import { useNavigate } from "react-router-dom";
import { BookOpen, Wifi, Download, Video, CheckCircle, ChevronRight, Zap, Globe, Shield } from "lucide-react";
import Logo from "../components/Logo.jsx";

const features = [
  {
    Icon: Wifi,
    color: "#3B82F6",
    bg: "rgba(59,130,246,0.08)",
    title: "Works on any connection",
    description:
      "BrainPath automatically adjusts video quality based on your network speed — from 4G down to 2G — so learning never stops.",
  },
  {
    Icon: Download,
    color: "#10B981",
    bg: "rgba(16,185,129,0.08)",
    title: "Study offline",
    description:
      "Download lessons before class and access them anywhere — no internet required. Progress syncs automatically when you reconnect.",
  },
  {
    Icon: Video,
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.08)",
    title: "Live classes",
    description:
      "Join live lectures directly in the app. Switch to audio-only mode when bandwidth is low to stay connected without interruption.",
  },
  {
    Icon: CheckCircle,
    color: "#8B5CF6",
    bg: "rgba(139,92,246,0.08)",
    title: "Quizzes and progress tracking",
    description:
      "Test your understanding with module quizzes and track your progress across every course in one place.",
  },
  {
    Icon: Shield,
    color: "#EC4899",
    bg: "rgba(236,72,153,0.08)",
    title: "Secure and role-based",
    description:
      "Separate experiences for students, instructors, and administrators. Instructor accounts are verified before activation.",
  },
  {
    Icon: Globe,
    color: "#06B6D4",
    bg: "rgba(6,182,212,0.08)",
    title: "Built for Cameroon",
    description:
      "Designed with the realities of sub-Saharan Africa in mind — low bandwidth, mobile-first, and accessible to everyone.",
  },
];

const stats = [
  { value: "2G+", label: "Works from" },
  { value: "PWA", label: "Installable app" },
  { value: "100%", label: "Offline capable" },
  { value: "Free", label: "To get started" },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-canvas)" }}
    >
      {/* ── Navigation ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo size="md" />
          <nav className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="bp-sub font-semibold text-slate-600 hover:text-slate-900 px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Log in
            </button>
            <button
              onClick={() => navigate("/login")}
              className="bp-sub font-semibold text-white px-5 py-2 rounded-lg transition-colors hover:bg-blue-600"
              style={{ background: "#3B82F6" }}
            >
              Get started
            </button>
          </nav>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24 text-center">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bp-micro font-semibold mb-6"
          style={{
            background: "rgba(59,130,246,0.08)",
            border: "0.5px solid rgba(59,130,246,0.2)",
            color: "#1d4ed8",
          }}
        >
          <Zap size={12} />
          Adaptive e-learning for low-resource environments
        </div>

        <h1
          className="font-bold tracking-tight text-slate-900 mb-6 leading-tight"
          style={{ fontSize: "clamp(32px, 5vw, 56px)" }}
        >
          Learn anywhere,
          <br />
          <span style={{ color: "#3B82F6" }}>even offline.</span>
        </h1>

        <p
          className="bp-body text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
          style={{ fontSize: "18px" }}
        >
          BrainPath is a mobile-first e-learning platform that adapts to your
          network conditions in real time — so unstable internet never stands
          between you and your education.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button
            onClick={() => navigate("/login")}
            className="flex items-center gap-2 bp-sub font-semibold text-white px-7 py-3.5 rounded-xl transition-colors hover:bg-blue-600"
            style={{ background: "#3B82F6", fontSize: "15px" }}
          >
            Start learning free
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate("/instructor-request")}
            className="flex items-center gap-2 bp-sub font-semibold text-slate-600 px-7 py-3.5 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
            style={{ fontSize: "15px" }}
          >
            Teach on BrainPath
          </button>
        </div>
      </section>

      {/* ── Stats bar ── */}
      <section
        className="border-y border-slate-200"
        style={{ background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p
                  className="font-bold text-slate-900 mb-1"
                  style={{ fontSize: "32px", color: "#3B82F6" }}
                >
                  {value}
                </p>
                <p className="bp-sub text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2
            className="font-bold text-slate-900 mb-4 tracking-tight"
            style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
          >
            Built for the real world
          </h2>
          <p className="bp-body text-slate-400 max-w-xl mx-auto">
            Every feature in BrainPath was designed with one question in mind:
            does this work when the internet is slow, expensive, or unavailable?
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map(({ Icon, color, bg, title, description }) => (
            <div
              key={title}
              className="bp-card hover:border-slate-300 transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: bg }}
              >
                <Icon size={20} style={{ color }} />
              </div>
              <h3
                className="font-semibold text-slate-900 mb-2"
                style={{ fontSize: "16px" }}
              >
                {title}
              </h3>
              <p className="bp-body text-slate-500 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ── */}
      <section
        className="py-24 border-t border-slate-200"
        style={{ background: "#fff" }}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2
              className="font-bold text-slate-900 mb-4 tracking-tight"
              style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
            >
              How it works
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create an account",
                description:
                  "Sign up as a student in seconds. Instructors submit a request that is reviewed and approved by an administrator.",
                color: "#3B82F6",
              },
              {
                step: "02",
                title: "Enroll in courses",
                description:
                  "Browse the course catalogue and enroll in any course. Download lessons for offline access with one tap.",
                color: "#10B981",
              },
              {
                step: "03",
                title: "Learn on your terms",
                description:
                  "Watch videos, read lessons, take quizzes, and join live classes — all from your phone or laptop, online or off.",
                color: "#F59E0B",
              },
            ].map(({ step, title, description, color }) => (
              <div key={step} className="text-center px-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
                  style={{ background: `${color}14` }}
                >
                  <span
                    className="font-bold"
                    style={{ fontSize: "20px", color }}
                  >
                    {step}
                  </span>
                </div>
                <h3
                  className="font-semibold text-slate-900 mb-3"
                  style={{ fontSize: "17px" }}
                >
                  {title}
                </h3>
                <p className="bp-body text-slate-500 leading-relaxed">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div
            className="rounded-2xl px-8 py-16 text-center"
            style={{
              background: "linear-gradient(135deg, #3B82F6 0%, #1d4ed8 100%)",
            }}
          >
            <h2
              className="font-bold text-white mb-4 tracking-tight"
              style={{ fontSize: "clamp(24px, 3vw, 36px)" }}
            >
              Ready to start learning?
            </h2>
            <p
              className="text-blue-100 mb-10 max-w-lg mx-auto"
              style={{ fontSize: "16px" }}
            >
              Join BrainPath today — no app store required. Install it directly
              from your browser and start learning in minutes.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 font-semibold text-brand-blue px-7 py-3.5 rounded-xl bg-white hover:bg-blue-50 transition-colors"
                style={{ fontSize: "15px" }}
              >
                Create free account
                <ChevronRight size={16} />
              </button>
              <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 font-semibold text-white px-7 py-3.5 rounded-xl border border-white/30 hover:bg-white/10 transition-colors"
                style={{ fontSize: "15px" }}
              >
                Log in
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <Logo size="sm" />
            <p className="bp-micro text-slate-400 text-center">
              © {new Date().getFullYear()} BrainPath — Adaptive e-learning for
              low-resource settings
            </p>
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/login")}
                className="bp-micro text-slate-400 hover:text-slate-700 transition-colors"
              >
                Log in
              </button>
              <button
                onClick={() => navigate("/instructor-request")}
                className="bp-micro text-slate-400 hover:text-slate-700 transition-colors"
              >
                Teach with us
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}