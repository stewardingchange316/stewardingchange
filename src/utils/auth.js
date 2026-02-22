// src/utils/auth.js
import { supabase } from "../lib/supabase";

/* ================= AUTH ================= */

export async function getUser() {
  try {
    const { data: { user: authUser }, error: sessionError } =
      await supabase.auth.getUser();

    if (sessionError || !authUser) {
      return null;
    }

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name || "",
      lastName: "",
      phone: profile.phone || "",
      createdAt: profile.created_at,

      onboarding: {
        church: profile.church_id
          ? {
              id: profile.church_id,
              name: profile.church_name,
            }
          : null,
        givingCap: profile.weekly_cap,
        bankConnected: profile.bank_connected || false,
      },

      stats: {
        totalGiven: 0,
        monthlyGoal: profile.weekly_cap ? profile.weekly_cap * 4 : 0,
        impactScore: 0,
      },
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
}

export const getCurrentUser = getUser;

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/* ================= AUTH ACTIONS ================= */

export function signUp() {
  console.warn(
    "signUp() is deprecated. Use supabase.auth.signUp() directly in components."
  );
  return null;
}

export function signIn() {
  console.warn(
    "signIn() is deprecated. Use supabase.auth.signInWithPassword() directly."
  );
  return null;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
}

export async function deleteAccount() {
  await signOut();
}

/* ================= USER UPDATES ================= */

export async function updateUser(updates) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { error } = await supabase
      .from("users")
      .update({
        first_name: updates.firstName,
        phone: updates.phone,
      })
      .eq("id", authUser.id);

    if (error) throw error;
    return await getUser();
  } catch (error) {
    console.error("Error updating user:", error);
    return null;
  }
}

export async function updateOnboardingData(data) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const updatePayload = {};

    if (data.church) {
      updatePayload.church_id = data.church.id;
      updatePayload.church_name = data.church.name;
    }

    if (data.givingCap !== undefined) {
      updatePayload.weekly_cap = data.givingCap;
    }

    if (data.bankConnected !== undefined) {
      updatePayload.bank_connected = data.bankConnected;
    }

    const { error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", authUser.id);

    if (error) throw error;
    return await getUser();
  } catch (error) {
    console.error("Error updating onboarding data:", error);
    return null;
  }
}

/* ================= ONBOARDING ================= */

export async function getOnboarding() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    let { data: profile, error } = await supabase
      .from("users")
      .select("onboarding_step, church_id, church_name, weekly_cap, bank_connected")
      .eq("id", authUser.id)
      .single();

    if (error && error.code === "PGRST116") {
      const { error: insertError } = await supabase
        .from("users")
        .insert({
          id: authUser.id,
          email: authUser.email,
          onboarding_step: "church",
        });

      if (insertError) throw insertError;

      return { step: "church" };
    }

    if (error) throw error;

    return {
      step: profile.onboarding_step || "church",
      churchId: profile.church_id,
      church: profile.church_id
        ? { id: profile.church_id, name: profile.church_name }
        : null,
      weeklyCap: profile.weekly_cap,
      bankConnected: profile.bank_connected || false,
    };
  } catch (error) {
    console.error("Error getting onboarding:", error);
    return { step: "church" };
  }
}

export async function setOnboarding(data) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return;

    const updatePayload = {};

    if (data.step !== undefined) {
      updatePayload.onboarding_step = data.step;
    }

    if (data.church !== undefined) {
      updatePayload.church_id = data.church.id;
      updatePayload.church_name = data.church.name;
    }

    if (data.weeklyCap !== undefined) {
      updatePayload.weekly_cap = data.weeklyCap;
    }

    if (data.bankConnected !== undefined) {
      updatePayload.bank_connected = data.bankConnected;
    }

    const { error } = await supabase
      .from("users")
      .update(updatePayload)
      .eq("id", authUser.id);

    if (error) throw error;
  } catch (error) {
    console.error("Error setting onboarding:", error);
  }
}

export async function advanceOnboarding(nextStep) {
  await setOnboarding({ step: nextStep });
}

export async function isOnboardingComplete() {
  const flow = await getOnboarding();
  return flow?.step === "done";
}

/**
 * Returns the canonical route for the user's current onboarding step.
 *
 * Always reads fresh data from the DB — never relies on cached state —
 * so the result is deterministic and safe to use for programmatic redirects
 * immediately after a DB write.
 *
 * Returns "/church-select" as a safe fallback for any unresolvable state.
 */
export async function getNextOnboardingPath() {
  // Canonical map kept in sync with RequireAuth.jsx's STEP_TO_ROUTE.
  const STEP_ROUTE = {
    church: "/church-select",
    cap:    "/giving-cap",
    bank:   "/bank",
    done:   "/dashboard",
  };

  try {
    const flow = await getOnboarding();
    if (!flow?.step) return "/church-select";
    return STEP_ROUTE[flow.step] ?? "/church-select";
  } catch {
    return "/church-select";
  }
}
