const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5000";

  export const generateSpecAPI = async (requirement) => {
  const res = await fetch(`${BACKEND_URL}/generate-spec`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requirement })
  });

  return res.json();
};

export const startMockServerAPI = async (spec) => {
  const res = await fetch(`${BACKEND_URL}/start-mock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ openapi: spec })
  });

  return res.json();
};

export const stopMockServerAPI = async () => {
  return fetch(`${BACKEND_URL}/stop-mock`, {
    method: "POST"
  });
};
