import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateWithRetry } from './geminiWithRetry.js';

const PROVIDER_LABELS = { gemini: 'Gemini', openai: 'OpenAI' };

/** OpenAI model for meal generation routes (generate-day, single meal, etc.) */
export const OPENAI_MEAL_MODEL = 'gpt-5-mini';

/** Models that only accept the default temperature (omit the param). */
function isGpt5Family(model) {
  return String(model || '').toLowerCase().startsWith('gpt-5');
}

function openaiSupportsCustomTemperature(model) {
  const id = String(model || '').toLowerCase();
  return !(isGpt5Family(id) || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4'));
}

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
      if (!process.env.OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY is not set');
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      // Reasoning tokens count against max_completion_tokens. Without enough
      // headroom (or a low reasoning_effort), gpt-5* returns empty content
      // with finish_reason=length.
      const request = {
        model: openaiModel,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: Math.max(maxTokens, isGpt5Family(openaiModel) ? 8000 : maxTokens),
        response_format: { type: 'json_object' },
      };
      // gpt-5* / o-series only allow the default temperature; sending 0.7 → 400
      if (openaiSupportsCustomTemperature(openaiModel)) {
        request.temperature = temperature;
      }
      if (isGpt5Family(openaiModel) || String(openaiModel).toLowerCase().startsWith('o')) {
        request.reasoning_effort = 'low';
      }
      console.log(
        `[ai] OpenAI request model=${openaiModel} max_completion_tokens=${request.max_completion_tokens}` +
          `${request.reasoning_effort ? ` reasoning_effort=${request.reasoning_effort}` : ''}`
      );
      const response = await openai.chat.completions.create(request);
      const choice = response.choices?.[0];
      const content = choice?.message?.content;
      if (!content || !String(content).trim()) {
        const finishReason = choice?.finish_reason;
        const usage = response.usage;
        throw new Error(
          `OpenAI returned empty content (finish_reason=${finishReason || 'unknown'}` +
            `${usage ? `, completion_tokens=${usage.completion_tokens}` : ''}). ` +
            'Usually reasoning used the full token budget — raise max tokens or lower reasoning_effort.'
        );
      }
      return content;
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
