import express from "express";

import {
  sendDirectMessage,
  sendGroupMessage,
  searchMessages,
  uploadMessageImage,
  deleteMessageImage,
} from "../controllers/messageController.js";
import {
  checkFriendship,
  checkGroupMembership,
} from "../middlewares/friendMiddleware.js";
import { upload } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.post("/direct", checkFriendship, sendDirectMessage);
router.post("/group", checkGroupMembership, sendGroupMessage);
router.post("/upload-image", upload.single("file"), uploadMessageImage);
router.delete("/delete-image", deleteMessageImage);
router.get("/search/:conversationId", searchMessages);

export default router;
