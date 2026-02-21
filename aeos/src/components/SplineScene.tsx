/**
 * SplineScene — AEOS Spline 3D integration
 *
 * Uses the official @splinetool/react-spline package.
 * Docs: https://docs.spline.design/
 *
 * To use your own scene:
 *   1. Build your scene at app.spline.design
 *   2. Export → "Spline Viewer" → copy the scene URL
 *   3. Replace the SCENE_URLS below with your own URLs
 *
 * Package install (already in package.json):
 *   npm install @splinetool/react-spline @splinetool/runtime
 *
 * The @splinetool/runtime package is a peer dependency of react-spline
 * and provides the Application class for programmatic control.
 */

import { Suspense, useRef, useCallback } from "react";
import Spline from "@splinetool/react-spline";
import type { Application } from "@splinetool/runtime";

// ─── Scene URLs ────────────────────────────────────────────────────────────
// Replace these with your own exported Spline scenes.
// Community scenes: https://app.spline.design/community
export const SCENES = {
  // Syd avatar — glassy orb with orbit rings
  sydAvatar:
    "https://prod.spline.design/kZBIBiHFiMwOrBbR/scene.splinecode",
  // Desktop background — abstract 3D particles / glass shards
  desktopBg:
    "https://prod.spline.design/6Wq1Q7YGyM-iab9i/scene.splinecode",
  // Login screen — morphing blob
  loginBlob:
    "https://prod.spline.design/Br2ec3WwqtVdynamic/scene.splinecode",
} as const;

// ─── Types ─────────────────────────────────────────────────────────────────

interface SplineSceneProps {
  scene: string;
  className?: string;
  style?: React.CSSProperties;
  /** Called when the Spline Application is ready — gives you programmatic control */
  onLoad?: (spline: Application) => void;
  /** Emit a Spline event (e.g. trigger animations) */
  onSplineMouseDown?: (e: CustomEvent) => void;
}

// ─── Loading skeleton ──────────────────────────────────────────────────────

function SplineSkeleton() {
  return (
    <div className="w-full h-full flex items-center justify-center animate-pulse">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-full"
          style={{
            background: "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.3), rgba(123,47,255,0.2))",
            animation: "breathe 2s ease-in-out infinite",
          }}
        />
        <div className="text-[10px] text-muted font-mono">Loading 3D scene…</div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export function SplineScene({
  scene,
  className = "",
  style,
  onLoad,
  onSplineMouseDown,
}: SplineSceneProps) {
  const splineRef = useRef<Application | null>(null);

  const handleLoad = useCallback(
    (spline: Application) => {
      splineRef.current = spline;

      // Example: find and animate objects by name from your Spline scene
      // const orb = spline.findObjectByName("Orb");
      // if (orb) orb.position.y = 10;

      // Example: listen to Spline events
      // spline.addEventListener("mouseDown", (e) => {
      //   if (e.target.name === "Button") { ... }
      // });

      onLoad?.(spline);
    },
    [onLoad]
  );

  return (
    <Suspense fallback={<SplineSkeleton />}>
      <Spline
        scene={scene}
        className={className}
        style={{ width: "100%", height: "100%", ...style }}
        onLoad={handleLoad}
        onSplineMouseDown={onSplineMouseDown}
      />
    </Suspense>
  );
}

// ─── Syd Avatar Spline ─────────────────────────────────────────────────────

interface SydSplineProps {
  onLoad?: (spline: Application) => void;
  isSpeaking?: boolean;
}

export function SydSpline({ onLoad, isSpeaking }: SydSplineProps) {
  const handleLoad = useCallback(
    (spline: Application) => {
      // Trigger the "idle" animation on load
      // spline.emitEvent("start", "Syd");
      onLoad?.(spline);
    },
    [onLoad]
  );

  return (
    <SplineScene
      scene={SCENES.sydAvatar}
      onLoad={handleLoad}
      style={{
        filter: isSpeaking ? "brightness(1.2) saturate(1.3)" : "brightness(1)",
        transition: "filter 0.3s",
      }}
    />
  );
}

// ─── Desktop background Spline ─────────────────────────────────────────────

export function DesktopBgSpline() {
  return (
    <SplineScene
      scene={SCENES.desktopBg}
      style={{ opacity: 0.35, pointerEvents: "none" }}
    />
  );
}

// ─── Programmatic control helpers ──────────────────────────────────────────

/**
 * Trigger a named event on a Spline object.
 * Call this from parent components after getting the Application ref via onLoad.
 *
 * Example:
 *   triggerSplineEvent(splineApp, "mouseDown", "Button");
 */
export function triggerSplineEvent(
  spline: Application,
  eventName: string,
  objectName: string
) {
  spline.emitEvent(eventName, objectName);
}

/**
 * Set a Spline variable (for reactive scenes).
 * Variables are defined in your Spline scene under "Variables" panel.
 *
 * Example:
 *   setSplineVariable(splineApp, "isSpeaking", true);
 */
export function setSplineVariable(
  spline: Application,
  name: string,
  value: unknown
) {
  spline.setVariable(name, value);
}
