import { Router } from "express";
import { upload } from "../middlewares/multerMiddleware.js";
import { resizeImage } from "../middlewares/resizeMiddleware.js";
import {
  createBlog,
  getBlog,
  getAllBlogs,
  getRecentBlogs,
  updateBlog,
  deleteBlog
} from "../controllers/blogController.js";

const blogRouter = Router();

blogRouter.post("/create", upload.fields([{ name: "thumbnail" }, { name: "detailImage" }]), resizeImage, createBlog);
blogRouter.get("/:blogId", getBlog);
blogRouter.get("/get/all", getAllBlogs);
blogRouter.get("/get/recent", getRecentBlogs);
blogRouter.patch(
  "/update/:blogId",
  upload.fields([{ name: "thumbnail" }, { name: "detailImage" }]),
  resizeImage,
  updateBlog
);
blogRouter.delete("/delete/:blogId", deleteBlog);

export default blogRouter;
