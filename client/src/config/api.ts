/**
 * CLUTCH API & Real-time Configuration
 * Allows dynamic runtime or environment-based routing.
 * In development, defaults to 'http://localhost:4000'.
 * In production builds (e.g. Docker + Nginx reverse proxy), uses relative URL '' or VITE_API_URL.
 */

export const API_BASE_URL: string = 
  import.meta.env.VITE_API_URL !== undefined 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.PROD ? '' : 'http://localhost:4000');

export const SOCKET_URL: string =
  import.meta.env.VITE_SOCKET_URL !== undefined 
    ? import.meta.env.VITE_SOCKET_URL 
    : (import.meta.env.PROD ? window.location.origin : 'http://localhost:4000');
