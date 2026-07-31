/**
 * Server-side streak update via record_user_streak RPC.
 * Fail-soft: never throws; returns { streak, max_streak } or null.
 */
export async function recordUserStreak(supabase, userId, localDate) {
  if (!userId) return null;

  const date =
    localDate && /^\d{4}-\d{2}-\d{2}$/.test(String(localDate).trim())
      ? String(localDate).trim()
      : new Date().toISOString().slice(0, 10);

  try {
    const { data, error } = await supabase.rpc('record_user_streak', {
      p_user_id: userId,
      p_local_date: date,
    });
    if (error) {
      console.error('[recordUserStreak]', error.message);
      return null;
    }
    const row = data?.[0];
    if (!row) return null;
    return { streak: row.streak, max_streak: row.max_streak };
  } catch (e) {
    console.error('[recordUserStreak]', e?.message || e);
    return null;
  }
}
