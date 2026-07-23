"""
LangGraph pipeline for complaint intake.

Flow (matches the demo video):
  raw document text
      -> extract_fields          (Groq gemma2-9b-it: fast structured extraction)
      -> completeness_check      (bonus: flags missing mandatory fields)
      -> risk_classification     (bonus: ICH Q9-style risk tagging)
      -> root_cause              (bonus: root cause leads for QA)
      -> capa_recommendation     (bonus: draft CAPA suggestions)
      -> summary                 (bonus: management-review summary)

Each node is a plain function operating on a shared TypedDict state, so the
graph is easy to extend (e.g. add a duplicate-detection node that queries
the DB) without touching the others.
"""
from langgraph.graph import StateGraph, END
from .nodes import (
    ComplaintAgentState,
    node_extract_fields,
    node_completeness_check,
    node_risk_classification,
    node_root_cause,
    node_capa_recommendation,
    node_summary,
)


def build_intake_graph():
    graph = StateGraph(ComplaintAgentState)

    graph.add_node("extract_fields", node_extract_fields)
    graph.add_node("completeness_check", node_completeness_check)
    graph.add_node("risk_classification", node_risk_classification)
    graph.add_node("root_cause_analysis", node_root_cause)
    graph.add_node("capa_recommendation", node_capa_recommendation)
    graph.add_node("generate_summary", node_summary)

    graph.set_entry_point("extract_fields")
    graph.add_edge("extract_fields", "completeness_check")
    graph.add_edge("completeness_check", "risk_classification")
    graph.add_edge("risk_classification", "root_cause_analysis")
    graph.add_edge("root_cause_analysis", "capa_recommendation")
    graph.add_edge("capa_recommendation", "generate_summary")
    graph.add_edge("generate_summary", END)

    return graph.compile()


# Compiled once at import time; reused across requests.
intake_graph = build_intake_graph()


def run_intake_pipeline(raw_text: str) -> ComplaintAgentState:
    return intake_graph.invoke({"raw_text": raw_text})
