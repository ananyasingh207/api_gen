import os
import certifi
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
import json

# -----------------------------
# SSL FIX (Windows / Render safe)
# -----------------------------
os.environ["SSL_CERT_FILE"] = certifi.where()

# -----------------------------
# Config
# -----------------------------
GEMINI_API_KEY = os.getenv("API_ARCHITECT_GEMINI_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("API_ARCHITECT_GEMINI_KEY not set")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Ambiguity Analyzer Service")

# -----------------------------
# Models
# -----------------------------
class AmbiguityRequest(BaseModel):
    requirement: str

class AmbiguityResponse(BaseModel):
    ambiguities: list[str]
    clarification_questions: list[str]

# -----------------------------
# Prompt
# -----------------------------
SYSTEM_PROMPT = """
You are a strict backend architecture reviewer.

You MUST always identify ambiguities, even if the requirement appears simple.

Treat ANY missing detail as ambiguity.

Do NOT assume defaults.
Do NOT fill gaps silently.
If something is not explicitly stated, it is ambiguous.

For the given API requirement:

1. List ALL ambiguities (minimum 3 if possible)
2. List clarification questions (minimum 3 if possible)

Focus especially on:
- Authentication & authorization
- Roles & permissions
- Pagination defaults
- Filtering behavior
- Sorting
- Rate limiting
- Error response structure
- Ownership rules
- Soft vs hard delete
- Async vs sync operations
- Data validation rules

Return ONLY valid JSON:
{
  "ambiguities": [...],
  "clarification_questions": [...]
}
"""

# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

import re

@app.post("/analyze", response_model=AmbiguityResponse)
def analyze(req: AmbiguityRequest):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=SYSTEM_PROMPT + "\n\nRequirement:\n" + req.requirement,
            config=types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=4096,
                response_mime_type="application/json"
            )
        )

        raw_text = response.text.strip()
        print("RAW RESPONSE:\n", raw_text)

        # Extract JSON block safely
        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)

        if not json_match:
            raise ValueError("No JSON object found in model output")

        json_str = json_match.group(0)

        try:
            data = json.loads(json_str)
        except Exception as e:
            print("JSON PARSE ERROR:", e)
            raise ValueError("Model returned malformed JSON")

        return {
            "ambiguities": data.get("ambiguities", []),
            "clarification_questions": data.get("clarification_questions", [])
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ambiguity analysis failed: {str(e)}"
        )
