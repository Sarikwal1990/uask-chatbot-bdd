import os
import re
import logging
from sentence_transformers import SentenceTransformer, util

# ------------------------------------------------------------
# Ensure logs directory exists
# ------------------------------------------------------------
os.makedirs("logs", exist_ok=True)

# ------------------------------------------------------------
# Logging Setup
# ------------------------------------------------------------
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

handler = logging.FileHandler("logs/scorer.log", mode="a", encoding="utf-8")
formatter = logging.Formatter(
    "%(asctime)s | %(levelname)s | %(name)s | %(message)s"
)
handler.setFormatter(formatter)

if not logger.handlers:
    logger.addHandler(handler)

# ------------------------------------------------------------
# Model Initialization
# ------------------------------------------------------------
try:
    model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    logger.info("SentenceTransformer model loaded successfully.")
except Exception as e:
    logger.exception("Failed to load SentenceTransformer model.")
    raise e

# ------------------------------------------------------------
# Utility Functions
# ------------------------------------------------------------
def cosine(a, b):
    """Compute cosine similarity between two embeddings."""
    return float(util.cos_sim(a, b))

def normalize(text: str) -> str:
    """Normalize text by lowercasing and removing non-alphanumeric characters except Arabic."""
    if not text:
        return ""
    text = re.sub(r"[^a-zA-Z0-9\u0600-\u06FF\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip().lower()
    return text

# ------------------------------------------------------------
# Hallucination and Quality Checks
# ------------------------------------------------------------
def detect_irrelevant_entities(expected: str, actual: str) -> bool:
    """Detect if actual response mentions sensitive or unrelated entities."""
    if not actual:
        return False

    sensitive_entities = [
        "uae", "emirates", "emirates id", "uae pass", "gdrfa", "ica", "ministry"
    ]
    norm_expected = normalize(expected)
    norm_actual = normalize(actual)

    for entity in sensitive_entities:
        if entity in norm_actual and entity not in norm_expected:
            logger.warning(f"Sensitive entity '{entity}' found in actual but not in expected.")
            return True
    return False

def has_hallucination(expected: str, actual: str) -> bool:
    """Detect hallucinations or irrelevant content."""
    if not actual:
        return False

    norm_expected = set(normalize(expected).split())
    norm_actual = set(normalize(actual).split())

    # Detect exaggerated or unrelated content
    suspicious_terms = {"always", "never", "definitely", "absolutely", "guaranteed", "100%"}
    if any(term in norm_actual for term in suspicious_terms) and len(norm_actual - norm_expected) > 8:
        logger.warning("Detected exaggerated language — possible hallucination.")
        return True

    # Detect sensitive entities
    if detect_irrelevant_entities(expected, actual):
        logger.warning("Detected irrelevant or sensitive entities — possible hallucination.")
        return True

    # Ignore low-confidence phrases (not hallucinations)
    low_confidence = {"i'm not sure", "i do not know", "i cannot confirm", "as an ai"}
    if any(p in actual.lower() for p in low_confidence):
        logger.info("Low-confidence response detected, but not hallucination.")
        return False

    return False

def contains_broken_html(actual: str) -> bool:
    """Detect broken or malformed HTML in the response."""
    if not actual:
        return False

    if "<" in actual and ">" in actual:
        safe_tags = ["<br", "<p", "<ul", "<ol", "<li", "<strong", "<em", "<a"]
        if any(tag in actual.lower() for tag in safe_tags):
            return False
        logger.warning("Broken HTML detected in response.")
        return True
    return False

# ------------------------------------------------------------
# Main Scoring Function — Sentence-Level Semantic Scoring Only
# ------------------------------------------------------------
def score_response(expected_meaning: str, actual: str, benchmark: float = 0.3):
    """
    Compute semantic similarity between expected and actual responses.
    Perform hallucination and formatting checks.
    Returns:
        dict: structured scoring result.
    """
    logger.info("---- Starting new response scoring ----")
    logger.info(f"Expected: {expected_meaning}")
    logger.info(f"Actual: {actual}")

    if not actual or not expected_meaning:
        logger.error("Missing expected or actual response. Returning zero scores.")
        return {
            "semantic": 0.0,
            "keyword_score": 1.0,   # backward compatibility
            "hallucination_flag": False,
            "broken_html_flag": False,
            "final_score": 0.0,
            "matchedKeywords": [],
            "benchmark": benchmark
        }

    # --- Semantic Similarity ---
    try:
        emb_expected = model.encode(expected_meaning, convert_to_tensor=True)
        emb_actual = model.encode(actual, convert_to_tensor=True)
        semantic = cosine(emb_expected, emb_actual)
        logger.info(f"Semantic similarity score: {semantic:.3f}")
    except Exception as e:
        logger.exception("Error during embedding or similarity computation.")
        semantic = 0.0

    # --- Quality Checks ---
    hallucination = has_hallucination(expected_meaning, actual)
    broken_html = contains_broken_html(actual)

    # --- Final Weighted Scoring ---
    final_score = semantic
    if hallucination:
        final_score -= 0.25
    if broken_html:
        final_score -= 0.10
    final_score = max(0.0, min(1.0, final_score))

    # --- Logging Summary ---
    logger.info(
        f"Final Score: {final_score:.3f} | Hallucination: {hallucination} | Broken HTML: {broken_html}"
    )
    logger.info("---- Scoring complete ----\n")

    # --- Structured Result ---
    return {
        "semantic": round(semantic, 3),
        "keyword_score": 1.0,   # maintained for backward compatibility
        "hallucination_flag": bool(hallucination),
        "broken_html_flag": bool(broken_html),
        "final_score": round(final_score, 3),
        "matchedKeywords": [],  # no longer used
        "benchmark": benchmark
    }