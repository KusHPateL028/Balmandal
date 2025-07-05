import { Router } from "express";
import { createRole, deleteRole, getRole, updateRole } from "../controllers/role.controller.js";

const router = Router();

router.route("/create").post(createRole);
router.route("/delete/:id").delete(deleteRole);
router.route("/update/:id").patch(updateRole);
router.route("/").get(getRole);

export default router;
