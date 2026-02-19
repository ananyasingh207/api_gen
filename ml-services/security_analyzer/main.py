from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Dict, Any
import time

app = FastAPI(title="Security Risk Analyzer")
SERVICE_NAME = "security-analyzer"

# -----------------------------
# Models
# -----------------------------
class SecurityRequest(BaseModel):
    openapi: Dict

class SecurityIssue(BaseModel):
    rule_id: str
    severity: str          # LOW | MEDIUM | HIGH | CRITICAL
    category: str         # OWASP category or custom category
    message: str
    location: str
    recommendation: str
    why_it_matters: str
    production_impact: str

class SecuritySummary(BaseModel):
    total_rules_checked: int
    issues_found: int
    security_score: int   # 0 - 100

class SecurityResult(BaseModel):
    issues: List[SecurityIssue]
    summary: SecuritySummary
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
SENSITIVE_FIELDS = {"password", "token", "ssn", "email", "creditcard", "apikey", "secret"}

def detect_sensitive_fields(schemas: Dict):
    findings = []
    for schema_name, schema in schemas.items():
        props = schema.get("properties", {})
        for field in props.keys():
            if field.lower() in SENSITIVE_FIELDS:
                findings.append((schema_name, field))
    return findings

def compute_confidence(security_score: int) -> float:
    # Simple mapping: higher security score → higher confidence
    return round(max(0.4, min(0.98, security_score / 100)), 2)


# -----------------------------
# Routes
# -----------------------------
@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze", response_model=UnifiedResponse)
def analyze_security(req: SecurityRequest):
    start_time = time.time()

    spec = req.openapi
    issues: List[SecurityIssue] = []

    paths = spec.get("paths", {})
    components = spec.get("components", {})
    schemas = components.get("schemas", {})

    rules_checked = 0

    # ---------------- OWASP: Broken Auth ----------------
    rules_checked += 1
    if not spec.get("security"):
        issues.append(SecurityIssue(
            rule_id="SEC-001",
            severity="HIGH",
            category="Broken Authentication",
            message="No global authentication defined",
            location="root.security",
            recommendation="Define JWT bearer authentication at global level",
            why_it_matters="APIs without authentication can be accessed by unauthorized users.",
            production_impact="This may lead to unauthorized data access and abuse in production systems."
        ))

    # ---------------- OWASP: Broken Object Level Authorization ----------------
    rules_checked += 1
    for path, methods in paths.items():
        if "{id}" in path:
            for method, details in methods.items():
                if "security" not in details:
                    issues.append(SecurityIssue(
                        rule_id="SEC-002",
                        severity="CRITICAL",
                        category="Broken Object Level Authorization",
                        message=f"{method.upper()} {path} has no authentication",
                        location=f"{path}.{method}",
                        recommendation="Add bearerAuth and enforce ownership checks",
                        why_it_matters="Object-level access must be protected to prevent horizontal privilege escalation.",
                        production_impact="Attackers could access or modify resources belonging to other users."
                    ))

    # ---------------- OWASP: No Rate Limiting ----------------
    rules_checked += 1
    if "x-rate-limit" not in spec:
        issues.append(SecurityIssue(
            rule_id="SEC-003",
            severity="MEDIUM",
            category="No Rate Limiting",
            message="No rate limiting strategy defined",
            location="root",
            recommendation="Apply rate limits (e.g., 100 req/min per user/IP)",
            why_it_matters="Rate limiting prevents abuse and brute-force attacks.",
            production_impact="Without rate limits, APIs are vulnerable to DDoS and credential stuffing."
        ))

    # ---------------- OWASP: DELETE Without Auth ----------------
    rules_checked += 1
    for path, methods in paths.items():
        if "delete" in methods and "security" not in methods["delete"]:
            issues.append(SecurityIssue(
                rule_id="SEC-004",
                severity="CRITICAL",
                category="Broken Authorization",
                message=f"DELETE {path} is missing authentication",
                location=f"{path}.delete",
                recommendation="Protect DELETE endpoints with authentication and roles",
                why_it_matters="Destructive actions must always be protected by strong authorization.",
                production_impact="Unauthenticated delete operations can cause irreversible data loss."
            ))

    # ---------------- OWASP: Excessive Data Exposure ----------------
    rules_checked += 1
    sensitive_findings = detect_sensitive_fields(schemas)
    for schema_name, field in sensitive_findings:
        issues.append(SecurityIssue(
            rule_id="SEC-005",
            severity="HIGH",
            category="Excessive Data Exposure",
            message=f"Sensitive field '{field}' exposed in schema '{schema_name}'",
            location=f"components.schemas.{schema_name}.{field}",
            recommendation="Mask or remove sensitive fields from API responses",
            why_it_matters="Sensitive fields should never be exposed in API responses.",
            production_impact="Exposure of sensitive data can lead to data breaches and compliance violations."
        ))

    # ---------------- OWASP: Mass Assignment ----------------
    rules_checked += 1
    for schema_name, schema in schemas.items():
        if "properties" in schema and not schema.get("readOnly"):
            issues.append(SecurityIssue(
                rule_id="SEC-006",
                severity="MEDIUM",
                category="Mass Assignment",
                message=f"Schema '{schema_name}' allows unrestricted field assignment",
                location=f"components.schemas.{schema_name}",
                recommendation="Use readOnly/writeOnly flags to prevent mass assignment",
                why_it_matters="Mass assignment vulnerabilities allow attackers to modify restricted fields.",
                production_impact="Attackers could escalate privileges or manipulate protected attributes."
            ))

    # ---------------- Security Score ----------------
    max_score = 100
    penalty = 0

    for issue in issues:
        if issue.severity == "CRITICAL":
            penalty += 15
        elif issue.severity == "HIGH":
            penalty += 10
        elif issue.severity == "MEDIUM":
            penalty += 5
        elif issue.severity == "LOW":
            penalty += 2

    security_score = max(0, max_score - penalty)
    confidence = compute_confidence(security_score)

    processing_time_ms = int((time.time() - start_time) * 1000)

    return {
        "status": "success",
        "service": SERVICE_NAME,
        "result": {
            "issues": issues,
            "summary": {
                "total_rules_checked": rules_checked,
                "issues_found": len(issues),
                "security_score": security_score
            },
            "confidence": confidence,
            "notes": "Findings are based on OWASP API Top 10 and common API security best practices."
        },
        "meta": {
            "version": "1.0",
            "processing_time_ms": processing_time_ms
        }
    }
