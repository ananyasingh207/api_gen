function ValidationResult({ validation }) {
  if (!validation) return null;

  return (
    <div style={{ marginTop: "10px" }}>
      {validation.valid ? (
        <span style={{ color: "green" }}>
          ✅ OpenAPI is valid
        </span>
      ) : (
        <div style={{ color: "red" }}>
          ❌ Invalid OpenAPI
          <pre>{JSON.stringify(validation.errors, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

export default ValidationResult;
