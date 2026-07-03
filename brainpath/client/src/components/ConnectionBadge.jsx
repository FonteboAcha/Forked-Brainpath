import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { getQualityLabel } from "../lib/videoQuality.js";
import { Wifi, WifiOff } from "lucide-react";

export default function ConnectionBadge({ effectiveType }) {
  const online = useOnlineStatus();

  if (!online) {
    return (
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
        style={{ background: "rgba(239,68,68,0.1)" }}
      >
        <WifiOff size={11} className="text-red-500" />
        <span className="bp-micro font-semibold text-red-500">Offline</span>
      </div>
    );
  }

  if (!effectiveType) return null;

  const { label, color } = getQualityLabel(effectiveType);
  const bg = `${color}18`; // 10% opacity version of the color

  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: bg }}
    >
      <Wifi size={11} style={{ color }} />
      <span className="bp-micro font-semibold" style={{ color }}>
        {effectiveType.toUpperCase()} · {label}
      </span>
    </div>
  );
}