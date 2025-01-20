import { Router } from "express";
import { upload } from "../middlewares/multerMiddleware.js";
import { resizeImage } from "../middlewares/resizeMiddleware.js";
import { createBanner, getAllBanner, deleteBanner } from "../controllers/bannerController.js";

const bannerRouter = Router();

bannerRouter.post("/create", upload.single("image"), resizeImage, createBanner);
bannerRouter.get("/get", getAllBanner);
bannerRouter.delete("/delete/:bannerId", deleteBanner);

export default bannerRouter