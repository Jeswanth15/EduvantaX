import React, { useEffect, useState } from 'react';
import { getPracticeHistory } from '../services/practiceService';
import { getDecodedToken } from '../utils/authHelper';

const PracticeHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const userId = getDecodedToken()?.userId || 1;

    useEffect(() => {
        getPracticeHistory(userId).then(data => setHistory(data)).catch(console.error).finally(()=>setLoading(false));
    }, [userId]);

    if (loading) return <div style={{textAlign:"center", padding:100, color:"var(--text-tertiary)"}}>Loading history...</div>;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:32 }}>
                <div>
                    <h1 style={{ fontSize:32, fontWeight:900, color:"var(--text-primary)", letterSpacing:"-0.03em", margin:"0 0 6px", fontFamily:"'Outfit', sans-serif" }}>Assessment Trace</h1>
                    <p style={{ margin:0, fontSize:14, color:"var(--text-secondary)", fontWeight:500 }}>Track your AI testing outcomes.</p>
                </div>
            </div>

            <div style={{ background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)", overflow:"hidden" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                    <thead style={{ background:"var(--surface-2)" }}>
                        <tr>
                            <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Time Taken</th>
                            <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Context Filter</th>
                            <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Score</th>
                            <th style={{ textAlign:"left", padding:"16px 24px", fontSize:11, fontWeight:800, color:"var(--text-muted)", textTransform:"uppercase", borderBottom:"1px solid var(--border-subtle)" }}>Resolution Matrix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding:60, textAlign:"center", color:"var(--text-tertiary)" }}>No evaluation data logged. Start practicing!</td></tr>
                        ) : history.map((rec, i) => {
                            const ratio = rec.totalQuestions ? rec.score/rec.totalQuestions : 0;
                            return (
                                <tr key={rec.id} style={{ borderBottom:"1px solid var(--border-subtle)", animation:`pageEnter 0.3s ease ${i*30}ms both` }}>
                                    <td style={{ padding:"16px 24px", fontSize:14, fontWeight:700, color:"var(--text-primary)" }}>{new Date(rec.timestamp).toLocaleString()}</td>
                                    <td style={{ padding:"16px 24px", fontSize:14, fontWeight:600, color:"var(--text-secondary)" }}>{rec.topic && rec.topic.length > 40 ? rec.topic.substring(0,40)+'...' : rec.topic || 'General Matrix'}</td>
                                    <td style={{ padding:"16px 24px" }}>
                                        <span style={{ padding:"6px 12px", borderRadius:99, fontSize:12, fontWeight:800, background:ratio>=0.7?"rgba(16,185,129,0.1)":"rgba(245,158,11,0.1)", color:ratio>=0.7?"#10b981":"#f59e0b" }}>
                                            {rec.score} / {rec.totalQuestions}
                                        </span>
                                    </td>
                                    <td style={{ padding:"16px 24px", fontSize:13, fontWeight:600, color:"var(--text-tertiary)" }}>
                                        <span style={{ color:"#10b981", marginRight:12 }}>✓ {rec.correctAnswers}</span>
                                        <span style={{ color:"#ef4444" }}>✕ {rec.wrongAnswers}</span>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PracticeHistory;
