import { Router } from "express";
import { sendMessage, getMessages } from "../controllers/message.controllers.js";
import { verifyJWT_username } from "../middlewares/verifyJWT.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/sendMessage").post(verifyJWT_username, upload.single("file"), sendMessage);
router.route("/getMessages/:chatId").get(verifyJWT_username, getMessages);

export default router;
