import React, { useEffect, useState } from "react";

import { getAllExamSchedules } from "../utils/api";
import { useNavigate } from "react-router-dom";

const TeacherExam = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [examSchedules, setExamSchedules] = useState([]);

  useEffect(() => {
    const loadExams = async () => {
      try {
        setLoading(true);

        const examRes = await getAllExamSchedules();
        const allExams = examRes.data || [];

        // Sort by date
        allExams.sort((a, b) =>
          String(a.examDate).localeCompare(String(b.examDate))
        );

        setExamSchedules(allExams);
      } catch (err) {
        console.error("Error loading exams:", err);
      } finally {
        setLoading(false);
      }
    };

    loadExams();
  }, []);

  if (loading) {
    return <h3 style={{ padding: 20 }}>Loading...</h3>;
  }

  return (
    <div className="exam-page-wrapper">
      {/* Internal CSS */}
      <style>
        {`
          .exam-container {
            padding: 24px;
            max-width: 1200px;
            margin: auto;
          }

          .exam-title {
            margin: 0 0 18px 0;
            font-size: 26px;
            font-weight: 700;
            color: #1a2b5f;
          }

          /* Responsive layout */
          .exam-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
            gap: 18px;
          }

          .exam-card {
            background: white;
            padding: 18px 20px;
            border-radius: 16px;
            box-shadow: 0 8px 22px rgba(0,0,0,0.06);
            cursor: pointer;
            transition: transform 0.25s ease, box-shadow 0.25s ease;
            border: 1px solid transparent;
          }

          .exam-card:hover {
            transform: translateY(-6px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.12);
            border-color: #dce6ff;
          }

          .exam-subject {
            font-size: 20px;
            font-weight: 700;
            color: #11357a;
            margin-bottom: 10px;
          }

          .exam-row {
            margin: 6px 0;
            font-size: 14px;
            color: #4a4a4a;
          }

          .tag {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 12px;
            margin-right: 8px;
            font-weight: 600;
          }

          .tag-date {
            background: #e9f2ff;
            color: #2556b8;
          }

          .tag-time {
            background: #fff4d9;
            color: #b87400;
          }

          .tag-class {
            background: #e8ffe8;
            color: #199614;
          }

          .tag-room {
            background: #ffeaea;
            color: #b32020;
          }

          @media (max-width: 600px) {
            .exam-title {
              font-size: 22px;
            }
          }
        `}
      </style>

      <div className="exam-container">
        <h2 className="exam-title">📘 All Exam Schedules</h2>

        {examSchedules.length === 0 ? (
          <p>No exams found.</p>
        ) : (
          <div className="exam-grid">
            {examSchedules.map((exam) => (
              <div
                key={exam.examScheduleId}
                className="exam-card"
                onClick={() =>
                  navigate(`/teacher/marks?examId=${exam.examScheduleId}`)
                }
              >
                <div className="exam-subject">
                  {exam.subjectName || `Subject #${exam.subjectId}`}
                </div>

                {/* Tags */}
                <div style={{ marginBottom: 8 }}>
                  <span className="tag tag-date">📅 {exam.examDate}</span>
                  <span className="tag tag-time">
                    ⏰ {exam.startTime}–{exam.endTime}
                  </span>
                </div>

                {/* Class & room */}
                <div className="exam-row">
                  <span className="tag tag-class">
                    Class: {exam.classroomName || `#${exam.classroomId}`}
                  </span>

                  <span className="tag tag-room">
                    Room: {exam.roomNo}
                  </span>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherExam;
