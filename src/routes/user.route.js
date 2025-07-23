import { Router } from "express";
import { createUser } from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/create").post(upload.single("avatar") , createUser);

export default router;