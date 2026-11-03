
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def home():
    return {
        "message": "Champions League API is running!",
        "status": "success"
    }

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "database": "not connected yet"
    }
