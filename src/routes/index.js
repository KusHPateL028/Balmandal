import { Router } from "express";
import roleRouter from "./role.route.js";
import areaRouter from "./area.route.js";
import sabhaRouter from "./sabha.route.js";
import userRouter from "./user.route.js";

const indexRouter = Router();

indexRouter.use("/role", roleRouter);
indexRouter.use("/area", areaRouter);
indexRouter.use("/sabha", sabhaRouter);
indexRouter.use("/user", userRouter);

export default indexRouter;
