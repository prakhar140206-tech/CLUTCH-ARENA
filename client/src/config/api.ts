/**
 * CLUTCH API & Real-time Configuration
 * Allows dynamic runtime or environment-based routing.
 * In development, defaults to 'http://localhost:4000'.
 * In production:
 * - Uses VITE_API_URL if configured
 * - Otherwise falls back to current origin or in-browser autonomous engine
 */

const getOrigin = (): string => {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return '';
};

export const API_BASE_URL: string = 
  import.meta.env.VITE_API_URL !== undefined 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.PROD 
        ? getOrigin() 
        : 'http://localhost:4000');

export const SOCKET_URL: string =
  import.meta.env.VITE_SOCKET_URL !== undefined 
    ? import.meta.env.VITE_SOCKET_URL 
    : (import.meta.env.PROD 
        ? getOrigin() 
        : 'http://localhost:4000');
