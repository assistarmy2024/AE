import { motion } from "framer-motion";
import { CheckCircle, XCircle, Clock, Globe, Mail, Terminal, FileText, Camera, Loader } from "lucide-react";
import { Activity, ApprovalStatus } from "@/store/useAEOSStore";
import clsx from "clsx";

const kindIcon: Record<string, React.ReactNode> = {
  browser:    <Globe size={14} />,
  email:      <Mail size={14} />,
  terminal:   <Terminal size={14} />,
  file:       <FileText size={14} />,
  screenshot: <Camera size={14} />,
  idle:       <Loader size={14} />,
};

const kindColor: Record<string, string> = {
  browser:    "rgba(0,212,255,0.15)",
  email:      "rgba(123,47,255,0.15)",
  terminal:   "rgba(0,255,136,0.12)",
  file:       "rgba(255,179,71,0.12)",
  screenshot: "rgba(255,45,107,0.12)",
  idle:       "rgba(255,255,255,0.06)",
};

function ApprovalBadge({ status }: { status: ApprovalStatus }) {
  const cfg = {
    pending:  { icon: <Clock size={11} />,       label: "Awaiting approval", color: "text-amber-400", bg: "rgba(255,179,71,0.12)"  },
    approved: { icon: <CheckCircle size={11} />, label: "Approved",          color: "text-green-400", bg: "rgba(0,255,136,0.12)"   },
    rejected: { icon: <XCircle size={11} />,     label: "Rejected",          color: "text-rose",      bg: "rgba(255,45,107,0.12)"  },
    auto:     { icon: <CheckCircle size={11} />, label: "Auto-approved",     color: "text-cyan/70",   bg: "rgba(0,212,255,0.08)"   },
  }[status];

  return (
    <div
      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${cfg.color}`}
      style={{ background: cfg.bg }}
    >
      {cfg.icon}
      {cfg.label}
    </div>
  );
}

interface Props {
  activity: Activity;
  onApprove?: () => void;
  onReject?: () => void;
  compact?: boolean;
}

export function ActivityCard({ activity, onApprove, onReject, compact }: Props) {
  const needsApproval = activity.approval === "pending";
  const isRunning     = activity.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        "rounded-xl overflow-hidden",
        compact ? "w-full max-w-xs" : "w-full"
      )}
      style={{
        background: kindColor[activity.kind] ?? "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/5">
        <span className="text-muted">{kindIcon[activity.kind]}</span>
        <span className="flex-1 text-xs font-medium text-soft truncate">{activity.title}</span>
        {isRunning && (
          <div className="w-1.5 h-1.5 rounded-full bg-cyan animate-pulse" style={{ boxShadow: "0 0 6px #00d4ff" }} />
        )}
      </div>

      {/* Preview area */}
      {!compact && (
        <div
          className="relative h-32 overflow-hidden flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.3)" }}
        >
          {activity.url && (
            <div className="absolute inset-0 flex flex-col">
              {/* Fake browser chrome */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-white/5 bg-black/30">
                {["#ff5f57","#febc2e","#28c840"].map((c,i) => (
                  <div key={i} className="w-2 h-2 rounded-full" style={{ background: c }} />
                ))}
                <div className="flex-1 mx-2 neo-inset rounded px-2 py-0.5 text-[9px] text-muted font-mono truncate">
                  {activity.url}
                </div>
              </div>
              {/* Placeholder page skeleton */}
              <div className="flex-1 p-3 space-y-2">
                <div className="h-2 w-3/4 rounded bg-white/5" />
                <div className="h-2 w-full rounded bg-white/5" />
                <div className="h-2 w-2/3 rounded bg-white/5" />
                <div className="mt-3 h-12 rounded bg-white/5" />
              </div>
              {/* Scan overlay */}
              {isRunning && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  <div
                    className="absolute left-0 right-0 h-0.5"
                    style={{
                      background: "linear-gradient(to right, transparent, rgba(0,212,255,0.6), transparent)",
                      animation: "scan 2s linear infinite",
                    }}
                  />
                </div>
              )}
            </div>
          )}
          {activity.kind === "email" && (
            <div className="p-3 w-full space-y-1.5">
              <div className="flex gap-2">
                <div className="w-6 h-6 rounded-full bg-violet/40 flex-shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-1.5 w-1/3 rounded bg-white/10" />
                  <div className="h-1.5 w-1/2 rounded bg-white/6" />
                </div>
              </div>
              {[1,2,3].map(i => (
                <div key={i} className="h-1.5 rounded bg-white/5" style={{ width: `${70+i*10}%` }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Description + status */}
      <div className="px-3 py-2 flex items-center justify-between gap-2">
        <p className="text-[11px] text-muted flex-1 truncate">{activity.description}</p>
        <ApprovalBadge status={activity.approval} />
      </div>

      {/* Tool tag */}
      {activity.tool && (
        <div className="px-3 pb-2">
          <span className="text-[10px] font-mono text-muted/60 px-1.5 py-0.5 rounded neo">
            {activity.tool}
          </span>
        </div>
      )}

      {/* Approve / Reject */}
      {needsApproval && (onApprove || onReject) && (
        <div className="flex border-t border-white/5">
          {onReject && (
            <button
              onClick={onReject}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-rose/80 hover:text-rose hover:bg-rose/5 transition-all"
            >
              <XCircle size={12} />
              Reject
            </button>
          )}
          <div className="w-px bg-white/5" />
          {onApprove && (
            <button
              onClick={onApprove}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs text-cyan/80 hover:text-cyan hover:bg-cyan/5 transition-all font-medium"
            >
              <CheckCircle size={12} />
              Approve
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
}
