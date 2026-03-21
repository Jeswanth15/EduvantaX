import React, { useState, useEffect, useRef, useCallback } from 'react';
import { generateQuestions, submitPracticeResult } from '../services/practiceService';
import { useNavigate, useLocation } from 'react-router-dom';
import { getDecodedToken } from '../utils/authHelper';
import { 
    FaBrain, FaArrowRight, FaCheckCircle, FaTimesCircle, FaRedo, 
    FaChevronLeft, FaSignal, FaQuoteLeft, FaBookOpen, FaAward
} from 'react-icons/fa';

const Practice = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { classSubjectId, moduleName, files } = location.state || {};

    const [content, setContent] = useState('');
    const [difficulty, setDifficulty] = useState('MEDIUM');
    const [questions, setQuestions] = useState([]);
    const [currentStep, setCurrentStep] = useState(0); // 0: Input, 1: Quiz, 2: Result
    const [loading, setLoading] = useState(false);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(0);
    const hasGenerated = useRef(false);
    const userId = getDecodedToken()?.userId || 1;

    useEffect(() => {
        if (moduleName && files && files.length > 0) {
            setContent(`Module: ${moduleName}`);
            // Don't auto-generate, let user select difficulty in Step 0
        }
    }, [moduleName, files]);

    const handleGenerate = useCallback(async (explicitFiles = null) => {
        setLoading(true);
        try {
            // If explicitFiles is an event (from onClick), ignore it and use default logic
            const actualFiles = (explicitFiles && Array.isArray(explicitFiles)) ? explicitFiles : null;
            const fileLinks = actualFiles || (files ? files.map(f => f.fileLink) : null);
            const data = await generateQuestions(content, difficulty, fileLinks, moduleName, classSubjectId);
            if (!data || data.length === 0) {
                throw new Error('No questions were generated. Please ensure materials are uploaded and processed.');
            }
            setQuestions(data);
            setCurrentStep(1);
        } catch (error) {
            console.error('Error generating questions:', error);
            alert(error.message || 'Failed to generate questions. Please try again.');
            setCurrentStep(0);
        } finally {
            setLoading(false);
        }
    }, [content, difficulty, moduleName, classSubjectId, files]);

    const handleOptionSelect = (questionIndex, option) => {
        setAnswers({ ...answers, [questionIndex]: option });
    };

    const handleSubmit = async () => {
        let calculatedScore = 0;
        let correctCount = 0;
        let wrongCount = 0;

        questions.forEach((q, index) => {
            if (answers[index] === q.correctOption) {
                calculatedScore++;
                correctCount++;
            } else {
                wrongCount++;
            }
        });

        setScore(calculatedScore);

        // Submit to backend
        const result = {
            topic: moduleName || (content.substring(0, 50) + (content.length > 50 ? '...' : '')), 
            moduleName: moduleName || null,
            classSubjectId: classSubjectId || null,
            score: Math.round((calculatedScore / questions.length) * 100),
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            wrongAnswers: wrongCount,
            userId: userId 
        };

        try {
            await submitPracticeResult(result);
            setCurrentStep(2);
        } catch (error) {
            console.error("Failed to save result", error);
            // Show result anyway
            setCurrentStep(2);
        }
    };

    const progress = questions.length > 0 ? ((Object.keys(answers).length) / questions.length) * 100 : 0;

    return (
        <div className="fade-in" style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px', color: 'var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <FaBrain /> Practice Mode
                </h1>
                <p style={{ color: 'var(--text-muted)' }}>Enhance your understanding through AI-generated assessments</p>
            </div>

            {/* Step 0: Input/Configuration */}
            {currentStep === 0 && (
                <div className="premium-card fade-in" style={{ maxWidth: '650px', margin: '0 auto', borderTop: '4px solid var(--primary-color)' }}>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            <FaQuoteLeft size={12} style={{ opacity: 0.5 }} /> Topic or Content
                        </label>
                        <textarea
                            className="modern-input"
                            style={{ width: '100%', height: '140px', padding: '16px', fontSize: '15px' }}
                            placeholder="Describe your target topic or paste material here..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: '700', color: 'var(--text-primary)' }}>
                            <FaSignal size={14} style={{ color: 'var(--primary-color)' }} /> Select Difficulty
                        </label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            {['EASY', 'MEDIUM', 'HARD'].map((level) => (
                                <div
                                    key={level}
                                    onClick={() => setDifficulty(level)}
                                    style={{
                                        flex: 1,
                                        padding: '12px',
                                        borderRadius: 'var(--radius-md)',
                                        border: '1.5px solid',
                                        borderColor: difficulty === level ? 'var(--primary-color)' : 'var(--border-color)',
                                        backgroundColor: difficulty === level ? 'rgba(12, 74, 110, 0.05)' : 'white',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        transition: 'all 0.2s',
                                        fontWeight: '600',
                                        color: difficulty === level ? 'var(--primary-color)' : 'var(--text-muted)'
                                    }}
                                >
                                    {level}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => handleGenerate()}
                        disabled={loading || !content}
                        className="modern-btn btn-primary"
                        style={{ width: '100%', padding: '16px', fontSize: '16px', fontWeight: '700', boxShadow: '0 4px 12px rgba(12, 74, 110, 0.2)' }}
                    >
                        {loading ? (
                            <>
                                <div className="spinner-small" style={{ borderLeftColor: 'white' }}></div>
                                Analyzing Materials...
                            </>
                        ) : (
                            <>Start Assessment <FaArrowRight /></>
                        )}
                    </button>
                </div>
            )}

            {/* Step 1: Quiz */}
            {currentStep === 1 && (
                <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {/* Progress Bar Container */}
                    <div style={{ position: 'sticky', top: '20px', zIndex: 10, marginBottom: '24px' }}>
                        <div className="glass-panel" style={{ padding: '16px 24px', boxShadow: 'var(--shadow-lg)', border: '1px solid rgba(12, 74, 110, 0.1)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                                <span style={{ fontWeight: '700', color: 'var(--primary-color)', fontSize: '14px' }}>
                                   QUESTION {Object.keys(answers).length} / {questions.length}
                                </span>
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600' }}>
                                    {Math.round(progress)}% COMPLETED
                                </span>
                            </div>
                            <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                <div 
                                    style={{ 
                                        width: `${progress}%`, 
                                        height: '100%', 
                                        backgroundColor: 'var(--primary-color)', 
                                        transition: 'width 0.4s ease-out',
                                        background: 'linear-gradient(90deg, var(--primary-color), var(--accent-color))'
                                    }} 
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {questions.map((q, index) => (
                            <div key={index} className="premium-card" style={{ padding: '32px' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '24px' }}>
                                    <div style={{ 
                                        width: '32px', height: '32px', borderRadius: '50%', 
                                        backgroundColor: 'var(--primary-color)', color: 'white', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '14px', fontWeight: '800', flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>
                                    <h3 style={{ fontSize: '18px', lineHeight: '1.5', margin: 0 }}>{q.questionText}</h3>
                                </div>

                                {q.type === 'MCQ' || q.type === 'TRUE_FALSE' ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                        {q.options.map((option, optIndex) => (
                                            <div
                                                key={optIndex}
                                                onClick={() => handleOptionSelect(index, option)}
                                                style={{
                                                    padding: '16px 20px',
                                                    borderRadius: 'var(--radius-md)',
                                                    border: '1.5px solid',
                                                    borderColor: answers[index] === option ? 'var(--primary-color)' : 'var(--border-color)',
                                                    backgroundColor: answers[index] === option ? 'rgba(12, 74, 110, 0.03)' : 'white',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '12px',
                                                    transition: 'var(--transition-fast)',
                                                    fontSize: '15px',
                                                    fontWeight: answers[index] === option ? '600' : '400',
                                                    color: answers[index] === option ? 'var(--primary-color)' : 'inherit'
                                                }}
                                            >
                                                <div style={{ 
                                                    width: '20px', height: '20px', borderRadius: '50%', 
                                                    border: '2px solid', 
                                                    borderColor: answers[index] === option ? 'var(--primary-color)' : '#cbd5e1',
                                                    backgroundColor: answers[index] === option ? 'var(--primary-color)' : 'transparent',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                                }}>
                                                    {answers[index] === option && <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'white' }} />}
                                                </div>
                                                {option}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ 
                                        padding: '16px', borderLeft: '4px solid var(--accent-color)', 
                                        backgroundColor: 'rgba(59, 130, 246, 0.05)', borderRadius: '0 8px 8px 0' 
                                    }}>
                                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <FaBookOpen /> This is a short-answer question for your reflection.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '40px', paddingBottom: '60px' }}>
                        <button
                            onClick={handleSubmit}
                            className="modern-btn btn-primary"
                            style={{ 
                                width: '100%', padding: '20px', fontSize: '18px', fontWeight: '800', 
                                letterSpacing: '0.5px', boxShadow: '0 8px 20px rgba(16, 185, 129, 0.2)',
                                backgroundColor: 'var(--success-color)' 
                            }}
                        >
                            <FaCheckCircle /> Finalize Assessment
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Result */}
            {currentStep === 2 && (
                <div className="fade-in" style={{ maxWidth: '600px', margin: '40px auto' }}>
                    <div className="premium-card text-center" style={{ padding: '48px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ 
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '6px', 
                            backgroundColor: score < (questions.length / 2) ? 'var(--error-color)' : 'var(--success-color)' 
                        }} />
                        
                        <div style={{ marginBottom: '32px' }}>
                             <FaAward size={48} style={{ color: 'var(--warning-color)', marginBottom: '16px' }} />
                             <h2 style={{ fontSize: '28px', color: 'var(--text-primary)' }}>Performance Summary</h2>
                        </div>

                        <div style={{ 
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', 
                            width: '160px', height: '160px', borderRadius: '50%',
                            background: score < (questions.length / 2) ? 'linear-gradient(135deg, #fff1f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                            border: '12px solid white', boxShadow: '0 8px 24px rgba(0,0,0,0.06)',
                            marginBottom: '32px'
                        }}>
                            <div>
                                <div style={{ fontSize: '48px', fontWeight: '900', color: score < (questions.length / 2) ? 'var(--error-color)' : 'var(--success-color)' }}>
                                    {score}
                                </div>
                                <div style={{ fontSize: '16px', fontWeight: '700', opacity: 0.5, borderTop: '2px solid rgba(0,0,0,0.1)', paddingTop: '4px' }}>
                                    TOTAL {questions.length}
                                </div>
                            </div>
                        </div>

                        {score < (questions.length / 2) ? (
                            <div className="fade-in" style={{ backgroundColor: '#fff5f5', padding: '24px', borderRadius: '16px', border: '1px solid #fed7d7', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--error-color)', marginBottom: '12px', fontWeight: '800' }}>
                                    <FaTimesCircle /> FURTHER STUDY REQUIRED
                                </div>
                                <p style={{ margin: 0, fontSize: '15px', color: '#822727', lineHeight: '1.6' }}>
                                    Your score is below 50%. We recommend revisiting the module materials to reinforce key concepts before your next attempt.
                                </p>
                            </div>
                        ) : (
                            <div className="fade-in" style={{ backgroundColor: '#f0fdf4', padding: '24px', borderRadius: '16px', border: '1px solid #bbf7d0', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--success-color)', marginBottom: '12px', fontWeight: '800' }}>
                                    <FaCheckCircle /> EXCELLENT PROGRESS!
                                </div>
                                <p style={{ margin: 0, fontSize: '15px', color: '#166534', lineHeight: '1.6' }}>
                                    Great job mastering this module. Your performance suggests a strong grasp of the material. Keep up the momentum!
                                </p>
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <button
                                onClick={() => {
                                    hasGenerated.current = false;
                                    setAnswers({});
                                    setScore(0);
                                    if (moduleName) {
                                        handleGenerate(files.map(f => f.fileLink));
                                    } else {
                                        setCurrentStep(0);
                                    }
                                }}
                                className="modern-btn btn-outline"
                            >
                                <FaRedo /> Retake Test
                            </button>
                            <button
                                onClick={() => navigate(moduleName ? '/syllabus' : '/practice-history')}
                                className="modern-btn btn-primary"
                            >
                                <FaChevronLeft /> {moduleName ? 'Back to Module' : 'View History'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Practice;
