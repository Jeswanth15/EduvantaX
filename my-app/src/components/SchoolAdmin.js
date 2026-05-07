import React, { useEffect, useState } from "react";
import { getDecodedToken } from "../utils/authHelper";
import {
  getTeachersBySchool, getStudentsBySchool, getAllAnnouncements,
  getAllClassrooms, createAnnouncement, deleteAnnouncement
} from "../utils/api";

const LoadingScreen = () => (
  <div style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", minHeight: 400, gap: 16 }}>
    <div style={{
      width: 56, height: 56, borderRadius: 16,
      background: "linear-gradient(135deg, rgba(96,165,250,0.2), rgba(96,165,250,0.08))",
      display: "flex", alignItems: "center", justifyContent: "center",
      animation: "float 2s ease-in-out infinite",
    }}>🏫</div>
    <div className="spinner spinner-lg" style={{ borderTopColor: "#60a5fa" }} />
    <p style={{ color: "var(--text-secondary)", fontSize: 14, fontWeight: 500 }}>Loading school data…</p>
  </div>
);

const SchoolAdmin = () => {
  const decoded = getDecodedToken();
  const schoolId = decoded?.schoolId;
  const schoolName = decoded?.schoolName || "Your School";
  const userName = decoded?.sub || decoded?.name || "Admin";

  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [newAnn, setNewAnn] = useState({ title: "", message: "", classroomId: "" });
  const [expandedAnn, setExpandedAnn] = useState(null);

  const refresh = async () => {
    if (!schoolId) return;
    try {
      setLoading(true);
      const [tRes, sRes, aRes, cRes] = await Promise.all([
        getTeachersBySchool(schoolId), getStudentsBySchool(schoolId),
        getAllAnnouncements(), getAllClassrooms(schoolId),
      ]);
      setTeachers(tRes.data);
      setStudents(sRes.data);
      setAnnouncements(aRes.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
      setClassrooms(cRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { refresh(); }, [schoolId]);

  const approvedTeachers = teachers.filter(t => t.approvalStatus === "APPROVED");
  const approvedStudents = students.filter(s => s.approvalStatus === "APPROVED");
  const pendingTotal = teachers.filter(t => t.approvalStatus !== "APPROVED").length + students.filter(s => s.approvalStatus !== "APPROVED").length;

  const handlePost = async () => {
    if (!newAnn.title || !newAnn.message) { alert("Title and message required!"); return; }
    setPosting(true);
    try {
      await createAnnouncement({ ...newAnn, userId: decoded.userId, schoolId: decoded.schoolId, classroomId: newAnn.classroomId || null });
      setNewAnn({ title: "", message: "", classroomId: "" });
      const res = await getAllAnnouncements();
      setAnnouncements(res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
    } catch { alert("Failed to post announcement."); }
    finally { setPosting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteAnnouncement(id);
      const res = await getAllAnnouncements();
      setAnnouncements(res.data.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt)));
    } catch { alert("Failed to delete."); }
  };

  if (loading) return <LoadingScreen />;

  const STATS = [
    { icon: "👨‍🏫", label: "Teachers", total: teachers.length, active: approvedTeachers.length, color: "#a78bfa", bg: "rgba(167,139,250,0.1)", border: "rgba(167,139,250,0.2)" },
    { icon: "🎓", label: "Students", total: students.length, active: approvedStudents.length, color: "#34d399", bg: "rgba(52,211,153,0.1)", border: "rgba(52,211,153,0.2)" },
    { icon: "🏛️", label: "Classrooms", total: classrooms.length, active: classrooms.length, color: "#60a5fa", bg: "rgba(96,165,250,0.1)", border: "rgba(96,165,250,0.2)" },
    { icon: "⏳", label: "Pending Users", total: pendingTotal, active: 0, color: "#fb923c", bg: "rgba(251,146,60,0.1)", border: "rgba(251,146,60,0.2)" },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* ── Hero Banner ── */}
      <div style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, #0c1428 0%, #0f2152 60%, #0a1428 100%)",
        borderRadius: 24, padding: "36px 40px", marginBottom: 32,
        border: "1px solid rgba(255,255,255,0.07)",
        boxShadow: "0 16px 48px rgba(0,0,0,0.25)",
      }}>
        <div style={{ position:"absolute", top:-60, right:60, width:220, height:220, borderRadius:"50%", background:"radial-gradient(circle, rgba(96,165,250,0.15) 0%, transparent 70%)", filter:"blur(30px)", pointerEvents:"none" }} />
        <div style={{ position:"absolute", bottom:-40, left:80, width:160, height:160, borderRadius:"50%", background:"radial-gradient(circle, rgba(52,211,153,0.10) 0%, transparent 70%)", filter:"blur(25px)", pointerEvents:"none" }} />

        <div style={{ position:"relative", display:"flex", alignItems:"center", gap:20, flexWrap:"wrap" }}>
          <div style={{
            width: 68, height: 68, borderRadius: 20, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(96,165,250,0.25), rgba(96,165,250,0.1))",
            border: "1.5px solid rgba(96,165,250,0.3)",
            display: "flex", alignItems:"center", justifyContent:"center",
            fontSize: 32, boxShadow: "0 8px 24px rgba(96,165,250,0.25)",
          }}>🏫</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"rgba(96,165,250,0.7)", letterSpacing:"0.1em", textTransform:"uppercase", marginBottom:4 }}>School Administration</div>
            <h1 style={{ fontSize:26, fontWeight:900, color:"white", margin:0, letterSpacing:"-0.03em", fontFamily:"'Outfit', sans-serif" }}>
              {schoolName}
            </h1>
            <p style={{ color:"rgba(148,163,184,0.75)", fontSize:13, margin:"4px 0 0" }}>Managed by <strong style={{ color:"rgba(96,165,250,0.9)" }}>{userName}</strong></p>
          </div>
          <div style={{
            display:"flex", alignItems:"center", gap:6,
            padding:"8px 14px", borderRadius:99,
            background:"rgba(52,211,153,0.12)", border:"1px solid rgba(52,211,153,0.25)",
          }}>
            <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981", boxShadow:"0 0 8px #10b981", animation:"pulse-glow 2s ease-in-out infinite" }} />
            <span style={{ fontSize:12.5, fontWeight:700, color:"#34d399" }}>Active School</span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div className="grid-cols-4">
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            background:`linear-gradient(135deg, ${s.bg}, transparent)`,
            border:`1px solid ${s.border}`,
            borderRadius:18, padding:"20px 20px 18px",
            transition:"all 0.25s ease",
            animation:`pageEnter 0.5s var(--ease-out) ${i*70}ms both`,
            cursor:"default",
          }}
            onMouseEnter={e => e.currentTarget.style.transform = "translateY(-3px)"}
            onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
          >
            <div style={{ fontSize:28, marginBottom:10 }}>{s.icon}</div>
            <div style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.04em", fontFamily:"'Outfit', sans-serif", lineHeight:1 }}>{s.total}</div>
            <div style={{ fontSize:12.5, color:"var(--text-secondary)", fontWeight:600, marginTop:4, marginBottom:12 }}>{s.label}</div>
            {s.active > 0 && (
              <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:6, height:6, borderRadius:"50%", background:s.color, boxShadow:`0 0 6px ${s.color}` }} />
                <span style={{ fontSize:11.5, color:s.color, fontWeight:700 }}>{s.active} approved</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Main grid ── */}
      <div className="responsive-grid-main">

        {/* Create Announcement */}
        <div style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:9, background:"rgba(96,165,250,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📣</div>
            <h2 style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", margin:0, letterSpacing:"-0.01em" }}>Create Announcement</h2>
          </div>
          <div style={{ padding:"22px 24px", display:"flex", flexDirection:"column", gap:14 }}>
            <div>
              <label style={LS.label}>Title</label>
              <input className="form-input" placeholder="e.g. Holiday Notice" value={newAnn.title}
                onChange={e => setNewAnn(p => ({ ...p, title: e.target.value }))} style={LS.input} />
            </div>
            <div>
              <label style={LS.label}>Message</label>
              <textarea className="form-input" placeholder="Write your announcement here…" rows={4}
                value={newAnn.message} onChange={e => setNewAnn(p => ({ ...p, message: e.target.value }))}
                style={{ ...LS.input, resize:"vertical" }} />
            </div>
            <div>
              <label style={LS.label}>Audience</label>
              <select className="form-input" value={newAnn.classroomId}
                onChange={e => setNewAnn(p => ({ ...p, classroomId: e.target.value }))} style={LS.input}>
                <option value="">🌐 Entire School (Global)</option>
                {classrooms.map(c => <option key={c.classId} value={c.classId}>🏛️ {c.name} — Section {c.section}</option>)}
              </select>
            </div>
            <button onClick={handlePost} disabled={posting} style={{
              display:"flex", alignItems:"center", justifyContent:"center", gap:7,
              padding:"12px 20px", borderRadius:12, cursor:"pointer",
              background:"linear-gradient(135deg, #2563eb, #7c3aed)", color:"white",
              border:"none", fontSize:14, fontWeight:700, fontFamily:"var(--font-sans)",
              boxShadow:"0 6px 20px rgba(37,99,235,0.35)", transition:"all 0.2s ease",
              opacity: posting ? 0.7 : 1,
            }}>
              {posting
                ? <><div className="spinner" style={{ width:15, height:15, borderColor:"rgba(255,255,255,0.3)", borderTopColor:"white" }} /> Posting…</>
                : <>📣 Broadcast Announcement</>
              }
            </button>
          </div>
        </div>

        {/* Recent Announcements */}
        <div style={{ background:"var(--surface-1)", border:"1px solid var(--border-light)", borderRadius:20, overflow:"hidden", boxShadow:"var(--shadow-sm)" }}>
          <div style={{ padding:"20px 24px", borderBottom:"1px solid var(--border-subtle)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <div style={{ width:32, height:32, borderRadius:9, background:"rgba(251,146,60,0.12)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:16 }}>📋</div>
              <h2 style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", margin:0 }}>Recent Announcements</h2>
            </div>
            <span style={{ fontSize:12, fontWeight:700, color:"var(--text-tertiary)", background:"var(--surface-2)", padding:"3px 10px", borderRadius:99, border:"1px solid var(--border-subtle)" }}>
              {announcements.length} total
            </span>
          </div>

          <div style={{ maxHeight:460, overflowY:"auto", padding:"16px 24px", display:"flex", flexDirection:"column", gap:12 }}>
            {announcements.length === 0 ? (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"var(--text-tertiary)", fontSize:14 }}>
                <div style={{ fontSize:40, marginBottom:10 }}>📭</div>
                No announcements yet
              </div>
            ) : (
              announcements.map((a, i) => (
                <div key={a.announcementId} style={{
                  background:"var(--surface-2)", borderRadius:14,
                  border:"1px solid var(--border-subtle)",
                  overflow:"hidden", transition:"all 0.2s ease",
                  animation:`pageEnter 0.4s var(--ease-out) ${i*40}ms both`,
                }}>
                  <div style={{ padding:"14px 16px" }}>
                    <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:10, marginBottom:6 }}>
                      <h4 style={{ fontSize:14, fontWeight:700, color:"var(--text-primary)", margin:0, lineHeight:1.3 }}>{a.title}</h4>
                      <button onClick={() => handleDelete(a.announcementId)} style={{
                        width:26, height:26, borderRadius:7, display:"flex", alignItems:"center", justifyContent:"center",
                        background:"rgba(244,63,94,0.1)", border:"1px solid rgba(244,63,94,0.2)",
                        color:"#fb7185", cursor:"pointer", flexShrink:0,
                        fontSize:11, fontFamily:"var(--font-sans)",
                      }}>✕</button>
                    </div>
                    <p 
                      onClick={() => setExpandedAnn(expandedAnn === a.announcementId ? null : a.announcementId)}
                      style={{
                        fontSize:13, color:"var(--text-secondary)", margin:"0 0 10px", lineHeight:1.5,
                        display: expandedAnn === a.announcementId ? "block" : "-webkit-box",
                        WebkitLineClamp: expandedAnn === a.announcementId ? "unset" : 2,
                        WebkitBoxOrient:"vertical", overflow:"hidden", cursor: "pointer"
                      }}
                      title="Click to expand/collapse"
                    >{a.message}</p>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                      <span style={{
                        fontSize:10.5, fontWeight:700, padding:"2px 8px", borderRadius:99,
                        background: a.classroomId ? "rgba(167,139,250,0.12)" : "rgba(52,211,153,0.12)",
                        color: a.classroomId ? "#a78bfa" : "#34d399",
                        border: a.classroomId ? "1px solid rgba(167,139,250,0.2)" : "1px solid rgba(52,211,153,0.2)",
                      }}>{a.classroomId ? "📚 Targeted" : "🌐 Global"}</span>
                      <span style={{ fontSize:11, color:"var(--text-tertiary)" }}>
                        🕐 {new Date(a.postedAt).toLocaleString([], { month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
};

const LS = {
  label: { fontSize:11.5, fontWeight:600, color:"var(--text-secondary)", display:"block", marginBottom:5, letterSpacing:"0.03em" },
  input: { width:"100%", padding:"10px 13px", background:"var(--surface-2)", border:"1.5px solid var(--border-light)", borderRadius:10, fontSize:13.5, color:"var(--text-primary)", outline:"none", fontFamily:"var(--font-sans)", transition:"all 0.2s ease" },
};

export default SchoolAdmin;
