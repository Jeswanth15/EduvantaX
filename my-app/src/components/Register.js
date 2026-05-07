import React, { useState, useEffect, useRef } from "react";
import { registerUser, getAllSchools } from "../utils/api";
import { Link } from "react-router-dom";

const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.4,
      dx: (Math.random() - 0.5) * 0.35, dy: (Math.random() - 0.5) * 0.35,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(167,139,250,${p.o})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};

const ROLES = [
  { value: "STUDENT", label: "Student", icon: "🎓" },
  { value: "TEACHER", label: "Teacher", icon: "📚" },
  { value: "SCHOOLADMIN", label: "School Admin", icon: "🏫" },
  { value: "DRIVER", label: "Driver", icon: "🚌" },
];

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "STUDENT", schoolId: "" });
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState("");
  const [step, setStep] = useState(1); // 1 = personal, 2 = role/school
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    getAllSchools().then(r => setSchools(r.data)).catch(() => {});
  }, []);

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!form.schoolId) { alert("Please select a school"); return; }
    setLoading(true);
    try {
      await registerUser(form);
      alert("Registration successful! Please wait for approval.");
      window.location.href = "/login";
    } catch {
      alert("Registration failed. Try again.");
      setLoading(false);
    }
  };

  const inputStyle = (id) => ({
    ...S.input,
    ...(focused === id ? S.inputFocus : {}),
  });

  return (
    <div style={S.page}>
      <div style={S.bgGrad} />
      <div style={S.bgBlob1} /><div style={S.bgBlob2} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}><ParticleCanvas /></div>

      <div style={S.card} className="animate-scale-in">
        <div style={S.cardShine} />

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span style={S.logoText}>NexusEdu</span>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={S.heading}>Create Account</h1>
          <p style={S.subheading}>Join your school's learning platform</p>
        </div>

        {/* Step indicator */}
        <div style={S.stepRow}>
          {[1, 2].map(n => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ ...S.stepDot, ...(step >= n ? S.stepDotActive : {}) }}>
                {step > n ? "✓" : n}
              </div>
              <span style={{ ...S.stepLabel, ...(step >= n ? { color: "#93c5fd" } : {}) }}>
                {n === 1 ? "Personal Info" : "Role & School"}
              </span>
              {n < 2 && <div style={{ ...S.stepLine, ...(step > n ? S.stepLineActive : {}) }} />}
            </div>
          ))}
        </div>

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {step === 1 && (
            <>
              {/* Name */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Full Name</label>
                <div style={{ position: "relative" }}>
                  <div style={S.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                  </div>
                  <input type="text" placeholder="John Smith" value={form.name}
                    onChange={e => handleChange("name", e.target.value)} required
                    onFocus={() => setFocused("name")} onBlur={() => setFocused("")}
                    style={inputStyle("name")} />
                </div>
              </div>

              {/* Email */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Email Address</label>
                <div style={{ position: "relative" }}>
                  <div style={S.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                    </svg>
                  </div>
                  <input type="email" placeholder="you@school.edu" value={form.email}
                    onChange={e => handleChange("email", e.target.value)} required
                    onFocus={() => setFocused("email")} onBlur={() => setFocused("")}
                    style={inputStyle("email")} />
                </div>
              </div>

              {/* Password */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Password</label>
                <div style={{ position: "relative" }}>
                  <div style={S.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </div>
                  <input type={showPass ? "text" : "password"} placeholder="Min. 8 characters" value={form.password}
                    onChange={e => handleChange("password", e.target.value)} required
                    onFocus={() => setFocused("pass")} onBlur={() => setFocused("")}
                    style={{ ...inputStyle("pass"), paddingRight: 44 }} />
                  <button type="button" onClick={() => setShowPass(!showPass)} style={S.eyeBtn}>
                    {showPass
                      ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                      : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </button>
                </div>
              </div>

              <button type="button" onClick={() => setStep(2)} style={S.nextBtn}
                disabled={!form.name || !form.email || !form.password}>
                Next Step
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {/* Role selector */}
              <div style={S.fieldGroup}>
                <label style={S.label}>I am a…</label>
                <div style={S.roleGrid}>
                  {ROLES.map(r => (
                    <button type="button" key={r.value}
                      onClick={() => handleChange("role", r.value)}
                      style={{ ...S.roleBtn, ...(form.role === r.value ? S.roleBtnActive : {}) }}>
                      <span style={{ fontSize: 22 }}>{r.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* School */}
              <div style={S.fieldGroup}>
                <label style={S.label}>Select School</label>
                <div style={{ position: "relative" }}>
                  <div style={S.inputIcon}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <select value={form.schoolId} onChange={e => handleChange("schoolId", e.target.value)}
                    required onFocus={() => setFocused("school")} onBlur={() => setFocused("")}
                    style={{ ...inputStyle("school"), paddingLeft: 40, cursor: "pointer",
                      backgroundImage: "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e\")",
                      backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", backgroundSize: 16,
                      paddingRight: 36, appearance: "none", WebkitAppearance: "none" }}>
                    <option value="" style={{ background: "#0f172a" }}>Choose your school…</option>
                    {schools.map(s => (
                      <option key={s.schoolId} value={s.schoolId} style={{ background: "#0f172a" }}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setStep(1)} style={S.backBtn}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  Back
                </button>
                <button type="submit" disabled={loading || !form.schoolId} style={{ ...S.nextBtn, flex: 1 }}>
                  {loading ? (
                    <><div className="spinner" style={{ width: 15, height: 15, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} /> Creating…</>
                  ) : (
                    <> Create Account <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.07)", textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "rgba(148,163,184,0.7)" }}>Already have an account? </span>
          <Link to="/login" style={{ fontSize: 13, fontWeight: 700, color: "#93c5fd", textDecoration: "none" }}>Sign In →</Link>
        </div>
      </div>
    </div>
  );
};

const S = {
  page: {
    minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
    background: "linear-gradient(135deg, #090e1a 0%, #0c1428 40%, #0f172a 100%)",
    position: "relative", overflow: "hidden", padding: 20,
  },
  bgGrad: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse 70% 50% at 80% 30%, rgba(124,58,237,0.16) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 20% 70%, rgba(14,165,233,0.12) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  bgBlob1: {
    position: "absolute", top: "-15%", right: "-5%", width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
  },
  bgBlob2: {
    position: "absolute", bottom: "-10%", left: "-5%", width: 450, height: 450, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(40px) saturate(200%)", WebkitBackdropFilter: "blur(40px) saturate(200%)",
    border: "1px solid rgba(255,255,255,0.09)", borderRadius: 28,
    padding: "40px 38px", width: "100%", maxWidth: 440,
    boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09)", overflow: "hidden",
  },
  cardShine: {
    position: "absolute", top: 0, left: "-100%", width: "60%", height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.03), transparent)",
    transform: "skewX(-15deg)", animation: "shimmer 5s ease-in-out infinite", pointerEvents: "none",
  },
  logoWrap: { display: "flex", alignItems: "center", gap: 10, marginBottom: 24 },
  logoIcon: {
    width: 40, height: 40, borderRadius: 12,
    background: "linear-gradient(135deg, #7c3aed, #2563eb)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 6px 20px rgba(124,58,237,0.4)",
  },
  logoText: { fontSize: 18, fontWeight: 800, color: "white", fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em" },
  heading: { fontSize: 26, fontWeight: 800, color: "white", marginBottom: 4, letterSpacing: "-0.03em", fontFamily: "'Outfit', sans-serif" },
  subheading: { fontSize: 13, color: "rgba(148,163,184,0.85)" },
  stepRow: { display: "flex", alignItems: "center", gap: 6, marginBottom: 24 },
  stepDot: {
    width: 26, height: 26, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: 11, fontWeight: 700, flexShrink: 0,
    background: "rgba(255,255,255,0.08)", color: "rgba(148,163,184,0.6)", border: "1.5px solid rgba(255,255,255,0.1)",
    transition: "all 0.3s ease",
  },
  stepDotActive: {
    background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white",
    border: "1.5px solid transparent", boxShadow: "0 2px 8px rgba(37,99,235,0.4)",
  },
  stepLabel: { fontSize: 11, fontWeight: 600, color: "rgba(148,163,184,0.5)", transition: "color 0.3s" },
  stepLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.08)", transition: "background 0.3s" },
  stepLineActive: { background: "linear-gradient(90deg, #2563eb, #7c3aed)" },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 5 },
  label: { fontSize: 11.5, fontWeight: 600, color: "rgba(148,163,184,0.85)", letterSpacing: "0.04em" },
  inputIcon: {
    position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
    color: "rgba(148,163,184,0.5)", pointerEvents: "none", zIndex: 1,
  },
  input: {
    width: "100%", padding: "10px 14px 10px 38px",
    background: "rgba(255,255,255,0.06)", border: "1.5px solid rgba(255,255,255,0.09)",
    borderRadius: 10, fontSize: 13.5, color: "white",
    fontFamily: "'Inter', sans-serif", outline: "none", transition: "all 0.2s ease",
  },
  inputFocus: {
    borderColor: "rgba(99,130,255,0.5)", background: "rgba(255,255,255,0.08)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.12)",
  },
  eyeBtn: {
    position: "absolute", right: 11, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "rgba(148,163,184,0.6)",
    cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
  },
  roleGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 },
  roleBtn: {
    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
    padding: "12px 8px", borderRadius: 10, cursor: "pointer",
    background: "rgba(255,255,255,0.04)", border: "1.5px solid rgba(255,255,255,0.08)",
    color: "rgba(148,163,184,0.8)", transition: "all 0.2s ease", fontFamily: "'Inter', sans-serif",
  },
  roleBtnActive: {
    background: "rgba(37,99,235,0.15)", border: "1.5px solid rgba(37,99,235,0.4)",
    color: "#93c5fd", boxShadow: "0 0 0 2px rgba(37,99,235,0.15)",
  },
  nextBtn: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "12px 20px", marginTop: 4,
    background: "linear-gradient(135deg, #2563eb, #7c3aed)", color: "white",
    border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 8px 24px rgba(37,99,235,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
    transition: "all 0.2s ease",
  },
  backBtn: {
    display: "flex", alignItems: "center", gap: 6,
    padding: "12px 16px", borderRadius: 12, cursor: "pointer",
    background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.09)",
    color: "rgba(148,163,184,0.8)", fontSize: 13.5, fontWeight: 600,
    fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease",
  },
};

export default Register;
