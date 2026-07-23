"""
Thin wrapper around the Groq SDK.

Get a free key at https://console.groq.com and put it in backend/.env as
GROQ_API_KEY. gemma2-9b-it is used for fast field extraction; the larger
llama-3.3-70b-versatile is used for reasoning-heavy tasks (root cause,
CAPA, risk classification) where quality matters more than latency.
"""
import json
from groq import Groq
from ..config import settings

_client = Groq(api_key=settings.groq_api_key)


def call_groq(system_prompt: str, user_prompt: str, model: str | None = None,
               json_mode: bool = False, temperature: float = 0.2) -> str:
    model = model or settings.groq_extraction_model
    kwargs = {}
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = _client.chat.completions.create(
        model=model,
        temperature=temperature,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        **kwargs,
    )
    return resp.choices[0].message.content


def call_groq_json(system_prompt: str, user_prompt: str, model: str | None = None) -> dict:
    raw = call_groq(system_prompt, user_prompt, model=model, json_mode=True)
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        start, end = raw.find("{"), raw.rfind("}")
        if start != -1 and end != -1:
            return json.loads(raw[start:end + 1])
        raise
