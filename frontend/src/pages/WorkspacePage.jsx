import MockControls from "../components/MockControls";
import SpecViewer from "../components/SpecViewer";
import SwaggerPreview from "../components/SwaggerPreview";
import ValidationResult from "../components/ValidationResult";
import AmbiguityPanel from "../components/AmbiguityPanel";
import SecurityPanel from "../components/SecurityPanel";

const WorkspacePage = ({
    spec,
    setSpec,
    validation,
    data,
    mock,
    loadingMock,
    startMockServer,
    stopMockServer,
}) => {
    return (
        <div className="workspace-container" style={{ padding: "20px", maxWidth: "1400px", margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2>API Workspace</h2>
                {/* Placeholder for potential back/reset button if needed later */}
            </div>

            <MockControls
                spec={spec}
                mock={mock}
                loadingMock={loadingMock}
                startMockServer={startMockServer}
                stopMockServer={stopMockServer}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", marginTop: "20px" }}>
                <SpecViewer spec={spec} setSpec={setSpec} />

                <SwaggerPreview spec={spec} mock={mock} />

                {validation && <ValidationResult validation={validation} />}

                <AmbiguityPanel data={data} />

                <SecurityPanel data={data} />
            </div>
        </div>
    );
};

export default WorkspacePage;
