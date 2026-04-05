/**
 * Persist the encryption salt generated during signup.
 *
 * During signup, a random salt is generated and stored in sessionStorage
 * (temporary). After the user confirms their email and is redirected to
 * the onboarding page, this function reads the pending salt and stores
 * it permanently in the user_crypto table.
 *
 * This two-step approach is needed because:
 * 1. Signup generates the salt (client-side, before email confirmation)
 * 2. The user_crypto table requires an authenticated user (after confirmation)
 * 3. The auth callback is server-side and can't access sessionStorage
 */

import { createClient } from "./supabase/client";

const PENDING_SALT_KEY = "dzino_pending_salt";

/**
 * Store the pending salt from signup into the user_crypto table.
 *
 * Safe to call multiple times — it's a no-op if:
 * - No pending salt exists in sessionStorage
 * - The user already has a salt in user_crypto
 * - The user is not authenticated
 */
export async function persistPendingSalt(): Promise<void> {
  if (typeof window === "undefined") return;

  const pendingSalt = sessionStorage.getItem(PENDING_SALT_KEY);
  if (!pendingSalt) return;

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check if salt already exists
  const { data: existing } = await supabase
    .from("user_crypto")
    .select("user_id")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Salt already stored — clean up sessionStorage
    sessionStorage.removeItem(PENDING_SALT_KEY);
    return;
  }

  // Store the salt
  const { error } = await supabase
    .from("user_crypto")
    .insert({ user_id: user.id, salt: pendingSalt });

  if (!error) {
    sessionStorage.removeItem(PENDING_SALT_KEY);
  }
}
