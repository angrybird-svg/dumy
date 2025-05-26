const { HfInference } = require('@huggingface/inference');
const hf = new HfInference(process.env.HF_TOKEN); // Free access token

// Cache for storing recent analyses to reduce API calls
const analysisCache = new Map();
const CACHE_LIMIT = 50; // Keep last 50 analyses

/**
 * Analyzes interview responses using Hugging Face models
 * @param {string} question - Interview question
 * @param {string} answer - User's response
 * @returns {Promise<object>} Analysis results
 */
async function analyzeResponse(question, answer) {
  try {
    const cacheKey = `${question}-${answer}`.substring(0, 100);
    
    // Return cached result if available
    if (analysisCache.has(cacheKey)) {
      return analysisCache.get(cacheKey);
    }

    // Format prompt for the model
    const prompt = `
    Analyze this interview response and provide:
    1. Clarity score (1-10)
    2. Relevance score (1-10)
    3. Two improvement suggestions

    Question: "${question}"
    Answer: "${answer}"

    Analysis:
    `;

    // Call Hugging Face API (FLAN-T5 as fallback)
    const response = await hf.textGeneration({
      model: 'HuggingFaceH4/zephyr-7b-beta', // Primary model
      inputs: prompt,
      parameters: {
        max_new_tokens: 200,
        temperature: 0.7,
        do_sample: true
      }
    }).catch(async () => {
      // Fallback to FLAN-T5 if Zephyr fails
      return await hf.textGeneration({
        model: 'google/flan-t5-base',
        inputs: prompt,
        parameters: { max_new_tokens: 150 }
      });
    });

    const analysis = parseAIFeedback(response.generated_text);

    // Update cache
    if (analysisCache.size >= CACHE_LIMIT) {
      analysisCache.delete(analysisCache.keys().next().value);
    }
    analysisCache.set(cacheKey, analysis);

    return analysis;
  } catch (err) {
    console.error('AI Analysis Error:', err);
    return getLocalFallbackAnalysis(answer); // Local backup
  }
}

/**
 * Parses raw model output into structured feedback
 */
function parseAIFeedback(text) {
  // Extract scores using regex
  const clarityMatch = text.match(/Clarity score:? (\d+)/i);
  const relevanceMatch = text.match(/Relevance score:? (\d+)/i);

  // Extract suggestions (format may vary)
  const suggestions = text.includes('suggestions:') 
    ? text.split('suggestions:')[1].trim().split('\n').slice(0, 2)
    : [
        "Provide more specific examples",
        "Structure your answer using the STAR method"
      ];

  return {
    clarity: clarityMatch ? Math.min(10, parseInt(clarityMatch[1])) : 6,
    relevance: relevanceMatch ? Math.min(10, parseInt(relevanceMatch[1])) : 6,
    suggestions,
    rawAnalysis: text // Keep original for debugging
  };
}

/**
 * Local fallback when API fails
 */
function getLocalFallbackAnalysis(answer) {
  const fillerWords = ["um", "uh", "like", "you know"].filter(word => 
    answer.toLowerCase().includes(word)
  ).length;

  return {
    clarity: Math.max(1, 8 - fillerWords),
    relevance: 7,
    suggestions: [
      fillerWords > 2 ? "Reduce filler words" : "Good pacing",
      "Add more technical details"
    ]
  };
}

module.exports = { analyzeResponse };