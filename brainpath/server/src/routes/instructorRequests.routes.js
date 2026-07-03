import { Router } from "express";
import { submitRequest } from "../controllers/instructorRequests.controller.js";

const router = Router();

router.post("/", submitRequest);

export default router;