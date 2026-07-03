import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import healthRoutes from "./routes/health.routes.js";
import coursesRoutes from "./routes/courses.routes.js";
import authRoutes from "./routes/auth.routes.js";
import instructorRoutes from "./routes/instructor.routes.js";
import instructorRequestsRoutes from "./routes/instructorRequests.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import studentRoutes from "./routes/student.routes.js"
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    // Must be an explicit origin, not '*', because credentials: true is set
    // below — the refresh-token cookie won't be sent/accepted otherwise.
    // origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    // credentials: true,

    origin: (origin, callback) => {
      const allowed = [
        process.env.CLIENT_ORIGIN,
        "http://localhost:5173",
      ].filter(Boolean);

      // allow requests with no origin (e.g. curl, Postman)
      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS: origin ${origin} not allowed`));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/courses", coursesRoutes);
app.use("/api/instructor-requests", instructorRequestsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/student", studentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;