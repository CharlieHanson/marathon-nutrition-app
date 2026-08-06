// api/routes/waitlist.js
// Public: collect marketing waitlist signups (Plus individuals + Pro nutritionists).
import { supabaseAdmin } from '../lib/supabaseAdmin.js';

const ALLOWED_USER_TYPES = new Set(['individual', 'nutritionist']);

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // Practical validation — not full RFC
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && email.length <= 320;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() : '';
    const userType =
      typeof req.body?.userType === 'string'
        ? req.body.userType.trim()
        : typeof req.body?.user_type === 'string'
          ? req.body.user_type.trim()
          : '';

    if (!name || name.length < 1 || name.length > 120) {
      return res.status(400).json({ success: false, error: 'Please enter your name.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ success: false, error: 'Please enter a valid email.' });
    }
    if (!ALLOWED_USER_TYPES.has(userType)) {
      return res.status(400).json({ success: false, error: 'Invalid waitlist type.' });
    }
    if (notes.length > 2000) {
      return res.status(400).json({ success: false, error: 'Notes are too long.' });
    }

    const { error } = await supabaseAdmin.from('waitlist').insert({
      name,
      email,
      user_type: userType,
      notes: notes || null,
    });

    if (error) {
      // Unique violation on (email, user_type)
      if (error.code === '23505') {
        return res.status(200).json({
          success: true,
          alreadyJoined: true,
          message: "You're already on this waitlist. We'll be in touch.",
        });
      }
      console.error('[api/waitlist] insert error:', error);
      return res.status(500).json({
        success: false,
        error: 'Could not join the waitlist. Please try again later.',
      });
    }

    return res.status(200).json({
      success: true,
      alreadyJoined: false,
      message: "You're on the list — thanks for joining!",
    });
  } catch (err) {
    console.error('[api/waitlist] uncaught:', err);
    return res.status(500).json({
      success: false,
      error: 'Could not join the waitlist. Please try again later.',
    });
  }
}
