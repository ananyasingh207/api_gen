function RequirementInput({
  requirement,
  setRequirement,
  generateSpec
}) {
  return (
    <>
      <textarea
        rows="6"
        cols="60"
        placeholder="Describe your API..."
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
      />

      <br /><br />
      <button onClick={generateSpec}>Generate Spec</button>
    </>
  );
}

export default RequirementInput;
