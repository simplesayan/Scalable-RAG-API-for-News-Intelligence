
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { performRAGQuery } from '../services/geminiService';
import { ChatMessage, NewsArticle } from '../types';

const ChatInterface: React.FC = () => {
  const [sessionId] = useState(`session-${Math.random().toString(36).substr(2, 9)}`);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSources, setCurrentSources] = useState<NewsArticle[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = db.getSession(sessionId);
    if (existing) setMessages(existing.history);
  }, [sessionId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setCurrentSources([]);

    try {
      const { response, sources } = await performRAGQuery(sessionId, input);
      const assistantMsg: ChatMessage = { role: 'assistant', content: response, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
      setCurrentSources(sources);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Error communicating with AI. Check API key.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    db.clearSession(sessionId);
    setMessages([]);
    setCurrentSources([]);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-[#0d0d0d]/50 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-semibold text-zinc-100">Intelligent RAG Assistant</h2>
          <p className="text-xs text-zinc-500">Retrieving from ingested local knowledge base</p>
        </div>
        <button 
          onClick={clearHistory}
          className="text-xs px-3 py-1.5 border border-zinc-800 rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
        >
          Reset Session
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.length === 0 && !loading && (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
            <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-zinc-300">Start a conversation</p>
            <p className="text-sm max-w-xs mt-2">Ask questions about your ingested news articles to see RAG in action.</p>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-5 py-4 ${
              m.role === 'user' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'bg-zinc-900 text-zinc-200 border border-zinc-800'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
              <span className="text-[10px] opacity-40 mt-2 block text-right">
                {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs text-zinc-500 font-medium">Analysing News Base...</span>
            </div>
          </div>
        )}

        {/* Sources Display */}
        {!loading && currentSources.length > 0 && (
          <div className="mt-4 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-3 flex items-center gap-2">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Sources Consulted
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSources.map((s, idx) => (
                <div key={idx} className="p-3 bg-zinc-800/50 border border-zinc-700/50 rounded-lg group hover:border-indigo-500/50 transition-colors">
                  <p className="text-[10px] font-semibold text-indigo-400 mb-1">{s.source}</p>
                  <p className="text-xs font-medium text-zinc-300 line-clamp-1">{s.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-6 bg-[#0d0d0d]/80 backdrop-blur-xl border-t border-zinc-800">
        <form onSubmit={handleSend} className="relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything about the news..."
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 text-sm rounded-xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all placeholder:text-zinc-600 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 flex items-center justify-center"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </form>
        <p className="text-[10px] text-zinc-600 text-center mt-4 uppercase tracking-tighter">
          Using RAG with Semantic Chunk Retrieval & Gemini 3 Flash Reasoning
        </p>
      </div>
    </div>
  );
};

export default ChatInterface;
