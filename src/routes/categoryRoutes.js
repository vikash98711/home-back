import { Router } from "express";
import { upload } from "../middlewares/multerMiddleware.js";
import { resizeImage } from "../middlewares/resizeMiddleware.js";
import {
  createCategory,
  getAllCategories,
  getAllCategoriesNames,
  getCategory,
  updateCategory,
  deleteCategory
} from "../controllers/categoryController.js";

const categoryRouter = Router();

categoryRouter.post(
  "/create",
  upload.single("thumbnail"),
  resizeImage,
  createCategory
);
categoryRouter.get("/get/all", getAllCategories);
categoryRouter.get("/get/names", getAllCategoriesNames);
categoryRouter.get("/get/:categoryId", getCategory);
categoryRouter.patch(
  "/update/:categoryId",
  upload.single("thumbnail"),
  resizeImage,
  updateCategory
);
categoryRouter.delete("/delete/:categoryId", deleteCategory);

export default categoryRouter;
