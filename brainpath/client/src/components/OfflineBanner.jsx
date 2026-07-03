import { useOnlineStatus } from "../hooks/useOnlineStatus.js";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      className="w-full flex items-center justify-center gap-2 py-2 px-4 z-[60]"
      style={{ background: "#F59E0B" }}
    >
      <WifiOff size={14} className="text-white shrink-0" />
      <p className="bp-micro font-semibold text-white text-center">
        You're offline — progress is saved locally and will sync when you reconnect
      </p>
    </div>
  );
}