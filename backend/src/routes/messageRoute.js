import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  searchMessages,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.get("/search/:conversationId", searchMessages);

export default router;
