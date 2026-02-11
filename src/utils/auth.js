// src/utils/auth.js

const USER_KEY = "sc_user";
const FLOW_KEY = "sc_onboarding";

/* ---------------- AUTH ---------------- */

export function getUser() {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getUser();
}

export function signUp(email, password) {
  const user = {
    email,
    createdAt: Date.now(),
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // initialize onboarding
  localStorage.setItem(
    FLOW_KEY,
    JSON.stringify({
      step: "church",
    })
  );

  return user;
}

export function signIn(email, password) {
  const user = {
    email,
    createdAt: Date.now(),
  };

  localStorage.setItem(USER_KEY, JSON.stringify(user));

  // do NOT reset onboarding on sign-in
  if (!localStorage.getItem(FLOW_KEY)) {
    localStorage.setItem(
      FLOW_KEY,
      JSON.stringify({
        step: "church",
      })
    );
  }

  return user;
}

export function signOut() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(FLOW_KEY);
}

/* ---------------- ONBOARDING ---------------- */

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
