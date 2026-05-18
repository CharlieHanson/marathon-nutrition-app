import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWithRetry } from '../../../src/lib/geminiWithRetry.js';

const PROVIDER_LABELS = { gemini: 'Gemini', openai: 'OpenAI' };

/** OpenAI model for meal generation routes (generate-day, single meal, etc.) */
export const OPENAI_MEAL_MODEL = 'gpt-5.4-nano';

/**
 * @param {'gemini'|'openai'} provider
 * @param {object} options
 * @param {string} options.prompt
 * @param {string} [options.geminiModel]
 * @param {string} [options.openaiModel]
 * @param {number} [options.temperature]
 * @param {number} [options.maxTokens]
 */
export async function completeJSON(provider, options) {
  const {
    prompt,
    geminiModel = 'gemini-2.5-flash',
    openaiModel = OPENAI_MEAL_MODEL,
    temperature = 0.7,
    maxTokens = 8000,
  } = options;

  const label = PROVIDER_LABELS[provider] || provider;

  try {
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      });
      return response.choices[0].message.content;
    }

    if (provider === 'gemini') {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: geminiModel,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature,
          maxOutputTokens: maxTokens,
        },
      });
      const aiResult = await generateWithRetry(model, prompt);
      return aiResult.response.text();
    }

    throw new Error(`Unknown provider: ${provider}`);
  } catch (err) {
    console.error(`${label} API error:`, err);
    throw new Error(`${label} API failed: ${err.message}`);
  }
}

export function isHighDemandError(message) {
  return message?.includes('503') || message?.includes('high demand');
}
