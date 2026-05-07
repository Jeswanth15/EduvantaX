import React, { useEffect, useState } from "react";
import { getUserById } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";
import { useTranslation } from "react-i18next";

const ROLE_META = {
  ADMIN:       { color: "#f472b6", bg: "rgba(244,114,182,0.12)", glow: "rgba(244,114,182,0.3)", icon: "🛡️", label: "System Administrator" },
  SCHOOLADMIN: { color: "#60a5fa", bg: "rgba(96,165,250,0.12)",  glow: "rgba(96,165,250,0.3)",  icon: "🏫", label: "School Administrator" },
  TEACHER:     { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", glow: "rgba(167,139,250,0.3)", icon: "📚", label: "Teacher" },
  STUDENT:     { color: "#34d399", bg: "rgba(52,211,153,0.12)",  glow: "rgba(52,211,153,0.3)",  icon: "🎓", label: "Student" },
  DRIVER:      { color: "#fb923c", bg: "rgba(251,146,60,0.12)",  glow: "rgba(251,146,60,0.3)",  icon: "🚌", label: "Driver" },
};

const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 14,
    padding: "14px 0",
    borderBottom: "1px solid var(--border-subtle)",
  }}>
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: "var(--surface-2)", border: "1px solid var(--border-subtle)",
      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
    }}>{icon}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value || "—"}</div>
    </div>
  </div>
);

const ProfilePage = () => {
  const { t, i18n } = useTranslation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const decoded = getDecodedToken();
  const userId = decoded?.userId;

  const changeLang = (lng) => { i18n.changeLanguage(lng); localStorage.setItem("lang", lng); };

  useEffect(() => {
    if (!userId) return;
    getUserById(userId).then(r => setUserData(r.data)).catch(console.error)
      .finally(() => setTimeout(() => setLoading(false), 400));
  }, [userId]);

  const getInitials = (name) => (name || "U").split(" ").slice(0,2).map(p => p[0]).join("").toUpperCase();

  const role = userData?.role || decoded?.role || "USER";
  const meta = ROLE_META[role] || ROLE_META.STUDENT;

  if (loading) {
    return (
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight:400, gap:16 }}>
        <div style={{ width:64, height:64, borderRadius:20, background:"var(--surface-2)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:28, animation:"float 2s ease-in-out infinite" }}>👤</div>
        <div className="spinner spinner-lg" />
        <p style={{ color:"var(--text-secondary)", fontSize:14, fontWeight:500 }}>Loading your profile…</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }} className="fade-in">

      {/* ── Profile Hero ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #0c1428 0%, #0f2152 55%, #0c1428 100%)",
        borderRadius: 24, marginBottom: 28,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
      }}>
        {/* Orb decorations */}
        <div style={{ position:"absolute", top:-50, right:60, width:200, height:200, borderRadius:"50%", background:`radial-gradient(circle, ${meta.glow} 0%, transparent 70%)`, filter:"blur(30px)", pointerEvents:"none" }} />

        <div style={{ padding: "36px 40px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
            {/* Avatar */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: `linear-gradient(135deg, ${meta.color}, ${meta.color}88)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, fontWeight: 800, color: "white",
                fontFamily: "'Outfit', sans-serif",
                boxShadow: `0 8px 32px ${meta.glow}, 0 0 0 4px rgba(255,255,255,0.08)`,
              }}>
                {getInitials(userData?.name)}
              </div>
              {/* Online dot */}
              <div style={{
                position: "absolute", bottom: 4, right: 4,
                width: 14, height: 14, borderRadius: "50%",
                background: "#10b981", border: "2.5px solid #0c1428",
                boxShadow: "0 0 8px #10b981",
              }} />
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:4 }}>
                <span style={{ fontSize:10.5, fontWeight:700, color:`${meta.color}aa`, letterSpacing:"0.1em", textTransform:"uppercase" }}>{meta.icon} {meta.label}</span>
              </div>
              <h1 style={{ fontSize:28, fontWeight:900, color:"white", margin:0, letterSpacing:"-0.03em", fontFamily:"'Outfit', sans-serif" }}>
                {userData?.name || "User"}
              </h1>
              <p style={{ color:"rgba(148,163,184,0.75)", fontSize:13.5, margin:"6px 0 0" }}>{userData?.email}</p>
            </div>

            {/* Status badge */}
            <div style={{
              display:"flex", alignItems:"center", gap:8, flexShrink:0,
              padding:"10px 18px", borderRadius:14,
              background: userData?.approvalStatus === "APPROVED" ? "rgba(52,211,153,0.12)" : "rgba(245,158,11,0.12)",
              border: `1px solid ${userData?.approvalStatus === "APPROVED" ? "rgba(52,211,153,0.25)" : "rgba(245,158,11,0.25)"}`,
            }}>
              <div style={{
                width:8, height:8, borderRadius:"50%",
                background: userData?.approvalStatus === "APPROVED" ? "#10b981" : "#f59e0b",
                animation:"pulse-glow 2s ease-in-out infinite",
              }} />
              <div>
                <div style={{ fontSize:10, color:"rgba(148,163,184,0.6)", fontWeight:600, textTransform:"uppercase", letterSpacing:"0.05em" }}>Account Status</div>
                <div style={{ fontSize:13, fontWeight:800, color: userData?.approvalStatus === "APPROVED" ? "#34d399" : "#fbbf24" }}>
                  {userData?.approvalStatus || "Active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Two Column Grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:22, marginBottom:22 }}>

        {/* Personal Info */}
        <div style={{ background:"var(--surface-1)", borderRadius:20, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"rgba(96,165,250,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>👤</div>
            <h2 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", margin:0 }}>{t("personal_info")}</h2>
          </div>
          <div style={{ padding:"4px 22px 18px" }}>
            <InfoRow icon="✉️" label={t("email_placeholder")} value={userData?.email} />
            <InfoRow icon="🏷️" label="User ID" value={`#${userData?.userId}`} />
            <InfoRow icon="🎭" label="Role" value={meta.label} />
          </div>
        </div>

        {/* Academic */}
        <div style={{ background:"var(--surface-1)", borderRadius:20, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
          <div style={{ padding:"18px 22px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:30, height:30, borderRadius:8, background:"rgba(52,211,153,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>🏫</div>
            <h2 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", margin:0 }}>{t("academic_affiliation")}</h2>
          </div>
          <div style={{ padding:"4px 22px 18px" }}>
            <InfoRow icon="🏫" label="School ID" value={userData?.schoolId ? `#${userData.schoolId}` : "Global Admin"} />
            {userData?.classroomId && <InfoRow icon="🏛️" label="Classroom" value={`#${userData.classroomId}`} />}
            <InfoRow icon="📅" label="Member Since" value={userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString([], { year:"numeric", month:"long" }) : "—"} />
          </div>
        </div>
      </div>

      {/* ── Settings Card ── */}
      <div style={{ background:"var(--surface-1)", borderRadius:20, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
        <div style={{ padding:"18px 24px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:30, height:30, borderRadius:8, background:"rgba(167,139,250,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:15 }}>⚙️</div>
          <h2 style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)", margin:0 }}>{t("account_settings")}</h2>
        </div>
        <div style={{ padding:"22px 24px" }}>

          {/* Language */}
          <div style={{ marginBottom:28 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"var(--text-secondary)", display:"block", marginBottom:12, letterSpacing:"0.05em", textTransform:"uppercase" }}>
              🌐 {t("language")}
            </label>
            <div style={{ display:"flex", gap:10 }}>
              {[["en","🇬🇧 English"], ["ta","🇮🇳 Tamil"]].map(([code, label]) => (
                <button key={code} onClick={() => changeLang(code)} style={{
                  flex:1, padding:"10px 16px", borderRadius:10, cursor:"pointer",
                  fontFamily:"var(--font-sans)", fontSize:13.5, fontWeight:700,
                  background: i18n.language === code ? "linear-gradient(135deg, #2563eb, #7c3aed)" : "var(--surface-2)",
                  color: i18n.language === code ? "white" : "var(--text-secondary)",
                  border: i18n.language === code ? "1px solid transparent" : "1px solid var(--border-light)",
                  boxShadow: i18n.language === code ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
                  transition:"all 0.2s ease",
                }}>{label}</button>
              ))}
            </div>
          </div>

          <p style={{ fontSize:13.5, color:"var(--text-secondary)", marginBottom:20, lineHeight:1.6, padding:"12px 16px", background:"var(--surface-2)", borderRadius:10, border:"1px solid var(--border-subtle)" }}>
            ℹ️ Profile editing is managed by your school administrator. Contact them for any updates to your account details.
          </p>

          <div style={{ display:"flex", gap:10 }}>
            <button style={{
              padding:"10px 18px", borderRadius:10, cursor:"pointer",
              background:"var(--surface-2)", border:"1px solid var(--border-light)",
              color:"var(--text-secondary)", fontSize:13.5, fontWeight:600,
              fontFamily:"var(--font-sans)", transition:"all 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--surface-3)"; e.currentTarget.style.color="var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="var(--surface-2)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >🔑 {t("change_password")}</button>
            <button style={{
              padding:"10px 18px", borderRadius:10, cursor:"pointer",
              background:"var(--surface-2)", border:"1px solid var(--border-light)",
              color:"var(--text-secondary)", fontSize:13.5, fontWeight:600,
              fontFamily:"var(--font-sans)", transition:"all 0.2s ease",
            }}
              onMouseEnter={e => { e.currentTarget.style.background="var(--surface-3)"; e.currentTarget.style.color="var(--text-primary)"; }}
              onMouseLeave={e => { e.currentTarget.style.background="var(--surface-2)"; e.currentTarget.style.color="var(--text-secondary)"; }}
            >📝 {t("request_update")}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
