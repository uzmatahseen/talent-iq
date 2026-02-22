import express from "express";
import { clerkMiddleware } from "@clerk/express";
import { protectRoute } from "../middleware/protectRoute.js";
import { syncUser, getCurrentUser } from "../controllers/userController.js";

const router = express.Router();

// Sync user - doesn't require protectRoute since user might not exist yet
router.post("/sync", clerkMiddleware(), syncUser);

// Get current user - requires authentication
router.get("/me", protectRoute, getCurrentUser);

export default router;
