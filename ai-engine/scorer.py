from sentence_transformers import SentenceTransformer, util
import re

# Multilingual model for English + Arabic
model = SentenceTransformer("sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")

def cosine(a, b):
    return float(util.cos_sim(a, b))

def has_hallucination(expected, actual):
    # Only flag hallucination if bot invents wrong facts, not if it adds valid steps
    expected_words = set(normalize(expected).split())
    actual_words = set(normalize(actual).split())

    # if bot mentions unrelated entities not at all related to expectMeaning → hallucination
    irrelevant_words = actual_words - expected_words
    suspicious_terms = ["wrong", "fake", "invalid", "random", "unrelated"]

    return any(w in irrelevant_words for w in suspicious_terms)

def normalize(text: str) -> str:
    # Lowercase + remove punctuation and extra spaces
    return re.sub(r"[^a-zA-Z0-9\u0600-\u06FF\s]", "", text).lower().strip()

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
    emb_expected = model.encode(expected_meaning)
    emb_actual = model.encode(actual)
    semantic = cosine(emb_expected, emb_actual)

    # --- Keyword matching (case- & punctuation-insensitive) ---
    norm_actual = normalize(actual)
    matched = [k for k in keywords if normalize(k) in norm_actual]
    keyword_score = len(matched) / len(keywords) if keywords else 1

    # --- Hallucination detection ---
    hallucination = has_hallucination(expected_meaning, actual)

    # --- Weighted final score ---
    final_score = (semantic * 0.7) + (keyword_score * 0.3)
    if hallucination:
        final_score -= 0.2

    # --- Clamp result between 0 and 1 ---
    final_score = max(0, min(1, final_score))

    return {
        "semantic": round(semantic, 3),
        "keyword_score": round(keyword_score, 3),
        "hallucination_flag": hallucination,
        "final_score": round(final_score, 3),
        "matchedKeywords": matched,
        "benchmark": benchmark
    }
