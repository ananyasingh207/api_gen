import { useState } from "react";
import { Copy, Download } from "lucide-react";
import MockControls from "../components/MockControls";
import SpecViewer from "../components/SpecViewer";
import SwaggerPreview from "../components/SwaggerPreview";
import ValidationResult from "../components/ValidationResult";
import AmbiguityPanel from "../components/AmbiguityPanel";
import SecurityPanel from "../components/SecurityPanel";
import RequirementInput from "../components/RequirementInput";
import "../styles/WorkspacePage.css";

const WorkspacePage = ({
    spec,
    setSpec,
    validation,
    data,
    mock,
    loadingMock,
    startMockServer,
    stopMockServer,
    requirement,
    setRequirement,
    generateSpec,
    isGenerating,
    generateError
}) => {
    const [activeTab, setActiveTab] = useState("editor");


    const handleCopy = () => {
        if (!spec) return;
        navigator.clipboard.writeText(JSON.stringify(spec, null, 2));
    };

    const handleExport = () => {
        if (!spec) return;
        const blob = new Blob([JSON.stringify(spec, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "openapi.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const renderRightPanel = () => {
        switch (activeTab) {
            case "editor":
                return <ValidationResult validation={validation} />;

            case "swagger":
                return <SwaggerPreview spec={spec} mock={mock} />;
            case "mock":
                /* Re-using MockControls as the panel content or a placeholder if a specific panel is meant. 
                   User asked to render <MockServerPanel />. Since checks showed MockControls is the functionality, 
                   I will render MockControls here as well or instead of the top?
                   The prompt said "Do NOT remove any tabs." and "Right Panel... Render <MockServerPanel />".
                   I'll move MockControls here to be the panel content as it makes sense for a "Mock" tab.
                */
                return (
                    <MockControls
                        spec={spec}
                        mock={mock}
                        loadingMock={loadingMock}
                        startMockServer={startMockServer}
                        stopMockServer={stopMockServer}
                    />
                );
            case "ambiguities":
                return <AmbiguityPanel data={data} />;
            case "security":
                return <SecurityPanel data={data} />;
            default:
                return null;
        }
    };

    return (
        <div className="workspace-page">
            <div className="workspace-generate">
                <div className="generate-row">
                    <RequirementInput
                        requirement={requirement}
                        setRequirement={setRequirement}
                        generateSpec={generateSpec}
                        isGenerating={isGenerating}
                        generateError={generateError}
                    />
                </div>
            </div>

            <div className="workspace-header">
                <div className="workspace-header-left">
                    <span className="workspace-title">OpenAPI Spec</span>
                    <button onClick={handleCopy} className="header-action-btn">
                        <Copy size={14} /> Copy
                    </button>
                    <button onClick={handleExport} className="header-action-btn">
                        <Download size={14} /> Export
                    </button>
                </div>

                <div className="workspace-header-right">
                    <button
                        onClick={() => setActiveTab("editor")}
                        className={`tab-btn ${activeTab === "editor" ? "active" : ""}`}
                    >
                        Editor
                    </button>
                    <button
                        onClick={() => setActiveTab("swagger")}
                        className={`tab-btn ${activeTab === "swagger" ? "active" : ""}`}
                    >
                        Swagger
                    </button>
                    <button
                        onClick={() => setActiveTab("mock")}
                        className={`tab-btn ${activeTab === "mock" ? "active" : ""}`}
                    >
                        Mock
                    </button>
                    <button
                        onClick={() => setActiveTab("ambiguities")}
                        className={`tab-btn ${activeTab === "ambiguities" ? "active" : ""}`}
                    >
                        Ambiguities
                    </button>
                    <button
                        onClick={() => setActiveTab("security")}
                        className={`tab-btn ${activeTab === "security" ? "active" : ""}`}
                    >
                        Security
                    </button>
                </div>
            </div>

            <div className="workspace-body">
                <div className="workspace-left">
                    <SpecViewer spec={spec} setSpec={setSpec} />
                </div>

                <div className="workspace-right">
                    {renderRightPanel()}
                </div>
            </div>
        </div>
    );
};

export default WorkspacePage;
