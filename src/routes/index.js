import { Router } from "express";
import roleRouter from "./role.route.js";
import areaRouter from "./area.route.js";
import sabhaRouter from "./sabha.route.js";

const indexRouter = Router();

indexRouter.use("/role", roleRouter);
indexRouter.use("/area", areaRouter);
indexRouter.use("/sabha", sabhaRouter);

export default indexRouter;
