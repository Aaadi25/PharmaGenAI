"""Very lightweight document -> plain text conversion. Not production OCR,
just enough to feed raw text into the LLM extraction agent."""
import io
from pypdf import PdfReader
import docx


def extract_text(filename: str, content: bytes) -> str:
    lower = filename.lower()
    if lower.endswith(".pdf"):
        reader = PdfReader(io.BytesIO(content))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if lower.endswith(".docx"):
        d = docx.Document(io.BytesIO(content))
        return "\n".join(p.text for p in d.paragraphs)
    if lower.endswith((".txt", ".eml")):
        return content.decode("utf-8", errors="ignore")
    return content.decode("utf-8", errors="ignore")
