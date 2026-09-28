import time
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from model import engine

app = FastAPI(
    title="SIF-Sentinel ML NLP Engine",
    description="AI/NLP Engine for Serious Injury & Fatality Precursor Detection (SIH26165)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ClassifyRequest(BaseModel):
    text: str = Field(..., description="Free-text safety report description (10-2000 chars)")
    installation: Optional[str] = None
    report_type: Optional[str] = None

class BatchClassifyRequest(BaseModel):
    items: List[ClassifyRequest]

class ClassifyResponse(BaseModel):
    risk_score: Optional[int] = None
    risk_band: str
    hazard_primary: str
    hazard_secondary: List[str] = []
    explainability_terms: List[str] = []
    is_manual_review: bool = False
    reason: Optional[str] = None
    confidence: Optional[float] = None
    latency_ms: float

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "sif-sentinel-ml",
        "model_loaded": engine.trained,
        "timestamp": time.time()
    }

@app.post("/classify", response_model=ClassifyResponse)
def classify_report(payload: ClassifyRequest):
    start = time.perf_counter()
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="Report description cannot be empty")
    
    result = engine.classify(payload.text)
    latency = round((time.perf_counter() - start) * 1000, 2)
    result["latency_ms"] = latency
    return result

@app.post("/classify/batch")
def classify_batch(payload: BatchClassifyRequest):
    start = time.perf_counter()
    results = []
    for item in payload.items:
        res = engine.classify(item.text)
        results.append(res)
    total_latency = round((time.perf_counter() - start) * 1000, 2)
    return {
        "count": len(results),
        "total_latency_ms": total_latency,
        "results": results
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=False)
