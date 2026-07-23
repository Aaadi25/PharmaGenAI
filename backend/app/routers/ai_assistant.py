from fastapi import APIRouter
from .. import schemas
from ..services.groq_client import call_groq
from ..agents import prompts
from ..config import settings

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/chat", response_model=schemas.ChatResponse)
def chat(payload: schemas.ChatRequest):
    context = f"\n\nCurrent complaint record:\n{payload.complaint_context}" if payload.complaint_context else ""
    reply = call_groq(
        prompts.CHAT_SYSTEM_PROMPT,
        f"{payload.message}{context}",
        model=settings.groq_reasoning_model,
    )
    return {"reply": reply}
