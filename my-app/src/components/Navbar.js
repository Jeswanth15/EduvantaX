import React from "react";

// Navbar brand mark — main nav controls live in Layout header
const Navbar = () => {

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 12,
    }}>
      {/* Brand mark */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 8,
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(37,99,235,0.35)",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" />
            <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </svg>
        </div>
        <span style={{
          fontSize: 14, fontWeight: 800,
          color: "var(--text-primary)", letterSpacing: "-0.02em",
          fontFamily: "'Outfit', sans-serif",
        }}>NexusEdu</span>
      </div>
    </div>
  );
};

export default Navbar;
