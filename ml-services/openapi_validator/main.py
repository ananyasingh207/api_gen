from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openapi_spec_validator import validate_spec
import yaml

app = FastAPI(title="OpenAPI Validator Service")

class ValidationRequest(BaseModel):
    openapi: dict

class ValidationResponse(BaseModel):
    valid: bool
    errors: list[str] = []

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/validate", response_model=ValidationResponse)
def validate_openapi(req: ValidationRequest):
    try:
        validate_spec(req.openapi)
        return {"valid": True, "errors": []}
    except Exception as e:
        return {
            "valid": False,
            "errors": [str(e)]
        }
