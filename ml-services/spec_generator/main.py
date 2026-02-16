import os
import certifi
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from google import genai
from google.genai import types
import traceback

# -----------------------------
# SSL FIX
# -----------------------------
os.environ["SSL_CERT_FILE"] = certifi.where()

# -----------------------------
# Config
# -----------------------------
GEMINI_API_KEY = os.getenv("API_ARCHITECT_GEMINI_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError("API_ARCHITECT_GEMINI_KEY not set")

client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Spec Generator Service")

# -----------------------------
# Models
# -----------------------------
class SpecRequest(BaseModel):
    requirement: str

class SpecResponse(BaseModel):
    openapi: dict

# -----------------------------
# Prompt
# -----------------------------
SYSTEM_PROMPT = """
You are an expert backend architect.

Convert the given natural language API requirement into a VALID OpenAPI 3.0.3 specification.

STRICT RULES:
- REST APIs only
- JSON request and response bodies
- Define schemas under components.schemas
- Include request validation
- Include standard HTTP error responses (400, 401, 404, 500)
- Use JWT Bearer authentication unless explicitly stated otherwise
- Do NOT include explanations
- Do NOT include markdown
- Output ONLY valid OpenAPI JSON
"""

# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/generate", response_model=SpecResponse)
def generate_spec(req: SpecRequest):
    try:
        prompt = SYSTEM_PROMPT + "\n\nRequirement:\n" + req.requirement

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0,
                max_output_tokens=4096,
                response_mime_type="application/json"
            )
        )

        try:
            spec_dict = response.parsed or json.loads(response.text)
        except Exception:
            print("RAW OUTPUT:\n", response.text)
            raise ValueError("Model did not return valid JSON")


        if not isinstance(spec_dict, dict):
            raise ValueError("Invalid OpenAPI output")

        return {"openapi": spec_dict}

    except Exception as e:
        traceback.print_exc() 
        raise HTTPException(
            status_code=500,
            detail=f"Spec generation failed: {str(e)}"
        )
