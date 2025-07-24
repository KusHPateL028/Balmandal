import { Router } from "express";
import roleRouter from "./role.route.js";
import areaRouter from "./area.route.js";
import sabhaRouter from "./sabha.route.js";
import userRouter from "./user.route.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { loginUser } from "../controllers/user.controller.js";

const indexRouter = Router();

indexRouter.use("/role", verifyJWT, roleRouter);
indexRouter.use("/area", verifyJWT, areaRouter);
indexRouter.use("/sabha", verifyJWT, sabhaRouter);
indexRouter.use("/user", verifyJWT, userRouter);
indexRouter.post("/login", loginUser);

export default indexRouter;
