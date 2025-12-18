
import { NewsArticle, SessionData, InteractionLog, VectorEntry } from '../types';
import { STORAGE_KEYS } from '../constants';

class DatabaseService {
  private get<T>(key: string): T[] {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  private set<T>(key: string, data: T[]): void {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // Articles (The "Document Store")
  saveArticles(articles: NewsArticle[]) {
    this.set(STORAGE_KEYS.ARTICLES, articles);
  }

  getArticles(): NewsArticle[] {
    return this.get(STORAGE_KEYS.ARTICLES);
  }

  // Vectors (The "Vector DB")
  saveVectors(vectors: VectorEntry[]) {
    this.set(STORAGE_KEYS.VECTORS, vectors);
  }

  getVectors(): VectorEntry[] {
    return this.get(STORAGE_KEYS.VECTORS);
  }

  // Sessions (The "Redis Caching" layer)
  getSession(sessionId: string): SessionData | undefined {
    const sessions = this.get<SessionData>(STORAGE_KEYS.SESSIONS);
    return sessions.find(s => s.id === sessionId);
  }

  saveSession(session: SessionData) {
    const sessions = this.get<SessionData>(STORAGE_KEYS.SESSIONS);
    const index = sessions.findIndex(s => s.id === session.id);
    if (index >= 0) {
      sessions[index] = session;
    } else {
      sessions.push(session);
    }
    this.set(STORAGE_KEYS.SESSIONS, sessions);
  }

  clearSession(sessionId: string) {
    const sessions = this.get<SessionData>(STORAGE_KEYS.SESSIONS);
    this.set(STORAGE_KEYS.SESSIONS, sessions.filter(s => s.id !== sessionId));
  }

  // Logs (The "SQL Analytics" layer)
  logInteraction(log: InteractionLog) {
    const logs = this.get<InteractionLog>(STORAGE_KEYS.LOGS);
    logs.push(log);
    this.set(STORAGE_KEYS.LOGS, logs);
  }

  getLogs(): InteractionLog[] {
    return this.get(STORAGE_KEYS.LOGS);
  }
}

export const db = new DatabaseService();
