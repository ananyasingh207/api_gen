import RequirementInput from "../components/RequirementInput";
import "../styles/SpecInputPage.css";

const SpecInputPage = ({ requirement, setRequirement, generateSpec, isGenerating, generateError }) => {
    return (
        <div className="spec-input-page">
            {/* Header Area */}
            <header className="spec-header">
                <div className="spec-logo">API Gen</div>
                <div className="header-actions">
                    {/* <div className="user-avatar"></div> */}
                </div>
            </header>

            <div className="spec-content-wrapper">
                {/* Main Heading Section */}
                <div className="hero-section">
                    <h1 className="hero-title">What API are we building today?</h1>
                    <p className="hero-subtitle">Describe your requirements and we'll generate the full specification.</p>
                </div>

                <div className="input-container">
                    <RequirementInput
                        requirement={requirement}
                        setRequirement={setRequirement}
                        generateSpec={generateSpec}
                        isGenerating={isGenerating}
                        generateError={generateError}
                    />
                </div>

                {/* Empty State Section */}
                <div className="empty-state-section">
                    <div className="empty-state-icon-container">
                        <svg className="shield-icon" viewBox="0 0 24 24">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                        </svg>
                    </div>
                    <h3 className="empty-state-title">Waiting for Specs</h3>
                    <p className="empty-state-subtitle">Your generated API documentation will appear here.</p>
                </div>
            </div>
        </div>
    );
};

export default SpecInputPage;
