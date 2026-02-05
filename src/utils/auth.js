const AUTH_KEY = "sc_auth";
const ONBOARD_KEY = "sc_onboarding";

// Keep compatibility with older imports by exporting both named helpers and the auth object.
export function login(email) {
  localStorage.setItem(AUTH_KEY, JSON.stringify({ email }));
}
export function logout() {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ONBOARD_KEY);
}
export function isAuthenticated() {
  return Boolean(localStorage.getItem(AUTH_KEY));
}
export function getUser() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}
export function getOnboarding() {
  const raw = localStorage.getItem(ONBOARD_KEY);
  return raw ? JSON.parse(raw) : { step: 0 };
}
export function setOnboarding(next) {
  localStorage.setItem(ONBOARD_KEY, JSON.stringify(next));
}

export const auth = {
  login,
  logout,
  isAuthenticated,
  getUser,
  getOnboarding,
  setOnboarding,
};
