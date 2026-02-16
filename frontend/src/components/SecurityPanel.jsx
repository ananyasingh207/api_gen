function SecurityPanel({ data }) {
  return (
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
  );
}

export default SecurityPanel;
