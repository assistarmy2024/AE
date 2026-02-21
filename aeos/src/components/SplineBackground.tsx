/**
 * SplineBackground — Full-screen 3D OS background using Spline viewer
 *
 * Uses @splinetool/viewer (web component) for the background layer.
 * The react-spline package is used for interactive avatar scenes.
 *
 * Spline docs: https://docs.spline.design/
 * Web component usage: import "@splinetool/viewer" then use <spline-viewer>
 */

import { useEffect } from "react";

// Augment JSX to support the Spline web component element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "spline-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          url?: string;
          "loading-anim-type"?: "spinner-small-dark" | "spinner-small-light" | "none";
          "events-target"?: "global" | "local";
        },
        HTMLElement
      >;
    }
  }
}

// Scene URL for the desktop background
// Replace with your own scene exported from app.spline.design
const BG_SCENE = "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode";

export function SplineBackground() {
  // Dynamically load the @splinetool/viewer web component
  useEffect(() => {
    import("@splinetool/viewer").catch(() => {
      // viewer not available — fallback to CSS-only background
    });
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Spline 3D background via web component */}
      <spline-viewer
        url={BG_SCENE}
        loading-anim-type="none"
        events-target="local"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0.3,
        }}
      />

      {/* Gradient overlay to blend the 3D scene into the OS aesthetic */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 20%, rgba(0,212,255,0.05), transparent),
            radial-gradient(ellipse 60% 80% at 80% 80%, rgba(123,47,255,0.06), transparent),
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(7,7,15,0.8))
          `,
        }}
      />
    </div>
  );
}
