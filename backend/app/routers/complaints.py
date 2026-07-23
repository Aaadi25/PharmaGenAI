from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import Optional

from ..database import get_db
from .. import models, schemas
from ..services.document_parser import extract_text
from ..services.groq_client import call_groq_json
from ..agents.graph import run_intake_pipeline
from ..agents import prompts

router = APIRouter(prefix="/api/complaints", tags=["complaints"])


@router.post("/extract")
async def extract_from_document(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
):
    """Runs the LangGraph intake pipeline over an uploaded document or pasted
    text and returns extracted fields + all bonus AI outputs, WITHOUT saving
    to the DB yet (the frontend shows them for QA review first)."""
    if not file and not text:
        raise HTTPException(400, "Provide a file or pasted text")

    if file:
        content = await file.read()
        raw_text = extract_text(file.filename, content)
    else:
        raw_text = text

    if not raw_text or not raw_text.strip():
        raise HTTPException(422, "Could not read any text from the input")

    result = run_intake_pipeline(raw_text)

    return {
        "extracted_fields": result.get("extracted_fields"),
        "ai_completeness": result.get("completeness"),
        "ai_risk_classification": result.get("risk"),
        "ai_root_cause_suggestions": result.get("root_cause", {}).get("suggestions"),
        "ai_capa_recommendations": result.get("capa", {}).get("capa"),
        "ai_summary": result.get("summary"),
        "raw_extracted_text": raw_text,
        "source_document_name": file.filename if file else None,
    }


@router.post("", response_model=schemas.ComplaintOut)
def create_complaint(payload: dict, db: Session = Depends(get_db)):
    """Saves a complaint. Accepts the full extraction payload (form fields +
    ai_* outputs) so the frontend can persist exactly what QA reviewed/edited."""
    complaint = models.Complaint(**{
        k: v for k, v in payload.items() if hasattr(models.Complaint, k)
    })

    # Run duplicate detection against existing complaints on save.
    complaint.ai_duplicate_matches = _find_duplicates(db, complaint)

    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return complaint


@router.get("", response_model=list[schemas.ComplaintOut])
def list_complaints(db: Session = Depends(get_db)):
    return db.query(models.Complaint).order_by(models.Complaint.created_at.desc()).all()


@router.get("/{complaint_id}", response_model=schemas.ComplaintOut)
def get_complaint(complaint_id: str, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).get(complaint_id)
    if not c:
        raise HTTPException(404, "Complaint not found")
    return c


@router.put("/{complaint_id}", response_model=schemas.ComplaintOut)
def update_complaint(complaint_id: str, payload: dict, db: Session = Depends(get_db)):
    c = db.query(models.Complaint).get(complaint_id)
    if not c:
        raise HTTPException(404, "Complaint not found")
    for k, v in payload.items():
        if hasattr(models.Complaint, k):
            setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


def _find_duplicates(db: Session, complaint: models.Complaint) -> list[dict]:
    """Bonus feature: Duplicate Complaint Detection.
    Step 1 - cheap SQL pre-filter on batch/product overlap.
    Step 2 - Groq compares descriptions of the candidates for real similarity.
    """
    if not complaint.batch_lot_number and not complaint.product_name:
        return []

    candidates = (
        db.query(models.Complaint)
        .filter(
            or_(
                models.Complaint.batch_lot_number == complaint.batch_lot_number,
                models.Complaint.product_name == complaint.product_name,
            )
        )
        .limit(5)
        .all()
    )
    if not candidates:
        return []

    matches = []
    for cand in candidates:
        try:
            verdict = call_groq_json(
                "You compare two pharmaceutical complaint descriptions and judge if "
                "they likely describe the SAME underlying quality event. Return ONLY "
                'JSON: {"same_event": true|false, "similarity": 0.0-1.0}',
                f"Complaint A: {complaint.detailed_description}\n"
                f"Complaint B: {cand.detailed_description}",
            )
        except Exception:
            continue
        if verdict.get("same_event"):
            matches.append({
                "complaint_id": cand.id,
                "similarity": verdict.get("similarity", 0.5),
            })
    return matches
