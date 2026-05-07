import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getStudentSubmissions, createSubmission } from "../utils/api";
import { getDecodedToken } from "../utils/authHelper";

const StudentSubmissionPage = () => {
  const { assignmentId } = useParams();
  const decoded = getDecodedToken();
  const studentId = decoded?.userId;

  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const loadSubmission = async () => {
      try {
        setLoading(true);
        const res = await getStudentSubmissions(assignmentId, studentId);
        setSubmission(res.data.length > 0 ? res.data[0] : null);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    loadSubmission();
  }, [assignmentId, studentId]);

  const handleUpload = async () => {
    if (!file) return alert("Select a file first!");
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("assignmentId", assignmentId);
      formData.append("studentId", studentId);
      const res = await createSubmission(formData);
      setSubmission(res.data);
    } catch { alert("Upload failed"); } finally { setUploading(false); }
  };

  const getFullFileUrl = (url) => url ? (url.startsWith("http") ? url : `http://localhost:8080${url}`) : "#";

  if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Fetching workspace...</div>;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Submission Workspace</h1>
        <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Upload files and track your evaluator's feedback.</p>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32, alignItems:"start" }}>
        
        {/* Left Col - Submitter */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
          <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
             <h3 style={{ fontSize:15, fontWeight:800, color:"var(--text-primary)", margin:"0 0 20px" }}>{submission ? "Update Turn-In" : "Upload Assessment"}</h3>
             
             <div style={{ background:file?"rgba(16,185,129,0.05)":"var(--surface-2)", border:file?"2px dashed #10b981":"2px dashed var(--border-medium)", borderRadius:16, padding:40, textAlign:"center", transition:"all 0.2s" }}>
                <input type="file" id="submit-file" style={{display:"none"}} onChange={e=>setFile(e.target.files[0])} />
                <label htmlFor="submit-file" style={{ cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                   <div style={{ width:48, height:48, borderRadius:"50%", background:file?"#10b981":"var(--surface-3)", color:file?"white":"var(--text-muted)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:20 }}>{file ? "✓" : "+"}</div>
                   <div style={{ fontSize:14, fontWeight:700, color:file?"#10b981":"var(--text-secondary)" }}>{file ? file.name : "Click to select local file"}</div>
                   {!file && <div style={{ fontSize:12, color:"var(--text-tertiary)" }}>PDF, DOCX, ZIP</div>}
                </label>
             </div>

             <button onClick={handleUpload} disabled={uploading||!file} style={{ width:"100%", marginTop:24, padding:14, borderRadius:12, background:submission?"transparent":"var(--primary-color)", color:submission?"var(--primary-color)":"white", border:submission?"1px solid var(--primary-color)":"none", fontWeight:800, cursor:uploading||!file?"not-allowed":"pointer", opacity:uploading||!file?0.5:1 }}>
               {uploading ? "Processing..." : submission ? "Overwrite File" : "Seal & Turn In"}
             </button>
          </div>
        </div>

        {/* Right Col - Status */}
        <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
           {submission ? (
             <>
               <div style={{ background:"var(--surface-1)", borderRadius:24, padding:32, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", position:"relative", overflow:"hidden" }}>
                  <div style={{ position:"absolute", top:0, left:0, bottom:0, width:4, background:submission.grade?"#10b981":"#f59e0b" }} />
                  <h3 style={{ fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 20px" }}>Academic Status</h3>
                  
                  <div style={{ marginBottom:28 }}>
                     <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Final Grade</div>
                     <div style={{ fontSize:40, fontWeight:900, color:submission.grade?"var(--primary-color)":"var(--text-tertiary)", fontFamily:"'Outfit', sans-serif" }}>{submission.grade || "PENDING"}</div>
                  </div>

                  <div>
                     <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", textTransform:"uppercase", letterSpacing:"0.5px", marginBottom:8 }}>Evaluator Remarks</div>
                     <div style={{ fontSize:14, color:"var(--text-secondary)", lineHeight:1.6, background:"var(--surface-2)", padding:16, borderRadius:12 }}>
                       {submission.feedback || "Evaluator has not left remarks yet."}
                     </div>
                  </div>
               </div>

               <div style={{ background:"var(--surface-1)", borderRadius:24, padding:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                  <h3 style={{ fontSize:12, fontWeight:800, color:"var(--text-tertiary)", textTransform:"uppercase", letterSpacing:"1px", margin:"0 0 16px" }}>Submission Footprint</h3>
                  <div style={{ display:"grid", gap:16 }}>
                     <div>
                       <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)" }}>Date Submitted</div>
                       <div style={{ fontSize:14, fontWeight:600, color:"var(--text-primary)" }}>{new Date(submission.submissionDate).toLocaleString()}</div>
                     </div>
                     <div>
                       <div style={{ fontSize:11, fontWeight:700, color:"var(--text-muted)", marginBottom:4 }}>Valid Attachment</div>
                       <a href={getFullFileUrl(submission.fileLink)} target="_blank" rel="noreferrer" style={{ fontSize:13, fontWeight:700, color:"var(--primary-color)", textDecoration:"none", padding:"6px 12px", background:"rgba(59,130,246,0.1)", borderRadius:99, display:"inline-block" }}>↓ Download Backup</a>
                     </div>
                  </div>
               </div>
             </>
           ) : (
             <div style={{ background:"var(--surface-1)", border:"1px dashed var(--border-medium)", borderRadius:24, padding:40, textAlign:"center", color:"var(--text-tertiary)" }}>
               <div style={{ fontSize:40, marginBottom:16 }}>📑</div>
               <div style={{ fontSize:15, fontWeight:700 }}>Awaiting Submission</div>
               <p style={{ fontSize:13, margin:0 }}>Upload your file on the left to begin.</p>
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default StudentSubmissionPage;
