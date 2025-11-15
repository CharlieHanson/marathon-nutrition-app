// api/get-personalized-preferences.js
import { getPersonalizedPreferences } from '../src/lib/rag.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, limit } = req.body || {};
    const preferences = await getPersonalizedPreferences({ userId, limit: limit ?? 10 });

    return res.status(200).json({
      success: true,
      preferences,
    });
  } catch (error) {
    console.error('❌ get-personalized-preferences error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
