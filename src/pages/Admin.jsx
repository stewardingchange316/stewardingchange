import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StepBadge({ step }) {
  const map = {
    done:   { label: "Done",    cls: "badge-done" },
    bank:   { label: "Bank",    cls: "badge-warn" },
    cap:    { label: "Cap",     cls: "badge-warn" },
    church: { label: "Church",  cls: "badge-warn" },
  };
  const { label, cls } = map[step] ?? { label: step ?? "—", cls: "" };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Church inline-edit form ──────────────────────────────────────────────────

function ChurchCard({ church, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    mission_title:       church.mission_title ?? "",
    mission_description: church.mission_description ?? "",
    mission_progress:    church.mission_progress ?? 0,
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === "mission_progress" ? Number(value) : value }));
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("churches")
      .update({
        mission_title:       form.mission_title,
        mission_description: form.mission_description,
        mission_progress:    form.mission_progress,
      })
      .eq("id", church.id);

    setSaving(false);

    if (!error) {
      setEditing(false);
      onSaved(church.id, form);
    }
  }

  return (
    <div className="card stack-4">
      <div className="row-between">
        <div>
          <div style={{ fontWeight: "var(--fw-semibold)", fontSize: "var(--fs-3)", color: "var(--color-text-primary)" }}>
            {church.name}
          </div>
          <div className="small muted" style={{ marginTop: 2 }}>{church.mission_label}</div>
        </div>
        <div style={{ display: "flex", gap: "var(--s-2)", alignItems: "center" }}>
          <span
            className="badge"
            style={{
              background: church.active ? "rgba(76,175,122,0.12)" : "var(--color-surface-2)",
              color: church.active ? "var(--color-success)" : "var(--color-text-muted)",
              borderColor: church.active ? "rgba(76,175,122,0.2)" : "var(--color-border)",
            }}
          >
            {church.active ? "Active" : "Inactive"}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setEditing((e) => !e)}
          >
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="stack-2">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small muted">{church.mission_title || "Mission"}</span>
          <span
            className="small"
            style={{ color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}
          >
            {church.mission_progress ?? 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${church.mission_progress ?? 0}%` }}
          />
        </div>
        <div className="small muted">Goal: {church.mission_goal || "—"} · {church.giving_cadence}</div>
      </div>

      {/* Inline edit form */}
      {editing && (
        <div
          className="stack-4"
          style={{
            borderTop: "1px solid var(--color-border)",
            paddingTop: "var(--s-4)",
            marginTop: "var(--s-2)",
          }}
        >
          <div className="stack-2">
            <label
              htmlFor={`title-${church.id}`}
              style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}
            >
              Mission title
            </label>
            <input
              id={`title-${church.id}`}
              className="input"
              name="mission_title"
              value={form.mission_title}
              onChange={handleChange}
            />
          </div>

          <div className="stack-2">
            <label
              htmlFor={`desc-${church.id}`}
              style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}
            >
              Mission description
            </label>
            <textarea
              id={`desc-${church.id}`}
              className="textarea"
              name="mission_description"
              value={form.mission_description}
              onChange={handleChange}
              rows={3}
            />
          </div>

          <div className="stack-2">
            <label
              htmlFor={`progress-${church.id}`}
              style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}
            >
              Progress ({form.mission_progress}%)
            </label>
            <input
              id={`progress-${church.id}`}
              className="sc-giving-slider"
              type="range"
              name="mission_progress"
              min={0}
              max={100}
              value={form.mission_progress}
              onChange={handleChange}
            />
          </div>

          <button
            className="btn btn-primary btn-sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Admin() {
  const nav = useNavigate();

  const [users,    setUsers]    = useState([]);
  const [churches, setChurches] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: userData }, { data: churchData }] = await Promise.all([
        supabase
          .from("users")
          .select("id, first_name, last_name, email, church_id, weekly_cap, bank_connected, onboarding_step, role, created_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("churches")
          .select("*")
          .order("name"),
      ]);

      setUsers(userData ?? []);
      setChurches(churchData ?? []);
      setLoading(false);
    }

    load();
  }, []);

  // Update church in local state after inline save
  function handleChurchSaved(id, patch) {
    setChurches((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
    );
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    nav("/");
  }

  /* ── Derived stats ── */
  const totalUsers      = users.length;
  const bankCount       = users.filter((u) => u.bank_connected).length;
  const bankPct         = totalUsers ? Math.round((bankCount / totalUsers) * 100) : 0;
  const doneCount       = users.filter((u) => u.onboarding_step === "done").length;
  const donePct         = totalUsers ? Math.round((doneCount / totalUsers) * 100) : 0;

  /* ── Loading state ── */
  if (loading) {
    return (
      <>
        <header className="header">
          <div className="header-inner">
            <Link to="/" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
          </div>
        </header>
        <div className="center" style={{ minHeight: "60vh" }}>
          <div className="spinner" />
        </div>
      </>
    );
  }

  /* ── Render ── */
  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <Link to="/" className="brand">
              <img
                src="/logo.png"
                alt="Stewarding Change"
                className="brand-mark"
                style={{ height: "36px", width: "36px", objectFit: "contain" }}
              />
              <span className="brand-name">Stewarding Change</span>
            </Link>
            <span className="badge badge-brand">Admin</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/dashboard")}>
              ← Dashboard
            </button>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* ── Page body ── */}
      <div className="dash-body">
        <div
          className="stack-7"
          style={{ width: "min(var(--container-max), calc(100% - 32px))", margin: "0 auto" }}
        >

          {/* ── Page title ── */}
          <div>
            <h2 style={{ margin: 0 }}>Admin Panel</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {totalUsers} user{totalUsers !== 1 ? "s" : ""} · {churches.length} church{churches.length !== 1 ? "es" : ""}
            </p>
          </div>

          {/* ── Stats row ── */}
          <div className="dash-stats">
            <div className="dash-stat">
              <div className="dash-stat-label">Total Users</div>
              <div className="dash-stat-value">{totalUsers}</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">Bank Connected</div>
              <div className="dash-stat-value">{bankCount}</div>
              <div className="small muted" style={{ marginTop: 4 }}>{bankPct}% of users</div>
            </div>
            <div className="dash-stat">
              <div className="dash-stat-label">Setup Complete</div>
              <div className="dash-stat-value">{doneCount}</div>
              <div className="small muted" style={{ marginTop: 4 }}>{donePct}% of users</div>
            </div>
          </div>

          {/* ── Users table ── */}
          <div className="stack-3">
            <h3 style={{ margin: 0 }}>Users</h3>
            <div style={{ overflowX: "auto", borderRadius: "var(--r-lg)" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Church</th>
                    <th>Cap</th>
                    <th>Bank</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        No users yet.
                      </td>
                    </tr>
                  )}
                  {users.map((u) => {
                    const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                    const churchName = churches.find((c) => c.id === u.church_id)?.name;
                    const cap = u.weekly_cap === null
                      ? <span className="muted">No limit</span>
                      : `$${u.weekly_cap} / wk`;

                    return (
                      <tr key={u.id}>
                        <td style={{ fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)", whiteSpace: "nowrap" }}>
                          {name}
                        </td>
                        <td style={{ color: "var(--color-text-muted)" }}>{u.email || "—"}</td>
                        <td style={{ whiteSpace: "nowrap" }}>{churchName || <span className="muted">—</span>}</td>
                        <td>{cap}</td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div
                              className={`status-dot ${u.bank_connected ? "is-active" : "is-paused"}`}
                              style={{ width: 8, height: 8 }}
                            />
                            <span className="muted">{u.bank_connected ? "Yes" : "No"}</span>
                          </div>
                        </td>
                        <td>
                          <StepBadge step={u.onboarding_step} />
                        </td>
                        <td>
                          {u.role === "admin"
                            ? <span className="badge badge-brand">Admin</span>
                            : <span className="muted">User</span>
                          }
                        </td>
                        <td style={{ whiteSpace: "nowrap", color: "var(--color-text-muted)" }}>
                          {fmt(u.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Churches section ── */}
          <div className="stack-3">
            <h3 style={{ margin: 0 }}>Churches</h3>
            <div className="grid-2">
              {churches.map((c) => (
                <ChurchCard
                  key={c.id}
                  church={c}
                  onSaved={handleChurchSaved}
                />
              ))}
            </div>
          </div>

          {/* ── Giving history placeholder ── */}
          <div className="stack-3">
            <h3 style={{ margin: 0 }}>Giving History</h3>
            <div className="dash-status-banner is-pending">
              <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
                <div className="status-dot is-pending" />
                <div className="small muted">
                  Donation history will appear here once the payment processor is connected.
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
