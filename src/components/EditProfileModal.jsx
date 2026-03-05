import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function EditProfileModal({ userId, initialFirstName, initialLastName, initialEmail, onClose, onSaved }) {
  const [firstName, setFirstName] = useState(initialFirstName ?? "");
  const [lastName,  setLastName]  = useState(initialLastName  ?? "");
  const [email,     setEmail]     = useState(initialEmail      ?? "");
  const [saving,    setSaving]    = useState(false);
  const [emailNote, setEmailNote] = useState("");
  const [error,     setError]     = useState("");

  async function handleSave() {
    if (!firstName.trim()) { setError("First name is required."); return; }
    setSaving(true);
    setError("");
    setEmailNote("");

    const { error: nameErr } = await supabase
      .from("users")
      .update({
        first_name: firstName.trim(),
        last_name:  lastName.trim() || null,
      })
      .eq("id", userId);

    if (nameErr) { setError("Failed to save. Please try again."); setSaving(false); return; }

    if (email.trim() && email.trim() !== initialEmail) {
      const { error: emailErr } = await supabase.auth.updateUser({ email: email.trim() });
      if (emailErr) {
        setError("Name saved, but email update failed: " + emailErr.message);
        setSaving(false);
        onSaved({ first_name: firstName.trim(), last_name: lastName.trim() || null });
        return;
      }
      setEmailNote("Check your inbox to confirm your new email address.");
    }

    setSaving(false);
    onSaved({ first_name: firstName.trim(), last_name: lastName.trim() || null });
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <h2 className="modal-title">Edit Profile</h2>
        <p className="modal-subtitle">Update your name or email address.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-4)" }}>

          <div style={{ display: "flex", gap: "var(--s-3)" }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <label className="auth-label">First Name</label>
              <input
                className="input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                autoFocus
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
              <label className="auth-label">Last Name</label>
              <input
                className="input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "var(--s-2)" }}>
            <label className="auth-label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
            />
            {emailNote && (
              <p className="small" style={{ margin: 0, color: "var(--color-brand)" }}>
                {emailNote}
              </p>
            )}
          </div>

          {error && (
            <p className="small" style={{ margin: 0, color: "var(--color-danger)" }}>
              {error}
            </p>
          )}

          <div style={{ display: "flex", gap: "var(--s-3)", justifyContent: "flex-end", paddingTop: "var(--s-2)" }}>
            <button className="btn btn-ghost btn-sm" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
