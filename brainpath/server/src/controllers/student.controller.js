import { pool } from "../config/db.js";

// GET /api/student/dashboard
// Returns everything the home screen needs in one request —
// saves the frontend from making 4-5 separate calls on load.
export async function getDashboardData(req, res, next) {
  try {
    const userId = req.user.id;

    const [
      hoursResult,
      completionResult,
      streakResult,
      continueResult,
      upcomingLiveResult,
    ] = await Promise.all([

      // Total learning hours (sum of time_spent across all progress rows)
      pool.query(
        `SELECT COALESCE(SUM(time_spent), 0) AS total_seconds
         FROM progress
         WHERE user_id = $1`,
        [userId]
      ),

      // Overall completion % across all enrolled courses
      pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE p.status = 'completed') AS completed,
           COUNT(*) AS total
         FROM enrollments e
         JOIN modules m ON m.course_id = e.course_id
         JOIN lessons l ON l.module_id = m.id
         LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = $1
         WHERE e.user_id = $1`,
        [userId]
      ),

      // Streak — count consecutive days with at least one lesson accessed
      // Simple version: count distinct days in the last 30 days where
      // last_accessed is not null, working backwards from today.
      pool.query(
        `WITH daily AS (
           SELECT DATE(last_accessed AT TIME ZONE 'UTC') AS day
           FROM progress
           WHERE user_id = $1 AND last_accessed IS NOT NULL
           GROUP BY DATE(last_accessed AT TIME ZONE 'UTC')
         ),
         numbered AS (
           SELECT day,
                  ROW_NUMBER() OVER (ORDER BY day DESC) AS rn
           FROM daily
         )
         SELECT COUNT(*) AS streak
         FROM numbered
         WHERE day = CURRENT_DATE - (rn - 1) * INTERVAL '1 day'`,
        [userId]
      ),

      // Last accessed lesson — "continue where you left off"
      pool.query(
        `SELECT
           l.id AS lesson_id,
           l.title AS lesson_title,
           l.type,
           c.id AS course_id,
           c.title AS course_title,
           p.status,
           p.last_accessed,
           -- progress % for this course
           (
             SELECT ROUND(
               100.0 * COUNT(*) FILTER (WHERE p2.status = 'completed') / NULLIF(COUNT(*), 0)
             )
             FROM lessons l2
             JOIN modules m2 ON m2.id = l2.module_id
             LEFT JOIN progress p2 ON p2.lesson_id = l2.id AND p2.user_id = $1
             WHERE m2.course_id = c.id
           ) AS course_progress
         FROM progress p
         JOIN lessons l ON l.id = p.lesson_id
         JOIN modules m ON m.id = l.module_id
         JOIN courses c ON c.id = m.course_id
         WHERE p.user_id = $1
           AND p.status != 'completed'
         ORDER BY p.last_accessed DESC NULLS LAST
         LIMIT 1`,
        [userId]
      ),

      // Upcoming live sessions for courses the student is enrolled in
      pool.query(
        `SELECT
           ls.id,
           ls.title,
           ls.scheduled_at,
           ls.room_id,
           ls.status,
           c.title AS course_title,
           u.name AS instructor_name
         FROM live_sessions ls
         JOIN courses c ON c.id = ls.course_id
         JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
         JOIN users u ON u.id = ls.instructor_id
         WHERE ls.scheduled_at >= NOW()
           AND ls.status IN ('scheduled', 'live')
         ORDER BY ls.scheduled_at ASC
         LIMIT 3`,
        [userId]
      ),
    ]);

    const totalSeconds = parseInt(hoursResult.rows[0].total_seconds);
    const completed = parseInt(completionResult.rows[0].completed);
    const total = parseInt(completionResult.rows[0].total);
    const streak = parseInt(streakResult.rows[0].streak);

    res.json({
      learningHours: parseFloat((totalSeconds / 3600).toFixed(1)),
      completionPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
      streak,
      continueLearning: continueResult.rows[0] || null,
      upcomingLive: upcomingLiveResult.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/courses
// Enrolled courses with per-course progress %
export async function getEnrolledCourses(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.category,
         c.difficulty,
         c.thumbnail_url,
         u.name AS instructor_name,
         e.enrolled_at,
         e.status AS enrollment_status,
         COUNT(l.id) AS total_lessons,
         COUNT(p.id) FILTER (WHERE p.status = 'completed') AS completed_lessons,
         ROUND(
           100.0 * COUNT(p.id) FILTER (WHERE p.status = 'completed')
           / NULLIF(COUNT(l.id), 0)
         ) AS progress_percent
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = $1
       WHERE e.user_id = $1 AND e.status = 'active'
       GROUP BY c.id, c.title, c.description, c.category, c.difficulty,
                c.thumbnail_url, u.name, e.enrolled_at, e.status
       ORDER BY e.enrolled_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/student/courses/discover
// Full course catalogue — shows enrollment status for this student
export async function getAllCourses(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.category,
         c.difficulty,
         c.thumbnail_url,
         u.name AS instructor_name,
         COUNT(DISTINCT l.id) AS total_lessons,
         CASE WHEN e.id IS NOT NULL THEN true ELSE false END AS enrolled
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       LEFT JOIN modules m ON m.course_id = c.id
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       GROUP BY c.id, c.title, c.description, c.category,
                c.difficulty, c.thumbnail_url, u.name, e.id
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/student/courses/:id/enroll
export async function enrollCourse(req, res, next) {
  try {
    const userId = req.user.id;
    const { id: courseId } = req.params;

    // Check course exists
    const course = await pool.query(
      "SELECT id FROM courses WHERE id = $1",
      [courseId]
    );
    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Upsert — safe to call even if already enrolled
    await pool.query(
      `INSERT INTO enrollments (user_id, course_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, course_id) DO NOTHING`,
      [userId, courseId]
    );

    res.status(201).json({ message: "Enrolled successfully" });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/lessons/:lessonId/resources
export async function getLessonResources(req, res, next) {
  try {
    const { lessonId } = req.params;
    const result = await pool.query(
      `SELECT id, title, file_url, file_size, created_at
       FROM resources
       WHERE lesson_id = $1
       ORDER BY created_at DESC`,
      [lessonId]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/student/courses/:courseId/learn
// Returns the full course structure for the lesson player —
// all modules and lessons so the sidebar can be built client-side
export async function getCoursePlayer(req, res, next) {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    // Confirm student is enrolled
    const enrollment = await pool.query(
      `SELECT id FROM enrollments
       WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
      [userId, courseId]
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ message: "You are not enrolled in this course" });
    }

    // Course info
    const course = await pool.query(
      `SELECT c.id, c.title, c.description, u.name AS instructor_name
       FROM courses c
       LEFT JOIN users u ON u.id = c.instructor_id
       WHERE c.id = $1`,
      [courseId]
    );
    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Modules + lessons + student progress in one query
    const modules = await pool.query(
      `SELECT
         m.id, m.title, m.order_index,
         json_agg(
           json_build_object(
             'id',          l.id,
             'title',       l.title,
             'type',        l.type,
             'duration',    l.duration,
             'order_index', l.order_index,
             'status',      COALESCE(p.status, 'not_started'),
             'score',       p.score
           ) ORDER BY l.order_index
         ) FILTER (WHERE l.id IS NOT NULL) AS lessons
       FROM modules m
       LEFT JOIN lessons l ON l.module_id = m.id
       LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = $1
       WHERE m.course_id = $2
       GROUP BY m.id
       ORDER BY m.order_index`,
      [userId, courseId]
    );

    // Course-level resources
    const resources = await pool.query(
      `SELECT id, title, file_url, file_size
       FROM resources
       WHERE course_id = $1
       ORDER BY created_at DESC`,
      [courseId]
    );

    res.json({
      ...course.rows[0],
      modules: modules.rows,
      resources: resources.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/courses/:courseId/lessons/:lessonId
// Returns full lesson content + resources
export async function getLessonContent(req, res, next) {
  try {
    const { courseId, lessonId } = req.params;
    const userId = req.user.id;

    // Confirm enrollment
    const enrollment = await pool.query(
      `SELECT id FROM enrollments
       WHERE user_id = $1 AND course_id = $2 AND status = 'active'`,
      [userId, courseId]
    );
    if (enrollment.rows.length === 0) {
      return res.status(403).json({ message: "Not enrolled" });
    }

    const lesson = await pool.query(
      `SELECT l.id, l.title, l.type, l.content, l.content_url, l.duration,
              COALESCE(p.status, 'not_started') AS status,
              p.score, p.time_spent
       FROM lessons l
       LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = $1
       WHERE l.id = $2`,
      [userId, lessonId]
    );
    if (lesson.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const resources = await pool.query(
      `SELECT id, title, file_url, file_size
       FROM resources
       WHERE lesson_id = $1
       ORDER BY created_at DESC`,
      [lessonId]
    );

    // Update last_accessed and mark as in_progress if not already completed
    await pool.query(
      `INSERT INTO progress (user_id, lesson_id, status, last_accessed)
       VALUES ($1, $2, 'in_progress', now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE
         SET last_accessed = now(),
             status = CASE
               WHEN progress.status = 'completed' THEN 'completed'
               ELSE 'in_progress'
             END,
             updated_at = now()`,
      [userId, lessonId]
    );

    res.json({ ...lesson.rows[0], resources: resources.rows });
  } catch (err) {
    next(err);
  }
}

// POST /api/student/courses/:courseId/lessons/:lessonId/complete
export async function completeLesson(req, res, next) {
  try {
    const { lessonId } = req.params;
    const userId = req.user.id;
    const { time_spent } = req.body;

    await pool.query(
      `INSERT INTO progress (user_id, lesson_id, status, time_spent, last_accessed, updated_at)
       VALUES ($1, $2, 'completed', $3, now(), now())
       ON CONFLICT (user_id, lesson_id) DO UPDATE
         SET status       = 'completed',
             time_spent   = EXCLUDED.time_spent,
             last_accessed = now(),
             updated_at   = now()`,
      [userId, lessonId, time_spent ?? 0]
    );

    res.json({ message: "Lesson marked as complete" });
  } catch (err) {
    next(err);
  }
}

// Returns quiz questions WITHOUT correct answers
// GET /api/student/courses/:courseId/modules/:moduleId/quiz
export async function getQuizForStudent(req, res, next) {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;

    const quiz = await pool.query(
      `SELECT q.id, q.title, q.module_id FROM quizzes q
       WHERE q.module_id = $1`,
      [moduleId]
    );
    if (quiz.rows.length === 0) {
      return res.status(404).json({ message: "No quiz for this module" });
    }

    const questions = await pool.query(
      `SELECT id, question, options, order_index
       FROM quiz_questions
       WHERE quiz_id = $1
       ORDER BY order_index`,
      [quiz.rows[0].id]
    );

    const attempts = await pool.query(
      `SELECT id, score, answers, attempted_at
       FROM quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2
       ORDER BY attempted_at DESC`,
      [userId, quiz.rows[0].id]
    );

    res.json({
      ...quiz.rows[0],
      questions: questions.rows,
      attempts: attempts.rows,
      attempt_count: attempts.rows.length,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/student/courses/:courseId/modules/:moduleId/quiz/submit
export async function submitQuiz(req, res, next) {
  try {
    const { moduleId } = req.params;
    const userId = req.user.id;
    const { answers } = req.body;

    if (!answers || Object.keys(answers).length === 0) {
      return res.status(400).json({ message: "No answers provided" });
    }

    const quiz = await pool.query(
      `SELECT * FROM quizzes WHERE module_id = $1`,
      [moduleId]
    );
    if (quiz.rows.length === 0) {
      return res.status(404).json({ message: "Quiz not found" });
    }
    const quizId = quiz.rows[0].id;

    const questions = await pool.query(
      `SELECT id, correct_answer FROM quiz_questions WHERE quiz_id = $1`,
      [quizId]
    );

    let correct = 0;
    const results = {};
    questions.rows.forEach(({ id, correct_answer }) => {
      const studentAnswer = answers[id];
      const isCorrect = studentAnswer === correct_answer;
      if (isCorrect) correct++;
      results[id] = {
        correct: isCorrect,
        correct_answer,
        student_answer: studentAnswer,
      };
    });

    const score = Math.round((correct / questions.rows.length) * 100);

    const attempt = await pool.query(
      `INSERT INTO quiz_attempts (user_id, quiz_id, answers, score)
       VALUES ($1, $2, $3, $4)
       RETURNING id, score, attempted_at`,
      [userId, quizId, JSON.stringify(answers), score]
    );

    res.json({
      score,
      correct,
      total: questions.rows.length,
      results,
      attempt: attempt.rows[0],
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/student/sessions
// All upcoming + live sessions for courses the student is enrolled in
export async function getMyLiveSessions(req, res, next) {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT
         ls.id, ls.title, ls.scheduled_at, ls.status, ls.room_id,
         c.id AS course_id, c.title AS course_title,
         u.name AS instructor_name,
         EXISTS (
           SELECT 1 FROM live_attendance la
           WHERE la.session_id = ls.id AND la.user_id = $1
         ) AS joined
       FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       JOIN users u ON u.id = ls.instructor_id
       WHERE ls.status IN ('scheduled', 'live')
       ORDER BY
         CASE ls.status WHEN 'live' THEN 0 ELSE 1 END,
         ls.scheduled_at ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/student/sessions/:id/join
// Records attendance when student joins
export async function joinSession(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const session = await pool.query(
      `SELECT ls.* FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       JOIN enrollments e ON e.course_id = c.id AND e.user_id = $1
       WHERE ls.id = $2`,
      [userId, id]
    );

    if (session.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (session.rows[0].status === "ended") {
      return res.status(400).json({ message: "This session has ended" });
    }

    // Upsert attendance record
    await pool.query(
      `INSERT INTO live_attendance (session_id, user_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [id, userId]
    );

    res.json({
      room_id: session.rows[0].room_id,
      title: session.rows[0].title,
      status: session.rows[0].status,
    });
  } catch (err) {
    next(err);
  }
}