import { useState } from "react";

import SpecInputPage from "./pages/SpecInputPage";
import WorkspacePage from "./pages/WorkspacePage";

import {
  generateSpecAPI,
  startMockServerAPI,
  stopMockServerAPI
} from "./services/api";

function App() {
  const [requirement, setRequirement] = useState("");
  const [spec, setSpec] = useState(null);
  const [validation, setValidation] = useState(null);

  const [data, setData] = useState({
    ambiguity: { ambiguities: [], clarification_questions: [] },
    security: {
      issues: [],
      summary: {
        total_rules_checked: 0,
        issues_found: 0
      }
    }
  });

  const [mock, setMock] = useState(null);
  const [loadingMock, setLoadingMock] = useState(false);

  // -------------------------
  // Generate Spec
  // -------------------------
  const generateSpec = async () => {
    const responseData = await generateSpecAPI(requirement);

    setSpec(responseData.openapi);
    setValidation(responseData.validation);

    setData(prev => ({
      ...prev,
      ambiguity: responseData.ambiguity ?? prev.ambiguity,
      security: responseData.security ?? prev.security
    }));
  };

  // -------------------------
  // Start Mock Server
  // -------------------------
  const startMockServer = async () => {
    if (!spec) return;

    try {
      setLoadingMock(true);
      const data = await startMockServerAPI(spec);
      setMock(data);
    } catch (err) {
      console.error("Failed to start mock server", err);
    } finally {
      setLoadingMock(false);
    }
  };

  // -------------------------
  // Stop Mock Server
  // -------------------------
  const stopMockServer = async () => {
    try {
      setLoadingMock(true);
      await stopMockServerAPI();
      setMock(null);
    } catch (err) {
      console.error("Failed to stop mock server", err);
    } finally {
      setLoadingMock(false);
    }
  };

  return (
    <>
      {!spec ? (
        <SpecInputPage
          requirement={requirement}
          setRequirement={setRequirement}
          generateSpec={generateSpec}
        />
      ) : (
        <WorkspacePage
          spec={spec}
          setSpec={setSpec}
          validation={validation}
          data={data}
          mock={mock}
          loadingMock={loadingMock}
          startMockServer={startMockServer}
          stopMockServer={stopMockServer}
        />
      )}
    </>
  );
}

export default App;
