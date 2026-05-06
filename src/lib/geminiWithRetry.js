export async function generateWithRetry(model, prompt, maxRetries = 3) {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return result;
    } catch (error) {
      lastError = error;

      const is503 =
        error.message?.includes('503') ||
        error.message?.includes('Service Unavailable');
      const isOverload =
        error.message?.includes('high demand') ||
        error.message?.includes('overloaded');

      if ((is503 || isOverload) && attempt < maxRetries - 1) {
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 500;
        console.warn(`Gemini 503 on attempt ${attempt + 1}, retrying in ${Math.round(delay)}ms...`);
        await new Promise((res) => setTimeout(res, delay));
        continue;
      }

      // On final attempt with a 503, try fallback model before giving up
      if (is503 || isOverload) {
        try {
          const { GoogleGenerativeAI } = await import('@google/generative-ai');
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
          console.warn('Falling back to gemini-1.5-flash');
          return await fallbackModel.generateContent(prompt);
        } catch (fallbackError) {
          throw fallbackError;
        }
      }

      throw error;
    }
  }

  throw lastError;
}
