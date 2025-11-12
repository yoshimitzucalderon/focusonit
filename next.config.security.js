/**
 * Production-Ready Security Headers Configuration
 *
 * This configuration adds critical security headers to protect against:
 * - XSS (Cross-Site Scripting)
 * - Clickjacking
 * - MIME sniffing
 * - Referrer leakage
 * - Man-in-the-Middle attacks
 *
 * To use: Merge these headers into your next.config.js
 */

const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    instrumentationHook: true,
  },
  output: 'standalone',

  // 🔒 SECURITY HEADERS
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/:path*',
        headers: [
          // Prevent clickjacking attacks
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // Control referrer information
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Force HTTPS for 1 year (31536000 seconds)
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          // Restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Content Security Policy (CSP)
          {
            key: 'Content-Security-Policy',
            value: [
              // Default: Only load resources from same origin
              "default-src 'self'",

              // Scripts: Allow self, inline scripts (for Next.js), and Vercel Live
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://va.vercel-scripts.com",

              // Styles: Allow self and inline styles (for Tailwind CSS)
              "style-src 'self' 'unsafe-inline'",

              // Images: Allow self, data URIs, and any HTTPS source
              "img-src 'self' data: https: blob:",

              // Fonts: Allow self only
              "font-src 'self' data:",

              // AJAX/WebSocket: Allow Supabase and Google APIs
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://www.googleapis.com https://oauth2.googleapis.com https://vercel.live https://va.vercel-scripts.com",

              // Frames: Disallow all iframes
              "frame-ancestors 'none'",

              // Forms: Only submit to same origin
              "form-action 'self'",

              // Base URI: Restrict to same origin
              "base-uri 'self'",

              // Block mixed content (HTTP resources on HTTPS page)
              "upgrade-insecure-requests",
            ].join('; '),
          },
        ],
      },
    ];
  },

  // Hide X-Powered-By header (don't expose Next.js)
  poweredByHeader: false,

  // Enable React strict mode for better error detection
  reactStrictMode: true,

  // Configure image domains (if using next/image with external sources)
  images: {
    domains: [],
    remotePatterns: [],
  },
};

// Sentry configuration
const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: process.env.NODE_ENV !== 'production',
  disableClientWebpackPlugin: process.env.NODE_ENV !== 'production',
  hideSourceMaps: true,
  disableLogger: true,
};

module.exports = process.env.NODE_ENV === 'production' || process.env.SENTRY_ENABLED === 'true'
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
