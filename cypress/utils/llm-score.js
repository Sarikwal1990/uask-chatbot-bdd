// ai-utils/llm-score.js

/**
 * Score LLM (chatbot) response based on keyword presence
 * @param {String} response - Actual text received from chatbot
 * @param {Array} expectedKeywords - list of keywords expected in a valid reply
 * @returns {Object} { score, matchedKeywords, totalKeywords }
 */
function calculateAIResponseScore(response, expectedKeywords = []) {
    if (!response || expectedKeywords.length === 0) {
        return { score: 0, matchedKeywords: [], totalKeywords: expectedKeywords.length };
    }

    // Normalize text
    const normalizedResponse = response.toLowerCase();

    // Count matched keywords
    const matchedKeywords = expectedKeywords.filter(keyword =>
        normalizedResponse.includes(keyword.toLowerCase())
    );

    const score = matchedKeywords.length / expectedKeywords.length;

    return {
        score: Number(score.toFixed(2)),
        matchedKeywords,
        totalKeywords: expectedKeywords.length
    };
}

/**
 * Validate AI response against Cypress benchmark threshold
 */
function validateAIResponse(response, expectedKeywords) {
    const benchmark = Cypress.env("benchmarkScore") || 0.3; // default 30%
    const result = calculateAIResponseScore(response, expectedKeywords);

    const passed = result.score >= benchmark;

    return {
        ...result,
        benchmark,
        passed
    };
}

module.exports = {
    calculateAIResponseScore,
    validateAIResponse
};