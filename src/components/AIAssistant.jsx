import React, { useState, useEffect, useRef, useContext } from "react";
import axios from "axios";
import { UserContext } from "../context/UserContext";

const API = import.meta.env.VITE_API_URI;

const AIAssistant = () => {
  const { user, isLoggedIn, getAuthHeader } = useContext(UserContext);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  // Fetch history when opened
  useEffect(() => {
    if (!open || !isLoggedIn || !user) return;
    (async () => {
      try {
        const h = await getAuthHeader();
        const res = await axios.get(`${API}/api/assistant/history`, { headers: h, timeout: 8000 });
        const server = res?.data?.messages || [];
        if (server.length) {
          setMessages(server.map(m => ({
            _id: m._id || Math.random(),
            role: m.role,
            content: m.content,
          })));
        } else {
          setMessages([{ _id: "welcome", role: "assistant", content: "Hi! I can track orders, compare products, or recommend items. What do you need?" }]);
        }
      } catch { /* keep current */ }
    })();
  }, [open, isLoggedIn, user]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const userMsg = { _id: Date.now(), role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const h = await getAuthHeader();
      const res = await axios.post(`${API}/api/assistant/chat`, { message: text }, { headers: h, timeout: 30000 });
      setMessages(prev => [...prev, { _id: Date.now() + 1, role: "assistant", content: res.data.reply }]);
    } catch (err) {
      const m = err?.response?.data?.message || "Connection error. Try again.";
      setError(m);
      setMessages(prev => [...prev, { _id: Date.now() + 1, role: "assistant", content: "Sorry, I hit an error. Please try again." }]);
    } finally { setLoading(false); }
  };

  const clearChat = async () => {
    try {
      const h = await getAuthHeader();
      await axios.delete(`${API}/api/assistant/clear`, { headers: h, timeout: 8000 });
      setMessages([{ _id: "welcome", role: "assistant", content: "Chat cleared! Ask me anything." }]);
      setError(null);
    } catch {}
  };

  if (!isLoggedIn || !user) return null;

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-full shadow-2xl hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
          aria-label="Open AI Assistant"
        >
          <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
          </svg>
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-20 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-slide-up" style={{ maxHeight: "min(600px, 80vh)" }}>
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-indigo-200">Orders · Compare · Recommend</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={clearChat} className="text-xs text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition" title="Clear history">Clear</button>
              <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white" aria-label="Close">✕</button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50">
            {error && (
              <div className="text-center text-red-500 text-sm bg-red-50 p-2 rounded-lg">{error}</div>
            )}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              return (
                <div key={msg._id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    isUser
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-white text-gray-800 border border-gray-200 shadow-sm rounded-bl-md"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 shadow-sm px-3.5 py-2 rounded-2xl rounded-bl-md text-sm text-gray-500 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask about orders, compare, recommend..."
                disabled={loading}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim() || loading}
                className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:from-indigo-600 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
