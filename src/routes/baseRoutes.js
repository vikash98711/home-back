import { Router } from "express";
import { getCount } from "../controllers/baseController.js";

const baseRouter = Router();

baseRouter.get("/get/count", getCount);

export default baseRouter;
