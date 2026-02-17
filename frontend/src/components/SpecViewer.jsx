// function SpecViewer({ spec }) {
//   if (!spec) return null;

//   return (
//     <pre style={{ marginTop: "20px" }}>
//       {JSON.stringify(spec, null, 2)}
//     </pre>
//   );
// }

// export default SpecViewer;


import { useEffect, useState } from "react";
import Editor from "@monaco-editor/react";

function SpecViewer({ spec, setSpec }) {
  const [editorValue, setEditorValue] = useState("");

  // Sync editor when spec changes from parent
  useEffect(() => {
    if (spec) {
      setEditorValue(JSON.stringify(spec, null, 2));
    }
  }, [spec]);

  const handleEditorChange = (value) => {
    setEditorValue(value);

    try {
      const parsed = JSON.parse(value);
      setSpec(parsed); // Only update parent if valid JSON
    } catch {
      // Ignore invalid JSON while typing
    }
  };

  const handleEditorDidMount = (editor, monaco) => {
    monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
      validate: true,
      allowComments: false,
      schemas: [],
      enableSchemaRequest: false
    });
  };

  if (!spec) return null;

  return (
    <div style={{ marginTop: "10px", height: "100%" }}>
      <Editor
        defaultLanguage="json"
        theme="vs-dark"
        value={editorValue}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          formatOnPaste: true,
          formatOnType: true,
          wordWrap: "on",
          automaticLayout: true,
          scrollBeyondLastLine: false
        }}
        height="100%"
      />
    </div>
  );
}

export default SpecViewer;
