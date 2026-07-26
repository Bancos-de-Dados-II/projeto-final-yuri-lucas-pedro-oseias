import { Router } from "express";
import { uploadController } from "../controllers/UploadController.ts";
import { handleUploadMiddleware } from "../middlewares/uploadMiddleware.ts";

const uploadRouter = Router();

uploadRouter.post("/", handleUploadMiddleware, (req, res) => uploadController.uploadFile(req, res));

export { uploadRouter };
