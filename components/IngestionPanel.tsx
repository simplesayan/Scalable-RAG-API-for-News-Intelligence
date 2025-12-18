
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { generateMockArticles } from '../services/geminiService';
import { NewsArticle } from '../types';

const IngestionPanel: React.FC = () => {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setArticles(db.getArticles());
  }, []);

  const handleIngest = async () => {
    setIngesting(true);
    setProgress(10);
    try {
      const newArticles = await generateMockArticles();
      setProgress(60);
      db.saveArticles(newArticles);
      setArticles(newArticles);
      setProgress(100);
    } catch (err) {
      alert("Ingestion failed. Ensure API key is valid.");
    } finally {
      setTimeout(() => {
        setIngesting(false);
        setProgress(0);
      }, 500);
    }
  };

  const clearArticles = () => {
    db.saveArticles([]);
    setArticles([]);
  };

  return (
    <div className="flex-1 overflow-y-auto p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-zinc-100">Content Ingestion</h2>
          <p className="text-zinc-500 mt-1">Populate your vector database with the latest news reports.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={clearArticles}
            className="px-4 py-2 text-sm border border-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
          >
            Clear Library
          </button>
          <button
            onClick={handleIngest}
            disabled={ingesting}
            className={`px-6 py-2 text-sm bg-indigo-600 text-white font-semibold rounded-lg shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center gap-2 ${ingesting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {ingesting ? (
              <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {ingesting ? 'Processing...' : 'Sync New Content'}
          </button>
        </div>
      </div>

      {ingesting && (
        <div className="mb-8">
          <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
            <span>Retrieving RSS Feeds</span>
            <span>{progress}% Complete</span>
          </div>
        </div>
      )}

      {articles.length === 0 ? (
        <div className="bg-zinc-900/50 border-2 border-dashed border-zinc-800 rounded-2xl p-20 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-zinc-800 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-zinc-300">Knowledge Base Empty</h3>
          <p className="text-zinc-500 mt-2 max-w-sm">
            Trigger ingestion to simulate scraping 50+ articles. These will be used as context for the RAG pipeline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <div key={article.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition-colors group">
              <div className="p-5">
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[10px] px-2 py-1 bg-indigo-600/10 text-indigo-400 rounded-full font-bold uppercase tracking-wider">
                    {article.category}
                  </span>
                  <span className="text-[10px] text-zinc-600 font-medium">{new Date(article.publishedAt).toLocaleDateString()}</span>
                </div>
                <h4 className="text-zinc-200 font-bold leading-snug line-clamp-2 mb-2 group-hover:text-white transition-colors">
                  {article.title}
                </h4>
                <p className="text-xs text-zinc-500 line-clamp-3 leading-relaxed mb-4">
                  {article.content}
                </p>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <span className="text-[10px] text-zinc-400 font-semibold">{article.source}</span>
                  <a href={article.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 text-[10px] font-bold uppercase hover:underline">
                    Read More
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IngestionPanel;
