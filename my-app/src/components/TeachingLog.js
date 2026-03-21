import React, { useEffect, useState } from "react";

import { getDecodedToken } from "../utils/authHelper";
import {
  getAllClassSubjects,
  createOrUpdateTeachingLog,
  getTeachingLogsByClassSubject,
  deleteTeachingLog,
} from "../utils/api";

const TeachingLog = () => {
  const decoded = getDecodedToken();
  const userRole = decoded?.role;
  const teacherId = decoded?.userId;

  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [topic, setTopic] = useState("");

  useEffect(() => {
    fetchClassSubjects();
  }, []);

  const fetchClassSubjects = async () => {
    try {
      const res = await getAllClassSubjects();
      let all = res.data || [];

      if (userRole === "TEACHER") {
        all = all.filter((cs) => cs.teacherId === teacherId);
      }

      setClassSubjects(all);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLogs = async (id) => {
    try {
      const res = await getTeachingLogsByClassSubject(id);
      setLogs(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelect = (id) => {
    setSelectedId(id);
    fetchLogs(id);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedId) return alert("Select a class first");

    const dto = {
      classSubjectId: selectedId,
      topicTaught: topic,
      teacherId,
    };

    try {
      await createOrUpdateTeachingLog(dto);
      setTopic("");
      fetchLogs(selectedId);
    } catch (err) {
      console.error(err);
      alert("Failed to save log");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete log?")) return;

    try {
      await deleteTeachingLog(id);
      fetchLogs(selectedId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="teaching-log-page">
      <div className="content-wrapper">
        <h2 className="page-title">📘 Teaching Logs</h2>

        {/* CLASS-SUBJECT SELECT */}
        <div className="card">
          <h3>Select Class & Subject</h3>

          {classSubjects.length === 0 ? (
            <p className="empty-text">No class-subjects assigned.</p>
          ) : (
            <div className="chip-scroll">
              {classSubjects.map((cs) => (
                <button
                  key={cs.id}
                  className={`chip ${selectedId === cs.id ? "chip-active" : ""}`}
                  onClick={() => handleSelect(cs.id)}
                >
                  {cs.classroomName || cs.classroom?.name} —{" "}
                  {cs.subjectName || cs.subject?.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ADD LOG */}
        {selectedId && (
          <div className="card">
            <h3>Add Teaching Log</h3>
            <form className="form-grid" onSubmit={handleSubmit}>
              <textarea
                placeholder="Enter topic taught..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                required
              />
              <button type="submit" className="btn-primary">
                Save Log
              </button>
            </form>
          </div>
        )}

        {/* EXISTING LOGS */}
        {logs.length > 0 && (
          <div className="card">
            <h3>Existing Logs</h3>

            <div className="log-list">
              {logs.map((log) => (
                <div key={log.id} className="log-card">
                  <div>
                    <strong className="log-title">{log.topicTaught}</strong>
                    <div className="log-meta">
                      Teacher: {log.teacher?.name || "N/A"} |
                      {" " + new Date(log.taughtAt).toLocaleString()}
                    </div>
                  </div>

                  {["ADMIN", "PRINCIPAL", "SCHOOLADMIN"].includes(userRole) && (
                    <button className="delete-btn" onClick={() => handleDelete(log.id)}>
                      🗑
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedId && logs.length === 0 && (
          <p className="empty-text">No logs yet for this class-subject.</p>
        )}
      </div>

      {/* ---------------- CSS ---------------- */}
      <style>{`
        .content-wrapper { padding:25px; max-width:900px; margin:auto; }

        .page-title {
          text-align:center;
          font-size:28px;
          color:#0a4275;
          margin-bottom:25px;
          font-weight:700;
        }

        .card {
          background:white;
          padding:20px;
          border-radius:12px;
          box-shadow:0 3px 10px rgba(0,0,0,.1);
          border: 1px solid var(--border-color);
          margin-bottom:25px;
        }

        .chip-scroll {
          display:flex;
          overflow-x:auto;
          gap:10px;
          padding:10px 0;
        }

        .chip {
          padding:8px 14px;
          border-radius:20px;
          background:#e6e9ef;
          border:none;
          cursor:pointer;
          white-space:nowrap;
          transition: all 0.2s;
        }
        .chip:hover {
          background: #d1d5db;
        }
        .chip-active {
          background:#0a4275;
          color:white;
        }

        .form-grid { display:flex; flex-direction:column; gap:10px; }

        textarea {
          height:80px;
          padding:10px;
          border-radius:6px;
          border:1px solid #ccc;
          resize:none;
          font-family: inherit;
        }

        .btn-primary {
          background:#0a4275;
          color:white;
          border:none;
          padding:10px;
          border-radius:6px;
          cursor:pointer;
          font-weight:600;
          transition: opacity 0.2s;
        }
        .btn-primary:hover {
          opacity: 0.9;
        }

        .log-list { display:grid; gap:12px; }

        .log-card {
          background:#f7f9fc;
          padding:14px;
          border-radius:10px;
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          border: 1px solid #edf2f7;
        }

        .log-title { font-size:16px; font-weight:600; }
        .log-meta { font-size:12px; color:gray; margin-top:4px; }

        .delete-btn {
          background:#d9534f;
          border:none;
          padding:6px 10px;
          color:white;
          border-radius:6px;
          cursor:pointer;
        }

        .empty-text { color:gray; font-style:italic; text-align:center; }

        @media(max-width:600px) {
          .content-wrapper { padding:15px; }
          .log-card { flex-direction:column; gap:10px; }
        }
      `}</style>
    </div>
  );
};

export default TeachingLog;
