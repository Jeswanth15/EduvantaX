import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getCalendarBySchool,
  createCalendarEntry,
  updateCalendarEntry,
  generateSchoolCalendar,
} from "../utils/api";

const Calendar = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;

  const [calendar, setCalendar] = useState([]);
  const [form, setForm] = useState({ date: "", status: "WORKING", description: "" });
  const [generateForm, setGenerateForm] = useState({ startDate: "", endDate: "", holidays: "" });
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingDate, setEditingDate] = useState(null);

  useEffect(() => {
    if (!schoolId) return;
    loadCalendar();
  }, [schoolId]);

  const loadCalendar = async () => {
    try {
      const res = await getCalendarBySchool(schoolId);
      setCalendar(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async () => {
    if (!form.date) return alert("Select a date");
    try {
      await createCalendarEntry({ ...form, schoolId });
      loadCalendar();
      setForm({ date: "", status: "WORKING", description: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateChange = (e) =>
    setGenerateForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleGenerate = async () => {
    if (!generateForm.startDate || !generateForm.endDate)
      return alert("Select start and end date");

    try {
      const holidaysArray = generateForm.holidays
        ? generateForm.holidays.split(",").map((d) => d.trim())
        : [];

      await generateSchoolCalendar(
        schoolId,
        generateForm.startDate,
        generateForm.endDate,
        holidaysArray
      );

      loadCalendar();
    } catch (err) {
      console.error(err);
    }
  };

  const changeMonth = (offset) => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + offset);
    setCurrentMonth(newMonth);
  };

  const startOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const endOfMonth = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const getCalendarDays = () => {
    const days = [];
    const firstDayIndex = startOfMonth.getDay();
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    for (let i = 1; i <= endOfMonth.getDate(); i++) {
      days.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));
    }
    return days;
  };

  const getDayStatus = (date) => {
    if (!date) return "";
    const dateStr = date.toISOString().split("T")[0];
    const entry = calendar.find((c) => c.date === dateStr);
    return entry ? entry.status : null;
  };

  const updateDayStatus = async (dateStr, newStatus) => {
    try {
      const current = calendar.find((c) => c.date === dateStr);
      if (current) {
        await updateCalendarEntry(current.calendarId, { ...current, status: newStatus });
      } else {
        await createCalendarEntry({
          schoolId,
          date: dateStr,
          status: newStatus,
        });
      }
      loadCalendar();
      setEditingDate(null);
    } catch (err) {
      console.error(err);
    }
  };

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const days = getCalendarDays();

  const getColor = (status) => {
    switch (status) {
      case "HOLIDAY":
        return "#ffcccc";
      case "HALF_DAY":
        return "#fff0b3";
      case "SUNDAY":
        return "#dcdcdc";
      case "WORKING":
        return "#cce5ff";
      default:
        return "#ffffff";
    }
  };

  return (
    <div className="calendar-page-wrapper">
      <div className="content-wrapper">
          <h2 className="page-title">School Calendar</h2>

          {/* Manual Entry */}
          <div className="card">
            <div className="form-row">
              <input type="date" name="date" value={form.date} onChange={handleChange} />
              <select name="status" value={form.status} onChange={handleChange}>
                <option value="WORKING">Working Day</option>
                <option value="HOLIDAY">Holiday</option>
                <option value="HALF_DAY">Half Day</option>
              </select>
              <input
                type="text"
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
              />
              <button className="btn-primary" onClick={handleSubmit}>
                Add
              </button>
            </div>
          </div>

          {/* Auto Generate */}
          <div className="card">
            <div className="form-row">
              <input type="date" name="startDate" value={generateForm.startDate} onChange={handleGenerateChange} />
              <input type="date" name="endDate" value={generateForm.endDate} onChange={handleGenerateChange} />
              <input
                type="text"
                name="holidays"
                placeholder="Holiday dates comma-separated"
                value={generateForm.holidays}
                onChange={handleGenerateChange}
              />
              <button className="btn-primary" onClick={handleGenerate}>
                Generate
              </button>
            </div>
          </div>

          {/* Toggle Calendar */}
          <button className="btn-primary" onClick={() => setShowCalendar((prev) => !prev)}>
            {showCalendar ? "Hide Calendar" : "View Calendar"}
          </button>

          {/* Calendar View */}
          {showCalendar && (
            <div className="calendar-wrapper">
              <div className="month-header">
                <button onClick={() => changeMonth(-1)}>◀</button>
                <h3>
                  {currentMonth.toLocaleString("default", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button onClick={() => changeMonth(1)}>▶</button>
              </div>

              <div className="calendar-grid">
                {weekdays.map((w) => (
                  <div key={w} className="weekday">
                    {w}
                  </div>
                ))}

                {days.map((date, idx) => {
                  const status = getDayStatus(date);
                  const dateStr = date?.toISOString().split("T")[0];

                  return (
                    <div
                      key={idx}
                      className="calendar-cell"
                      style={{ background: getColor(status) }}
                      onClick={() => date && setEditingDate(dateStr)}
                    >
                      {date ? date.getDate() : ""}

                      {editingDate === dateStr ? (
                        <select
                          value={status || "WORKING"}
                          autoFocus
                          onBlur={() => setEditingDate(null)}
                          onChange={(e) => updateDayStatus(dateStr, e.target.value)}
                        >
                          <option value="WORKING">Working</option>
                          <option value="HOLIDAY">Holiday</option>
                          <option value="HALF_DAY">Half Day</option>
                        </select>
                      ) : (
                        status && <span className="status-text">{status}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      {/* CSS */}
      <style>{`
        .page-container { display:flex; width:100%; }

        .content-area {
          flex:1;
          background:#f3f5f9;
          min-height:100vh;
          transition:0.3s;
        }

        .content-wrapper {
          padding:25px;
          max-width:950px;
          margin:auto;
        }

        .page-title {
          text-align:center;
          font-size:28px;
          color:#0a4275;
          margin-bottom:25px;
        }

        .card {
          background:white;
          padding:20px;
          border-radius:12px;
          margin-bottom:25px;
          box-shadow:0 2px 8px rgba(0,0,0,0.1);
        }

        .form-row {
          display:flex;
          gap:10px;
          flex-wrap:wrap;
        }

        input, select {
          padding:10px;
          border-radius:6px;
          border:1px solid #ccc;
          font-size:15px;
        }

        .btn-primary {
          background:#0a4275;
          color:white;
          border:none;
          padding:10px 18px;
          border-radius:6px;
          cursor:pointer;
          font-weight:600;
        }

        .calendar-wrapper {
          margin-top:20px;
        }

        .month-header {
          display:flex;
          justify-content:center;
          align-items:center;
          gap:15px;
          margin-bottom:15px;
        }

        .calendar-grid {
          display:grid;
          grid-template-columns:repeat(7,1fr);
          gap:5px;
        }

        .weekday {
          font-weight:bold;
          text-align:center;
          padding:10px;
        }

        .calendar-cell {
          min-height:80px;
          padding:6px;
          border-radius:6px;
          text-align:center;
          cursor:pointer;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }

        .status-text {
          font-size:12px;
          margin-top:4px;
        }

        /* MOBILE RESPONSIVE */
        @media(max-width:600px){
          .calendar-grid{
            transform:scale(0.85);
            transform-origin:top left;
          }
          .calendar-cell{
            min-height:60px;
            font-size:12px;
          }
          .content-wrapper{
            padding:15px;
          }
        }
      `}</style>
    </div>
  );
};

export default Calendar;
