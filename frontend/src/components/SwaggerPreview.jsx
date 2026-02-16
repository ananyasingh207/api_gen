import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

function SwaggerPreview({ spec, mock }) {
  if (!spec) return null;

  return (
    <div style={{ marginTop: "30px" }}>
      <h3>📘 Swagger API Preview</h3>
      <SwaggerUI
        spec={{
          ...spec,
          servers: mock?.mock_url
            ? [{ url: mock.mock_url, description: "Mock Server" }]
            : spec.servers
        }}
      />
    </div>
  );
}

export default SwaggerPreview;