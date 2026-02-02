from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict

app = FastAPI(title="Security Risk Analyzer")

class SecurityRequest(BaseModel):
    openapi: Dict

class SecurityIssue(BaseModel):
    rule_id: str
    severity: str
    message: str
    location: str

class SecurityResponse(BaseModel):
    issues: List[SecurityIssue]

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/analyze", response_model=SecurityResponse)
def analyze_security(req: SecurityRequest):
    spec = req.openapi
    issues = []

    paths = spec.get("paths", {})
    security_def = spec.get("components", {}).get("securitySchemes")

    # RULE 1 — No global security
    if not spec.get("security"):
        issues.append(SecurityIssue(
            rule_id="SEC-001",
            severity="HIGH",
            message="No global authentication defined",
            location="root.security"
        ))

    # RULE 2 — Missing security on endpoints
    for path, methods in paths.items():
        for method, details in methods.items():
            if "security" not in details:
                issues.append(SecurityIssue(
                    rule_id="SEC-002",
                    severity="HIGH",
                    message="Endpoint missing authentication",
                    location=f"{path}.{method}"
                ))

    # RULE 3 — DELETE without auth check
    for path, methods in paths.items():
        if "delete" in methods and "security" not in methods["delete"]:
            issues.append(SecurityIssue(
                rule_id="SEC-003",
                severity="CRITICAL",
                message="DELETE endpoint without authorization",
                location=f"{path}.delete"
            ))

    return {"issues": issues}
