import type { ReactNode } from "react";

import { Link } from "@tanstack/react-router";

import { Footer } from "./footer";

interface LegalLayoutProps {
  title: string;
  lastUpdated: string;
  children: ReactNode;
}

function LegalLayout({ title, lastUpdated, children }: LegalLayoutProps) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400&display=swap');
        
        .dark-page {
          --dark-bg: #0c0a09;
          --dark-card: #1c1917;
          --dark-text: #fafaf9;
          --dark-rose: oklch(0.70 0.18 350);
          --dark-muted: #a8a29e;
          --dark-line: rgba(255, 255, 255, 0.08);
        }
        
        .legal-prose h2 {
          font-family: 'Crimson Pro', serif;
          font-weight: 600;
          font-size: 1.5rem;
          color: var(--dark-text);
          margin-top: 2.5rem;
          margin-bottom: 1rem;
        }
        
        .legal-prose h3 {
          font-family: 'Crimson Pro', serif;
          font-weight: 600;
          font-size: 1.25rem;
          color: var(--dark-text);
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        
        .legal-prose p {
          font-family: 'Crimson Pro', serif;
          font-size: 1.125rem;
          line-height: 1.75;
          color: var(--dark-muted);
          margin-bottom: 1rem;
        }
        
        .legal-prose ul {
          font-family: 'Crimson Pro', serif;
          font-size: 1.125rem;
          line-height: 1.75;
          color: var(--dark-muted);
          margin-bottom: 1rem;
          padding-left: 1.5rem;
          list-style-type: disc;
        }
        
        .legal-prose li {
          margin-bottom: 0.5rem;
        }
        
        .legal-prose a {
          color: var(--dark-rose);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .legal-prose a:hover {
          opacity: 0.8;
        }
      `}</style>

      <div
        className="dark-page min-h-screen w-full relative"
        style={{ background: "var(--dark-bg)" }}
      >
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(var(--dark-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--dark-line) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
          }}
        />

        {/* Header */}
        <header className="relative z-50 px-6 md:px-10 py-6">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Link
              to="/"
              className="flex items-center gap-2 transition-opacity hover:opacity-60"
              style={{ color: "var(--dark-text)" }}
            >
              <svg
                className="w-6 h-6"
                style={{ color: "var(--dark-rose)" }}
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <span
                className="text-xl"
                style={{ fontFamily: "Crimson Pro, serif", fontWeight: 600 }}
              >
                songcal
              </span>
            </Link>

            <a
              href="https://github.com/851-labs/songcal"
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full transition-opacity hover:opacity-60"
              style={{ color: "var(--dark-text)" }}
            >
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
              </svg>
            </a>
          </div>
        </header>

        {/* Content */}
        <main className="relative z-10 px-6 md:px-10 pb-16">
          <div className="max-w-3xl mx-auto">
            <h1
              className="text-4xl md:text-5xl mb-2"
              style={{
                fontFamily: "Crimson Pro, serif",
                fontWeight: 600,
                color: "var(--dark-text)",
              }}
            >
              {title}
            </h1>
            <p
              className="text-sm mb-12"
              style={{ fontFamily: "Crimson Pro, serif", color: "var(--dark-muted)" }}
            >
              Last updated: {lastUpdated}
            </p>

            <div className="legal-prose">{children}</div>
          </div>
        </main>

        <Footer maxWidth="3xl" />
      </div>
    </>
  );
}

export { LegalLayout };
