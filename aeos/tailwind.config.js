/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // AEOS design tokens
        void:    "#07070f",
        surface: "#0d0d1a",
        glass:   "rgba(255,255,255,0.04)",
        border:  "rgba(255,255,255,0.08)",
        // Accent gradients
        cyan:  "#00d4ff",
        violet:"#7b2fff",
        rose:  "#ff2d6b",
        // Text
        muted: "rgba(255,255,255,0.4)",
        soft:  "rgba(255,255,255,0.7)",
      },
      fontFamily: {
        sans: ["Inter var", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      backdropBlur: {
        xs: "4px",
        glass: "24px",
        heavy: "40px",
      },
      boxShadow: {
        glass:
          "0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.08)",
        "glass-lg":
          "0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
        neo:  "8px 8px 16px rgba(0,0,0,0.5), -4px -4px 12px rgba(255,255,255,0.03)",
        "neo-inset":
          "inset 4px 4px 8px rgba(0,0,0,0.5), inset -2px -2px 6px rgba(255,255,255,0.03)",
        glow:    "0 0 24px rgba(0,212,255,0.3)",
        "glow-v":"0 0 24px rgba(123,47,255,0.4)",
        "glow-r":"0 0 24px rgba(255,45,107,0.3)",
      },
      animation: {
        "float":      "float 6s ease-in-out infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "scan":       "scan 3s linear infinite",
        "fade-up":    "fadeUp 0.4s ease forwards",
        "slide-in":   "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
        "ripple":     "ripple 1s ease-out forwards",
        "typing":     "typing 1.4s steps(3) infinite",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0px) rotate(0deg)" },
          "33%":     { transform: "translateY(-12px) rotate(1deg)" },
          "66%":     { transform: "translateY(-6px) rotate(-1deg)" },
        },
        pulseGlow: {
          "0%,100%": { opacity: "0.6", filter: "blur(12px)" },
          "50%":     { opacity: "1",   filter: "blur(6px)" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { opacity: "0", transform: "translateX(20px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        ripple: {
          "0%":   { transform: "scale(0)", opacity: "1" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        typing: {
          "0%,100%": { content: "'●'" },
          "33%":     { content: "'● ●'" },
          "66%":     { content: "'● ● ●'" },
        },
      },
    },
  },
  plugins: [],
};
