import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../lib/axios.js";

export default function InstructorRequestPage() {
  const [form, setForm] = useState({
    name: "", email: "", password: "",
    qualification: "", subject_areas: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/instructor-requests", form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
            <span className="text-brand-emerald text-xl">✓</span>
          </div>
          <h2 className="text-lg font-medium text-slate-900 mb-2">Request submitted</h2>
          <p className="text-sm text-slate-400 mb-6">
            Your request is under review. An admin will approve your account shortly — you'll be able to log in once approved.
          </p>
          <Link
            to="/login"
            className="text-sm text-brand-blue hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-6">

        <div className="text-center mb-6">
          <h1 className="text-xl font-medium text-slate-900">
            Brain<span className="text-brand-blue">Path</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">Instructor account request</p>
        </div>

        {error && (
          <p className="text-red-500 text-sm mb-4 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            Personal details
          </p>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Full name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              placeholder="Dr. Jane Mbah"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              placeholder="jane@university.cm"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Password</label>
            <input
              type="password"
              required
              value={form.password}
              onChange={update("password")}
              placeholder="At least 8 characters"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>

          <p className="text-xs font-medium text-slate-400 uppercase tracking-wide pt-2">
            Qualifications
          </p>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Highest qualification</label>
            <input
              required
              value={form.qualification}
              onChange={update("qualification")}
              placeholder="e.g. MSc Computer Science, University of Buea"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Subject area(s)</label>
            <input
              required
              value={form.subject_areas}
              onChange={update("subject_areas")}
              placeholder="e.g. Mobile Development, Web Engineering"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-blue text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
        </form>

        <p className="text-center text-sm text-slate-400 mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-blue">Log in</Link>
        </p>
      </div>
    </div>
  );
}