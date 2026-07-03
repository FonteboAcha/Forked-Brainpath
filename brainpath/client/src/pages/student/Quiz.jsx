import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, RotateCcw, ArrowLeft, Clock } from "lucide-react";
import api from "../../lib/axios.js";

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function ScoreDisplay({ score, correct, total, onRetry, onBack }) {
  const passed = score >= 60;

  return (
    <div className="max-w-lg mx-auto text-center space-y-6">
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
        style={{
          background: passed ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.08)",
        }}
      >
        <p
          className="text-3xl font-bold"
          style={{ color: passed ? "#10B981" : "#ef4444" }}
        >
          {score}%
        </p>
      </div>

      <div>
        <h2 className="bp-heading text-slate-900 mb-1">
          {passed ? "Well done!" : "Keep trying!"}
        </h2>
        <p className="bp-body text-slate-500">
          You got {correct} out of {total} questions correct.
        </p>
        {!passed && (
          <p className="bp-sub text-slate-400 mt-1">
            You need 60% to pass. Review the answers below and try again.
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bp-sub font-semibold text-white transition-colors hover:bg-blue-600"
          style={{ background: "#3B82F6" }}
        >
          <RotateCcw size={15} />
          Try again
        </button>
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bp-sub font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft size={15} />
          Back to lesson
        </button>
      </div>
    </div>
  );
}

export default function QuizPage() {
  const { courseId, moduleId, lessonId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchQuiz();
  }, [moduleId]);

  async function fetchQuiz() {
    setLoading(true);
    setResult(null);
    setAnswers({});
    try {
      const { data } = await api.get(
        `/student/courses/${courseId}/modules/${moduleId}/quiz`
      );
      setQuiz(data);
    } catch {
      setError("Could not load quiz");
    } finally {
      setLoading(false);
    }
  }

  function selectAnswer(questionId, answer) {
    setAnswers({ ...answers, [questionId]: answer });
  }

  async function handleSubmit() {
    // Check all questions answered
    const unanswered = quiz.questions.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`Please answer all questions before submitting (${unanswered.length} remaining)`);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      const { data } = await api.post(
        `/student/courses/${courseId}/modules/${moduleId}/quiz/submit`,
        { answers }
      );
      setResult(data);
      // Scroll to top to show score
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Could not submit quiz");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-64" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">
        <p className="bp-body text-red-500 mb-4">{error}</p>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="bp-sub text-brand-blue"
        >
          ← Back to course
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-lg mx-auto px-6 sm:px-8 py-8">

      {/* Back link */}
      <button
        onClick={() => navigate(`/courses/${courseId}`)}
        className="flex items-center gap-2 bp-sub text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to course
      </button>

      {/* Score screen */}
      {result ? (
        <div className="space-y-8">
          <ScoreDisplay
            score={result.score}
            correct={result.correct}
            total={result.total}
            onRetry={fetchQuiz}
            onBack={() => navigate(`/courses/${courseId}`)}
          />

          {/* Answer review */}
          <div>
            <h3 className="bp-heading text-slate-900 mb-4">Answer review</h3>
            <div className="space-y-4">
              {quiz.questions.map((q, i) => {
                const r = result.results[q.id];
                return (
                  <div key={q.id} className="bp-card">
                    <div className="flex items-start gap-3 mb-3">
                      {r.correct ? (
                        <CheckCircle size={18} className="text-brand-emerald shrink-0 mt-0.5" />
                      ) : (
                        <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
                      )}
                      <p className="bp-sub font-semibold text-slate-900">
                        {i + 1}. {q.question}
                      </p>
                    </div>
                    <div className="pl-7 space-y-2">
                      {q.options.map((opt) => {
                        const isCorrect = opt === r.correct_answer;
                        const isStudentAnswer = opt === r.student_answer;
                        const isWrong = isStudentAnswer && !isCorrect;

                        return (
                          <div
                            key={opt}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bp-body"
                            style={{
                              background: isCorrect
                                ? "rgba(16,185,129,0.08)"
                                : isWrong
                                ? "rgba(239,68,68,0.06)"
                                : "transparent",
                              border: isCorrect
                                ? "0.5px solid rgba(16,185,129,0.3)"
                                : isWrong
                                ? "0.5px solid rgba(239,68,68,0.3)"
                                : "0.5px solid transparent",
                              color: isCorrect
                                ? "#065f46"
                                : isWrong
                                ? "#991b1b"
                                : "#64748b",
                            }}
                          >
                            {isCorrect && <CheckCircle size={13} className="shrink-0" />}
                            {isWrong && <XCircle size={13} className="shrink-0" />}
                            {opt}
                            {isCorrect && (
                              <span className="ml-auto bp-micro font-semibold">
                                Correct answer
                              </span>
                            )}
                            {isWrong && (
                              <span className="ml-auto bp-micro font-semibold">
                                Your answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Quiz taking screen */
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="bp-display text-slate-900">{quiz?.title}</h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="bp-body text-slate-400">
                {quiz?.questions.length} questions
              </p>
              {quiz?.attempt_count > 0 && (
                <p className="bp-micro text-slate-400 flex items-center gap-1">
                  <Clock size={12} />
                  Last attempt {timeAgo(quiz.attempts[0].attempted_at)} —{" "}
                  {quiz.attempts[0].score}%
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="bp-body text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Questions */}
          {quiz?.questions.map((q, i) => (
            <div key={q.id} className="bp-card space-y-4">
              <p className="bp-sub font-semibold text-slate-900">
                {i + 1}. {q.question}
              </p>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => selectAnswer(q.id, opt)}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left bp-body transition-all"
                      style={{
                        background: selected
                          ? "rgba(59,130,246,0.06)"
                          : "transparent",
                        borderColor: selected ? "#3B82F6" : "#e2e8f0",
                        color: selected ? "#1d4ed8" : "#475569",
                        fontWeight: selected ? "500" : "400",
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors"
                        style={{
                          borderColor: selected ? "#3B82F6" : "#cbd5e1",
                          background: selected ? "#3B82F6" : "transparent",
                        }}
                      >
                        {selected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Progress indicator */}
          <div className="flex items-center justify-between bp-micro text-slate-400">
            <span>
              {Object.keys(answers).length} of {quiz?.questions.length} answered
            </span>
            <div className="bp-progress-track w-32">
              <div
                className="bp-progress-fill bg-brand-blue"
                style={{
                  width: `${(Object.keys(answers).length / (quiz?.questions.length || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-3 rounded-xl bp-sub font-semibold text-white disabled:opacity-50 transition-colors hover:bg-blue-600"
            style={{ background: "#3B82F6" }}
          >
            {submitting
              ? "Submitting..."
              : `Submit quiz (${Object.keys(answers).length}/${quiz?.questions.length})`}
          </button>
        </div>
      )}
    </div>
  );
}