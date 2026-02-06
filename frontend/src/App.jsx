import { useState } from "react";
import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

function App() {
  const [requirement, setRequirement] = useState("");
  const [spec, setSpec] = useState(null);
  const [validation, setValidation] = useState(null);

  const [data, setData] = useState({
    ambiguity: { ambiguities: [], clarification_questions: [] },
    security: {
      issues: [],
      summary: {
        total_rules_checked: 0,
        issues_found: 0
      }
    }
  });

  const [mock, setMock] = useState(null);
  const [loadingMock, setLoadingMock] = useState(false);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  // -------------------------
  // Phase 1–4: Generate Spec
  // -------------------------
  const generateSpec = async () => {
    const res = await fetch(`${BACKEND_URL}/generate-spec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement })
    });

    const responseData = await res.json();
    console.log(responseData);

    setSpec(responseData.openapi);
    setValidation(responseData.validation);

    setData(prev => ({
      ...prev,
      ambiguity: responseData.ambiguity ?? prev.ambiguity,
      security: responseData.security ?? prev.security
    }));
  };

  // -------------------------
  // Phase 5: Start Mock Server
  // -------------------------
  const startMockServer = async () => {
    if (!spec) return;

    try {
      setLoadingMock(true);

      const res = await fetch(`${BACKEND_URL}/start-mock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ openapi: spec })
      });

      const data = await res.json();
      setMock(data);
    } catch (err) {
      console.error("Failed to start mock server", err);
    } finally {
      setLoadingMock(false);
    }
  };

  // -------------------------
  // Phase 5: Stop Mock Server
  // -------------------------
  const stopMockServer = async () => {
    try {
      setLoadingMock(true);
      await fetch(`${BACKEND_URL}/stop-mock`, { method: "POST" });
      setMock(null);
    } catch (err) {
      console.error("Failed to stop mock server", err);
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>AI API Architect</h2>

      <textarea
        rows="6"
        cols="60"
        placeholder="Describe your API..."
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
      />

      <br /><br />
      <button onClick={generateSpec}>Generate Spec</button>

      <br /><br />
      <button
        onClick={startMockServer}
        disabled={!spec || loadingMock || mock}
      >
        {loadingMock ? "Starting Mock Server..." : "Start Mock Server"}
      </button>

      <button
        onClick={stopMockServer}
        disabled={!mock || loadingMock}
        style={{ marginLeft: "10px" }}
      >
        Stop Mock Server
      </button>

      {mock?.mock_url && (
        <div style={{ marginTop: "20px" }}>
          <h3>🧪 Mock Server Running</h3>
          <a href={mock.mock_url} target="_blank" rel="noreferrer">
            {mock.mock_url}
          </a>
        </div>
      )}

      {/* ---------- OpenAPI JSON ---------- */}
      {spec && (
        <pre style={{ marginTop: "20px" }}>
          {JSON.stringify(spec, null, 2)}
        </pre>
      )}

      {/* ---------- Swagger UI (SINGLE, FIXED) ---------- */}
      {spec && (
        <div style={{ marginTop: "30px" }}>
          <h3>📘 Swagger API Preview</h3>
          <SwaggerUI
            spec={{
              ...spec,
              servers: mock?.mock_url
                ? [{ url: mock.mock_url, description: "Mock Server" }]
                : spec.servers
            }}
          />
        </div>
      )}

      {/* ---------- Validation ---------- */}
      {validation && (
        <div style={{ marginTop: "10px" }}>
          {validation.valid ? (
            <span style={{ color: "green" }}>✅ OpenAPI is valid</span>
          ) : (
            <div style={{ color: "red" }}>
              ❌ Invalid OpenAPI
              <pre>{JSON.stringify(validation.errors, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {/* ---------- Ambiguity Analyzer ---------- */}
      <div style={{ marginTop: "20px" }}>
        <h3>⚠️ Ambiguities</h3>

        {data.ambiguity.ambiguities.length > 0 ? (
          <ul>
            {data.ambiguity.ambiguities.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "green" }}>✅ No ambiguities detected</p>
        )}

        <h3>❓ Clarification Questions</h3>

        {data.ambiguity.clarification_questions.length > 0 ? (
          <ul>
            {data.ambiguity.clarification_questions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
        ) : (
          <p style={{ color: "gray" }}>No clarification questions needed</p>
        )}
      </div>

      {/* ---------- Security Analyzer ---------- */}
      <div style={{ marginTop: "20px" }}>
        <h3>🔐 Security Risks</h3>

        {data.security.issues.length === 0 ? (
          <p style={{ color: "green" }}>
            ✅ No security issues detected
          </p>
        ) : (
          <ul>
            {data.security.issues.map((issue, i) => (
              <li key={i}>
                <strong>[{issue.severity}]</strong> {issue.message}
                <br />
                <small>{issue.location}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
