import { pool } from "../config/db.js";
import { nanoid } from "nanoid";

// GET /api/instructor/courses
// Lists all courses created by this instructor
export async function getMyCourses(req, res, next) {
  try {
    const instructorId = req.user.id;

    const result = await pool.query(
      `SELECT
         c.id,
         c.title,
         c.description,
         c.category,
         c.difficulty,
         c.thumbnail_url,
         c.created_at,
         COUNT(DISTINCT e.id)  AS enrolled_students,
         COUNT(DISTINCT m.id)  AS total_modules,
         COUNT(DISTINCT l.id)  AS total_lessons,
         ROUND(
           AVG(
             CASE WHEN p.status = 'completed' THEN 100 ELSE 0 END
           ), 1
         ) AS avg_completion
       FROM courses c
       LEFT JOIN enrollments e  ON e.course_id = c.id
       LEFT JOIN modules m      ON m.course_id = c.id
       LEFT JOIN lessons l      ON l.module_id = m.id
       LEFT JOIN progress p     ON p.lesson_id = l.id
       WHERE c.instructor_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [instructorId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/instructor/courses/:id
export async function getCourseDetail(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    const course = await pool.query(
      `SELECT * FROM courses WHERE id = $1 AND instructor_id = $2`,
      [id, instructorId]
    );
    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const [modules, resources] = await Promise.all([
      pool.query(
        `SELECT
           m.id, m.title, m.order_index,
           json_agg(
             json_build_object(
               'id',          l.id,
               'title',       l.title,
               'type',        l.type,
               'duration',    l.duration,
               'order_index', l.order_index
             ) ORDER BY l.order_index
           ) FILTER (WHERE l.id IS NOT NULL) AS lessons
         FROM modules m
         LEFT JOIN lessons l ON l.module_id = m.id
         WHERE m.course_id = $1
         GROUP BY m.id
         ORDER BY m.order_index`,
        [id]
      ),
      pool.query(
        `SELECT id, title, file_url, file_size, lesson_id, course_id, created_at
         FROM resources
         WHERE course_id = $1
         ORDER BY created_at DESC`,
        [id]
      ),
    ]);

    res.json({
      ...course.rows[0],
      modules: modules.rows,
      resources: resources.rows,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/courses
export async function createCourse(req, res, next) {
  try {
    const instructorId = req.user.id;
    const { title, description, category, difficulty } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const result = await pool.query(
      `INSERT INTO courses (title, description, category, difficulty, instructor_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [title, description, category, difficulty, instructorId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/instructor/courses/:id
export async function updateCourse(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;
    const { title, description, category, difficulty } = req.body;

    const result = await pool.query(
      `UPDATE courses
       SET title       = COALESCE($1, title),
           description = COALESCE($2, description),
           category    = COALESCE($3, category),
           difficulty  = COALESCE($4, difficulty)
       WHERE id = $5 AND instructor_id = $6
       RETURNING *`,
      [title, description, category, difficulty, id, instructorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/instructor/courses/:id
export async function deleteCourse(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    const result = await pool.query(
      `DELETE FROM courses WHERE id = $1 AND instructor_id = $2 RETURNING id`,
      [id, instructorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/courses/:id/modules
export async function createModule(req, res, next) {
  try {
    const { id: courseId } = req.params;
    const instructorId = req.user.id;
    const { title, order_index } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Module title is required" });
    }

    // Verify this instructor owns the course
    const course = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
      [courseId, instructorId]
    );
    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    const result = await pool.query(
      `INSERT INTO modules (course_id, title, order_index)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [courseId, title, order_index ?? 0]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/courses/:courseId/modules/:moduleId/lessons
export async function createLesson(req, res, next) {
  try {
    const { courseId, moduleId } = req.params;
    const instructorId = req.user.id;
    const { title, type, content, content_url, duration, order_index } = req.body;

    if (!title || !type) {
      return res.status(400).json({ message: "Title and type are required" });
    }
    if (!["video", "text", "quiz"].includes(type)) {
      return res.status(400).json({ message: "Type must be video, text, or quiz" });
    }

    // Verify instructor owns the course
    const course = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
      [courseId, instructorId]
    );
    if (course.rows.length === 0) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Verify module belongs to that course
    const module = await pool.query(
      `SELECT id FROM modules WHERE id = $1 AND course_id = $2`,
      [moduleId, courseId]
    );
    if (module.rows.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    const result = await pool.query(
      `INSERT INTO lessons (module_id, title, type, content, content_url, duration, order_index)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        moduleId,
        title,
        type,
        content ?? null,
        content_url ?? null,
        duration ?? null,
        order_index ?? 0,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/instructor/courses/:courseId/modules/:moduleId/lessons/:lessonId
export async function updateLesson(req, res, next) {
  try {
    const { courseId, lessonId, moduleId } = req.params;
    const instructorId = req.user.id;
    const { title, content, content_url, duration } = req.body;

    // Verify ownership chain
    const check = await pool.query(
      `SELECT l.id FROM lessons l
       JOIN modules m ON m.id = l.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE l.id = $1 AND m.id = $2 AND c.id = $3 AND c.instructor_id = $4`,
      [lessonId, moduleId, courseId, instructorId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    const result = await pool.query(
      `UPDATE lessons
       SET title       = COALESCE($1, title),
           content     = COALESCE($2, content),
           content_url = COALESCE($3, content_url),
           duration    = COALESCE($4, duration)
       WHERE id = $5
       RETURNING *`,
      [title, content, content_url, duration, lessonId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/instructor/courses/:courseId/modules/:moduleId/lessons/:lessonId
export async function deleteLesson(req, res, next) {
  try {
    const { courseId, lessonId, moduleId } = req.params;
    const instructorId = req.user.id;

    const result = await pool.query(
      `DELETE FROM lessons l
       USING modules m, courses c
       WHERE l.id = $1
         AND l.module_id = m.id
         AND m.id = $2
         AND m.course_id = c.id
         AND c.id = $3
         AND c.instructor_id = $4
       RETURNING l.id`,
      [lessonId, moduleId, courseId, instructorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Lesson not found" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/resources
// Attach a resource to either a lesson or a course
export async function addResource(req, res, next) {
  try {
    const instructorId = req.user.id;
    const { title, file_url, file_size, lesson_id, course_id } = req.body;

    if (!title || !file_url) {
      return res.status(400).json({ message: "title and file_url are required" });
    }
    if (!lesson_id && !course_id) {
      return res.status(400).json({ message: "lesson_id or course_id is required" });
    }
    if (lesson_id && course_id) {
      return res.status(400).json({ message: "Provide either lesson_id or course_id, not both" });
    }

    // Verify instructor owns the course
    if (course_id) {
      const check = await pool.query(
        `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
        [course_id, instructorId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Not authorised" });
      }
    }

    if (lesson_id) {
      const check = await pool.query(
        `SELECT l.id FROM lessons l
         JOIN modules m ON m.id = l.module_id
         JOIN courses c ON c.id = m.course_id
         WHERE l.id = $1 AND c.instructor_id = $2`,
        [lesson_id, instructorId]
      );
      if (check.rows.length === 0) {
        return res.status(403).json({ message: "Not authorised" });
      }
    }

    const result = await pool.query(
      `INSERT INTO resources (title, file_url, file_size, lesson_id, course_id, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, file_url, file_size ?? null, lesson_id ?? null, course_id ?? null, instructorId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/instructor/resources/:id
export async function deleteResource(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    const result = await pool.query(
      `DELETE FROM resources r
       USING courses c
       WHERE r.id = $1
         AND (
           (r.course_id = c.id AND c.instructor_id = $2)
           OR
           (r.lesson_id IN (
             SELECT l.id FROM lessons l
             JOIN modules m ON m.id = l.module_id
             WHERE m.course_id = c.id AND c.instructor_id = $2
           ))
         )
       RETURNING r.id`,
      [id, instructorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Resource not found" });
    }

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/courses/:courseId/lessons/:lessonId/quiz
// POST /api/instructor/courses/:courseId/modules/:moduleId/quiz
export async function createQuiz(req, res, next) {
  try {
    const { courseId, moduleId } = req.params;
    const instructorId = req.user.id;
    const { title, questions } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Quiz title is required" });
    }
    if (!questions || questions.length === 0) {
      return res.status(400).json({ message: "At least one question is required" });
    }

    // Verify instructor owns the course and module belongs to it
    const check = await pool.query(
      `SELECT m.id FROM modules m
       JOIN courses c ON c.id = m.course_id
       WHERE m.id = $1 AND c.id = $2 AND c.instructor_id = $3`,
      [moduleId, courseId, instructorId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Module not found" });
    }

    // Remove any existing quiz for this module first
    await pool.query(`DELETE FROM quizzes WHERE module_id = $1`, [moduleId]);

    // Create quiz
    const quiz = await pool.query(
      `INSERT INTO quizzes (module_id, title) VALUES ($1, $2) RETURNING *`,
      [moduleId, title]
    );
    const quizId = quiz.rows[0].id;

    // Insert questions
    for (let i = 0; i < questions.length; i++) {
      const { question, type, options, correct_answer } = questions[i];
      await pool.query(
        `INSERT INTO quiz_questions
           (quiz_id, question, options, correct_answer, order_index)
         VALUES ($1, $2, $3, $4, $5)`,
        [quizId, question, JSON.stringify(options), correct_answer, i]
      );
    }

    res.status(201).json(quiz.rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/instructor/courses/:courseId/modules/:moduleId/quiz
export async function getQuiz(req, res, next) {
  try {
    const { courseId, moduleId } = req.params;
    const instructorId = req.user.id;

    const quiz = await pool.query(
      `SELECT q.* FROM quizzes q
       JOIN modules m ON m.id = q.module_id
       JOIN courses c ON c.id = m.course_id
       WHERE q.module_id = $1 AND c.id = $2 AND c.instructor_id = $3`,
      [moduleId, courseId, instructorId]
    );
    if (quiz.rows.length === 0) {
      return res.status(404).json({ message: "No quiz for this module yet" });
    }

    const questions = await pool.query(
      `SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index`,
      [quiz.rows[0].id]
    );

    res.json({ ...quiz.rows[0], questions: questions.rows });
  } catch (err) {
    next(err);
  }
}

// GET /api/instructor/dashboard
export async function getDashboardData(req, res, next) {
  try {
    const instructorId = req.user.id;

    const [
      coursesResult,
      studentsResult,
      completionResult,
      upcomingLiveResult,
      recentEnrollmentsResult,
      topCoursesResult,
    ] = await Promise.all([

      // Total courses created
      pool.query(
        `SELECT COUNT(*) FROM courses WHERE instructor_id = $1`,
        [instructorId]
      ),

      // Total unique students across all courses
      pool.query(
        `SELECT COUNT(DISTINCT e.user_id) AS total
         FROM enrollments e
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = $1`,
        [instructorId]
      ),

      // Average completion % across all courses
      pool.query(
        `SELECT ROUND(AVG(sub.pct), 1) AS avg_completion
         FROM (
           SELECT
             c.id,
             ROUND(
               100.0 * COUNT(p.id) FILTER (WHERE p.status = 'completed')
               / NULLIF(COUNT(l.id), 0)
             ) AS pct
           FROM courses c
           LEFT JOIN modules m ON m.course_id = c.id
           LEFT JOIN lessons l ON l.module_id = m.id
           LEFT JOIN progress p ON p.lesson_id = l.id
           WHERE c.instructor_id = $1
           GROUP BY c.id
         ) sub`,
        [instructorId]
      ),

      // Upcoming live sessions
      pool.query(
        `SELECT
           ls.id, ls.title, ls.scheduled_at, ls.status, ls.room_id,
           c.title AS course_title,
           COUNT(la.id) AS registered_count
         FROM live_sessions ls
         JOIN courses c ON c.id = ls.course_id
         LEFT JOIN live_attendance la ON la.session_id = ls.id
         WHERE c.instructor_id = $1
           AND ls.scheduled_at >= NOW()
           AND ls.status IN ('scheduled', 'live')
         GROUP BY ls.id, c.title
         ORDER BY ls.scheduled_at ASC
         LIMIT 3`,
        [instructorId]
      ),

      // Recent enrollments across all courses
      pool.query(
        `SELECT
           u.name, u.email,
           c.title AS course_title,
           e.enrolled_at
         FROM enrollments e
         JOIN users u ON u.id = e.user_id
         JOIN courses c ON c.id = e.course_id
         WHERE c.instructor_id = $1
         ORDER BY e.enrolled_at DESC
         LIMIT 8`,
        [instructorId]
      ),

      // Top courses by enrollment
      pool.query(
        `SELECT
           c.id,
           c.title,
           COUNT(DISTINCT e.user_id) AS enrolled_students,
           COUNT(DISTINCT l.id) AS total_lessons,
           ROUND(
             100.0 * COUNT(p.id) FILTER (WHERE p.status = 'completed')
             / NULLIF(COUNT(l.id) * COUNT(DISTINCT e.user_id), 0)
           ) AS avg_completion
         FROM courses c
         LEFT JOIN enrollments e ON e.course_id = c.id
         LEFT JOIN modules m ON m.course_id = c.id
         LEFT JOIN lessons l ON l.module_id = m.id
         LEFT JOIN progress p ON p.lesson_id = l.id
         WHERE c.instructor_id = $1
         GROUP BY c.id
         ORDER BY enrolled_students DESC
         LIMIT 5`,
        [instructorId]
      ),
    ]);

    res.json({
      stats: {
        totalCourses:     parseInt(coursesResult.rows[0].count),
        totalStudents:    parseInt(studentsResult.rows[0].total),
        avgCompletion:    parseFloat(completionResult.rows[0].avg_completion ?? 0),
        upcomingLive:     upcomingLiveResult.rows.length,
      },
      upcomingLive:       upcomingLiveResult.rows,
      recentEnrollments:  recentEnrollmentsResult.rows,
      topCourses:         topCoursesResult.rows,
    });
  } catch (err) {
    next(err);
  }
}


// GET /api/instructor/sessions
export async function getMySessions(req, res, next) {
  try {
    const instructorId = req.user.id;

    const result = await pool.query(
      `SELECT
         ls.id, ls.title, ls.scheduled_at, ls.status, ls.room_id,
         ls.recording_url,
         c.id AS course_id, c.title AS course_title,
         COUNT(la.id) AS attendee_count
       FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       LEFT JOIN live_attendance la ON la.session_id = ls.id
       WHERE c.instructor_id = $1
       GROUP BY ls.id, c.id, c.title
       ORDER BY ls.scheduled_at DESC`,
      [instructorId]
    );

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
}

// POST /api/instructor/sessions
export async function createSession(req, res, next) {
  try {
    const instructorId = req.user.id;
    const { title, course_id, scheduled_at } = req.body;

    if (!title || !course_id) {
      return res.status(400).json({ message: "title and course_id are required" });
    }

    // Verify instructor owns the course
    const course = await pool.query(
      `SELECT id FROM courses WHERE id = $1 AND instructor_id = $2`,
      [course_id, instructorId]
    );
    if (course.rows.length === 0) {
      return res.status(403).json({ message: "Course not found" });
    }

    // Generate a unique unguessable room ID
    const roomId = `brainpath-${course_id.slice(0, 8)}-${nanoid(10)}`;

    const result = await pool.query(
      `INSERT INTO live_sessions
         (course_id, instructor_id, title, room_id, scheduled_at, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        course_id,
        instructorId,
        title,
        roomId,
        scheduled_at ?? new Date().toISOString(),
        scheduled_at ? "scheduled" : "live",
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/instructor/sessions/:id/start
export async function startSession(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    // First verify ownership
    const check = await pool.query(
      `SELECT ls.id FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       WHERE ls.id = $1 AND c.instructor_id = $2`,
      [id, instructorId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const result = await pool.query(
      `UPDATE live_sessions
       SET status = 'live'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function endSession(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    // Verify ownership
    const check = await pool.query(
      `SELECT ls.id FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       WHERE ls.id = $1 AND c.instructor_id = $2`,
      [id, instructorId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }

    const result = await pool.query(
      `UPDATE live_sessions
       SET status = 'ended'
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const instructorId = req.user.id;

    // Verify ownership and that session is not live
    const check = await pool.query(
      `SELECT ls.id, ls.status FROM live_sessions ls
       JOIN courses c ON c.id = ls.course_id
       WHERE ls.id = $1 AND c.instructor_id = $2`,
      [id, instructorId]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ message: "Session not found" });
    }
    if (check.rows[0].status === "live") {
      return res.status(400).json({ message: "Cannot delete a live session — end it first" });
    }

    await pool.query(
      `DELETE FROM live_sessions WHERE id = $1`,
      [id]
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}