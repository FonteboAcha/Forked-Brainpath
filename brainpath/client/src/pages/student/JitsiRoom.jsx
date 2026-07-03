import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PhoneOff, ExternalLink, Users, Wifi, WifiOff } from "lucide-react";
import api from "../../lib/axios.js";
import { useConnectionQuality, useDemoQualityOverride } from "../../hooks/useConnectionQuality.js";
import { getConnectionHint } from "../../lib/connection.js";
import ConnectionBadge from "../../components/ConnectionBadge.jsx";
import { shouldSuggestAudioOnly } from "../../lib/videoQuality.js";
import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

export default function StudentJitsiRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const jitsiContainer = useRef(null);
  const jitsiApi = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomData, setRoomData] = useState(location.state || null);
  const [participantCount, setParticipantCount] = useState(0);
  const [audioOnly, setAudioOnly] = useState(false);

  const online = useOnlineStatus();
  const [effectiveType, setEffectiveType] = useState(
    () => getConnectionHint()?.effectiveType ?? "4g"
  );
  useConnectionQuality(setEffectiveType);
  useDemoQualityOverride(setEffectiveType);

  // Step 1 — fetch room data if not passed via navigation state
  useEffect(() => {
    if (roomData) return;

    api.post(`/student/sessions/${sessionId}/join`)
      .then(({ data }) => setRoomData(data))
      .catch((err) => {
        setError(
          err.response?.data?.message ||
          "Could not join session — it may have ended"
        );
        setLoading(false);
      });
  }, [sessionId]);

  // Step 2 — load Jitsi once we have room data
  useEffect(() => {
    if (!roomData?.room_id) return;

    // Check if Jitsi script is already loaded
    if (window.JitsiMeetExternalAPI) {
      initJitsi(roomData.room_id);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => initJitsi(roomData.room_id);
    script.onerror = () => {
      setError("Could not load Jitsi — check your internet connection");
      setLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      jitsiApi.current?.dispose();
      // Only remove if we added it
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [roomData]);

  // Step 3 — react to audio-only toggle
  useEffect(() => {
    if (!jitsiApi.current) return;
    if (audioOnly) {
      jitsiApi.current.executeCommand("toggleVideo");
    }
  }, [audioOnly]);

  function initJitsi(roomId) {
    if (!jitsiContainer.current) return;
    if (jitsiApi.current) return; // already initialised

    try {
      jitsiApi.current = new window.JitsiMeetExternalAPI("meet.jit.si", {
        roomName: roomId,
        parentNode: jitsiContainer.current,
        width: "100%",
        height: "100%",
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          prejoinPageEnabled: false,
          disableDeepLinking: true,
          enableWelcomePage: false,
          // Audio-only mode based on connection
          startAudioOnly: shouldSuggestAudioOnly(effectiveType),
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          TOOLBAR_BUTTONS: [
            "microphone", "camera",
            "chat", "raisehand",
            "tileview", "hangup",
          ],
          MOBILE_APP_PROMO: false,
        },
      });

      jitsiApi.current.addEventListener("videoConferenceJoined", () => {
        setLoading(false);
      });

      jitsiApi.current.addEventListener("participantJoined", () => {
        setParticipantCount((n) => n + 1);
      });

      jitsiApi.current.addEventListener("participantLeft", () => {
        setParticipantCount((n) => Math.max(0, n - 1));
      });

      jitsiApi.current.addEventListener("readyToClose", () => {
        handleLeave();
      });

    } catch (err) {
      setError("Failed to start Jitsi: " + err.message);
      setLoading(false);
    }
  }

  function handleLeave() {
    jitsiApi.current?.dispose();
    jitsiApi.current = null;
    navigate("/live");
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-slate-900">
        <div className="text-center">
          <p className="bp-body text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate("/live")}
            className="bp-sub text-brand-blue"
          >
            ← Back to sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-900">

      {/* Header */}
      <div
        className="flex items-center justify-between px-6 h-14 shrink-0 gap-4"
        style={{ background: "#1e293b", borderBottom: "0.5px solid #334155" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse shrink-0" />
          <p className="bp-sub font-semibold text-white truncate">
            {roomData?.title ?? "Live session"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Connection badge */}
          <ConnectionBadge effectiveType={effectiveType} />

          {/* Audio-only toggle */}
          <button
            onClick={() => setAudioOnly((prev) => !prev)}
            className="flex items-center gap-1.5 bp-micro font-semibold px-3 py-1.5 rounded-lg border transition-colors"
            style={{
              borderColor: audioOnly ? "#F59E0B" : "#334155",
              color: audioOnly ? "#F59E0B" : "#94a3b8",
              background: audioOnly ? "rgba(245,158,11,0.1)" : "transparent",
            }}
          >
            {audioOnly ? "🎧 Audio only" : "📷 Video on"}
          </button>

          {participantCount > 0 && (
            <div className="flex items-center gap-1.5 bp-micro text-slate-400">
              <Users size={13} />
              {participantCount + 1}
            </div>
          )}

          <a
            href={`https://meet.jit.si/${roomData?.room_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bp-micro text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink size={13} />
            <span className="hidden sm:block">Open in tab</span>
          </a>

          <button
            onClick={handleLeave}
            className="flex items-center gap-2 bp-sub font-semibold px-3 py-1.5 rounded-lg text-white hover:bg-red-600 transition-colors"
            style={{ background: "#ef4444" }}
          >
            <PhoneOff size={14} />
            <span className="hidden sm:block">Leave</span>
          </button>
        </div>
      </div>

      {/* Poor connection banner */}
      {shouldSuggestAudioOnly(effectiveType) && !audioOnly && (
        <div
          className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ background: "rgba(245,158,11,0.1)", borderBottom: "0.5px solid rgba(245,158,11,0.3)" }}
        >
          <p className="bp-micro font-semibold text-amber-400">
            Poor connection detected — switching to audio only may improve your experience
          </p>
          <button
            onClick={() => setAudioOnly(true)}
            className="bp-micro font-semibold px-3 py-1 rounded-lg ml-4 shrink-0"
            style={{ background: "#F59E0B", color: "#fff" }}
          >
            Switch
          </button>
        </div>
      )}

      {/* Offline banner */}
      {!online && (
        <div
          className="flex items-center justify-center gap-2 px-4 py-2 shrink-0"
          style={{ background: "#ef4444" }}
        >
          <WifiOff size={13} className="text-white" />
          <p className="bp-micro font-semibold text-white">
            You are offline — live session unavailable
          </p>
        </div>
      )}

      {/* Jitsi embed */}
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="bp-body text-slate-400">Connecting to session...</p>
              {roomData?.room_id && (
                <p className="bp-micro text-slate-500 mt-2">
                  Room: {roomData.room_id}
                </p>
              )}
            </div>
          </div>
        )}
        <div ref={jitsiContainer} className="w-full h-full" />
      </div>
    </div>
  );
}