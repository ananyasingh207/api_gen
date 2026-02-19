import os
import certifi
import json
import re
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
from typing import Any

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

SERVICE_NAME = "spec-generator"

app = FastAPI(title="Spec Generator Service")

# -----------------------------
# Models
# -----------------------------
class SpecRequest(BaseModel):
    requirement: str

class SpecResult(BaseModel):
    openapi: dict
    explainability: dict
    confidence: float
    notes: str

class Meta(BaseModel):
    version: str = "1.0"
    processing_time_ms: int

class UnifiedResponse(BaseModel):
    status: str
    service: str
    result: Any
    meta: Meta

# -----------------------------
# Prompt
# -----------------------------
SYSTEM_PROMPT = """
You are an expert backend architect.

Convert the given natural language API requirement into a VALID OpenAPI 3.0.3 specification.

STRICT RULES:
- REST APIs only
- Use versioned endpoints (prefix all paths with /v1)
- Use resource-oriented naming (e.g., /users/{id}, /orders/{id})
- Use plural nouns for resources (e.g., /users, /products, /orders)
- JSON request and response bodies only
- Define schemas under components.schemas
- Include request validation
- Use JWT Bearer authentication unless explicitly stated otherwise

RESPONSE ENVELOPE (ALL endpoints must follow this):
{
  "success": true,
  "data": <response_payload_or_null>,
  "error": <error_object_or_null>
}

LIST ENDPOINT RULES:
- All collection GET endpoints must support pagination, filtering, and sorting
- Include query params: limit, offset, sort

ERROR CONTRACT (ALL endpoints must include these responses):
- 400: Validation error
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

OUTPUT RULES:
- Do NOT include explanations
- Do NOT include markdown
- Output ONLY valid OpenAPI JSON
"""

# -----------------------------
# Helpers
# -----------------------------
def compute_confidence(spec: dict) -> float:
    # Simple heuristic confidence score based on presence of key sections
    score = 0.6
    if spec.get("paths"):
        score += 0.15
    if spec.get("components", {}).get("schemas"):
        score += 0.15
    if spec.get("components", {}).get("securitySchemes"):
        score += 0.1
    return round(min(0.95, score), 2)

def build_explainability():
    return {
        "conventions_enforced": [
            "Versioned endpoints (/v1/*)",
            "Plural resource naming",
            "JWT Bearer authentication",
            "Standardized response envelope",
            "Pagination, filtering, sorting for list endpoints",
            "Standard HTTP error contracts"
        ],
        "why_it_matters": "Enforcing consistent API conventions improves maintainability, security, and client integration.",
        "production_impact": "Inconsistent APIs lead to fragile clients, security gaps, and high long-term maintenance costs.",
        "how_to_fix": "Refine the natural language requirements with explicit details about auth, pagination, and error handling."
    }

# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate", response_model=UnifiedResponse)
def generate_spec(req: SpecRequest):
    start_time = time.time()
    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=SYSTEM_PROMPT + "\n\nRequirement:\n" + req.requirement,
            config=types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=4096,
                response_mime_type="application/json"
            )
        )

        raw_text = response.text.strip()
        print("RAW RESPONSE:\n", raw_text)

        json_match = re.search(r"\{.*\}", raw_text, re.DOTALL)
        if not json_match:
            raise ValueError("No JSON object found in model output")

        spec_dict = json.loads(json_match.group(0))

        confidence = compute_confidence(spec_dict)
        explainability = build_explainability()

        processing_time_ms = int((time.time() - start_time) * 1000)

        return {
            "status": "success",
            "service": SERVICE_NAME,
            "result": {
                "openapi": spec_dict,
                "explainability": explainability,
                "confidence": confidence,
                "notes": "Spec generated using enforced REST conventions and OpenAPI best practices."
            },
            "meta": {
                "version": "1.0",
                "processing_time_ms": processing_time_ms
            }
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Spec generation failed: {str(e)}"
        )
