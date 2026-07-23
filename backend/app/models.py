import uuid
import datetime as dt
from sqlalchemy import Column, String, Text, Date, Numeric, DateTime, JSON
from .database import Base


def gen_id():
    return str(uuid.uuid4())


class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String(36), primary_key=True, default=gen_id)

    # 1. Origin & Customer
    complaint_source = Column(String(120))
    customer_name = Column(String(255))

    # 2. Product & Batch
    product_name = Column(String(255))
    product_strength_grade = Column(String(120))
    batch_lot_number = Column(String(120))
    manufacturing_date = Column(Date, nullable=True)
    expiry_date = Column(Date, nullable=True)
    quantity_affected = Column(Numeric, nullable=True)

    # 3. Complaint Details
    complaint_type = Column(String(120))
    complaint_date = Column(Date, nullable=True)
    detailed_description = Column(Text)

    # 4. Assessment & Priority
    initial_severity = Column(String(50))
    priority = Column(String(50))

    # Workflow / meta
    status = Column(String(50), default="Pending Triage")
    source_document_name = Column(String(255), nullable=True)
    raw_extracted_text = Column(Text, nullable=True)

    # AI outputs (bonus features), stored as JSON for flexibility
    ai_completeness = Column(JSON, nullable=True)      # {"score": 0-100, "missing_fields": [...]}
    ai_risk_classification = Column(JSON, nullable=True)  # {"risk": "High", "rationale": "..."}
    ai_root_cause_suggestions = Column(JSON, nullable=True)  # [{"cause": "...", "confidence": "..."}]
    ai_capa_recommendations = Column(JSON, nullable=True)     # [{"corrective": "...", "preventive": "..."}]
    ai_summary = Column(Text, nullable=True)
    ai_duplicate_matches = Column(JSON, nullable=True)  # [{"complaint_id": "...", "similarity": 0.0}]

    created_at = Column(DateTime, default=dt.datetime.utcnow)
    updated_at = Column(DateTime, default=dt.datetime.utcnow, onupdate=dt.datetime.utcnow)
