import { motion, AnimatePresence } from "framer-motion";
import { useAEOSStore } from "@/store/useAEOSStore";
import { Mic, MicOff, Video, VideoOff, Minimize2 } from "lucide-react";
import { SydSpline } from "./SplineScene";

export function SydAvatar() {
  const { sydExpanded, setSydExpanded, voiceActive, videoActive, setVoiceActive, setVideoActive, isThinking } =
    useAEOSStore();

  const speaking = voiceActive || isThinking;

  return (
    <>
      {/* Collapsed bubble */}
      <AnimatePresence>
        {!sydExpanded && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setSydExpanded(true)}
            className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full cursor-pointer"
            style={{
              background: "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.7), rgba(123,47,255,0.8))",
              boxShadow: `0 0 32px rgba(0,212,255,0.4), 0 0 64px rgba(123,47,255,0.2), 0 8px 24px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Glow pulse */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 35% 35%, rgba(0,212,255,0.3), transparent)",
                animation: speaking ? "breathe 1s ease-in-out infinite" : "breathe 3s ease-in-out infinite",
              }}
            />
            <div className="relative flex items-center justify-center h-full text-xl">✦</div>
            {/* Online indicator */}
            <div className="absolute top-0.5 right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-void"
              style={{ boxShadow: "0 0 6px #00ff88" }} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded panel */}
      <AnimatePresence>
        {sydExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20, x: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 20, x: 20 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl overflow-hidden glass-2"
            style={{ border: "1px solid rgba(0,212,255,0.25)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="status-dot online" />
                <span className="text-sm font-semibold text-white">Syd</span>
                {isThinking && (
                  <span className="text-xs text-cyan/70 font-mono">thinking…</span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setVoiceActive(!voiceActive)}
                  className={`p-1.5 rounded-lg transition-all ${voiceActive ? "text-cyan" : "text-muted hover:text-white"}`}
                  style={voiceActive ? { background: "rgba(0,212,255,0.15)" } : {}}
                >
                  {voiceActive ? <Mic size={14} /> : <MicOff size={14} />}
                </button>
                <button
                  onClick={() => setVideoActive(!videoActive)}
                  className={`p-1.5 rounded-lg transition-all ${videoActive ? "text-violet" : "text-muted hover:text-white"}`}
                  style={videoActive ? { background: "rgba(123,47,255,0.15)" } : {}}
                >
                  {videoActive ? <Video size={14} /> : <VideoOff size={14} />}
                </button>
                <button
                  onClick={() => setSydExpanded(false)}
                  className="p-1.5 rounded-lg text-muted hover:text-white transition-all"
                >
                  <Minimize2 size={14} />
                </button>
              </div>
            </div>

            {/* Avatar — Spline 3D scene */}
            <div className="relative h-48 overflow-hidden" style={{ background: "radial-gradient(circle at center, rgba(123,47,255,0.08), transparent 70%)" }}>
              <SydSpline isSpeaking={speaking} />

              {/* Scan overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: "linear-gradient(to bottom, transparent 40%, rgba(7,7,15,0.6))",
                }}
              />
            </div>

            {/* Status bar */}
            <div className="px-4 py-2.5 flex items-center gap-2">
              <div className="flex-1 neo-inset rounded-lg px-3 py-1.5">
                <p className="text-xs text-muted font-mono">
                  {isThinking ? "Processing request…" : voiceActive ? "Listening…" : "Ready"}
                </p>
              </div>
              {speaking && (
                <div className="flex gap-px items-end h-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-0.5 rounded-full bg-cyan"
                      style={{
                        height: `${6 + Math.sin(i) * 8}px`,
                        animation: `breathe ${0.3 + i * 0.1}s ease-in-out infinite`,
                        opacity: 0.8,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
