from fastapi import FastAPI

app = FastAPI(title="Security Analysis Service")

@app.get("/health")
def health():
    return {"status": "ok"}
