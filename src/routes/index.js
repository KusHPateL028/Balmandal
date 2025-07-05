import { Router } from "express";
import roleRouter from "./role.route.js";
import areaRouter from "./area.route.js";

const indexRouter = Router();

indexRouter.use("/role", roleRouter);
indexRouter.use("/area", areaRouter);

export default indexRouter;
