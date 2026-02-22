import { motion } from "framer-motion";
import { Cpu, Wifi, WifiOff, Battery, Bell, Settings, ChevronDown, Loader, Monitor } from "lucide-react";
import { useAEOSStore, type Runtime } from "@/store/useAEOSStore";
import { useState, useEffect } from "react";
import clsx from "clsx";

const RUNTIMES: { id: Runtime; label: string; color: string }[] = [
  { id: "openclaw", label: "OpenClaw", color: "#00d4ff" },
  { id: "zeroclaw", label: "ZeroClaw", color: "#00ff88" },
  { id: "picoclaw", label: "PicoClaw", color: "#ffb347" },
];

function RuntimePicker() {
  const { activeRuntime, runtimeStatus, setActiveRuntime } = useAEOSStore();
  const [open, setOpen] = useState(false);
  const active = RUNTIMES.find((r) => r.id === activeRuntime)!;

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl neo text-xs font-medium transition-all hover:bg-white/5"
      >
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: active.color, boxShadow: `0 0 6px ${active.color}`, animation: runtimeStatus[activeRuntime] === "online" ? "breathe 2s infinite" : "none" }}
        />
        <span className="text-soft">{active.label}</span>
        <ChevronDown size={11} className={clsx("text-muted transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full mt-2 right-0 w-44 glass-2 rounded-xl overflow-hidden z-50"
          onClick={(e) => e.stopPropagation()}
        >
          {RUNTIMES.map((r) => {
            const status = runtimeStatus[r.id];
            return (
              <button
                key={r.id}
                onClick={() => { setActiveRuntime(r.id); setOpen(false); }}
                className={clsx("w-full flex items-center gap-2 px-3 py-2.5 text-xs transition-all", r.id === activeRuntime ? "bg-white/5" : "hover:bg-white/3")}
              >
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: status === "online" ? r.color : status === "busy" ? "#ffb347" : "rgba(255,255,255,0.2)", boxShadow: status === "online" ? `0 0 6px ${r.color}` : "none" }}
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

function GatewayStatus() {
  const { gatewayConnected, gatewayConnecting, setActivePanel, setSidePanelOpen } = useAEOSStore();

  const openSettings = () => {
    setSidePanelOpen(true);
    setActivePanel("settings");
  };

  if (gatewayConnecting) {
    return (
      <button onClick={openSettings} className="flex items-center gap-1.5 text-xs text-cyan/70 hover:text-cyan transition-colors">
        <Loader size={12} className="animate-spin" />
        <span className="hidden sm:block font-mono">Connecting</span>
      </button>
    );
  }

  if (gatewayConnected) {
    return (
      <button onClick={openSettings} className="flex items-center gap-1.5 text-xs text-green-400/70 hover:text-green-400 transition-colors">
        <Wifi size={12} />
        <span className="hidden sm:block font-mono">Gateway</span>
      </button>
    );
  }

  return (
    <button onClick={openSettings} className="flex items-center gap-1.5 text-xs text-muted hover:text-amber-400 transition-colors">
      <WifiOff size={12} />
      <span className="hidden sm:block font-mono">Offline</span>
    </button>
  );
}

type NavTab = "Assistant" | "CUA" | "Files" | "Browser";

export function TopBar() {
  const [clock, setClock] = useState(() => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  const [activeNav, setActiveNav] = useState<NavTab>("Assistant");
  const { setActivePanel, setSidePanelOpen } = useAEOSStore();

  // Live clock
  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    const id = setInterval(tick, 10000);
    return () => clearInterval(id);
  }, []);

  const handleNav = (item: NavTab) => {
    setActiveNav(item);
    if (item === "CUA") {
      setSidePanelOpen(true);
      setActivePanel("cua");
    }
  };

  const NAV: NavTab[] = ["Assistant", "CUA", "Files", "Browser"];

  return (
    <div
      className="flex items-center gap-4 px-5 py-2 border-b border-white/5"
      style={{ background: "rgba(7,7,15,0.8)", backdropFilter: "blur(20px)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: "linear-gradient(135deg, #00d4ff, #7b2fff)", boxShadow: "0 0 12px rgba(0,212,255,0.3)" }}
        >
          ✦
        </div>
        <span className="text-sm font-bold text-gradient-cyan">AEOS</span>
      </div>

      {/* Nav pills */}
      <div className="flex gap-1">
        {NAV.map((item) => (
          <button
            key={item}
            onClick={() => handleNav(item)}
            className={clsx(
              "flex items-center gap-1 px-3 py-1 rounded-lg text-xs transition-all",
              activeNav === item ? "text-white bg-white/8 font-medium" : "text-muted hover:text-white"
            )}
          >
            {item === "CUA" && <Monitor size={10} />}
            {item}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {/* Gateway status */}
      <GatewayStatus />

      {/* Runtime picker */}
      <RuntimePicker />

      {/* System indicators */}
      <div className="flex items-center gap-3 text-muted">
        <div className="flex items-center gap-1 text-xs">
          <Cpu size={12} />
          <span className="font-mono hidden md:block">CPU</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <Battery size={12} />
        </div>
        <Bell size={13} className="hover:text-white cursor-pointer transition-colors" />
        <button
          onClick={() => { setSidePanelOpen(true); setActivePanel("settings"); }}
          className="hover:text-white cursor-pointer transition-colors"
        >
          <Settings size={13} />
        </button>
      </div>

      {/* Live clock */}
      <div className="text-xs font-mono text-muted flex-shrink-0">
        {clock}
      </div>
    </div>
  );
}
