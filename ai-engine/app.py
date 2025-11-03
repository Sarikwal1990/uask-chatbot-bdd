# ai-engine/app.py
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .scorer import score_response

app = FastAPI()

class Input(BaseModel):
    expectedMeaning: str
    actualResponse: str
    keywords: list[str] = []
    benchmark: float = 0.0  # will always be passed from Cypress

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return JSONResponse({"status": "ok"})

@app.post("/score")
def compute_score(input: Input):
    try:
        print("Received input:", input.dict())

        result = score_response(
    expected_meaning=input.expectedMeaning,
    actual=input.actualResponse,
    keywords=input.keywords,
    benchmark=input.benchmark
)

        result.setdefault("final_score", 0)
        result.setdefault("matchedKeywords", [])

        print("Score result:", result)
        return result

    except Exception as e:
        print("Error in /score:", e)
        return JSONResponse(
            status_code=200,
            content={
                "final_score": 0,
                "matchedKeywords": [],
                "error": str(e)
            }
        )
