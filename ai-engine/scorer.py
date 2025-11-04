# ai-engine/scorer.py
from sentence_transformers import SentenceTransformer, util
import re

# Multilingual model for English + Arabic
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

def cosine(a, b):
    return float(util.cos_sim(a, b))

def normalize(text: str) -> str:
    # Lowercase + remove punctuation except Arabic chars + keep letters/numbers/space
    if not text:
        return ""
    return re.sub(r"[^a-zA-Z0-9\u0600-\u06FF\s]", " ", text).lower().strip()

def detect_irrelevant_entities(expected, actual):
    """
    If the actual response contains sensitive entities not present in expected context,
    flag as possible hallucination. This is conservative and checks only a short allowlist.
    """
    if not actual:
        return False

    # short allowlist of government-specific terms to validate against expectedMeaning
    sensitive_entities = ["uae", "emirates", "emirates id", "uae pass", "gdrfa", "ica", "ministry"]
    norm_expected = normalize(expected)
    norm_actual = normalize(actual)

    for ent in sensitive_entities:
        if ent in norm_actual and ent not in norm_expected:
            # actual mentions a sensitive entity that the expected meaning didn't reference
            return True
    return False

def has_hallucination(expected, actual):
    # Heuristic checks:
    # 1) suspicious standalone words in 'actual' that are unrelated to expected
    # 2) mention of sensitive entities not in expected meaning
    # 3) explicit phrases that suggest the model is guessing
    if not actual:
        return False

    norm_expected = set(normalize(expected).split())
    norm_actual = set(normalize(actual).split())

    # suspicious terms that often indicate fabrication
    suspicious_terms = {"always", "never", "definitely", "absolutely", "100%"}
    if any(term in norm_actual for term in suspicious_terms) and len(norm_actual - norm_expected) > 8:
        return True

    # check for sensitive entities referenced incorrectly
    if detect_irrelevant_entities(expected, actual):
        return True

    # fallback: if actual contains obvious "I don't know" style phrases that indicate low quality
    low_quality = {"i'm not sure", "i do not know", "i cannot confirm", "as an ai"}
    lower_actual = actual.lower()
    if any(p in lower_actual for p in low_quality):
        # not a hallucination per-se, but we treat it as low-confidence -> not hallucination
        return False

    return False

def contains_broken_html(actual):
    """
    Quick heuristic: if < and > exist but common safe tags absent, flag low-quality formatting.
    This avoids false-positive for legitimate HTML like <br> or <p>.
    """
    if not actual:
        return False
    if "<" in actual and ">" in actual:
        safe_tags = ["<br", "<p", "<ul", "<ol", "<li", "<strong", "<em", "<a"]
        if any(tag in actual.lower() for tag in safe_tags):
            return False
        # if there are angle brackets but no safe tags -> suspect broken HTML
        return True
    return False

def score_response(expected_meaning, actual, keywords, benchmark=0.3):
    """
    Returns semantic score + keyword match + hallucination flag + final score
    """
    if not actual:
        return {
            "semantic": 0,
            "keyword_score": 0,
            "hallucination_flag": False,
            "final_score": 0,
            "matchedKeywords": []
        }

    # --- Semantic similarity ---
    try:
        emb_expected = model.encode(expected_meaning)
        emb_actual = model.encode(actual)
        semantic = cosine(emb_expected, emb_actual)
    except Exception as e:
        # if embeddings fail, fallback to 0 semantic but do not crash service
        semantic = 0.0

    # --- Keyword matching (case- & punctuation-insensitive) ---
    norm_actual = normalize(actual)
    matched = [k for k in keywords if normalize(k) in norm_actual]
    keyword_score = len(matched) / len(keywords) if keywords else 1

    # --- Hallucination detection ---
    hallucination = has_hallucination(expected_meaning, actual)

    # --- Broken HTML detection ---
    broken_html = contains_broken_html(actual)

    # --- Weighted final score ---
    final_score = (semantic * 0.7) + (keyword_score * 0.3)
    if hallucination:
        final_score -= 0.25
    if broken_html:
        final_score -= 0.10

    # --- Clamp result between 0 and 1 ---
    final_score = max(0, min(1, final_score))

    return {
        "semantic": round(semantic, 3),
        "keyword_score": round(keyword_score, 3),
        "hallucination_flag": bool(hallucination),
        "broken_html_flag": bool(broken_html),
        "final_score": round(final_score, 3),
        "matchedKeywords": matched,
        "benchmark": benchmark
    }
