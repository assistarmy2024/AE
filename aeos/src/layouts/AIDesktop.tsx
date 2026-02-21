import { motion } from "framer-motion";
import { TopBar } from "@/components/TopBar";
import { ChatWindow } from "@/components/ChatWindow";
import { SidePanel } from "@/components/SidePanel";
import { SydAvatar } from "@/components/SydAvatar";
import { SplineBackground } from "@/components/SplineBackground";
import { useAEOSStore } from "@/store/useAEOSStore";
import { ChevronRight } from "lucide-react";

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Subtle dot grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      {/* Atmospheric glow blobs */}
      <div
        className="absolute -top-32 -left-32 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(0,212,255,0.06), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full"
        style={{
          background: "radial-gradient(ellipse, rgba(123,47,255,0.04), transparent 70%)",
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full"
        style={{
          background: "radial-gradient(circle, rgba(255,45,107,0.04), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      {/* Scan line (very subtle) */}
      <div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(to right, transparent, rgba(0,212,255,0.06), transparent)",
          animation: "scan 8s linear infinite",
        }}
      />
    </div>
  );
}

export function AIDesktop() {
  const { sidePanelOpen, setSidePanelOpen } = useAEOSStore();

  return (
    <div className="relative w-screen h-screen flex flex-col overflow-hidden" style={{ background: "var(--void)" }}>
      {/* Spline 3D background */}
      <SplineBackground />
      {/* CSS fallback grid */}
      <BackgroundGrid />

      {/* Top bar */}
      <div className="relative z-10 flex-shrink-0">
        <TopBar />
      </div>

      {/* Main workspace */}
      <div className="relative z-10 flex flex-1 overflow-hidden">
        {/* Chat area */}
        <motion.div
          className="flex-1 flex flex-col overflow-hidden"
          animate={{ marginRight: 0 }}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div
                className="w-5 h-5 rounded-md flex items-center justify-center text-xs"
                style={{ background: "linear-gradient(135deg, #00d4ff, #7b2fff)", boxShadow: "0 0 10px rgba(0,212,255,0.25)" }}
              >
                ✦
              </div>
              <span className="text-sm font-semibold">Syd</span>
              <span className="text-xs text-muted">— your AI assistant</span>
            </div>

            {!sidePanelOpen && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSidePanelOpen(true)}
                className="flex items-center gap-1 text-xs text-muted hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
              >
                <ChevronRight size={12} />
                Panel
              </motion.button>
            )}
          </div>

          {/* Chat */}
          <div className="flex-1 overflow-hidden">
            <ChatWindow />
          </div>
        </motion.div>

        {/* Side panel */}
        <SidePanel />
      </div>

      {/* Syd floating avatar */}
      <SydAvatar />
    </div>
  );
}
