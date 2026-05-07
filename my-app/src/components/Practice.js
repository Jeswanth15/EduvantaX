import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateQuestions, submitPracticeResult } from '../services/practiceService';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDecodedToken } from '../utils/authHelper';

const Practice = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { classSubjectId, moduleName, files } = location.state || {};

    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);
    const hasGenerated = useRef(false);
    const userId = getDecodedToken()?.userId || 1;

    useEffect(() => {
        if (moduleName && files && files.length > 0) setContent(`Module: ${moduleName}`);
    }, [moduleName, files]);

    const handleGenerate = useCallback(async (explicitFiles = null) => {
        setLoading(true);
        try {
            const actualFiles = (explicitFiles && Array.isArray(explicitFiles)) ? explicitFiles : null;
            const fileLinks = actualFiles || (files ? files.map(f => f.fileLink) : null);
            const data = await generateQuestions(content, difficulty, fileLinks, moduleName, classSubjectId);
            if (!data || data.length === 0) throw new Error('No questions were generated.');
            setQuestions(data); setCurrentStep(1);
        } catch (error) {
            alert(error.message || 'Failed to generate questions.'); setCurrentStep(0);
        } finally { setLoading(false); }
    }, [content, difficulty, moduleName, classSubjectId, files]);

    const handleSubmit = async () => {
        let calculatedScore = 0; let correctCount = 0; let wrongCount = 0;
        questions.forEach((q, i) => { if (answers[i] === q.correctOption) { calculatedScore++; correctCount++; } else { wrongCount++; } });
        setScore(calculatedScore);

        try {
            await submitPracticeResult({
                topic: moduleName || (content.substring(0, 50) + (content.length > 50 ? '...' : '')), 
                moduleName: moduleName || null, classSubjectId: classSubjectId || null,
                score: Math.round((calculatedScore / questions.length) * 100),
                totalQuestions: questions.length, correctAnswers: correctCount, wrongAnswers: wrongCount, userId: userId 
            });
        } catch (error) { console.error("Failed to save result"); }
        setCurrentStep(2);
    };

    const progress = questions.length > 0 ? ((Object.keys(answers).length) / questions.length) * 100 : 0;

    return (
        <div style={{ maxWidth: 1000, margin: "0 auto", paddingBottom: 60 }}>
            {/* Header */}
            <div style={{ background:"linear-gradient(135deg, #4f46e5, #7c3aed)", borderRadius:24, padding:32, color:"white", marginBottom:32, boxShadow:"0 12px 32px rgba(124,58,237,0.25)", textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center" }}>
               <div style={{ width:56, height:56, borderRadius:20, background:"rgba(255,255,255,0.15)", backdropFilter:"blur(10px)", fontSize:28, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:16 }}>🧠</div>
               <h1 style={{ fontSize:32, fontWeight:900, margin:"0 0 8px", fontFamily:"'Outfit', sans-serif" }}>AI Practice Room</h1>
               <p style={{ margin:0, color:"#e0e7ff", fontSize:15, fontWeight:500 }}>Validate your understanding with contextual challenge sets.</p>
            </div>

            {currentStep === 0 && (
                <div style={{ maxWidth: 640, margin: "0 auto", background:"var(--surface-1)", borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-md)", padding:32 }}>
                    <div style={{ marginBottom:32 }}>
                        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Study Material Context</label>
                        <textarea className="form-input" style={{ width:"100%", height:120, resize:"none", borderRadius:16, fontSize:15 }} placeholder="Describe your target topic or paste material here..." value={content} onChange={e=>setContent(e.target.value)} />
                    </div>

                    <div style={{ marginBottom:32 }}>
                        <label style={{ display:"block", fontSize:12, fontWeight:800, color:"var(--text-secondary)", textTransform:"uppercase", letterSpacing:"1px", marginBottom:12 }}>Difficulty Level</label>
                        <div style={{ display:"flex", gap:12 }}>
                            {['EASY', 'MEDIUM', 'HARD'].map(lvl => (
                                <div key={lvl} onClick={()=>setDifficulty(lvl)} style={{ flex:1, padding:14, borderRadius:12, border:difficulty===lvl?"2px solid var(--primary-color)":"2px solid var(--border-medium)", background:difficulty===lvl?"rgba(59,130,246,0.05)":"var(--surface-2)", cursor:"pointer", textAlign:"center", fontSize:13, fontWeight:700, color:difficulty===lvl?"var(--primary-color)":"var(--text-secondary)", transition:"all 0.2s" }}>
                                    {lvl}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button onClick={()=>handleGenerate()} disabled={loading||!content} style={{ width:"100%", padding:18, borderRadius:16, background:"var(--primary-color)", color:"white", fontSize:16, fontWeight:800, border:"none", cursor:(loading||!content)?"not-allowed":"pointer", boxShadow:"0 8px 24px rgba(37,99,235,0.3)", opacity:(loading||!content)?0.7:1 }}>
                        {loading ? "Synthesizing Exam..." : "Start Assessment →"}
                    </button>
                </div>
            )}

            {currentStep === 1 && (
                <div style={{ maxWidth:800, margin:"0 auto" }}>
                    <div style={{ position:"sticky", top:20, zIndex:100, marginBottom:32 }}>
                        <div style={{ background:"var(--surface-1)", padding:24, borderRadius:20, boxShadow:"0 12px 40px rgba(0,0,0,0.1)", border:"1px solid var(--border-light)" }}>
                            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                                <span style={{ fontSize:12, fontWeight:800, color:"var(--primary-color)", letterSpacing:"1px", textTransform:"uppercase" }}>Question {Object.keys(answers).length} / {questions.length}</span>
                                <span style={{ fontSize:14, fontWeight:800, color:"var(--text-primary)" }}>{Math.round(progress)}%</span>
                            </div>
                            <div style={{ height:8, background:"var(--surface-2)", borderRadius:99, overflow:"hidden" }}>
                                <div style={{ height:"100%", width:`${progress}%`, background:"linear-gradient(90deg, #3b82f6, #8b5cf6)", transition:"width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }} />
                            </div>
                        </div>
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", gap:24 }}>
                        {questions.map((q, i) => (
                            <div key={i} style={{ background:"var(--surface-1)", padding:32, borderRadius:24, border:"1px solid var(--border-light)", boxShadow:"var(--shadow-sm)" }}>
                                <div style={{ display:"flex", gap:16, alignItems:"flex-start", marginBottom:24 }}>
                                    <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(59,130,246,0.1)", color:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, fontWeight:800, flexShrink:0 }}>{i+1}</div>
                                    <h3 style={{ fontSize:18, fontWeight:700, margin:0, lineHeight:1.5, color:"var(--text-primary)" }}>{q.questionText}</h3>
                                </div>
                                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                                    {(q.type==="MCQ"||q.type==="TRUE_FALSE") ? q.options.map((opt, optI) => (
                                        <div key={optI} onClick={()=>setAnswers({...answers, [i]:opt})} style={{ display:"flex", alignItems:"center", gap:14, padding:"16px 20px", borderRadius:16, border:answers[i]===opt?"2px solid var(--primary-color)":"1px solid var(--border-medium)", background:answers[i]===opt?"rgba(59,130,246,0.05)":"var(--surface-1)", cursor:"pointer", transition:"all 0.2s" }} onMouseEnter={e=>{if(answers[i]!==opt)e.currentTarget.style.background="var(--surface-2)"}} onMouseLeave={e=>{if(answers[i]!==opt)e.currentTarget.style.background="var(--surface-1)"}}>
                                            <div style={{ width:20, height:20, borderRadius:"50%", border:`2px solid ${answers[i]===opt?"var(--primary-color)":"#cbd5e1"}`, background:answers[i]===opt?"var(--primary-color)":"transparent", display:"flex", alignItems:"center", justifyContent:"center" }}>
                                                {answers[i]===opt && <div style={{ width:6, height:6, borderRadius:"50%", background:"white" }} />}
                                            </div>
                                            <span style={{ fontSize:15, fontWeight:answers[i]===opt?700:500, color:answers[i]===opt?"var(--primary-color)":"var(--text-secondary)", lineHeight:1.4 }}>{opt}</span>
                                        </div>
                                    )) : (
                                        <div style={{ background:"rgba(245,158,11,0.1)", padding:20, borderRadius:16, borderLeft:"4px solid #f59e0b", color:"#b45309", fontSize:14, fontWeight:600 }}>Short answer validation is an open reflection task.</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <button onClick={handleSubmit} style={{ width:"100%", marginTop:32, padding:20, borderRadius:16, background:"linear-gradient(135deg, #10b981, #059669)", color:"white", fontSize:16, fontWeight:800, border:"none", cursor:"pointer", boxShadow:"0 12px 24px rgba(16,185,129,0.3)" }}>
                        Seal Answers & View Results
                    </button>
                </div>
            )}

            {currentStep === 2 && (
                <div style={{ maxWidth:600, margin:"0 auto" }}>
                    <div style={{ background:"var(--surface-1)", borderRadius:32, padding:48, textAlign:"center", border:"1px solid var(--border-light)", boxShadow:"var(--shadow-lg)", position:"relative", overflow:"hidden" }}>
                        <div style={{ position:"absolute", top:0, left:0, right:0, height:6, background:score<(questions.length/2)?"#ef4444":"#10b981" }} />
                        <h2 style={{ fontSize:24, fontWeight:900, marginBottom:32, color:"var(--text-primary)" }}>Performance Summary</h2>
                        
                        <div style={{ width:180, height:180, margin:"0 auto 32px", borderRadius:"50%", background:score<(questions.length/2)?"#fef2f2":"#ecfdf5", border:"12px solid white", boxShadow:"0 12px 32px rgba(0,0,0,0.08)", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
                            <div style={{ fontSize:56, fontWeight:900, color:score<(questions.length/2)?"#ef4444":"#10b981", lineHeight:1 }}>{score}</div>
                            <div style={{ fontSize:14, fontWeight:800, color:"var(--text-muted)", marginTop:6, paddingTop:6, borderTop:"2px solid rgba(0,0,0,0.1)" }}>/ {questions.length} PTS</div>
                        </div>

                        {score < (questions.length/2) ? (
                            <div style={{ background:"#fef2f2", border:"1px solid #fecaca", padding:24, borderRadius:16, marginBottom:32 }}>
                                <div style={{ fontSize:14, fontWeight:800, color:"#dc2626", marginBottom:8 }}>Further Study Advised</div>
                                <div style={{ fontSize:14, color:"#991b1b", lineHeight:1.6 }}>Your assimilation score indicates some gaps. Revisit the module before attempting again.</div>
                            </div>
                        ) : (
                            <div style={{ background:"#ecfdf5", border:"1px solid #a7f3d0", padding:24, borderRadius:16, marginBottom:32 }}>
                                <div style={{ fontSize:14, fontWeight:800, color:"#059669", marginBottom:8 }}>Excellent Mastery</div>
                                <div style={{ fontSize:14, color:"#065f46", lineHeight:1.6 }}>You demonstrated a strong understanding of the learning objectives.</div>
                            </div>
                        )}

                        <div style={{ display:"flex", gap:16 }}>
                            <button onClick={()=>{hasGenerated.current=false; setAnswers({}); setScore(0); if(moduleName) handleGenerate(files.map(f=>f.fileLink)); else setCurrentStep(0);}} style={{ flex:1, padding:16, borderRadius:12, background:"white", border:"2px solid var(--border-medium)", color:"var(--text-secondary)", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer" }}>Retake Assessment</button>
                            <button onClick={()=>navigate(moduleName?'/syllabus':'/practice-history')} style={{ flex:1, padding:16, borderRadius:12, background:"var(--primary-color)", border:"none", color:"white", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", boxShadow:"0 4px 12px rgba(37,99,235,0.3)" }}>View Log</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Practice;
