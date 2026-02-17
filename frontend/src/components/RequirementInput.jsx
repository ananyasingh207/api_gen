function RequirementInput({
  requirement,
  setRequirement,
  generateSpec,
  isGenerating,
  generateError
}) {
  return (
    <>
      <textarea
        className="input-textarea"
        placeholder="Describe your API..."
        value={requirement}
        onChange={(e) => setRequirement(e.target.value)}
      />

      <button
        className="generate-button"
        onClick={generateSpec}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <>
            <span className="spinner" />
            Generating...
          </>
        ) : (
          <>
            <svg className="btn-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" fill="currentColor" />
            </svg>
            Generate API
          </>
        )}
      </button>

      {generateError && (
        <div className="generate-error">
          {generateError}
        </div>
      )}
    </>
  );
}

export default RequirementInput;
