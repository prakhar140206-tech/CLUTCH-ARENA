/**
 * CLUTCH API & Real-time Configuration
 * Allows dynamic runtime or environment-based routing.
 * In development, defaults to 'http://localhost:4000'.
 * In production builds:
 * - When loaded on GitHub Pages (github.io), connects to the active live backend tunnel
 * - When hosted in standard Docker + Nginx reverse proxy, uses relative '' and window.location.origin
 */

const CLOUDFLARE_BACKEND_TUNNEL = 'https://pleasant-collaborative-logan-signatures.trycloudflare.com';

const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');

export const API_BASE_URL: string = 
  import.meta.env.VITE_API_URL !== undefined 
    ? import.meta.env.VITE_API_URL 
    : (import.meta.env.PROD 
        ? (isGitHubPages ? CLOUDFLARE_BACKEND_TUNNEL : '') 
        : 'http://localhost:4000');

export const SOCKET_URL: string =
  import.meta.env.VITE_SOCKET_URL !== undefined 
    ? import.meta.env.VITE_SOCKET_URL 
    : (import.meta.env.PROD 
        ? (isGitHubPages ? CLOUDFLARE_BACKEND_TUNNEL : window.location.origin) 
        : 'http://localhost:4000');
