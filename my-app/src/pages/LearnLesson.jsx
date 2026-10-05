import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

export default function LearnLesson() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Data states
  const [course, setCourse] = useState(null);
  const [modules, setModules] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [currentLesson, setCurrentLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Interactive states
  const [codeSnippet, setCodeSnippet] = useState('');
  const [codeOutput, setCodeOutput] = useState('');
  const [runningCode, setRunningCode] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  // AI Chatbot panel toggle & messages inside player
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your AI assistant. Ask me anything about this lesson!' }
  ]);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    const fetchLearningData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const [courseRes, modulesRes, lessonsRes, progressRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/courses/${courseId}`, { headers }).catch(() => ({ data: null })),
          axios.get(`http://localhost:5000/api/courses/${courseId}/modules`, { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/courses/${courseId}/lessons`, { headers }).catch(() => ({ data: [] })),
          axios.get(`http://localhost:5000/api/courses/${courseId}/progress`, { headers }).catch(() => ({ data: null })),
        ]);

        const courseData = courseRes.data?.course || courseRes.data;
        if (!courseData) {
          setError('Course not found or unauthorized.');
          setLoading(false);
          return;
        }

        setCourse(courseData);

        const rawModules = modulesRes.data?.modules || modulesRes.data;
        setModules(Array.isArray(rawModules) ? rawModules : []);

        const rawLessons = lessonsRes.data?.lessons || lessonsRes.data;
        const lessonList = Array.isArray(rawLessons) ? rawLessons : [];
        setLessons(lessonList);

        if (lessonList.length > 0) {
          setCurrentLesson(lessonList[0]);
          setCodeSnippet(lessonList[0].initial_code || '// Write your code here\nconsole.log("Hello, Code Runner!");');
        }

        setProgress(progressRes.data || { percentage: 0 });
      } catch (err) {
        console.error('Error loading course player:', err);
        setError('Failed to load learning environment.');
      } finally {
        setLoading(false);
      }
    };

    fetchLearningData();
  }, [courseId]);

  // Fetch specific lesson materials / details when currentLesson changes
  useEffect(() => {
    if (!currentLesson) return;
    const fetchLessonExtras = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const matRes = await axios.get(`http://localhost:5000/api/lessons/${currentLesson.id}/materials`, { headers }).catch(() => ({ data: [] }));
        const rawMats = matRes.data?.materials || matRes.data;
        setMaterials(Array.isArray(rawMats) ? rawMats : []);
        setCodeSnippet(currentLesson.initial_code || '// Write your code here\n');
        setCodeOutput('');
        setQuizSubmitted(false);
        setAssignmentSubmitted(false);
      } catch (err) {
        setMaterials([]);
      }
    };
    fetchLessonExtras();
  }, [currentLesson]);

  // Handle Code Execution
  const handleRunCode = async () => {
    try {
      setRunningCode(true);
      setCodeOutput('Running code...');
      const res = await axios.post('http://localhost:5000/api/coding/run', {
        lesson_id: currentLesson?.id,
        code: codeSnippet
      });
      setCodeOutput(res.data.output || res.data.result || 'Executed successfully with no output.');
    } catch (err) {
      setCodeOutput('Error executing code snippet. Please check syntax.');
    } finally {
      setRunningCode(false);
    }
  };

  // Mark lesson as complete
  const handleMarkComplete = async () => {
    if (!currentLesson) return;
    try {
      await axios.post(`http://localhost:5000/api/lessons/${currentLesson.id}/complete`);
      alert('Lesson marked as complete!');
      // Update progress dynamically or refetch
      setProgress((prev) => ({ ...prev, percentage: Math.min((prev?.percentage || 0) + 10, 100) }));
    } catch (err) {
      alert('Failed to mark lesson complete.');
    }
  };

  // AI Chat message sender
  const handleSendChat = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    const newMsg = { sender: 'user', text: userInput };
    setChatMessages((prev) => [...prev, newMsg]);
    const query = userInput;
    setUserInput('');

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Regarding "${query}": This relates to the core concepts in ${currentLesson?.title || 'this module'}. Make sure to review the code example and output panel!` }
      ]);
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-xl font-semibold animate-pulse">Loading Learning Environment...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white space-y-4">
        <div className="text-red-400 text-lg font-semibold">{error}</div>
        <Link to="/dashboard" className="bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-500 transition">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const currentIndex = lessons.findIndex((l) => l.id === currentLesson?.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col h-screen overflow-hidden">
      
      {/* Top Navbar */}
      <header className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-4">
          <Link to="/dashboard" className="text-indigo-500 font-bold tracking-wider text-sm">CODE RUNNER</Link>
          <span className="text-gray-600">|</span>
          <h2 className="text-sm font-semibold text-white truncate max-w-md">{course?.title}</h2>
        </div>
        
        {/* Progress Bar & Actions */}
        <div className="flex items-center space-x-6">
          <div className="hidden sm:flex items-center space-x-3">
            <span className="text-xs text-gray-400">Progress ({progress?.percentage || 0}%)</span>
            <div className="w-32 bg-gray-800 h-2 rounded-full overflow-hidden border border-gray-700">
              <div className="bg-indigo-500 h-full transition-all duration-300" style={{ width: `${progress?.percentage || 0}%` }}></div>
            </div>
          </div>
          <button
            onClick={() => setIsAiOpen(!isAiOpen)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5"
          >
            <span>🤖 AI Assistant</span>
          </button>
        </div>
      </header>

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Left Sidebar: Modules & Lessons */}
        <aside className="w-80 bg-gray-900 border-r border-gray-800 flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">Course Syllabus</h3>
          </div>
          <div className="p-3 space-y-4">
            {modules.length > 0 ? (
              modules.map((mod, mIdx) => (
                <div key={mod.id || mIdx} className="space-y-1">
                  <h4 className="text-xs font-bold text-gray-300 px-2 py-1 bg-gray-800/60 rounded">
                    Module {mIdx + 1}: {mod.title}
                  </h4>
                  <div className="pl-2 space-y-1 mt-1">
                    {lessons
                      .filter((l) => l.module_id === mod.id || l.moduleIndex === mIdx || true)
                      .map((lesson, lIdx) => {
                        const isSelected = currentLesson?.id === lesson.id;
                        return (
                          <button
                            key={lesson.id || lIdx}
                            onClick={() => setCurrentLesson(lesson)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-xs transition flex items-center justify-between ${
                              isSelected ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                            }`}
                          >
                            <span className="truncate">▶ {lesson.title || `Lesson ${lIdx + 1}`}</span>
                            <span className="text-[10px] opacity-75">{lesson.duration || '10m'}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-1">
                {lessons.map((lesson, idx) => (
                  <button
                    key={lesson.id || idx}
                    onClick={() => setCurrentLesson(lesson)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                      currentLesson?.id === lesson.id ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    ▶ {lesson.title || `Lesson ${idx + 1}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>

        {/* Center Content Player */}
        <main className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-950/40">
          {currentLesson ? (
            <div className="max-w-4xl mx-auto space-y-6">
              
              {/* Lesson Title & Mark Complete */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-xs text-indigo-400 font-semibold">Active Lesson</span>
                  <h1 className="text-2xl font-bold text-white mt-0.5">{currentLesson.title}</h1>
                </div>
                <button
                  onClick={handleMarkComplete}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow"
                >
                  ✓ Mark Complete
                </button>
              </div>

              {/* Video Player or Content Box */}
              <div className="bg-black rounded-2xl overflow-hidden border border-gray-800 aspect-video flex items-center justify-center relative shadow-2xl">
                {currentLesson.video_url ? (
                  <iframe
                    src={currentLesson.video_url}
                    title={currentLesson.title}
                    className="w-full h-full"
                    allowFullScreen
                  ></iframe>
                ) : (
                  <div className="text-center space-y-2 p-6">
                    <span className="text-4xl">🎥</span>
                    <p className="text-gray-400 text-sm">Interactive Video Player Stream</p>
                    <p className="text-xs text-gray-500">Follow the text lesson and code workspace below.</p>
                  </div>
                )}
              </div>

              {/* Lesson Text Content */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                <h3 className="text-sm font-bold text-indigo-400">Lesson Overview & Notes</h3>
                <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {currentLesson.content || 'Detailed documentation, explanation of theories, and key takeaways for this lesson.'}
                </div>
              </div>

              {/* Downloadable Materials / PDF Viewer */}
              {materials.length > 0 && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3">
                  <h3 className="text-sm font-bold text-white">Downloadable Materials & PDFs</h3>
                  <div className="space-y-2">
                    {materials.map((mat, mIdx) => (
                      <a
                        key={mat.id || mIdx}
                        href={mat.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-800 border border-gray-700 rounded-xl text-xs text-indigo-400 hover:bg-gray-700/60 transition"
                      >
                        <span>📄 {mat.title || `Resource File ${mIdx + 1}`}</span>
                        <span>Download ↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Interactive Code Editor Workspace */}
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-white">Interactive Coding Workspace</h3>
                  <button
                    onClick={handleRunCode}
                    disabled={runningCode}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50"
                  >
                    {runningCode ? 'Running...' : '▶ Run Code'}
                  </button>
                </div>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  rows={6}
                  className="w-full bg-black font-mono text-xs text-emerald-400 p-4 rounded-xl border border-gray-800 focus:outline-none focus:border-indigo-500"
                ></textarea>
                {codeOutput && (
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-gray-400">Output Console:</span>
                    <pre className="bg-black p-3 rounded-xl border border-gray-800 text-xs font-mono text-gray-200 overflow-x-auto">
                      {codeOutput}
                    </pre>
                  </div>
                )}
              </div>

              {/* Quiz / Assessment Component */}
              {currentLesson.quiz && (
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white">Knowledge Check Quiz</h3>
                  <p className="text-xs text-gray-300">{currentLesson.quiz.question || 'Test your understanding of this lesson.'}</p>
                  <div className="space-y-2">
                    {(currentLesson.quiz.options || ['Option A', 'Option B', 'Option C']).map((opt, oIdx) => (
                      <label key={oIdx} className="flex items-center space-x-3 text-xs text-gray-300 bg-gray-800 p-3 rounded-xl border border-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          name="quiz-option"
                          onChange={() => setQuizAnswers({ selected: oIdx })}
                        />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => setQuizSubmitted(true)}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition border border-gray-700"
                  >
                    Submit Answer
                  </button>
                  {quizSubmitted && (
                    <p className="text-xs text-emerald-400 font-semibold">Answer recorded successfully!</p>
                  )}
                </div>
              )}

              {/* Previous / Next Lesson Navigation Buttons */}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={() => prevLesson && setCurrentLesson(prevLesson)}
                  disabled={!prevLesson}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 text-xs font-medium rounded-xl disabled:opacity-40 hover:bg-gray-700 transition"
                >
                  ← Previous Lesson
                </button>
                <button
                  onClick={() => nextLesson && setCurrentLesson(nextLesson)}
                  disabled={!nextLesson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-xl disabled:opacity-40 transition shadow"
                >
                  Next Lesson →
                </button>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-gray-500 text-sm">Select a lesson from the sidebar to begin learning.</div>
          )}
        </main>

        {/* Right Drawer: AI Chatbot Assistant */}
        {isAiOpen && (
          <aside className="w-96 bg-gray-900 border-l border-gray-800 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-800 flex justify-between items-center">
              <h3 className="font-bold text-white text-xs uppercase tracking-wider text-indigo-400">AI Learning Assistant</h3>
              <button onClick={() => setIsAiOpen(false)} className="text-gray-400 hover:text-white text-sm">✕</button>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-xs leading-relaxed ${
                    msg.sender === 'user' ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-200 border border-gray-700'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} className="p-3 border-t border-gray-800 flex space-x-2 bg-gray-900">
              <input
                type="text"
                placeholder="Ask AI about this lesson..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-xs font-semibold transition">
                Send
              </button>
            </form>
          </aside>
        )}

      </div>
    </div>
  );
}