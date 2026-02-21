import { motion } from "framer-motion";
import { Cpu, Wifi, Battery, Bell, Settings, ChevronDown } from "lucide-react";
import { useAEOSStore, Runtime } from "@/store/useAEOSStore";
import { useState } from "react";
import clsx from "clsx";

const RUNTIMES: { id: Runtime; label: string; color: string }[] = [
  { id: "openclaw", label: "OpenClaw",  color: "#00d4ff" },
  { id: "zeroclaw", label: "ZeroClaw",  color: "#00ff88" },
  { id: "picoclaw", label: "PicoClaw",  color: "#ffb347" },
];

function RuntimePicker() {
  const { activeRuntime, runtimeStatus, setActiveRuntime } = useAEOSStore();
  const [open, setOpen] = useState(false);
  const active = RUNTIMES.find((r) => r.id === activeRuntime)!;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neo text-xs font-medium transition-all hover:bg-white/5"
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background: active.color,
            boxShadow: `0 0 6px ${active.color}`,
            animation: runtimeStatus[activeRuntime] === "online" ? "breathe 2s infinite" : "none",
          }}
        />
        <span className="text-soft">{active.label}</span>
        <ChevronDown size={11} className={clsx("text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 w-44 glass-2 rounded-xl overflow-hidden z-50"
        >
          {RUNTIMES.map((r) => {
            const status = runtimeStatus[r.id];
            return (
              <button
                key={r.id}
                onClick={() => { setActiveRuntime(r.id); setOpen(false); }}
                className={clsx(
                  "w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all",
                  r.id === activeRuntime ? "bg-white/5" : "hover:bg-white/3"
                )}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{
                    background: status === "online" ? r.color : status === "busy" ? "#ffb347" : "rgba(255,255,255,0.2)",
                    boxShadow: status === "online" ? `0 0 6px ${r.color}` : "none",
                  }}
                />
                <span className="flex-1 text-left text-soft">{r.label}</span>
                <span className={clsx("text-[10px]", status === "online" ? "text-green-400" : status === "busy" ? "text-amber-400" : "text-muted")}>
                  {status}
                </span>
              </button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

export function TopBar() {
  const now = new Date();

  return (
    <div
      className="flex items-center gap-4 px-5 py-2 border-b border-white/5"
      style={{ background: "rgba(7,7,15,0.8)", backdropFilter: "blur(20px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            background: "linear-gradient(135deg, #00d4ff, #7b2fff)",
            boxShadow: "0 0 12px rgba(0,212,255,0.3)",
          }}
        >
          ✦
        </div>
        <span className="text-sm font-bold text-gradient-cyan">AEOS</span>
      </div>

      {/* Nav pills */}
      <div className="flex gap-1">
        {["Assistant", "Terminal", "Files", "Browser"].map((item) => (
          <button
            key={item}
            className={clsx(
              "px-3 py-1 rounded-lg text-xs transition-all",
              item === "Assistant" ? "text-white bg-white/8 font-medium" : "text-muted hover:text-white"
            )}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Runtime picker */}
      <RuntimePicker />

      {/* System indicators */}
      <div className="flex items-center gap-3 text-muted">
        <div className="flex items-center gap-1 text-xs">
          <Cpu size={12} />
          <span className="font-mono">2.1%</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Wifi size={12} className="text-green-400/70" />
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Battery size={12} />
          <span className="font-mono">87%</span>
        </div>
        <Bell size={13} className="hover:text-white cursor-pointer transition-colors" />
        <Settings size={13} className="hover:text-white cursor-pointer transition-colors" />
      </div>

      {/* Clock */}
      <div className="text-xs font-mono text-muted flex-shrink-0">
        {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
      </div>
    </div>
  );
}
