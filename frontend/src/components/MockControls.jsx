import { Server, Square } from "lucide-react";

function MockControls({
  spec,
  mock,
  loadingMock,
  startMockServer,
  stopMockServer
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <button
        onClick={startMockServer}
        disabled={!spec || loadingMock || mock}
        className="mock-btn mock-btn-primary"
      >
        <Server size={16} />
        {loadingMock ? "Starting Mock Server..." : "Start Mock Server"}
      </button>

      <button
        onClick={stopMockServer}
        disabled={!mock || loadingMock}
        className="mock-btn mock-btn-danger"
      >
        <Square size={16} fill="currentColor" />
        Stop Mock Server
      </button>

      {mock?.mock_url && (
        <div style={{ marginTop: "20px" }}>
          <h3>Mock Server Running</h3>
          <a href={mock.mock_url} target="_blank" rel="noreferrer">
            {mock.mock_url}
          </a>
        </div>
      )}
    </div>
  );
}

export default MockControls;
