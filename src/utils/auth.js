// src/utils/auth.js
import { supabase } from "../lib/supabase";

const FLOW_KEY = "sc_onboarding"; // Keep for backward compatibility during transition

/* ================= AUTH ================= */

export async function getUser() {
  try {
    // Get current Supabase session
    const { data: { user: authUser }, error: sessionError } = await supabase.auth.getUser();
    
    if (sessionError || !authUser) {
      return null;
    }

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError) {
      console.error("Error fetching user profile:", profileError);
      return null;
    }

    // Transform database format to match your existing user object structure
    return {
      id: profile.id,
      email: profile.email,
      firstName: profile.first_name || "",
      lastName: "", // Add last_name to schema if needed
      phone: profile.phone || "",
      createdAt: profile.created_at,

      onboarding: {
        church: profile.church_id ? {
          id: profile.church_id,
          name: profile.church_name
        } : null,
        givingCap: profile.weekly_cap,
        bankConnected: profile.bank_connected || false,
      },

      stats: {
        totalGiven: 0, // Will come from transactions table later
        monthlyGoal: profile.weekly_cap ? profile.weekly_cap * 4 : 0,
        impactScore: 0,
      },
    };
  } catch (error) {
    console.error("Error in getUser:", error);
    return null;
  }
}

// Alias so older/newer imports won't break
export const getCurrentUser = getUser;

export async function isAuthenticated() {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}

/*
  SIGN UP
  Now handled by Supabase auth in Signup.jsx
  This function is kept for compatibility but shouldn't be called directly
*/
export function signUp(userData) {
  console.warn("signUp() is deprecated. Use supabase.auth.signUp() directly in components.");
  return null;
}

/*
  SIGN IN
  Now handled by Supabase auth
*/
export function signIn(email, password) {
  console.warn("signIn() is deprecated. Use supabase.auth.signInWithPassword() directly.");
  return null;
}

export async function signOut() {
  // Clear localStorage onboarding cache
  localStorage.removeItem(FLOW_KEY);
  
  // Sign out from Supabase
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
}

export async function deleteAccount() {
  // This should trigger a Supabase RLS policy or edge function
  // For now, just sign out
  await signOut();
}

/* ================= USER UPDATES ================= */

export async function updateUser(updates) {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data, error } = await supabase
      .from("users")
      .update({
        first_name: updates.firstName,
        phone: updates.phone,
        // Add other fields as needed
      })
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) throw error;
    return await getUser(); // Return fresh user object
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

/* ================= ONBOARDING FLOW ================= */

export async function getOnboarding() {
  try {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) return null;

    const { data: profile, error } = await supabase
      .from("users")
      .select("onboarding_step, church_id, church_name, weekly_cap, bank_connected")
      .eq("id", authUser.id)
      .single();

    if (error) throw error;

    return {
      step: profile.onboarding_step || "church",
      churchId: profile.church_id,
      church: profile.church_id ? {
        id: profile.church_id,
        name: profile.church_name
      } : null,
      weeklyCap: profile.weekly_cap,
      bankConnected: profile.bank_connected || false,
    };
  } catch (error) {
    console.error("Error getting onboarding:", error);
    return { step: "church" }; // Default fallback
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
    
    if (data.churchId !== undefined) {
      updatePayload.church_id = data.churchId;
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
  return flow?.step === "done" || flow?.step === "complete";
}

export async function getNextOnboardingPath() {
  const flow = await getOnboarding();
  if (!flow) return "/signup";

  switch (flow.step) {
    case "church":
      return "/church-select";
    case "cap":
      return "/giving-cap";
    case "bank":
      return "/bank";
    case "done":
    case "complete":
      return "/dashboard";
    default:
      return "/church-select";
  }
}