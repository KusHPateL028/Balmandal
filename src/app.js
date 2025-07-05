import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import indexRouter from "./routes/index.js";

const app = express();

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use("/api", indexRouter);

export default app;