/**
 * Client Configuration
 * Centralized config for PUBLIC client-side values only
 * 
 * ⚠️ WARNING: This file is bundled and exposed to the browser!
 * Never put secrets, API keys, or sensitive data here.
 * 
 * For secrets (like API keys), use Vite's define in vite.config.ts
 * or keep them server-side only.
 */

// Read Vite env variables (available at build/runtime via import.meta.env)
// Fallback to `process.env.*` values injected via `define` in `vite.config.ts`.
const metaEnv = (import.meta as any)?.env || {};
const nodeEnv = (typeof process !== 'undefined' && (process as any).env) ? (process as any).env : {};

export const config = {
  // Server URL (where the backend API is running)
  serverUrl: metaEnv.VITE_SERVER_URL ?? nodeEnv.SERVER_URL ?? undefined,
  
  // WebSocket URL (for PvP connections)
  wsUrl: metaEnv.VITE_WS_URL ?? nodeEnv.WS_URL ?? undefined,
} as const;

export default config;
