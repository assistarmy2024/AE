/**
 * CUAPanel — Computer Use Agent panel.
 *
 * Shows real-time tool calls, browser activity, terminal commands,
 * and exec approval requests coming from the OpenClaw gateway.
 */
import { motion, AnimatePresence } from "framer-motion";
import {
  Monitor,
  Globe,
  Terminal,
  FileText,
  Camera,
  Mail,
  Pen,
  Loader,
  CheckCircle2,
  XCircle,
  Clock,
  Zap,
  ChevronDown,
  ChevronRight,
  WifiOff,
} from "lucide-react";
import { useAEOSStore, type Activity, type ActivityKind } from "@/store/useAEOSStore";
import { useState } from "react";
import clsx from "clsx";

// ─── Icons / colors ────────────────────────────────────────────────────────

const KIND_ICON: Record<ActivityKind, React.ReactNode> = {
  browser:    <Globe size={13} />,
  email:      <Mail size={13} />,
  terminal:   <Terminal size={13} />,
  file:       <FileText size={13} />,
  screenshot: <Camera size={13} />,
  canvas:     <Pen size={13} />,
  idle:       <Loader size={13} />,
};

const KIND_COLOR: Record<ActivityKind, string> = {
  browser:    "#00d4ff",
  email:      "#7b2fff",
  terminal:   "#00ff88",
  file:       "#ffb347",
  screenshot: "#ff2d6b",
  canvas:     "#a78bfa",
  idle:       "rgba(255,255,255,0.3)",
};

const KIND_BG: Record<ActivityKind, string> = {
  browser:    "rgba(0,212,255,0.08)",
  email:      "rgba(123,47,255,0.08)",
  terminal:   "rgba(0,255,136,0.06)",
  file:       "rgba(255,179,71,0.08)",
  screenshot: "rgba(255,45,107,0.08)",
  canvas:     "rgba(167,139,250,0.08)",
  idle:       "rgba(255,255,255,0.03)",
};

// ─── Activity row ──────────────────────────────────────────────────────────

function ActivityRow({ activity }: { activity: Activity }) {
  const { approveActivity, rejectActivity } = useAEOSStore();
  const [expanded, setExpanded] = useState(false);

  const color = KIND_COLOR[activity.kind];
  const bg    = KIND_BG[activity.kind];
  const icon  = KIND_ICON[activity.kind];

  const isPending = activity.approval === "pending";
  const isRunning = activity.status === "running";
  const isDone    = activity.status === "done";
  const isError   = activity.status === "error";

  return (
    <motion.div
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      className="rounded-xl overflow-hidden"
      style={{ background: bg, border: `1px solid rgba(255,255,255,0.07)` }}
    >
      {/* Header row */}
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
      >
        {/* Kind icon */}
        <div
          className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ background: `${color}18`, color }}
        >
          {icon}
        </div>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white truncate">{activity.title}</p>
          {activity.tool && (
            <span className="text-[9px] font-mono text-muted/60">{activity.tool}</span>
          )}
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {isRunning && (
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
          )}
          {isDone && <CheckCircle2 size={11} className="text-green-400" />}
          {isError && <XCircle size={11} className="text-rose-400" />}
          {isPending && <Clock size={11} className="text-amber-400 animate-pulse" />}
          {expanded ? <ChevronDown size={11} className="text-muted" /> : <ChevronRight size={11} className="text-muted" />}
        </div>
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-white/5">
              {/* Description */}
              <p className="text-[11px] text-muted mt-2">{activity.description}</p>

              {/* URL preview */}
              {activity.url && (
                <div className="neo-inset rounded-lg px-2 py-1.5 flex items-center gap-1.5">
                  <Globe size={10} className="text-muted flex-shrink-0" />
                  <span className="text-[10px] font-mono text-cyan/80 truncate">{activity.url}</span>
                </div>
              )}

              {/* Tool args */}
              {!!activity.toolArgs && (
                <details className="group">
                  <summary className="text-[10px] text-muted cursor-pointer hover:text-white list-none flex items-center gap-1">
                    <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                    Args
                  </summary>
                  <pre className="text-[9px] font-mono text-muted/70 mt-1 p-2 neo-inset rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                    {JSON.stringify(activity.toolArgs, null, 2).slice(0, 500)}
                  </pre>
                </details>
              )}

              {/* Tool output */}
              {activity.toolOutput && (
                <details className="group">
                  <summary className="text-[10px] text-muted cursor-pointer hover:text-white list-none flex items-center gap-1">
                    <ChevronRight size={10} className="group-open:rotate-90 transition-transform" />
                    Output
                  </summary>
                  <pre className="text-[9px] font-mono text-green-400/70 mt-1 p-2 neo-inset rounded-lg overflow-x-auto whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
                    {activity.toolOutput.slice(0, 1000)}
                  </pre>
                </details>
              )}

              {/* Approve / Reject for exec approval */}
              {isPending && (
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); rejectActivity(activity.id); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-rose-400/80 hover:text-rose-400 transition-colors"
                    style={{ background: "rgba(255,45,107,0.08)", border: "1px solid rgba(255,45,107,0.15)" }}
                  >
                    <XCircle size={11} />
                    Reject
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); approveActivity(activity.id); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs text-cyan/80 hover:text-cyan font-medium transition-colors"
                    style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)" }}
                  >
                    <CheckCircle2 size={11} />
                    Approve
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Browser live-view mock ────────────────────────────────────────────────

function BrowserPreview({ activity }: { activity: Activity }) {
  if (activity.kind !== "browser") return null;

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/5 bg-black/30">
        {["#ff5f57","#febc2e","#28c840"].map((c, i) => (
          <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
        ))}
        <div className="flex-1 mx-2 neo-inset rounded px-2 py-1 text-[9px] text-muted font-mono truncate">
          {activity.url ?? "about:blank"}
        </div>
        {activity.status === "running" && (
          <div className="w-2 h-2 rounded-full animate-spin border border-cyan border-t-transparent" />
        )}
      </div>

      {/* Screenshot or skeleton */}
      {activity.screenshotUrl ? (
        <img src={activity.screenshotUrl} alt="screenshot" className="w-full h-32 object-cover object-top" />
      ) : (
        <div className="h-28 p-3 space-y-2 relative">
          {[3/4, 1, 2/3, 1, 1/2].map((w, i) => (
            <div key={i} className="h-1.5 rounded animate-pulse bg-white/5" style={{ width: `${w * 100}%`, animationDelay: `${i * 0.1}s` }} />
          ))}
          <div className="mt-2 h-10 rounded animate-pulse bg-white/5" />
          {activity.status === "running" && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute left-0 right-0 h-0.5" style={{ background: "linear-gradient(to right, transparent, rgba(0,212,255,0.6), transparent)", animation: "scan 1.5s linear infinite" }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main CUA panel ────────────────────────────────────────────────────────

export function CUAPanel() {
  const {
    activityQueue,
    currentActivity,
    autoApprove,
    setAutoApprove,
    approveActivity,
    rejectActivity,
    gatewayConnected,
  } = useAEOSStore();

  const pending  = activityQueue.filter((a) => a.approval === "pending").length;
  const running  = activityQueue.filter((a) => a.status === "running").length;
  const done     = activityQueue.filter((a) => a.status === "done").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Monitor size={14} className="text-cyan/70" />
            <span className="text-sm font-semibold">Computer Use</span>
          </div>
          <button
            onClick={() => setAutoApprove(!autoApprove)}
            className={clsx(
              "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
              autoApprove ? "text-amber-400" : "text-muted hover:text-white"
            )}
            style={autoApprove
              ? { background: "rgba(255,179,71,0.12)", border: "1px solid rgba(255,179,71,0.3)" }
              : { background: "transparent", border: "1px solid var(--border)" }
            }
          >
            <Zap size={10} />
            {autoApprove ? "Auto ON" : "Manual"}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Running",  value: running,  color: "text-cyan",       icon: <Loader size={10} className="animate-spin" /> },
            { label: "Pending",  value: pending,  color: "text-amber-400",  icon: <Clock size={10} /> },
            { label: "Done",     value: done,     color: "text-green-400",  icon: <CheckCircle2 size={10} /> },
          ].map((s) => (
            <div key={s.label} className="neo rounded-xl px-2 py-1.5 text-center">
              <div className={`flex items-center justify-center gap-1 ${s.color} mb-0.5`}>
                {s.icon}
                <span className="text-sm font-bold">{s.value}</span>
              </div>
              <span className="text-[9px] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Offline banner */}
      {!gatewayConnected && (
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-amber-400/80" style={{ background: "rgba(255,179,71,0.08)", border: "1px solid rgba(255,179,71,0.15)" }}>
          <WifiOff size={12} />
          Gateway offline — connect in Settings to see live CUA activity
        </div>
      )}

      {/* Current activity */}
      {currentActivity && (
        <div className="px-4 pt-3 pb-2">
          <p className="text-[9px] text-muted uppercase tracking-widest mb-2 font-medium">Current</p>

          {/* Browser live view if browser tool */}
          <BrowserPreview activity={currentActivity} />

          {/* Current activity card */}
          <div className="mt-2">
            <ActivityRow activity={currentActivity} />
          </div>

          {/* Quick approve/reject if pending */}
          {currentActivity.approval === "pending" && (
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => rejectActivity(currentActivity.id)}
                className="flex-1 py-1.5 rounded-lg text-xs text-rose-400/80 hover:text-rose-400 transition-colors"
                style={{ background: "rgba(255,45,107,0.08)", border: "1px solid rgba(255,45,107,0.15)" }}
              >
                Reject
              </button>
              <button
                onClick={() => approveActivity(currentActivity.id)}
                className="flex-1 py-1.5 rounded-lg text-xs text-cyan font-medium transition-colors"
                style={{ background: "rgba(0,212,255,0.12)", border: "1px solid rgba(0,212,255,0.25)" }}
              >
                Approve
              </button>
            </div>
          )}
        </div>
      )}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {activityQueue.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 gap-2 text-muted">
            <Monitor size={28} className="opacity-20" />
            <p className="text-xs">No tool activity yet</p>
            <p className="text-[10px] opacity-60">Tool calls will appear here</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[9px] text-muted uppercase tracking-widest mb-2 font-medium">History</p>
            <AnimatePresence>
              {activityQueue
                .filter((a) => a.id !== currentActivity?.id)
                .map((a) => (
                  <ActivityRow key={a.id} activity={a} />
                ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
