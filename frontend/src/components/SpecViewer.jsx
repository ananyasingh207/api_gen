function SpecViewer({ spec }) {
  if (!spec) return null;

  return (
    <pre style={{ marginTop: "20px" }}>
      {JSON.stringify(spec, null, 2)}
    </pre>
  );
}

export default SpecViewer;
