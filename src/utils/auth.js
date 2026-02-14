// src/utils/auth.js

const USER_KEY = "sc_user";
const FLOW_KEY = "sc_onboarding";

/* ================= AUTH ================= */

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

// Alias so older/newer imports won't break
export const getCurrentUser = getUser;

export function isAuthenticated() {
  return !!getUser();
}

/*
  SIGN UP
  Returns a user object (NOT { user: ... })
*/
export function signUp(userData) {
  const user = {
    id: "SC-" + Math.random().toString(36).substring(2, 10).toUpperCase(),
    email: userData.email,
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    phone: userData.phone || "",
    createdAt: Date.now(),

    onboarding: {
      church: null,
      givingCap: null,
      bankConnected: false,
    },

    stats: {
      totalGiven: 0,
      monthlyGoal: 0,
      impactScore: 0,
    },
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // initialize onboarding flow
  localStorage.setItem(
    FLOW_KEY,
    JSON.stringify({
      step: "church",
    })
  );

  return user;
}

/*
  SIGN IN
  Keeps existing stored user intact
*/
export function signIn(email, password) {
  const existing = getUser();

  // NOTE: this is still "local" auth for now (not Supabase auth yet)
  if (!existing || existing.email !== email) {
    throw new Error("Invalid email or password.");
  }

  // do NOT reset onboarding on sign-in
  if (!localStorage.getItem(FLOW_KEY)) {
    localStorage.setItem(FLOW_KEY, JSON.stringify({ step: "church" }));
  }

  return existing;
}

export function signOut() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(FLOW_KEY);
}

export function deleteAccount() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(FLOW_KEY);
}

/* ================= USER UPDATES ================= */

export function updateUser(updates) {
  const user = getUser();
  if (!user) return null;

  const updated = { ...user, ...updates };
  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

export function updateOnboardingData(data) {
  const user = getUser();
  if (!user) return null;

  const updated = {
    ...user,
    onboarding: {
      ...user.onboarding,
      ...data,
    },
  };

  localStorage.setItem(USER_KEY, JSON.stringify(updated));
  return updated;
}

/* ================= ONBOARDING FLOW ================= */

export function getOnboarding() {
  const raw = localStorage.getItem(FLOW_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function setOnboarding(data) {
  localStorage.setItem(FLOW_KEY, JSON.stringify(data));
}

export function advanceOnboarding(nextStep) {
  setOnboarding({ step: nextStep });
}

export function isOnboardingComplete() {
  const flow = getOnboarding();
  return flow?.step === "complete";
}

export function getNextOnboardingPath() {
  const flow = getOnboarding();
  if (!flow) return "/signup";

  switch (flow.step) {
    case "church":
      return "/church-select";
    case "cap":
      return "/giving-cap";
    case "bank":
      return "/bank";
    case "complete":
      return "/dashboard";
    default:
      return "/church-select";
  }
}
