import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { getDecodedToken } from "../utils/authHelper";
import * as XLSX from "xlsx";

import "./../styles/PendingUsers.css";   // <-- IMPORTANT

import {
  getPendingUsersBySchool,
  getTeachersBySchool,
  getStudentsBySchool,
  approveUser,
  rejectUser,
  deleteUser,
  bulkRegister,
} from "../utils/api";

const PendingUsers = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [pendingUsers, setPendingUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [excelData, setExcelData] = useState([]);
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    if (schoolId) fetchAll();
  }, [schoolId]);

  const fetchAll = async () => {
    const [p, t, s] = await Promise.all([
      getPendingUsersBySchool(schoolId),
      getTeachersBySchool(schoolId),
      getStudentsBySchool(schoolId),
    ]);

    setPendingUsers(p.data);
    setTeachers(t.data);
    setStudents(s.data);
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb = XLSX.read(ev.target.result, { type: "binary" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      const formatted = json.map((r) => ({
        name: r.name || r.Name,
        email: r.email || r.Email,
        password: r.password || r.Password,
        role: r.role || r.Role,
        schoolId,
      }));

      setExcelData(formatted);
    };
    reader.readAsBinaryString(file);
  };

  const handleBulkSubmit = async () => {
    await bulkRegister(excelData);
    alert("Bulk registered!");
    setExcelData([]);
    setShowBulk(false);
    fetchAll();
  };

  return (
    <div className="pending-users-wrapper">
      <div className="pending-page">
        <div className="wrapper">

          <h1 className="title">User Management</h1>

          {/* BULK REGISTER */}
          <div className="premium-card" style={{ padding: '24px', marginBottom: '32px' }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Bulk Register Users</h2>

              <button
                className="modern-btn btn-primary"
                style={{ width: "180px" }}
                onClick={() => setShowBulk(!showBulk)}
              >
                {showBulk ? "Close" : "Upload Excel"}
              </button>
            </div>

            {showBulk && (
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="modern-input"
                  onChange={handleExcelUpload}
                  style={{ marginBottom: '20px' }}
                />

                {excelData.length > 0 && (
                  <>
                    <div className="bulk-preview" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', background: 'var(--background-color)', padding: '15px', borderRadius: '12px' }}>
                      {excelData.map((u, i) => (
                        <div key={i} className="bulk-item" style={{ padding: '8px 0', borderBottom: i < excelData.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none' }}>
                          <span style={{ fontWeight: '600' }}>{u.name}</span> — {u.email} — <span className="class-badge" style={{ background: 'rgba(30, 136, 229, 0.1)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '8px', fontSize: '11px' }}>{u.role}</span>
                        </div>
                      ))}
                    </div>

                    <button className="modern-btn btn-primary" onClick={handleBulkSubmit}>
                      Submit Bulk Registration
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* PENDING USERS */}
          <h2 className="section-title">Pending Approvals</h2>

          <div className="user-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '40px' }}>
            {pendingUsers.length === 0 && <p className="empty-text">No pending users to approve.</p>}
            {pendingUsers.map((u) => (
              <div key={u.userId} className="premium-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                  <div className="user-name" style={{ fontSize: '18px', fontWeight: '700' }}>{u.name}</div>
                  <div className="class-badge" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '700' }}>{u.role}</div>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>{u.email}</div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    className="modern-btn btn-primary"
                    style={{ flex: 1, padding: '8px' }}
                    onClick={() => approveUser(u.userId, schoolId).then(fetchAll)}
                  >
                    Approve
                  </button>

                  <button
                    className="modern-btn btn-outline"
                    style={{ flex: 1, padding: '8px', color: '#f59e0b', borderColor: '#fef3c7' }}
                    onClick={() => rejectUser(u.userId, schoolId).then(fetchAll)}
                  >
                    Reject
                  </button>

                  <button
                    className="modern-btn btn-outline"
                    style={{ padding: '8px', color: '#ef4444', borderColor: '#fecaca' }}
                    onClick={() => deleteUser(u.userId).then(fetchAll)}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* TEACHERS */}
          <h2 className="section-title">Verified Teachers</h2>
          <div className="premium-card" style={{ padding: '0', overflow: 'hidden', marginBottom: '40px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(30, 136, 229, 0.05)' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Email</th>
                </tr>
              </thead>

              <tbody>
                {teachers.map((t) => (
                  <tr key={t.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{t.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{t.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* STUDENTS */}
          <h2 className="section-title">Verified Students</h2>
          <div className="premium-card" style={{ padding: '0', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                <tr>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Name</th>
                  <th style={{ padding: '16px', textAlign: 'left' }}>Email</th>
                </tr>
              </thead>

              <tbody>
                {students.map((s) => (
                  <tr key={s.userId} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '16px', fontWeight: '600' }}>{s.name}</td>
                    <td style={{ padding: '16px', color: 'var(--text-secondary)' }}>{s.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PendingUsers;
