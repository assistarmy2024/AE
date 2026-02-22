import { motion, AnimatePresence } from "framer-motion";
import { Activity, Puzzle, Settings2, ChevronLeft, Monitor, Wifi, WifiOff, Loader } from "lucide-react";
import { useAEOSStore } from "@/store/useAEOSStore";
import { ActivityPane } from "./ActivityPane";
import { PluginPanel } from "./PluginPanel";
import { CUAPanel } from "./CUAPanel";
import clsx from "clsx";
import { useState } from "react";

const TABS = [
  { id: "activity" as const, label: "Activity", icon: Activity },
  { id: "cua"      as const, label: "CUA",      icon: Monitor  },
  { id: "plugins"  as const, label: "Plugins",  icon: Puzzle   },
  { id: "settings" as const, label: "Settings", icon: Settings2 },
];

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="w-10 h-5 rounded-full relative flex-shrink-0 transition-all"
      style={{ background: value ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.06)", border: value ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
        style={{ background: value ? "linear-gradient(135deg,#00d4ff,#7b2fff)" : "rgba(255,255,255,0.2)", boxShadow: value ? "0 0 8px rgba(0,212,255,0.5)" : "none", left: value ? "calc(100% - 18px)" : "2px" }}
      />
    </button>
  );
}

function SettingsPane() {
  const {
    autoApprove, setAutoApprove,
    activeRuntime,
    gatewaySettings, updateGatewaySettings,
    gatewayConnected, gatewayConnecting, gatewayError,
    connectGateway, disconnectGateway,
  } = useAEOSStore();

  const [localUrl,   setLocalUrl]   = useState(gatewaySettings.url);
  const [localToken, setLocalToken] = useState(gatewaySettings.token);
  const [localKey,   setLocalKey]   = useState(gatewaySettings.sessionKey);

  const saveAndConnect = () => {
    updateGatewaySettings({ url: localUrl.trim(), token: localToken.trim(), sessionKey: localKey.trim() || "main" });
    connectGateway();
  };

  return (
    <div className="px-4 py-4 space-y-5 overflow-y-auto h-full">
      {/* Gateway connection */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-medium mb-3">Gateway Connection</p>

        {/* Status banner */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs"
          style={gatewayConnected
            ? { background: "rgba(0,255,136,0.08)", border: "1px solid rgba(0,255,136,0.2)", color: "#00ff88" }
            : gatewayConnecting
              ? { background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.15)", color: "#00d4ff" }
              : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }
          }
        >
          {gatewayConnected ? <Wifi size={12} /> : gatewayConnecting ? <Loader size={12} className="animate-spin" /> : <WifiOff size={12} />}
          <span>{gatewayConnected ? "Connected" : gatewayConnecting ? "Connecting…" : "Disconnected"}</span>
          {gatewayError && <span className="text-rose-400 truncate ml-1">{gatewayError}</span>}
        </div>

        {/* URL */}
        <div className="space-y-2">
          <label className="text-[10px] text-muted block">Gateway URL</label>
          <input
            value={localUrl}
            onChange={(e) => setLocalUrl(e.target.value)}
            placeholder="ws://localhost:18789"
            className="w-full neo-inset rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-muted outline-none"
          />
        </div>

        {/* Token */}
        <div className="space-y-2 mt-2">
          <label className="text-[10px] text-muted block">Auth Token (optional)</label>
          <input
            type="password"
            value={localToken}
            onChange={(e) => setLocalToken(e.target.value)}
            placeholder="OPENCLAW_GATEWAY_TOKEN"
            className="w-full neo-inset rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-muted outline-none"
          />
        </div>

        {/* Session key */}
        <div className="space-y-2 mt-2">
          <label className="text-[10px] text-muted block">Session Key</label>
          <input
            value={localKey}
            onChange={(e) => setLocalKey(e.target.value)}
            placeholder="main"
            className="w-full neo-inset rounded-xl px-3 py-2 text-xs font-mono text-white placeholder:text-muted outline-none"
          />
        </div>

        {/* Connect / Disconnect */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={saveAndConnect}
            disabled={gatewayConnecting}
            className="flex-1 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ background: "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(123,47,255,0.25))", border: "1px solid rgba(0,212,255,0.3)" }}
          >
            {gatewayConnecting ? "Connecting…" : "Connect"}
          </button>
          {(gatewayConnected || gatewayConnecting) && (
            <button
              onClick={disconnectGateway}
              className="px-3 py-2 rounded-xl text-xs text-muted hover:text-rose-400 transition-colors"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Preferences */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-medium mb-3">Preferences</p>
        <div className="space-y-3">
          {[
            { label: "Auto-approve actions", desc: "Skip approval for low-risk operations", val: autoApprove, set: setAutoApprove },
          ].map((s) => (
            <div key={s.label} className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-soft">{s.label}</p>
                <p className="text-[10px] text-muted mt-0.5">{s.desc}</p>
              </div>
              <Toggle value={s.val} onChange={s.set} />
            </div>
          ))}
        </div>
      </div>

      <div className="h-px bg-white/5" />

      {/* Runtime info */}
      <div>
        <p className="text-xs text-muted uppercase tracking-widest font-medium mb-2">Runtime</p>
        <div className="neo rounded-xl px-3 py-2.5 space-y-1.5">
          {[
            ["Active", activeRuntime],
            ["Gateway", gatewaySettings.url],
            ["Session", gatewaySettings.sessionKey],
            ["AEOS", "1.0.0"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between text-xs gap-2">
              <span className="text-muted flex-shrink-0">{k}</span>
              <span className="text-soft font-mono truncate text-right">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function SidePanel() {
  const { sidePanelOpen, setSidePanelOpen, activePanel, setActivePanel } = useAEOSStore();

  return (
    <AnimatePresence>
      {sidePanelOpen && (
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 300, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="flex-shrink-0 border-l border-white/5 flex flex-col overflow-hidden"
          style={{ background: "rgba(7,7,15,0.6)" }}
        >
          {/* Tab bar */}
          <div className="flex border-b border-white/5">
            {TABS.map((t) => {
              const Icon = t.icon;
              const active = activePanel === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActivePanel(t.id)}
                  className={clsx(
                    "flex-1 flex flex-col items-center gap-0.5 py-2.5 text-[10px] transition-all",
                    active ? "text-white border-b-2" : "text-muted hover:text-white border-b-2 border-transparent"
                  )}
                  style={active ? { borderBottomColor: "#00d4ff" } : {}}
                >
                  <Icon size={14} />
                  {t.label}
                </button>
              );
            })}
            <button
              onClick={() => setSidePanelOpen(false)}
              className="px-3 text-muted hover:text-white transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePanel}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activePanel === "activity" && <ActivityPane />}
                {activePanel === "cua"      && <CUAPanel />}
                {activePanel === "plugins"  && <PluginPanel />}
                {activePanel === "settings" && <SettingsPane />}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
