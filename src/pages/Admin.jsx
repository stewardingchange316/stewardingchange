import { useState, useEffect, useMemo } from "react";
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
    done:   { label: "Done",   cls: "badge-done" },
    bank:   { label: "Bank",   cls: "badge-warn" },
    cap:    { label: "Cap",    cls: "badge-warn" },
    church: { label: "Church", cls: "badge-warn" },
  };
  const { label, cls } = map[step] ?? { label: step ?? "—", cls: "" };
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ─── Church inline-edit card ──────────────────────────────────────────────────

function ChurchCard({ church, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
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
              background:   church.active ? "rgba(76,175,122,0.12)" : "var(--color-surface-2)",
              color:        church.active ? "var(--color-success)"   : "var(--color-text-muted)",
              borderColor:  church.active ? "rgba(76,175,122,0.2)"   : "var(--color-border)",
            }}
          >
            {church.active ? "Active" : "Inactive"}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={() => setEditing((e) => !e)}>
            {editing ? "Cancel" : "Edit"}
          </button>
        </div>
      </div>

      <div className="stack-2">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span className="small muted">{church.mission_title || "Mission"}</span>
          <span className="small" style={{ color: "var(--color-brand)", fontWeight: "var(--fw-semibold)" }}>
            {church.mission_progress ?? 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${church.mission_progress ?? 0}%` }} />
        </div>
        <div className="small muted">Goal: {church.mission_goal || "—"} · {church.giving_cadence}</div>
      </div>

      {editing && (
        <div className="stack-4" style={{ borderTop: "1px solid var(--color-border)", paddingTop: "var(--s-4)", marginTop: "var(--s-2)" }}>
          <div className="stack-2">
            <label htmlFor={`title-${church.id}`} style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}>
              Mission title
            </label>
            <input id={`title-${church.id}`} className="input" name="mission_title" value={form.mission_title} onChange={handleChange} />
          </div>

          <div className="stack-2">
            <label htmlFor={`desc-${church.id}`} style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}>
              Mission description
            </label>
            <textarea id={`desc-${church.id}`} className="textarea" name="mission_description" value={form.mission_description} onChange={handleChange} rows={3} />
          </div>

          <div className="stack-2">
            <label htmlFor={`progress-${church.id}`} style={{ fontSize: "var(--fs-1)", fontWeight: "var(--fw-medium)", color: "var(--color-text-primary)" }}>
              Progress ({form.mission_progress}%)
            </label>
            <input id={`progress-${church.id}`} className="sc-giving-slider" type="range" name="mission_progress" min={0} max={100} value={form.mission_progress} onChange={handleChange} />
          </div>

          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving}>
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

  // ── Filter + sort state ─────────────────────────────────────────────────────
  const [churchFilter, setChurchFilter] = useState("all");
  const [bankFilter,   setBankFilter]   = useState("all"); // "all" | "connected" | "not_connected"
  const [search,       setSearch]       = useState("");
  const [capSort,      setCapSort]      = useState(null);  // null | "desc" | "asc"
  const [copied,       setCopied]       = useState(false);

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

  function handleChurchSaved(id, patch) {
    setChurches((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    nav("/");
  }

  // ── Filtered + sorted users ─────────────────────────────────────────────────

  const filteredUsers = useMemo(() => {
    let result = users;

    if (churchFilter !== "all") {
      result = result.filter((u) => u.church_id === churchFilter);
    }

    if (bankFilter === "connected") {
      result = result.filter((u) => u.bank_connected);
    } else if (bankFilter === "not_connected") {
      result = result.filter((u) => !u.bank_connected);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((u) =>
        `${u.first_name ?? ""} ${u.last_name ?? ""}`.toLowerCase().includes(q) ||
        (u.email ?? "").toLowerCase().includes(q)
      );
    }

    if (capSort) {
      result = [...result].sort((a, b) => {
        const av = a.weekly_cap ?? Infinity; // null = no limit = treated as highest
        const bv = b.weekly_cap ?? Infinity;
        return capSort === "desc" ? bv - av : av - bv;
      });
    }

    return result;
  }, [users, churchFilter, bankFilter, search, capSort]);

  // ── Stats — always reflect current filter ───────────────────────────────────

  const totalUsers = filteredUsers.length;
  const bankCount  = filteredUsers.filter((u) => u.bank_connected).length;
  const bankPct    = totalUsers ? Math.round((bankCount / totalUsers) * 100) : 0;
  const doneCount  = filteredUsers.filter((u) => u.onboarding_step === "done").length;
  const donePct    = totalUsers ? Math.round((doneCount / totalUsers) * 100) : 0;

  const activeChurchName = churchFilter !== "all"
    ? churches.find((c) => c.id === churchFilter)?.name
    : null;

  // ── Actions ─────────────────────────────────────────────────────────────────

  function handleCopyEmails() {
    const emails = filteredUsers.map((u) => u.email).filter(Boolean).join(", ");
    navigator.clipboard.writeText(emails);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmailAll() {
    const emails = filteredUsers.map((u) => u.email).filter(Boolean).join(",");
    window.location.href = `mailto:?bcc=${encodeURIComponent(emails)}`;
  }

  function handleExportCSV() {
    const headers = ["Name", "Email", "Church", "Weekly Cap", "Bank Connected", "Status", "Joined"];
    const rows = filteredUsers.map((u) => [
      [u.first_name, u.last_name].filter(Boolean).join(" ") || "",
      u.email || "",
      churches.find((c) => c.id === u.church_id)?.name || "",
      u.weekly_cap === null ? "No limit" : `$${u.weekly_cap}`,
      u.bank_connected ? "Yes" : "No",
      u.onboarding_step || "",
      fmt(u.created_at),
    ]);

    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href     = url;
    a.download = `sc-users-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function toggleCapSort() {
    setCapSort((s) => (s === null ? "desc" : s === "desc" ? "asc" : null));
  }

  const capSortLabel = capSort === "desc" ? "Cap ↓" : capSort === "asc" ? "Cap ↑" : "Cap ↕";

  // ── Loading ─────────────────────────────────────────────────────────────────

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

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="dash-root">

      {/* ── Header ── */}
      <header className="header">
        <div className="header-inner">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <Link to="/" className="brand">
              <img src="/logo.png" alt="Stewarding Change" className="brand-mark" style={{ height: "36px", width: "36px", objectFit: "contain" }} />
              <span className="brand-name">Stewarding Change</span>
            </Link>
            <span className="badge badge-brand">Admin</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--s-3)" }}>
            <button className="btn btn-ghost btn-sm" onClick={() => nav("/dashboard")}>← Dashboard</button>
            <button className="btn btn-ghost btn-sm" onClick={handleSignOut}>Sign out</button>
          </div>
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dash-body">
        <div className="stack-7" style={{ width: "min(var(--container-max), calc(100% - 32px))", margin: "0 auto" }}>

          {/* ── Title ── */}
          <div>
            <h2 style={{ margin: 0 }}>Admin Panel</h2>
            <p className="muted" style={{ margin: "4px 0 0" }}>
              {users.length} user{users.length !== 1 ? "s" : ""} · {churches.length} church{churches.length !== 1 ? "es" : ""}
            </p>
          </div>

          {/* ── Stats — update with filter ── */}
          <div>
            {activeChurchName && (
              <p className="small muted" style={{ margin: "0 0 var(--s-3)" }}>
                Showing: <strong style={{ color: "var(--color-text-primary)" }}>{activeChurchName}</strong>
              </p>
            )}
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
          </div>

          {/* ── Users section ── */}
          <div className="stack-4">
            <h3 style={{ margin: 0 }}>Users</h3>

            {/* ── Filters row ── */}
            <div className="stack-3">

              {/* Search + bank filter */}
              <div style={{ display: "flex", gap: "var(--s-3)", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  className="input"
                  style={{ maxWidth: 260, padding: "7px 12px", fontSize: "var(--fs-1)" }}
                  placeholder="Search name or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div style={{ display: "flex", gap: "var(--s-2)" }}>
                  {[
                    { value: "all",           label: "All" },
                    { value: "connected",     label: "Bank ✓" },
                    { value: "not_connected", label: "No bank" },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      className={`btn btn-sm ${bankFilter === value ? "btn-primary" : "btn-secondary"}`}
                      onClick={() => setBankFilter(value)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Church filter tabs */}
              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                <button
                  className={`btn btn-sm ${churchFilter === "all" ? "btn-primary" : "btn-secondary"}`}
                  onClick={() => setChurchFilter("all")}
                >
                  All churches
                </button>
                {churches.map((c) => (
                  <button
                    key={c.id}
                    className={`btn btn-sm ${churchFilter === c.id ? "btn-primary" : "btn-secondary"}`}
                    onClick={() => setChurchFilter(c.id)}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "var(--s-2)", flexWrap: "wrap" }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleCopyEmails}
                  disabled={filteredUsers.length === 0}
                >
                  {copied ? "Copied!" : "Copy emails"}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleEmailAll}
                  disabled={filteredUsers.length === 0}
                >
                  Email all
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleExportCSV}
                  disabled={filteredUsers.length === 0}
                >
                  Export CSV
                </button>
                {(churchFilter !== "all" || bankFilter !== "all" || search) && (
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => { setChurchFilter("all"); setBankFilter("all"); setSearch(""); setCapSort(null); }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Table ── */}
            <div style={{ overflowX: "auto", borderRadius: "var(--r-lg)" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Church</th>
                    <th
                      style={{ cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}
                      onClick={toggleCapSort}
                      title="Sort by weekly cap"
                    >
                      {capSortLabel}
                    </th>
                    <th>Bank</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: "center", color: "var(--color-text-muted)" }}>
                        No users match the current filters.
                      </td>
                    </tr>
                  )}
                  {filteredUsers.map((u) => {
                    const name       = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                    const churchName = churches.find((c) => c.id === u.church_id)?.name;
                    const cap        = u.weekly_cap === null
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
                            <div className={`status-dot ${u.bank_connected ? "is-active" : "is-paused"}`} style={{ width: 8, height: 8 }} />
                            <span className="muted">{u.bank_connected ? "Yes" : "No"}</span>
                          </div>
                        </td>
                        <td><StepBadge step={u.onboarding_step} /></td>
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
                <ChurchCard key={c.id} church={c} onSaved={handleChurchSaved} />
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
