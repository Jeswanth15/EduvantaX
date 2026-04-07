import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserRole, getUserName, logout } from "../utils/authHelper";
import { FaSignOutAlt, FaRocket, FaUserCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const role = getUserRole();
  const name = getUserName();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (!role) {
      navigate("/login");
      return;
    }

    const timer = setTimeout(() => {
      setRedirecting(true);
      const normalizedRole = role?.toUpperCase();
      switch (normalizedRole) {
        case "ADMIN":
          navigate("/admin");
          break;
        case "SCHOOLADMIN":
        case "PRINCIPAL": // Same dashboard for now or similar
          navigate("/schooladmin");
          break;
        case "TEACHER":
          navigate("/teacher");
          break;
        case "STUDENT":
          navigate("/student");
          break;
        case "DRIVER":
          navigate("/driver/portal");
          break;
        default:
          console.warn("Unknown role or role missing from switch:", normalizedRole);
          navigate("/login");
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [role, navigate]);

  return (
    <div style={styles.container}>
      <div className="premium-card" style={styles.card}>
        <div style={styles.iconWrapper}>
          <FaRocket size={32} className="pulse" />
        </div>
        <h2 style={styles.welcomeText}>{t("welcome")}, {name || "User"}!</h2>
        <div style={styles.statusBox}>
          <div style={styles.spinner}></div>
          <p style={styles.redirectText}>
            {redirecting ? t("redirecting") : t("preparing")}
          </p>
        </div>

        <div style={styles.footer}>
          <div style={styles.userInfo}>
            <FaUserCircle size={14} />
            <span>{t("signed_in_as")} <strong>{role}</strong></span>
          </div>
          <button onClick={logout} className="modern-btn btn-outline" style={styles.logoutBtn}>
            <FaSignOutAlt /> {t("logout")}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "calc(100vh - 100px)", // Account for navbar/header space in Layout
  },
  card: {
    width: "420px",
    padding: "40px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  iconWrapper: {
    width: "64px",
    height: "64px",
    borderRadius: "20px",
    backgroundColor: "rgba(30, 136, 229, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "var(--primary-color)",
    marginBottom: "24px",
  },
  welcomeText: {
    fontSize: "24px",
    fontWeight: "700",
    marginBottom: "32px",
  },
  statusBox: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    marginBottom: "40px",
  },
  spinner: {
    width: "24px",
    height: "24px",
    border: "3px solid rgba(0,0,0,0.1)",
    borderTopColor: "var(--primary-color)",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  redirectText: {
    fontSize: "14px",
    color: "var(--text-secondary)",
    margin: 0,
  },
  footer: {
    width: "100%",
    paddingTop: "24px",
    borderTop: "1px solid var(--border-color)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  userInfo: {
    fontSize: "12px",
    color: "var(--text-muted)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  logoutBtn: {
    fontSize: "12px",
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  }
};

export default HomePage;
