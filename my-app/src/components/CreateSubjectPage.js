import React, { useEffect, useState } from "react";
import { getAllSubjects, createSubject, deleteSubject } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const CreateSubjectPage = () => {
  const decoded = getDecodedToken();

  const [subjects, setSubjects] = useState([]);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");

  const fetchSubjects = async () => {
    try {
      const res = await getAllSubjects();
      setSubjects(res.data);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) return alert("Subject name is required");

    try {
      await createSubject({ name, code });
      setName("");
      setCode("");
      fetchSubjects();
      alert("Subject created successfully!");
    } catch (err) {
      console.error("Error creating:", err);
      alert("Failed to create subject");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subject?")) return;
    try {
      await deleteSubject(id);
      fetchSubjects();
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete subject");
    }
  };

  return (
    <div className="create-subject-page-wrapper">
      <div className="content-wrapper">
          <h2 className="page-title">Create Subject</h2>

          {/* FORM CARD */}
          <div className="form-card">
            <h3>Add New Subject</h3>

            <div className="form-grid">
              <input
                type="text"
                placeholder="Subject Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Subject Code (optional)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>

            <button className="create-btn" onClick={handleCreate}>
              Create Subject
            </button>
          </div>

          {/* SUBJECT LIST */}
          <h3 className="section-title">Existing Subjects</h3>

          {subjects.length === 0 ? (
            <p>No subjects found.</p>
          ) : (
            <div className="subjects-grid">
              {subjects.map((subj) => (
                <div key={subj.subjectId} className="subject-card">
                  <h4>{subj.name}</h4>
                  <p className="code">{subj.code || "No Code"}</p>

                  <button
                    className="delete-btn"
                    onClick={() => handleDelete(subj.subjectId)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      {/* ----- CSS BELOW ----- */}
      <style>{`
        .page-container {
          display: flex;
          width: 100%;
        }

        .content-area {
          flex: 1;
          background: #f3f5f9;
          min-height: 100vh;
          transition: 0.3s;
        }

        .content-wrapper {
          padding: 25px;
        }

        .page-title {
          text-align: center;
          font-size: 28px;
          color: #0a4275;
          margin-bottom: 25px;
        }

        /* FORM CARD */
        .form-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.1);
          max-width: 450px;
          margin: auto;
          margin-bottom: 40px;
        }

        .form-card h3 {
          margin-bottom: 15px;
          color: #333;
        }

        .form-grid {
          display: grid;
          gap: 12px;
        }

        .form-grid input {
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #ccc;
          font-size: 15px;
        }

        .create-btn {
          width: 100%;
          margin-top: 15px;
          background: #0a4275;
          color: white;
          padding: 10px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-size: 16px;
          transition: 0.2s;
        }

        .create-btn:hover {
          background: #06315a;
        }

        /* SUBJECT GRID */
        .subjects-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
        }

        .subject-card {
          background: white;
          padding: 15px;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          text-align: center;
          transition: 0.2s;
        }

        .subject-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.15);
        }

        .subject-card h4 {
          margin-bottom: 5px;
        }

        .subject-card .code {
          font-size: 14px;
          color: #666;
          margin-bottom: 12px;
        }

        .delete-btn {
          width: 100%;
          background: #e53935;
          padding: 8px 12px;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          transition: 0.2s;
        }

        .delete-btn:hover {
          background: #b71c1c;
        }

        /* RESPONSIVE */
        @media (max-width: 900px) {
          .content-area {
            margin-left: 0 !important;
          }
        }

        @media (max-width: 480px) {
          .page-title {
            font-size: 22px;
          }
          .form-card {
            padding: 15px;
          }
        }
      `}</style>
    </div>
  );
};

export default CreateSubjectPage;
