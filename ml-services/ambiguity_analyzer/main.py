import os
import certifi
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai

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
You are a senior backend architect.

Analyze the API requirement and identify:
1. Ambiguities
2. Missing or unclear requirements

Focus on:
- Authentication & authorization
- Pagination & filtering
- Error handling
- Rate limits
- Resource ownership
- Soft vs hard deletes
- Sync vs async behavior

Be concise and technical.
"""

# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=AmbiguityResponse)
def analyze(req: AmbiguityRequest):
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=SYSTEM_PROMPT + "\n\nRequirement:\n" + req.requirement,
            config={
                "temperature": 0,
                "max_output_tokens": 1024,
                "response_schema": {
                    "type": "object",
                    "properties": {
                        "ambiguities": {
                            "type": "array",
                            "items": { "type": "string" }
                        },
                        "clarification_questions": {
                            "type": "array",
                            "items": { "type": "string" }
                        }
                    },
                    "required": ["ambiguities", "clarification_questions"]
                }
            }
        )

        # 🔒 DEFENSIVE CHECK (THIS FIXES YOUR ERROR)
        if response.parsed is None:
            return {
                "ambiguities": [],
                "clarification_questions": [
                    "The requirement may already be sufficiently clear, or more context is needed."
                ]
            }

        data = response.parsed

        return {
            "ambiguities": data["ambiguities"],
            "clarification_questions": data["clarification_questions"]
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Ambiguity analysis failed: {str(e)}"
        )

