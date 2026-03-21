import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import { getExamsForStudent } from "../utils/api";
import { FaGraduationCap, FaClock, FaCalendarAlt, FaMapMarkerAlt, FaMagic } from "react-icons/fa";

const StudentExamPage = () => {
  const decoded = getDecodedToken();
  const classroomId = decoded?.classroomId;

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studyPlan, setStudyPlan] = useState({}); // Mapping of examId to plan text
  const [loadingPlan, setLoadingPlan] = useState(null); // ID of the exam being processed
  const userId = decoded?.userId;

  useEffect(() => {
    if (!classroomId) return;

    const load = async () => {
      try {
        setLoading(true);

        const res = await getExamsForStudent(classroomId);
        setExams(res.data || []);
      } catch (err) {
        console.error("Exam load error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [classroomId]);

  const handleGenerateStudyPlan = async (exam) => {
    if (!exam.classSubjectId) {
      alert("Missing learning data for this subject.");
      return;
    }

    setLoadingPlan(exam.examScheduleId);
    try {
      // Defaulting to 7 days for exam study plans
      const res = await fetch(`http://localhost:8080/api/practice/study-plan/${userId}/${exam.classSubjectId}?days=7`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      const text = await res.text();
      setStudyPlan(prev => ({ ...prev, [exam.examScheduleId]: text }));
    } catch (err) {
      console.error(err);
      setStudyPlan(prev => ({ ...prev, [exam.examScheduleId]: "Failed to generate plan. Please try again." }));
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="exam-container">
      <h2 style={{ marginBottom: '24px' }}>📘 My Exams</h2>

      {loading && <p>Loading exams...</p>}

      {!loading && exams.length === 0 && (
        <p>No exams scheduled.</p>
      )}

      {!loading &&
        exams.length > 0 &&
        exams.map((exam) => (
          <div
            key={exam.examScheduleId}
            className="premium-card"
            style={{
              marginBottom: 20,
              padding: "24px",
              borderLeft: "5px solid var(--primary-color)",
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FaGraduationCap color="var(--primary-color)" /> {exam.subjectName || "Subject"}
                </h3>
                <div style={{ display: 'flex', gap: '20px', color: 'var(--text-secondary)', fontSize: '14px', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaCalendarAlt size={12} /> {new Date(exam.examDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaClock size={12} /> {exam.startTime} - {exam.endTime}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FaMapMarkerAlt size={12} /> Room: {exam.roomNo}
                  </div>
                </div>
              </div>
              
              <button 
                className="modern-btn btn-primary"
                onClick={() => handleGenerateStudyPlan(exam)}
                disabled={loadingPlan === exam.examScheduleId}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <FaMagic /> {loadingPlan === exam.examScheduleId ? "AI Planning..." : "Generate Study Plan"}
              </button>
            </div>

            {studyPlan[exam.examScheduleId] && (
              <div style={{ 
                marginTop: "16px", 
                padding: "16px", 
                background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)", 
                borderRadius: "12px",
                border: "1px solid #bae6fd",
                animation: "fadeIn 0.5s ease-out"
              }}>
                <strong style={{ display: 'block', marginBottom: '8px', color: 'var(--primary-color)', fontSize: '13px' }}>✨ Recommended Study Plan:</strong>
                <p style={{ margin: 0, fontSize: '15px', lineHeight: '1.6', color: '#334155' }}>
                  {studyPlan[exam.examScheduleId]}
                </p>
              </div>
            )}
          </div>
        ))}
    </div>
  );
};

export default StudentExamPage;
