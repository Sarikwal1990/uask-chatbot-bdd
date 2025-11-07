import logging
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from .scorer import score_response

# ------------------------------------------------------------
# Logging Setup
# ------------------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
handler = logging.FileHandler("logs/app.log", mode="a", encoding="utf-8")
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
handler.setFormatter(formatter)
if not logger.handlers:
    logger.addHandler(handler)

# ------------------------------------------------------------
# FastAPI Setup
# ------------------------------------------------------------
app = FastAPI(title="AI Scorer API", version="2.0")

class Input(BaseModel):
    expectedMeaning: str
    actualResponse: str
    keywords: list[str] = []     # Kept for backward compatibility, ignored internally
    benchmark: float = 0.0       # Always passed from Cypress

# ------------------------------------------------------------
# Health Route
# ------------------------------------------------------------
@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return JSONResponse({"status": "ok", "service": "ai-engine", "version": "2.0"})

# ------------------------------------------------------------
# Scoring Endpoint
# ------------------------------------------------------------
@app.post("/score")
def compute_score(input: Input):
    try:
        input_data = input.dict()
        logger.info("Received scoring request: %s", input_data)

        # Purely semantic scoring (keywords ignored internally)
        result = score_response(
            expected_meaning=input.expectedMeaning,
            actual=input.actualResponse,
            benchmark=input.benchmark
        )

        # Fill in backward compatibility placeholders
        result.setdefault("final_score", 0)
        result.setdefault("matchedKeywords", [])
        result.setdefault("benchmark", input.benchmark)

        logger.info("Scoring result: %s", result)
        return result

    except Exception as e:
        logger.exception("Error in /score endpoint")
        return JSONResponse(
            status_code=500,
            content={
                "final_score": 0,
                "matchedKeywords": [],
                "error": str(e),
                "message": "Internal scoring error"
            }
        )
