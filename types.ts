
export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  url: string;
  publishedAt: string;
  source: string;
  category: string;
}

export interface VectorEntry {
  id: string;
  articleId: string;
  embedding: number[];
  text: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface SessionData {
  id: string;
  history: ChatMessage[];
  lastUsed: number;
}

export interface InteractionLog {
  timestamp: string;
  sessionId: string;
  userQuery: string;
  llmResponse: string;
  responseTimeMs: number;
  tokens?: number;
}

export enum AppRoute {
  CHAT = 'chat',
  INGEST = 'ingest',
  ANALYTICS = 'analytics'
}
