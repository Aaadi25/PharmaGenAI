from typing import Optional, Any
from datetime import date
from pydantic import BaseModel


class ComplaintBase(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[date] = None
    expiry_date: Optional[date] = None
    quantity_affected: Optional[float] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[date] = None
    detailed_description: Optional[str] = None
    initial_severity: Optional[str] = None
    priority: Optional[str] = None


class ComplaintCreate(ComplaintBase):
    status: Optional[str] = "Pending Triage"


class ComplaintOut(ComplaintBase):
    id: str
    status: str
    ai_completeness: Optional[dict] = None
    ai_risk_classification: Optional[dict] = None
    ai_root_cause_suggestions: Optional[list] = None
    ai_capa_recommendations: Optional[list] = None
    ai_summary: Optional[str] = None
    ai_duplicate_matches: Optional[list] = None

    class Config:
        from_attributes = True


class ExtractionResult(BaseModel):
    extracted_fields: dict
    confidence_notes: Optional[str] = None


class ChatRequest(BaseModel):
    message: str
    complaint_context: Optional[dict] = None


class ChatResponse(BaseModel):
    reply: str
