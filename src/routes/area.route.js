import { Router } from "express";
import {
  createArea,
  deleteArea,
  getArea,
  updateArea,
} from "../controllers/area.controller.js";

const router = Router();

router.route("/").get(getArea);
router.route("/create").post(createArea);
router.route("/delete/:id").delete(deleteArea);
router.route("/update/:id").patch(updateArea);

export default router;
