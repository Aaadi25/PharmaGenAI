from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import complaints, ai_assistant

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AIVOA Complaint Management System",
    description="AI-powered customer complaint intake for API & FDF pharmaceutical QA",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)
app.include_router(ai_assistant.router)


@app.get("/")
def health():
    return {"status": "ok", "service": "complaint-management-backend"}
