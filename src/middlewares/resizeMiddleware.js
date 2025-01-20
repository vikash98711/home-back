import sharp from "sharp";
import path from "path";
import fs from "fs";
import { ApiResponse } from "../utils/ApiResponse.js";

sharp.cache(false);

export const resizeImage = async (req, res, next) => {
  try {
    const files = req.files;

    if (!files || Object.keys(files).length === 0) {
      return next(); // Skip if no files are uploaded
    }

    for (const key of Object.keys(files)) {
      const fileArray = Array.isArray(files[key]) ? files[key] : [files[key]];

      for (const file of fileArray) {
        const originalName = file.originalname;
        const metadata = await sharp(file.buffer).metadata();
        const aspectRatio = (metadata.width || 1) / (metadata.height || 1);

        let newWidth = Math.min(1440, metadata.width || 1440);
        let newHeight = Math.round(newWidth / aspectRatio);

        if (newHeight > 1080) {
          newHeight = 1080;
          newWidth = Math.round(newHeight * aspectRatio);
        }

        if (process.env.MEMORY === "true") {
          // If processing in memory (buffer)
          const resizedImageBuffer = await sharp(file.buffer)
            .resize(newWidth, newHeight)
            .toFormat("jpeg")
            .jpeg({ quality: 70 })
            .toBuffer();

          file.buffer = resizedImageBuffer;
          file.filename = `resized-${Date.now()}-${originalName}`;
        } else {
          // If processing on disk (toFile)
          const imagePath = path.join(__dirname, file.path);
          const outputFilePath = path.join(
            __dirname,
            "./public/temp",
            `resized-${Date.now()}-${file.filename}`
          );

          await sharp(imagePath)
            .resize(newWidth, newHeight)
            .toFormat("jpeg")
            .jpeg({ quality: 70 })
            .toFile(outputFilePath);

          fs.unlinkSync(imagePath); // Delete the original file after resizing
          file.path = outputFilePath;
          file.filename = `resized-${Date.now()}-${file.filename}`;
        }
      }
    }

    next(); // Proceed to the next middleware
  } catch (err) {
    console.error("Error processing image:", err);
    res
      .status(500)
      .json(
        new ApiResponse(
          500,
          err.message,
          "Something went wrong while processing the images"
        )
      );
  }
};
