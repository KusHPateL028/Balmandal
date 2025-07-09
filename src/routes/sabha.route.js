import { Router } from "express";
import {
  createSabha,
  deleteSabha,
  getSabha,
  updateSabha,
} from "../controllers/sabha.controller.js";

const router = Router();

router.route("/create").post(createSabha);
router.route("/").get(getSabha);
router.route("/delete/:id").delete(deleteSabha);
router.route("/update/:id").patch(updateSabha);

export default router;
