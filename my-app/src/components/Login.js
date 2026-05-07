import React, { useState, useEffect, useRef } from "react";
import { loginUser } from "../utils/api";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

/* ── Animated Background Canvas ── */
const ParticleCanvas = () => {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2.2 + 0.4,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.15,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width) p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(147, 197, 253, ${p.o})`;
        ctx.fill();
      });
      // Draw connections
      particles.forEach((p, i) => {
        particles.slice(i + 1).forEach((q) => {
          const dist = Math.hypot(p.x - q.x, p.y - q.y);
          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(147,197,253,${0.12 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        });
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};

const Login = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [focused, setFocused] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await loginUser({ email, password });
      localStorage.setItem("token", response.data);
      window.location.href = "/";
    } catch (err) {
      setError(err.response?.data || "Invalid credentials. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      {/* Animated gradient background */}
      <div style={S.bgGrad} />
      <div style={S.bgBlob1} />
      <div style={S.bgBlob2} />
      <div style={S.bgBlob3} />
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <ParticleCanvas />
      </div>

      {/* Card */}
      <div style={S.card} className="animate-scale-in">
        {/* Shine sweep */}
        <div style={S.cardShine} />

        {/* Logo */}
        <div style={S.logoWrap}>
          <div style={S.logoIcon}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
              <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              <path d="M2 12l10 5 10-5" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeLinecap="round" fill="none" />
            </svg>
          </div>
          <span style={S.logoText}>NexusEdu</span>
        </div>

        {/* Heading */}
        <div style={{ marginBottom: 32 }}>
          <h1 style={S.heading}>{t("welcome_back")}</h1>
          <p style={S.subheading}>{t("login_to_account")}</p>
        </div>

        {/* Error */}
        {error && (
          <div style={S.errorBox} className="animate-fade-in">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Email */}
          <div style={S.inputGroup}>
            <label style={S.label}>Email address</label>
            <div style={{ position: "relative" }}>
              <div style={S.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("email_placeholder")}
                required
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused("")}
                style={{ ...S.input, ...(focused === "email" ? S.inputFocus : {}) }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={S.inputGroup}>
            <label style={S.label}>Password</label>
            <div style={{ position: "relative" }}>
              <div style={S.inputIcon}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2"/><circle cx="12" cy="16" r="1" fill="currentColor"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("password_placeholder")}
                required
                onFocus={() => setFocused("pass")}
                onBlur={() => setFocused("")}
                style={{ ...S.input, ...(focused === "pass" ? S.inputFocus : {}), paddingRight: 44 }}
              />
              <button type="button" onClick={() => setShowPass(!showPass)} style={S.eyeBtn}>
                {showPass ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                )}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading} style={S.submitBtn} className={loading ? "btn-loading" : ""}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }} />
                Signing in…
              </>
            ) : (
              <>
                Sign In
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={S.divider}><span style={S.dividerText}>Don't have an account?</span></div>

        <Link to="/register" style={S.registerLink}>
          Create your account
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </Link>

        {/* Trust badges */}
        <div style={S.trustRow}>
          {["🔒 End-to-end secure", "🏫 Multi-school", "⚡ Real-time"].map((t) => (
            <span key={t} style={S.trustBadge}>{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b3e 40%, #0f172a 100%)",
    position: "relative",
    overflow: "hidden",
    padding: 20,
  },
  bgGrad: {
    position: "absolute", inset: 0,
    background: "radial-gradient(ellipse 80% 60% at 20% 40%, rgba(37,99,235,0.18) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(124,58,237,0.14) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  bgBlob1: {
    position: "absolute", top: "-20%", left: "-10%",
    width: 600, height: 600, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
    animation: "float 8s ease-in-out infinite",
  },
  bgBlob2: {
    position: "absolute", bottom: "-10%", right: "-5%",
    width: 500, height: 500, borderRadius: "50%",
    background: "radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)",
    filter: "blur(40px)", pointerEvents: "none",
    animation: "float 10s ease-in-out infinite reverse",
  },
  bgBlob3: {
    position: "absolute", top: "50%", left: "50%",
    transform: "translate(-50%,-50%)",
    width: 800, height: 400, borderRadius: "50%",
    background: "radial-gradient(ellipse, rgba(14,165,233,0.06) 0%, transparent 70%)",
    filter: "blur(60px)", pointerEvents: "none",
  },
  card: {
    position: "relative",
    background: "rgba(255,255,255,0.05)",
    backdropFilter: "blur(40px) saturate(200%)",
    WebkitBackdropFilter: "blur(40px) saturate(200%)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 28,
    padding: "44px 40px",
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 40px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  cardShine: {
    position: "absolute", top: 0, left: "-100%",
    width: "60%", height: "100%",
    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.04), transparent)",
    transform: "skewX(-15deg)",
    animation: "shimmer 4s ease-in-out infinite",
    pointerEvents: "none",
  },
  logoWrap: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 32,
  },
  logoIcon: {
    width: 44, height: 44, borderRadius: 14,
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 8px 24px rgba(37,99,235,0.4)",
  },
  logoText: {
    fontSize: 20, fontWeight: 800, color: "white",
    fontFamily: "'Outfit', sans-serif", letterSpacing: "-0.03em",
  },
  heading: {
    fontSize: 28, fontWeight: 800, color: "white",
    marginBottom: 6, letterSpacing: "-0.03em",
    fontFamily: "'Outfit', sans-serif",
  },
  subheading: {
    fontSize: 14, color: "rgba(148,163,184,1)", fontWeight: 400,
  },
  errorBox: {
    display: "flex", alignItems: "center", gap: 8,
    background: "rgba(244,63,94,0.12)",
    border: "1px solid rgba(244,63,94,0.3)",
    color: "#fda4af", borderRadius: 10,
    padding: "10px 14px", fontSize: 13, fontWeight: 500, marginBottom: 16,
  },
  inputGroup: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 12, fontWeight: 600, color: "rgba(148,163,184,0.9)", letterSpacing: "0.04em" },
  inputIcon: {
    position: "absolute", left: 13, top: "50%", transform: "translateY(-50%)",
    color: "rgba(148,163,184,0.6)", pointerEvents: "none", zIndex: 1,
  },
  input: {
    width: "100%", padding: "11px 14px 11px 40px",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 10, fontSize: 14, color: "white",
    fontFamily: "'Inter', sans-serif",
    outline: "none",
    transition: "all 0.2s ease",
  },
  inputFocus: {
    borderColor: "rgba(99,130,255,0.6)",
    background: "rgba(255,255,255,0.08)",
    boxShadow: "0 0 0 3px rgba(59,130,246,0.15)",
  },
  eyeBtn: {
    position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
    background: "none", border: "none", color: "rgba(148,163,184,0.7)",
    cursor: "pointer", padding: 4, display: "flex", alignItems: "center",
    transition: "color 0.2s ease",
  },
  submitBtn: {
    marginTop: 8,
    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
    width: "100%", padding: "13px 20px",
    background: "linear-gradient(135deg, #2563eb, #7c3aed)",
    color: "white", border: "none", borderRadius: 12,
    fontSize: 15, fontWeight: 700, cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
    boxShadow: "0 8px 24px rgba(37,99,235,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",
    transition: "all 0.2s ease",
    letterSpacing: "-0.01em",
  },
  divider: {
    margin: "28px 0 20px",
    display: "flex", alignItems: "center",
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: 20,
  },
  dividerText: {
    fontSize: 13, color: "rgba(148,163,184,0.7)", fontWeight: 400,
  },
  registerLink: {
    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
    padding: "11px 20px",
    background: "rgba(255,255,255,0.06)",
    border: "1.5px solid rgba(255,255,255,0.1)",
    borderRadius: 12, color: "rgba(200,220,255,0.9)",
    fontSize: 14, fontWeight: 600,
    textDecoration: "none",
    transition: "all 0.2s ease",
    cursor: "pointer",
    fontFamily: "'Inter', sans-serif",
  },
  trustRow: {
    display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginTop: 24,
  },
  trustBadge: {
    fontSize: 11, padding: "4px 10px",
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 99, color: "rgba(148,163,184,0.7)",
    fontWeight: 500,
  },
};

export default Login;
