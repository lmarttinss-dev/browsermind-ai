/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eef2ff",
          100: "#e0e7ff",
          200: "#c7d2fe",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#3730a3",
          900: "#312e81",
          950: "#1e1b4b",
        },
      },
      typography: {
        invert: {
          css: {
            "--tw-prose-body": "#d1d5db",
            "--tw-prose-headings": "#f3f4f6",
            "--tw-prose-lead": "#9ca3af",
            "--tw-prose-links": "#60a5fa",
            "--tw-prose-bold": "#f3f4f6",
            "--tw-prose-counters": "#9ca3af",
            "--tw-prose-bullets": "#6b7280",
            "--tw-prose-hr": "#374151",
            "--tw-prose-quotes": "#d1d5db",
            "--tw-prose-quote-borders": "#3b82f6",
            "--tw-prose-captions": "#9ca3af",
            "--tw-prose-code": "#34d399",
            "--tw-prose-pre-code": "#d1d5db",
            "--tw-prose-pre-bg": "#111827",
            "--tw-prose-th-borders": "#374151",
            "--tw-prose-td-borders": "#374151",
            "h1, h2, h3, h4": {
              borderBottom: "1px solid #374151",
              paddingBottom: "0.5rem",
              marginBottom: "1rem",
            },
            h2: {
              fontSize: "1.2rem",
              marginTop: "2.5rem",
            },
            h3: {
              fontSize: "1.05rem",
              marginTop: "2rem",
            },
            h1: { fontSize: "1.375rem" },
            a: {
              textDecoration: "none",
              "&:hover": { textDecoration: "underline" },
            },
            code: {
              backgroundColor: "#1f2937",
              padding: "0.15rem 0.4rem",
              borderRadius: "0.25rem",
              fontSize: "0.85em",
              fontWeight: "400",
            },
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            pre: {
              backgroundColor: "#111827",
              border: "1px solid #374151",
              borderRadius: "0.5rem",
            },
            blockquote: {
              backgroundColor: "rgba(30, 58, 138, 0.15)",
              borderLeftColor: "#3b82f6",
              borderRadius: "0 0.5rem 0.5rem 0",
              padding: "0.75rem 1rem",
              fontStyle: "normal",
            },
            table: {
              width: "100%",
              borderCollapse: "collapse",
            },
            thead: {
              backgroundColor: "#111827",
            },
            "th, td": {
              border: "1px solid #374151",
              padding: "0.5rem 0.75rem",
            },
            th: {
              textAlign: "left",
              fontWeight: "600",
              color: "#e5e7eb",
            },
            td: {
              color: "#d1d5db",
            },
            hr: {
              borderColor: "#374151",
              marginTop: "1.5rem",
              marginBottom: "1.5rem",
            },
            "ul > li::marker": {
              color: "#6b7280",
            },
            "ol > li::marker": {
              color: "#9ca3af",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
