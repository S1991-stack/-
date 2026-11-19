import { PlayerError } from '../types/audio';

type ErrorListener = (err: PlayerError) => void;

class ErrorHandlerService {
  private listeners = new Set<ErrorListener>();

  subscribe(listener: ErrorListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  report(message: string, error?: unknown): PlayerError {
    const detail =
      error instanceof Error
        ? error.message
        : typeof error === 'string'
        ? error
        : undefined;

    const payload: PlayerError = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      message,
      detail,
      timestamp: Date.now(),
    };

    console.warn('[SALAH Neon Player]', message, detail ?? '');
    this.listeners.forEach((fn) => fn(payload));
    return payload;
  }
}

export const errorHandler = new ErrorHandlerService();
