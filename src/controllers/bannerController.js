import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Banner } from "../model/bannerModel.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";

// create banner
const createBanner = asyncHandler(async (req, res) => {
    // get all banner counts
    const count = await Banner.countDocuments();
    if (count >= 3) {
         return res.status(400).json(new ApiResponse(400, null, "Banner limit reached"));
    }
    // get the image
    const image = req.file;
    // validate the image
    if (image.mimetype !== "image/jpeg" && image.mimetype !== "image/png") {
        return res.status(400).json(new ApiResponse(400, null, "Invalid image format"));
    }
    // upload the images
    const imageUrl = await uploadFile(image);
    // validate the images
    if (!imageUrl) {
        return res.status(500).json(new ApiResponse(500, null, "Image upload failed"));
    }
    // create the banner
    const banner = await Banner.create({
        image: imageUrl,
    })
    // validate the banner
    const createdBanner = await Banner.findById(banner._id);
    if (!createdBanner) {
        return res.status(500).json(new ApiResponse(500, null, "Banner creation failed"));
    }
    // send the response
    return res.status(200).json(new ApiResponse(200, {}, "Banner created successfully"));
})

// get all banner
const getAllBanner = asyncHandler(async (req, res) => {
    const banner = await Banner.find().select("_id image");
    if (!banner) {
        return res.status(404).json(new ApiResponse(404, null, "Banner not found"));
    }
    return res.status(200).json(new ApiResponse(200, banner, "Banner found successfully"));
})

// delete banner
const deleteBanner = asyncHandler(async (req, res) => {
    // get banner id from the params
    const { bannerId } = req.params;
    // get the banner
    const banner = await Banner.findById(bannerId);
    if (!banner) {
        return res.status(404).json(new ApiResponse(404, null, "Banner not found"));
    }
    // delete thumbnail from cloudinary
    if (banner.image) {
        const publicId = banner.image.split('/').pop().split('.')[0];
        await deleteFile(publicId, res)
    }
    // delete the banner
    await Banner.findByIdAndDelete(banner._id);
    // send the response
    return res
        .status(200)
        .json(new ApiResponse(200, null, "Banner deleted successfully"));
})

export { createBanner, getAllBanner, deleteBanner }