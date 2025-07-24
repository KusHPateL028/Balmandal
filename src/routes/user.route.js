import { Router } from "express";
import {
    changePassword,
  createUser,
  deleteUser,
  getUser,
  getUserByID,
  getUserByRole,
  logoutUser,
  updateUser,
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/create").post(upload.single("avatar"), createUser);
router.route("/").get(getUser);
router.route("/:id").get(getUserByID);
router.route("/role/:roleId").get(getUserByRole);
router.route("/delete/:id").delete(deleteUser);
router.route("/update/:id").patch(upload.single("avatar"), updateUser);
router.route("/logout").post(logoutUser);
router.route("/change-password").post(changePassword);

export default router;