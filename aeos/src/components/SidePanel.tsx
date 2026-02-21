import { motion, AnimatePresence } from "framer-motion";
import { Activity, Puzzle, Settings2, ChevronLeft } from "lucide-react";
import { useAEOSStore } from "@/store/useAEOSStore";
import { ActivityPane } from "./ActivityPane";
import { PluginPanel } from "./PluginPanel";
import clsx from "clsx";

const TABS = [
  { id: "activity" as const, label: "Activity", icon: Activity },
  { id: "plugins"  as const, label: "Plugins",  icon: Puzzle   },
  { id: "settings" as const, label: "Settings", icon: Settings2 },
];

function SettingsPane() {
  const { autoApprove, setAutoApprove, activeRuntime } = useAEOSStore();
  return (
    <div className="px-4 py-4 space-y-4">
      <p className="text-xs text-muted uppercase tracking-widest font-medium">Preferences</p>

      {[
        { label: "Auto-approve actions",       desc: "Skip approval for low-risk operations", val: autoApprove,  set: setAutoApprove  },
        { label: "Show thinking steps",        desc: "Display Syd's reasoning in chat",       val: true,         set: () => {}        },
        { label: "Voice response",             desc: "Syd speaks replies aloud",              val: false,        set: () => {}        },
        { label: "Desktop notifications",      desc: "Notify when action needs approval",     val: true,         set: () => {}        },
      ].map((s) => (
        <div key={s.label} className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-soft">{s.label}</p>
            <p className="text-[10px] text-muted mt-0.5">{s.desc}</p>
          </div>
          <button
            onClick={() => s.set(!s.val)}
            className="w-10 h-5 rounded-full relative flex-shrink-0 transition-all mt-0.5"
            style={{ background: s.val ? "rgba(0,212,255,0.25)" : "rgba(255,255,255,0.06)", border: s.val ? "1px solid rgba(0,212,255,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300"
              style={{
                background: s.val ? "linear-gradient(135deg,#00d4ff,#7b2fff)" : "rgba(255,255,255,0.2)",
                boxShadow: s.val ? "0 0 8px rgba(0,212,255,0.5)" : "none",
                left: s.val ? "calc(100% - 18px)" : "2px",
              }}
            />
          </button>
        </div>
      ))}

      <div className="h-px bg-white/5 my-4" />
      <p className="text-xs text-muted uppercase tracking-widest font-medium">Runtime info</p>
      <div className="neo rounded-xl px-3 py-2.5 space-y-1.5">
        {[
          ["Active runtime", activeRuntime],
          ["Gateway", "ws://localhost:18789"],
          ["Version", "0.1.0-aeos"],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between text-xs">
            <span className="text-muted">{k}</span>
            <span className="text-soft font-mono">{v}</span>
          </div>
        ))}
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
