function ValidationResult({ validation }) {
  return (
    <div style={{ marginTop: "10px" }}>
      <div style={{ fontWeight: 500, marginBottom: "6px" }}>
        <h3>OpenAPI Validation</h3>
      </div>

      {!validation ? (
        <div style={{ color: "#888" }}>
          Validation has not been executed yet.
        </div>
      ) : validation.valid ? (
        <div style={{ color: "green" }}>
          OpenAPI is valid
        </div>
      ) : (
        <div style={{ color: "red" }}>
          Invalid OpenAPI
          {validation.errors && validation.errors.length > 0 && (
            <pre style={{ marginTop: "6px" }}>
              {JSON.stringify(validation.errors, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

export default ValidationResult;
