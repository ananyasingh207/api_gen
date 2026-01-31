import { useState } from "react";

function App() {
  const [requirement, setRequirement] = useState("");
  const [spec, setSpec] = useState(null);
  const [validation, setValidation] = useState(null);

  const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  const generateSpec = async () => {
    const res = await fetch(`${BACKEND_URL}/generate-spec`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requirement })
    });

    const data = await res.json();
    console.log(data);
    setSpec(data.openapi);
    setValidation(data.validation);
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

      <pre>
        {spec && JSON.stringify(spec, null, 2)}
      </pre>

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

    </div>
  );
}

export default App;
