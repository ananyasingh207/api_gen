function MockControls({
  spec,
  mock,
  loadingMock,
  startMockServer,
  stopMockServer
}) {
  return (
    <>
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
    </>
  );
}

export default MockControls;
