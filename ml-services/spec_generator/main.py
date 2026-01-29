from fastapi import FastAPI

app = FastAPI(title="Spec Generator Service")

@app.get("/health")
def health():
    return {"status": "ok"}
