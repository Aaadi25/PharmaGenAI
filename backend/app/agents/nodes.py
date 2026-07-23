from typing import TypedDict, Optional
from ..config import settings
from ..services.groq_client import call_groq_json
from . import prompts


class ComplaintAgentState(TypedDict, total=False):
    raw_text: str
    extracted_fields: dict
    completeness: dict
    risk: dict
    root_cause: dict
    capa: dict
    summary: str


def node_extract_fields(state: ComplaintAgentState) -> ComplaintAgentState:
    fields = call_groq_json(
        prompts.EXTRACTION_SYSTEM_PROMPT,
        f"Complaint document text:\n\n{state['raw_text']}",
        model=settings.groq_extraction_model,
    )
    state["extracted_fields"] = fields
    return state


def node_completeness_check(state: ComplaintAgentState) -> ComplaintAgentState:
    result = call_groq_json(
        prompts.COMPLETENESS_SYSTEM_PROMPT,
        f"Extracted fields:\n{state['extracted_fields']}",
        model=settings.groq_reasoning_model,
    )
    state["completeness"] = result
    return state


def node_risk_classification(state: ComplaintAgentState) -> ComplaintAgentState:
    result = call_groq_json(
        prompts.RISK_SYSTEM_PROMPT,
        f"Extracted fields:\n{state['extracted_fields']}",
        model=settings.groq_reasoning_model,
    )
    state["risk"] = result
    return state


def node_root_cause(state: ComplaintAgentState) -> ComplaintAgentState:
    result = call_groq_json(
        prompts.ROOT_CAUSE_SYSTEM_PROMPT,
        f"Complaint description:\n{state['extracted_fields'].get('detailed_description')}",
        model=settings.groq_reasoning_model,
    )
    state["root_cause"] = result
    return state


def node_capa_recommendation(state: ComplaintAgentState) -> ComplaintAgentState:
    result = call_groq_json(
        prompts.CAPA_SYSTEM_PROMPT,
        f"Complaint: {state['extracted_fields']}\nRoot cause leads: {state.get('root_cause')}",
        model=settings.groq_reasoning_model,
    )
    state["capa"] = result
    return state


def node_summary(state: ComplaintAgentState) -> ComplaintAgentState:
    result = call_groq_json(
        prompts.SUMMARY_SYSTEM_PROMPT,
        f"Complaint fields:\n{state['extracted_fields']}",
        model=settings.groq_extraction_model,
    )
    state["summary"] = result.get("summary", "")
    return state
