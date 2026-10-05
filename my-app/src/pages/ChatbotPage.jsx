import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ChatbotPage() {
  const [conversations, setConversations] = useState([]);
  const [currentConvId, setCurrentConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    "How do I write a custom middleware in Flask?",
    "Explain React useEffect dependency arrays with examples.",
    "How can I optimize SQL queries for large datasets?",
    "What is the best way to handle user authentication tokens securely?"
  ];

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get('http://localhost:5000/api/chatbot/conversations', { headers });
      const convs = res.data?.conversations || [];
      
      if (convs.length > 0) {
        setConversations(convs);
        selectConversation(convs[0].id);
      } else {
        handleNewChat();
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      // Fallback local state
      const fallback = [{ id: 'conv-1', title: 'New Coding Session' }];
      setConversations(fallback);
      selectConversation('conv-1');
    }
  };

  const selectConversation = async (convId) => {
    setCurrentConvId(convId);
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`http://localhost:5000/api/chatbot/conversations/${convId}`, { headers });
      const msgs = res.data?.messages || [];
      setMessages(msgs);
    } catch (err) {
      setMessages([
        { sender: 'ai', text: 'How can I assist you with your project today?' }
      ]);
    }
  };

  const handleNewChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('http://localhost:5000/api/chatbot/conversations', { title: 'New Chat' }, { headers });
      const newConv = res.data?.conversation;
      
      setConversations(prev => [newConv, ...prev]);
      setCurrentConvId(newConv.id);
      setMessages([
        { sender: 'ai', text: 'Started a fresh session. What coding problem are we tackling?' }
      ]);
    } catch (err) {
      console.error('Failed to create new chat:', err);
    }
  };

  const handleDeleteChat = async (e, convId) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.delete(`http://localhost:5000/api/chatbot/conversations/${convId}`, { headers });
      
      const updated = conversations.filter(c => c.id !== convId);
      setConversations(updated);
      if (currentConvId === convId) {
        if (updated.length > 0) {
          selectConversation(updated[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      setConversations(conversations.filter(c => c.id !== convId));
    }
  };

  const handleSendMessage = async (e, textToSend) => {
    if (e) e.preventDefault();
    const query = textToSend || inputMessage;
    if (!query.trim()) return;

    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post('http://localhost:5000/api/chatbot/chat', {
        conversation_id: currentConvId,
        message: query
      }, { headers });

      const aiReply = res.data?.response || 'I processed your request.';
      setMessages(prev => [...prev, { sender: 'ai', text: aiReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: 'Sorry, I encountered an error connecting to the AI server.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (codeText, index) => {
    navigator.clipboard.writeText(codeText);
    setCopiedId(index);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      {/* Header Bar */}
      <header className="bg-gray-900 border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold tracking-wider text-indigo-500">
          CODE RUNNER
        </Link>
        <div className="flex items-center space-x-6">
          <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition">Dashboard</Link>
          <Link to="/courses" className="text-sm font-medium text-gray-400 hover:text-white transition">Catalog</Link>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-72 bg-gray-950 border-r border-gray-800 flex flex-col justify-between hidden md:flex">
          <div className="p-4 space-y-4">
            <button
              onClick={handleNewChat}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow"
            >
              <span>+ New Chat</span>
            </button>

            <div className="space-y-1 pt-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider px-2">Recent Sessions</span>
              <div className="space-y-1 mt-2 overflow-y-auto max-h-[calc(100vh-250px)]">
                {conversations.map((conv) => {
                  const isActive = currentConvId === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => selectConversation(conv.id)}
                      className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition ${
                        isActive ? 'bg-gray-800 text-white font-semibold' : 'text-gray-400 hover:bg-gray-900 hover:text-gray-200'
                      }`}
                    >
                      <span className="truncate flex-1">{conv.title || 'Coding Assistance'}</span>
                      <button
                        onClick={(e) => handleDeleteChat(e, conv.id)}
                        className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-red-400 p-1 transition"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 border-t border-gray-900 text-[11px] text-gray-500 text-center">
            Code Runner AI v2.4
          </div>
        </aside>

        {/* Chat Area */}
        <main className="flex-1 flex flex-col bg-gray-900 overflow-hidden relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.sender === 'user';
              return (
                <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-2xl rounded-2xl px-5 py-4 text-xs leading-relaxed space-y-3 ${
                    isUser ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-800 border border-gray-700 text-gray-200 rounded-bl-none shadow-lg'
                  }`}>
                    <div className="font-semibold text-[10px] opacity-70">
                      {isUser ? 'You' : 'Code Runner AI'}
                    </div>
                    
                    <div className="whitespace-pre-wrap">
                      {msg.text.includes('```') ? (
                        <div>
                          {msg.text.split('```').map((part, i) => {
                            if (i % 2 === 1) {
                              return (
                                <div key={i} className="my-3 bg-gray-950 border border-gray-700 rounded-xl overflow-hidden">
                                  <div className="bg-gray-900 px-4 py-2 border-b border-gray-800 flex justify-between items-center text-[10px] text-gray-400 font-mono">
                                    <span>code snippet</span>
                                    <button
                                      onClick={() => handleCopyCode(part, `${index}-${i}`)}
                                      className="hover:text-indigo-400 transition"
                                    >
                                      {copiedId === `${index}-${i}` ? '✓ Copied!' : '📋 Copy'}
                                    </button>
                                  </div>
                                  <pre className="p-4 font-mono text-[11px] text-indigo-300 overflow-x-auto">
                                    <code>{part}</code>
                                  </pre>
                                </div>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          })}
                        </div>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 border border-gray-700 rounded-2xl rounded-bl-none px-5 py-4 text-xs text-gray-400 flex items-center space-x-2">
                  <span className="animate-spin">⏳</span>
                  <span>AI is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {messages.length <= 1 && (
            <div className="px-6 py-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">Suggested Starter Questions</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleSendMessage(e, q)}
                    className="text-left bg-gray-800/60 hover:bg-gray-800 border border-gray-700/80 hover:border-indigo-500/50 p-3 rounded-xl text-xs text-gray-300 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-900 border-t border-gray-800">
            <form onSubmit={(e) => handleSendMessage(e, null)} className="flex items-center space-x-3 max-w-4xl mx-auto">
              <input
                type="text"
                placeholder="Ask a coding question or paste your code snippet..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 shadow-inner"
              />
              <button
                type="submit"
                disabled={loading || !inputMessage.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl text-xs font-bold transition shadow disabled:opacity-50"
              >
                Send 🚀
              </button>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}