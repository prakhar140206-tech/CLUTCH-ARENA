/**
 * Resolves static assets correctly relative to base path
 * Fixes broken image paths on GitHub Pages (/CLUTCH-ARENA/) and custom domains
 */
export const CLUTCH_LOGO = `${import.meta.env.BASE_URL}logo.png`;
export const CLUTCH_FAVICON = `${import.meta.env.BASE_URL}favicon.png`;
