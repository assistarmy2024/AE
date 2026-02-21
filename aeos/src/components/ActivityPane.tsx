import { motion, AnimatePresence } from "framer-motion";
import { Activity as ActivityIcon, CheckCircle2, Clock, XCircle, Zap } from "lucide-react";
import { useAEOSStore } from "@/store/useAEOSStore";
import { ActivityCard } from "./ActivityCard";
import clsx from "clsx";

export function ActivityPane() {
  const { activityQueue, currentActivity, approveActivity, rejectActivity, autoApprove, setAutoApprove } =
    useAEOSStore();

  const pending  = activityQueue.filter((a) => a.approval === "pending").length;
  const approved = activityQueue.filter((a) => a.approval === "approved").length;
  const rejected = activityQueue.filter((a) => a.approval === "rejected").length;

  return (
    <div className="flex flex-col h-full">
      {/* Header stats */}
      <div className="px-4 py-3 border-b border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ActivityIcon size={14} className="text-cyan/70" />
            <span className="text-sm font-semibold">Activity</span>
          </div>
          {/* Auto-approve toggle */}
          <button
            onClick={() => setAutoApprove(!autoApprove)}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all",
              autoApprove ? "text-amber-400" : "text-muted hover:text-white"
            )}
            style={autoApprove ? { background: "rgba(255,179,71,0.12)", border: "1px solid rgba(255,179,71,0.3)" } : { background: "transparent", border: "1px solid var(--border)" }}
          >
            <Zap size={11} />
            {autoApprove ? "Auto-approve ON" : "Auto-approve"}
          </button>
        </div>

        {/* Mini stats */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Pending",  value: pending,  color: "text-amber-400", icon: <Clock size={11} /> },
            { label: "Approved", value: approved, color: "text-green-400", icon: <CheckCircle2 size={11} /> },
            { label: "Rejected", value: rejected, color: "text-rose",      icon: <XCircle size={11} /> },
          ].map((s) => (
            <div key={s.label} className="neo rounded-xl px-3 py-2 text-center">
              <div className={`flex items-center justify-center gap-1 ${s.color} mb-0.5`}>
                {s.icon}
                <span className="text-base font-bold">{s.value}</span>
              </div>
              <span className="text-[10px] text-muted">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Current activity (large) */}
      {currentActivity && (
        <div className="px-4 py-3 border-b border-white/5">
          <p className="text-[10px] text-muted uppercase tracking-widest mb-2 font-medium">Current</p>
          <ActivityCard
            activity={currentActivity}
            onApprove={() => approveActivity(currentActivity.id)}
            onReject={() => rejectActivity(currentActivity.id)}
          />
        </div>
      )}

      {/* Queue */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        <p className="text-[10px] text-muted uppercase tracking-widest mb-2 font-medium">Queue</p>
        <AnimatePresence>
          {activityQueue
            .filter((a) => a.id !== currentActivity?.id)
            .map((a, i) => (
              <motion.div
                key={a.id}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <ActivityCard
                  activity={a}
                  onApprove={() => approveActivity(a.id)}
                  onReject={() => rejectActivity(a.id)}
                  compact
                />
              </motion.div>
            ))}
        </AnimatePresence>
        {activityQueue.length === 0 && (
          <p className="text-xs text-muted text-center py-8">No activities yet</p>
        )}
      </div>
    </div>
  );
}
