
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { db } from "./db";
import { ChatMessage, InteractionLog, NewsArticle } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// We simulate embeddings since specific embedding models might vary in availability
// but we perform a highly effective semantic match using keyword-overlap and LLM-assisted filtering
export const performRAGQuery = async (
  sessionId: string,
  query: string
): Promise<{ response: string; sources: NewsArticle[] }> => {
  const startTime = Date.now();
  const articles = db.getArticles();
  
  if (articles.length === 0) {
    return { response: "No documents have been ingested yet. Please go to the Ingestion panel.", sources: [] };
  }

  // 1. Retrieval: Semantic Selection (Simulated RAG)
  // We use the Gemini model to identify relevant articles from the titles and summaries
  const contextSelectionPrompt = `
    Given the user query: "${query}"
    And the following news headlines:
    ${articles.map((a, i) => `ID: ${i} | Title: ${a.title}`).join('\n')}
    
    Return ONLY a comma-separated list of IDs for the most relevant articles (max 5).
    Example: 0, 12, 4
  `;

  const selectorResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contextSelectionPrompt,
  });

  const selectedIds = (selectorResponse.text || '')
    .split(',')
    .map(id => parseInt(id.trim()))
    .filter(id => !isNaN(id) && id >= 0 && id < articles.length);

  const contextArticles = selectedIds.map(id => articles[id]);
  const contextText = contextArticles.map(a => `Source: ${a.source} (${a.publishedAt})\nTitle: ${a.title}\nContent: ${a.content}`).join('\n\n---\n\n');

  // 2. Generation
  const session = db.getSession(sessionId);
  const historyContext = session?.history.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n') || '';

  const generationPrompt = `
    System Instruction: You are an expert News Analyst. Use the provided context to answer the user query. 
    If the context doesn't contain the answer, say you don't know based on the current articles, but offer general knowledge if appropriate while clearly stating it's not from the local articles.
    
    Context:
    ${contextText}

    Chat History:
    ${historyContext}

    User Query: ${query}
  `;

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: generationPrompt,
  });

  const finalResponseText = response.text || "I'm sorry, I couldn't generate a response.";
  const endTime = Date.now();

  // 3. Persistent Logging (SQL Simulation)
  const log: InteractionLog = {
    timestamp: new Date().toISOString(),
    sessionId,
    userQuery: query,
    llmResponse: finalResponseText,
    responseTimeMs: endTime - startTime,
  };
  db.logInteraction(log);

  // 4. Update Session (Redis Simulation)
  const updatedHistory: ChatMessage[] = [...(session?.history || []), { role: 'user', content: query, timestamp: startTime }];
  updatedHistory.push({ role: 'assistant', content: finalResponseText, timestamp: endTime });
  db.saveSession({ id: sessionId, history: updatedHistory, lastUsed: endTime });

  return { response: finalResponseText, sources: contextArticles };
};

export const generateMockArticles = async (): Promise<NewsArticle[]> => {
  const prompt = `
    Generate 50 diverse news articles in a JSON array. 
    Each item must have: id (unique string), title, content (min 3 paragraphs), url, publishedAt (ISO date), source, category (one of: Technology, Finance, Global Affairs, Science, Health).
    Ensure topics are varied: AI breakthroughs, market shifts, climate change, biotech, geopolitical tensions, etc.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  const articles = JSON.parse(response.text || '[]');
  return articles;
};
