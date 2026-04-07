import React, { useState, useEffect } from "react";
import { registerUser, getAllSchools } from "../utils/api";
import { Link } from "react-router-dom";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("STUDENT");
  const [schoolId, setSchoolId] = useState("");
  const [schools, setSchools] = useState([]);

  useEffect(() => {
    loadSchools();
  }, []);

  const loadSchools = async () => {
    try {
      const res = await getAllSchools();
      setSchools(res.data);
    } catch (err) {
      console.error("Error loading schools", err);
      alert("Failed to load schools.");
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!schoolId) {
      alert("Please select a school");
      return;
    }

    try {
      const payload = { name, email, password, role, schoolId };
      await registerUser(payload);

      alert("Registration successful! Wait for approval.");
      window.location.href = "/login";
    } catch (error) {
      console.error("Registration failed:", error);
      alert("Registration failed. Try again.");
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create Account</h2>
        <p style={styles.subtitle}>Register to continue</p>

        <form onSubmit={handleRegister} style={styles.form}>
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={styles.input}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={styles.input}
          />

          {/* ROLE DROPDOWN */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            required
            style={styles.input}
          >
            <option value="STUDENT">Student</option>
            <option value="TEACHER">Teacher</option>
            <option value="PRINCIPAL">Principal</option>
            <option value="SCHOOLADMIN">School Admin</option>
            <option value="DRIVER">Driver</option>
          </select>

          {/* SCHOOL DROPDOWN */}
          <select
            value={schoolId}
            onChange={(e) => setSchoolId(e.target.value)}
            required
            style={styles.input}
          >
            <option value="">Select School</option>
            {schools.map((s) => (
              <option key={s.schoolId} value={s.schoolId}>
                {s.name}
              </option>
            ))}
          </select>

          <button type="submit" style={styles.button}>
            Register
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f4c75, #3282b8)",
    padding: "20px",
  },

  card: {
    background: "white",
    width: "100%",
    maxWidth: "420px",
    padding: "40px 30px",
    borderRadius: "16px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    textAlign: "center",
  },

  title: {
    fontSize: "28px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#0a4275",
  },

  subtitle: {
    color: "#666",
    marginBottom: "25px",
    fontSize: "14px",
  },

  form: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },

  input: {
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    outline: "none",
    width: "100%",
  },

  button: {
    padding: "12px",
    borderRadius: "8px",
    background: "#0a4275",
    color: "white",
    fontWeight: "600",
    border: "none",
    cursor: "pointer",
    marginTop: "5px",
    fontSize: "16px",
  },

  footerText: {
    marginTop: "15px",
    fontSize: "14px",
    color: "#333",
  },

  link: {
    color: "#0a4275",
    fontWeight: "600",
    textDecoration: "none",
  },
};

export default Register;
