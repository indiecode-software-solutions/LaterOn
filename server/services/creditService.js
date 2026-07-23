/**
 * Credit Service — LaterOn Credit-Based Usage System
 *
 * Credit Rules:
 *  - Text-only automation: 5 credits
 *  - Automation with attachment: 7 credits
 *  - Each AI action used: +3 credits
 *
 * Free credits reset monthly; purchased credits never expire.
 * Free credits are consumed first before purchased credits.
 */

/**
 * Calculate credits required for a given schedule payload.
 * @param {Object} params
 * @param {string|null} params.mediaUrl     - Attachment URL (null if none)
 * @param {boolean}     params.usedAi       - Whether AI was used to compose the message
 * @returns {number} Total credits required
 */
function calculateCredits({ mediaUrl = null, usedAi = false }) {
  const base = mediaUrl ? 7 : 5;
  const aiCost = usedAi ? 3 : 0;
  return base + aiCost;
}

/**
 * Fetch the credit record for a given user, auto-creating it if missing (500 free).
 * @param {Object} supabaseAdmin
 * @param {string} userId
 * @returns {{ data: Object|null, error: Object|null }}
 */
async function getUserCredits(supabaseAdmin, userId) {
  const { data, error } = await supabaseAdmin
    .from('user_credits')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code === 'PGRST116') {
    // Row not found — create one with next_refill_date fixed to 1st of next month
    const now = new Date();
    const nextRefill = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    const { data: created, error: createErr } = await supabaseAdmin
      .from('user_credits')
      .insert({
        user_id: userId,
        free_balance: 500,
        purchased_balance: 0,
        last_refill_date: now.toISOString(),
        next_refill_date: nextRefill.toISOString()
      })
      .select()
      .single();

    return { data: created, error: createErr };
  }

  return { data, error };
}

/**
 * Check if a monthly refill is due, and if so, reset free_balance to 500.
 * @param {Object} supabaseAdmin
 * @param {string} userId
 * @param {Object} creditRecord - The current user_credits row
 */
async function maybeRefillCredits(supabaseAdmin, userId, creditRecord) {
  const now = new Date();
  const nextRefill = new Date(creditRecord.next_refill_date);

  if (now >= nextRefill) {
    const newNextRefill = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0);

    await supabaseAdmin
      .from('user_credits')
      .update({
        free_balance: 500,
        last_refill_date: now.toISOString(),
        next_refill_date: newNextRefill.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('user_id', userId);

    // Log the refill transaction
    await supabaseAdmin.from('credit_transactions').insert({
      user_id: userId,
      amount: 500,
      type: 'monthly_refill',
      description: 'Monthly free credit refill'
    });

    creditRecord.free_balance = 500;
    creditRecord.next_refill_date = newNextRefill.toISOString();
  }
}

/**
 * Deduct credits from a user's account (free first, then purchased).
 * Returns the updated credit record or an error if insufficient balance.
 *
 * @param {Object} supabaseAdmin
 * @param {string} userId
 * @param {number} amount            - Credits to deduct
 * @param {string} description       - Human-readable reason
 * @param {string|null} scheduleId   - Associated schedule ID for audit trail
 * @returns {{ success: boolean, error: string|null, creditsCharged: number }}
 */
async function deductCredits(supabaseAdmin, userId, amount, description, scheduleId = null) {
  const { data: credits, error: fetchErr } = await getUserCredits(supabaseAdmin, userId);
  if (fetchErr || !credits) {
    return { success: false, error: 'Could not fetch credit balance', creditsCharged: 0 };
  }

  // Check for monthly refill first
  await maybeRefillCredits(supabaseAdmin, userId, credits);

  const total = credits.free_balance + credits.purchased_balance;
  if (total < amount) {
    return { success: false, error: 'Insufficient credits', creditsCharged: 0 };
  }

  // Consume free credits first, then purchased
  let newFree = credits.free_balance;
  let newPurchased = credits.purchased_balance;
  let remaining = amount;

  if (newFree >= remaining) {
    newFree -= remaining;
    remaining = 0;
  } else {
    remaining -= newFree;
    newFree = 0;
    newPurchased -= remaining;
    remaining = 0;
  }

  const { error: updateErr } = await supabaseAdmin
    .from('user_credits')
    .update({
      free_balance: newFree,
      purchased_balance: newPurchased,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  if (updateErr) {
    return { success: false, error: updateErr.message, creditsCharged: 0 };
  }

  // Log transaction
  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: -amount,
    type: 'deduction',
    description,
    schedule_id: scheduleId || null
  });

  return { success: true, error: null, creditsCharged: amount };
}

/**
 * Refund credits to a user's free balance for a failed schedule.
 *
 * @param {Object} supabaseAdmin
 * @param {string} userId
 * @param {number} amount            - Credits to refund
 * @param {string} scheduleId        - Schedule that failed
 * @returns {{ success: boolean }}
 */
async function refundCredits(supabaseAdmin, userId, amount, scheduleId) {
  if (!amount || amount <= 0) return { success: false };

  // Refund to free balance
  const { data: credits } = await getUserCredits(supabaseAdmin, userId);
  if (!credits) return { success: false };

  await supabaseAdmin
    .from('user_credits')
    .update({
      free_balance: credits.free_balance + amount,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId);

  await supabaseAdmin.from('credit_transactions').insert({
    user_id: userId,
    amount: +amount,
    type: 'refund',
    description: `Refund for failed automation (schedule: ${scheduleId})`,
    schedule_id: scheduleId
  });

  return { success: true };
}

module.exports = { calculateCredits, getUserCredits, maybeRefillCredits, deductCredits, refundCredits };
