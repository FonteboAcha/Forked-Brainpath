import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { PhoneOff, ExternalLink, Users } from "lucide-react";
import api from "../../lib/axios.js";

export default function InstructorJitsiRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const jitsiContainer = useRef(null);
  const jitsiApi = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomData, setRoomData] = useState(location.state || null);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!roomData) {
      setError("No session data — go back and click Start again");
      return;
    }

    const script = document.createElement("script");
    script.src = "https://meet.jit.si/external_api.js";
    script.async = true;
    script.onload = () => initJitsi(roomData.room_id);
    script.onerror = () =>
      setError("Could not load Jitsi — check your internet connection");
    document.head.appendChild(script);

    return () => {
      jitsiApi.current?.dispose();
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [roomData]);

  function initJitsi(roomId) {
    if (!jitsiContainer.current) return;

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
      },
      interfaceConfigOverwrite: {
        SHOW_JITSI_WATERMARK: false,
        SHOW_WATERMARK_FOR_GUESTS: false,
        TOOLBAR_BUTTONS: [
          "microphone", "camera", "desktop",
          "chat", "raisehand", "tileview",
          "participants-pane", "hangup",
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
      handleEnd();
    });

    setLoading(false);
  }

  async function handleEnd() {
    jitsiApi.current?.dispose();
    try {
      await api.patch(`/instructor/sessions/${sessionId}/end`);
    } catch {
      // Best effort — navigate away regardless
    }
    navigate("/instructor/sessions");
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <p className="bp-body text-red-500 mb-4">{error}</p>
          <button
            onClick={() => navigate("/instructor/sessions")}
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
      <div
        className="flex items-center justify-between px-6 h-14 shrink-0"
        style={{ background: "#1e293b", borderBottom: "0.5px solid #334155" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-2 h-2 rounded-full bg-brand-emerald animate-pulse shrink-0" />
          <p className="bp-sub font-semibold text-white truncate">
            {roomData?.title ?? "Live session"} — Instructor
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {participantCount > 0 && (
            <div className="flex items-center gap-1.5 bp-micro text-slate-400">
              <Users size={13} />
              {participantCount + 1} in room
            </div>
          )}
          <a
            href={`https://meet.jit.si/${roomData?.room_id}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 bp-micro text-slate-400 hover:text-white transition-colors"
          >
            <ExternalLink size={13} />
            Open in tab
          </a>
          <button
            onClick={handleEnd}
            className="flex items-center gap-2 bp-sub font-semibold px-3 py-1.5 rounded-lg text-white hover:bg-red-600 transition-colors"
            style={{ background: "#ef4444" }}
          >
            <PhoneOff size={14} />
            End session
          </button>
        </div>
      </div>

      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900 z-10">
            <div className="text-center">
              <div className="w-10 h-10 border-2 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="bp-body text-slate-400">Starting session...</p>
            </div>
          </div>
        )}
        <div ref={jitsiContainer} className="w-full h-full" />
      </div>
    </div>
  );
}