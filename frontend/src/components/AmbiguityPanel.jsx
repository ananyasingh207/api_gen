function AmbiguitySection({ data }) {
  return (
    <div style={{ marginTop: "20px" }}>
      <h3>⚠️ Ambiguities</h3>

      {data.ambiguity.ambiguities.length > 0 ? (
        <ul>
          {data.ambiguity.ambiguities.map((a, i) => (
            <li key={i}>{a}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "green" }}>
          ✅ No ambiguities detected
        </p>
      )}

      <h3>❓ Clarification Questions</h3>

      {data.ambiguity.clarification_questions.length > 0 ? (
        <ul>
          {data.ambiguity.clarification_questions.map((q, i) => (
            <li key={i}>{q}</li>
          ))}
        </ul>
      ) : (
        <p style={{ color: "gray" }}>
          No clarification questions needed
        </p>
      )}
    </div>
  );
}

export default AmbiguitySection;
