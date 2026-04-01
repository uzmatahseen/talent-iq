import express from "express";
import { getStreamToken, executeCode } from "../controllers/chatController.js";
import { protectRoute } from "../middleware/protectRoute.js";

const router = express.Router();

router.get("/token", protectRoute, getStreamToken);
router.post("/execute", protectRoute, executeCode);

export default router;
