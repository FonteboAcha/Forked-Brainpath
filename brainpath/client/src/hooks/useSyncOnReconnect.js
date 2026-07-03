import { useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus.js";
import { drainSyncQueue } from "../lib/sync.js";

export function useSyncOnReconnect(onSynced) {
  const online = useOnlineStatus();
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!online) {
      wasOffline.current = true;
      return;
    }

    // Only drain if we were previously offline
    if (wasOffline.current) {
      wasOffline.current = false;
      drainSyncQueue().then((result) => {
        if (result.synced > 0) {
          console.log(`Synced ${result.synced} pending item(s) to server`);
          onSynced?.(result);
        }
      });
    }
  }, [online]);

  return online;
}