from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from openapi_spec_validator import validate_spec
from typing import List, Dict, Any
import time

app = FastAPI(title="OpenAPI Validator Service")
SERVICE_NAME = "openapi-validator"

# -----------------------------
# Models
# -----------------------------
class ValidationRequest(BaseModel):
    openapi: dict

class LintIssue(BaseModel):
    level: str            # "error" | "warning"
    message: str
    location: str
    why_it_matters: str
    production_impact: str
    how_to_fix: str

class ValidationResult(BaseModel):
    valid: bool
    errors: List[LintIssue]
    warnings: List[LintIssue]
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
# Helpers
# -----------------------------
def is_camel_case(s: str):
    return s and s[0].islower() and "_" not in s

def compute_confidence(error_count: int, warning_count: int) -> float:
    base = 0.95
    penalty = min(0.5, 0.1 * error_count + 0.03 * warning_count)
    return round(max(0.4, base - penalty), 2)

def collect_semantic_findings(spec: dict):
    warnings: List[LintIssue] = []
    errors: List[LintIssue] = []

    paths = spec.get("paths", {})
    components = spec.get("components", {})
    schemas = components.get("schemas", {})
    security_schemes = components.get("securitySchemes", {})

    uses_auth = bool(security_schemes)

    # -------- Validate schemas have examples --------
    for name, schema in schemas.items():
        if "example" not in schema:
            warnings.append(LintIssue(
                level="warning",
                message=f"Schema '{name}' is missing example values",
                location=f"components.schemas.{name}",
                why_it_matters="Examples help frontend and QA teams understand expected payloads.",
                production_impact="Lack of examples leads to misinterpretation of API contracts and integration bugs.",
                how_to_fix="Add an 'example' field to the schema definition."
            ))

    # -------- Validate paths --------
    for path, methods in paths.items():
        for method, op in methods.items():
            if not isinstance(op, dict):
                continue

            responses = op.get("responses", {})
            op_id = op.get("operationId")

            # Missing responses
            if not responses:
                errors.append(LintIssue(
                    level="error",
                    message=f"{method.upper()} {path} has no responses defined",
                    location=f"paths.{path}.{method}.responses",
                    why_it_matters="Every endpoint must define responses to form a valid API contract.",
                    production_impact="Clients will not know how to handle responses, causing runtime failures.",
                    how_to_fix="Define at least one success and standard error responses (200, 400, 500)."
                ))

            # Auth checks
            has_security = "security" in op or uses_auth
            if not has_security:
                warnings.append(LintIssue(
                    level="warning",
                    message=f"{method.upper()} {path} has no authentication defined",
                    location=f"paths.{path}.{method}.security",
                    why_it_matters="Unprotected endpoints can be accessed by unauthorized users.",
                    production_impact="This can lead to data leaks or unauthorized operations in production.",
                    how_to_fix="Define security requirements (e.g., JWT bearerAuth) for this endpoint."
                ))

            # Missing auth error responses
            if has_security:
                for code in ["401", "403"]:
                    if code not in responses:
                        warnings.append(LintIssue(
                            level="warning",
                            message=f"{method.upper()} {path} is missing {code} response",
                            location=f"paths.{path}.{method}.responses",
                            why_it_matters="Clients should be aware of authentication and authorization failures.",
                            production_impact="Missing error contracts make it hard for clients to handle auth failures gracefully.",
                            how_to_fix=f"Add {code} response to this endpoint's responses."
                        ))

            # operationId best practice
            if not op_id:
                warnings.append(LintIssue(
                    level="warning",
                    message=f"{method.upper()} {path} is missing operationId",
                    location=f"paths.{path}.{method}.operationId",
                    why_it_matters="operationId is used for client SDK generation and API discoverability.",
                    production_impact="Missing operationId can break automated client generation.",
                    how_to_fix="Add a unique camelCase operationId."
                ))
            elif not is_camel_case(op_id):
                warnings.append(LintIssue(
                    level="warning",
                    message=f"operationId '{op_id}' should be camelCase",
                    location=f"paths.{path}.{method}.operationId",
                    why_it_matters="Consistent naming conventions improve maintainability and readability.",
                    production_impact="Inconsistent naming makes client SDKs harder to use and maintain.",
                    how_to_fix="Rename operationId to camelCase (e.g., getOrdersByUser)."
                ))

            # Status code consistency
            for code in responses:
                if not str(code).isdigit():
                    warnings.append(LintIssue(
                        level="warning",
                        message=f"{method.upper()} {path} has non-standard status code '{code}'",
                        location=f"paths.{path}.{method}.responses",
                        why_it_matters="Non-standard status codes may confuse API consumers.",
                        production_impact="Clients may not handle unexpected status codes correctly.",
                        how_to_fix="Use standard HTTP status codes like 200, 201, 400, 401, 403, 404, 500."
                    ))

    return errors, warnings


# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/validate", response_model=UnifiedResponse)
def validate_openapi(req: ValidationRequest):
    start_time = time.time()

    # ---------- Syntax Validation ----------
    try:
        validate_spec(req.openapi)
    except Exception as e:
        processing_time_ms = int((time.time() - start_time) * 1000)
        return {
            "status": "error",
            "service": SERVICE_NAME,
            "result": {
                "valid": False,
                "errors": [
                    {
                        "level": "error",
                        "message": f"Syntax Error: {str(e)}",
                        "location": "spec",
                        "why_it_matters": "Invalid OpenAPI specs cannot be used for tooling or code generation.",
                        "production_impact": "CI/CD pipelines and API gateways may reject invalid specs.",
                        "how_to_fix": "Fix the OpenAPI syntax error reported above."
                    }
                ],
                "warnings": [],
                "confidence": 0.4,
                "notes": "Validation failed due to OpenAPI syntax errors."
            },
            "meta": {
                "version": "1.0",
                "processing_time_ms": processing_time_ms
            }
        }

    # ---------- Semantic Validation ----------
    errors, warnings = collect_semantic_findings(req.openapi)
    confidence = compute_confidence(len(errors), len(warnings))

    processing_time_ms = int((time.time() - start_time) * 1000)

    return {
        "status": "success",
        "service": SERVICE_NAME,
        "result": {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings,
            "confidence": confidence,
            "notes": "Findings are based on OpenAPI best practices and API governance rules."
        },
        "meta": {
            "version": "1.0",
            "processing_time_ms": processing_time_ms
        }
    }
