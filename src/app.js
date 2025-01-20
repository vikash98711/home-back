import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// import routes
import baseRouter from "./routes/baseRoutes.js";
import userRouter from "./routes/userRoutes.js";
import categoryRouter from "./routes/categoryRoutes.js";
import productRouter from "./routes/productRoute.js";
import blogRouter from "./routes/blogRoutes.js";
import bannerRouter from "./routes/bannerRoutes.js";

app.use("/api/v1/base", baseRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/blogs", blogRouter);
app.use("/api/v1/banners", bannerRouter);

export { app };
