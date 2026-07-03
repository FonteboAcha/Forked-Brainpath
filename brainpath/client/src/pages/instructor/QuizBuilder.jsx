import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Plus, Trash2, ArrowLeft, CheckCircle } from "lucide-react";
import api from "../../lib/axios.js";

const EMPTY_QUESTION = {
  type: "multiple_choice",
  question: "",
  options: ["", "", "", ""],
  correct_answer: "",
};

function QuestionCard({ q, index, onChange, onDelete }) {
  const isTrueFalse = q.type === "true_false";

  function updateOption(i, val) {
    const opts = [...q.options];
    opts[i] = val;
    onChange({ ...q, options: opts, correct_answer: "" });
  }

  function setType(type) {
    onChange({
      ...q,
      type,
      options: type === "true_false" ? ["True", "False"] : ["", "", "", ""],
      correct_answer: "",
    });
  }

  return (
    <div className="bp-card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <p className="bp-sub font-semibold text-slate-700">Question {index + 1}</p>
        <div className="flex items-center gap-2 shrink-0">
          {/* Type toggle */}
          <div className="flex bg-slate-100 rounded-lg p-0.5">
            {["multiple_choice", "true_false"].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`px-2.5 py-1 rounded-md bp-micro font-semibold transition-colors ${
                  q.type === t
                    ? "bg-white text-brand-blue shadow-sm"
                    : "text-slate-500"
                }`}
              >
                {t === "multiple_choice" ? "Multiple choice" : "True / False"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50"
          >
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="block bp-micro font-semibold text-slate-600 mb-1.5">
          Question text <span className="text-red-400">*</span>
        </label>
        <textarea
          value={q.question}
          onChange={(e) => onChange({ ...q, question: e.target.value })}
          placeholder="Enter your question..."
          rows={2}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 bp-body outline-none focus:ring-2 focus:border-brand-blue resize-none"
        />
      </div>

      {/* Options */}
      <div>
        <label className="block bp-micro font-semibold text-slate-600 mb-2">
          Options — click the circle to mark the correct answer
        </label>
        <div className="space-y-2">
          {q.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onChange({ ...q, correct_answer: opt || String(i) })}
                className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors ${
                  q.correct_answer === opt && opt !== ""
                    ? "border-brand-emerald bg-brand-emerald"
                    : q.correct_answer === String(i)
                    ? "border-brand-emerald bg-brand-emerald"
                    : "border-slate-300"
                }`}
                aria-label={`Mark option ${i + 1} as correct`}
              >
                {(q.correct_answer === opt && opt !== "") && (
                  <CheckCircle size={12} className="text-white" />
                )}
              </button>
              {isTrueFalse ? (
                <span
                  className={`bp-body px-4 py-2 rounded-lg border flex-1 ${
                    q.correct_answer === opt
                      ? "border-brand-emerald bg-emerald-50 text-brand-emerald font-medium"
                      : "border-slate-200 text-slate-700"
                  }`}
                >
                  {opt}
                </span>
              ) : (
                <input
                  value={opt}
                  onChange={(e) => updateOption(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className={`flex-1 border rounded-lg px-3 py-2 bp-body outline-none focus:ring-2 focus:border-brand-blue transition-colors ${
                    q.correct_answer === opt && opt !== ""
                      ? "border-brand-emerald bg-emerald-50"
                      : "border-slate-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        {!q.correct_answer && (
          <p className="bp-micro text-amber-500 mt-2">
            Select the correct answer by clicking the circle next to it
          </p>
        )}
      </div>
    </div>
  );
}

export default function QuizBuilder() {
  const { courseId, moduleId } = useParams();
  const navigate = useNavigate();

  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([{ ...EMPTY_QUESTION }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [existingQuiz, setExistingQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if quiz already exists for this lesson
    api.get(`/instructor/courses/${courseId}/modules/${moduleId}/quiz`)
      .then(({ data }) => {
        setExistingQuiz(data);
        setQuizTitle(data.title);
        setQuestions(
          data.questions.map((q) => ({
            ...q,
            type: q.options.length === 2 ? "true_false" : "multiple_choice",
            options: q.options,
          }))
        );
      })
      .catch(() => {
        // No quiz yet — that's fine
      })
      .finally(() => setLoading(false));
  }, [courseId, moduleId]);

  function addQuestion() {
    setQuestions([...questions, { ...EMPTY_QUESTION, options: ["", "", "", ""] }]);
  }

  function updateQuestion(index, updated) {
    setQuestions(questions.map((q, i) => (i === index ? updated : q)));
  }

  function deleteQuestion(index) {
    if (questions.length === 1) return;
    setQuestions(questions.filter((_, i) => i !== index));
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");

    // Validate
    if (!quizTitle.trim()) {
      setError("Quiz title is required");
      return;
    }
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        setError(`Question ${i + 1} is missing its text`);
        return;
      }
      if (!q.correct_answer) {
        setError(`Question ${i + 1} has no correct answer selected`);
        return;
      }
      if (q.type === "multiple_choice") {
        const filled = q.options.filter((o) => o.trim() !== "");
        if (filled.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`);
          return;
        }
      }
    }

    setSaving(true);
    try {
      await api.post(
        `/instructor/courses/${courseId}/modules/${moduleId}/quiz`,
        {
          title: quizTitle,
          questions: questions.map((q) => ({
            question: q.question,
            type: q.type,
            options: q.type === "true_false"
              ? ["True", "False"]
              : q.options.filter((o) => o.trim() !== ""),
            correct_answer: q.correct_answer,
          })),
        }
      );
      navigate(`/instructor/courses/${courseId}`);
    } catch (err) {
      setError(err.response?.data?.message || "Could not save quiz");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48" />
          <div className="h-40 bg-slate-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8 max-w-2xl">
      <button
        onClick={() => navigate(`/instructor/courses/${courseId}`)}
        className="flex items-center gap-2 bp-sub text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <ArrowLeft size={15} />
        Back to course
      </button>

      <h1 className="bp-display text-slate-900 mb-2">
        {existingQuiz ? "Edit quiz" : "Create quiz"}
      </h1>
      <p className="bp-body text-slate-400 mb-8">
        Students will see all questions and submit at the end.
        Results are shown immediately after submission.
      </p>

      {error && (
        <div className="bp-body text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Quiz title */}
        <div className="bp-card">
          <label className="block bp-sub font-semibold text-slate-700 mb-1.5">
            Quiz title <span className="text-red-400">*</span>
          </label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            placeholder="e.g. Module 1 Knowledge Check"
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 bp-body outline-none focus:ring-2 focus:border-brand-blue"
          />
        </div>

        {/* Questions */}
        {questions.map((q, i) => (
          <QuestionCard
            key={i}
            q={q}
            index={i}
            onChange={(updated) => updateQuestion(i, updated)}
            onDelete={() => deleteQuestion(i)}
          />
        ))}

        {/* Add question */}
        <button
          type="button"
          onClick={addQuestion}
          className="w-full py-3 rounded-xl border-2 border-dashed border-slate-200 hover:border-brand-blue bp-sub font-semibold text-slate-400 hover:text-brand-blue transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add question
        </button>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-white disabled:opacity-50 transition-colors hover:bg-blue-600"
            style={{ background: "#3B82F6" }}
          >
            {saving ? "Saving..." : "Save quiz"}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/instructor/courses/${courseId}`)}
            className="flex-1 sm:flex-none sm:px-8 py-2.5 rounded-lg bp-sub font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}