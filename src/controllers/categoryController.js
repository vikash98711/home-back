import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Category } from "../model/categoryModel.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";
import Joi from "joi";

const createCategory = asyncHandler(async (req, res) => {
  // Joi schema for validation
  const schema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    isPublic: Joi.boolean().required(),
  });

  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }
  const { name, isPublic } = value;
  // check if category already exists
  const categoryExists = await Category.findOne({ name });
  if (categoryExists) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Category already exists"));
  }
  // get thumbnail from the request
  const thumbnail = req.file;
  if (!thumbnail) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Thumbnail is required"));
  }
  if (
    thumbnail.mimetype !== "image/jpeg" &&
    thumbnail.mimetype !== "image/png"
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid image format"));
  }
  // upload image to cloudinary
  const thumbnailUrl = await uploadFile(thumbnail);
  // validate the image url
  if (!thumbnailUrl) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Thumbnail upload failed"));
  }
  // create the category
  const category = await Category.create({
    name,
    thumbnail: thumbnailUrl,
    isPublic,
  });
  // validate the category creation
  const createdCategory = await Category.findById(category._id);
  if (!createdCategory) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Category creation failed"));
  }
  // send the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, createdCategory.name, "Category created successfully")
    );
});

const getAllCategories = asyncHandler(async (req, res) => {
  // get all categories
  const categories = await Category.aggregate([
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        name: 1,
        thumbnail: 1,
        isPublic: 1,
      },
    },
  ]);

  // Validate the categories
  if (!categories || categories.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Categories not found"));
  }

  // Send the response
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories found successfully"));
});

const getAllCategoriesNames = asyncHandler(async (req, res) => {
  // get all categories
  const categories = await Category.find().select("name").sort({ name: 1 });
  // validate the categories
  if (!categories) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Categories not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, categories, "Categories found successfully"));
});

const getCategory = asyncHandler(async (req, res) => {
  // get category id from the params
  const { categoryId } = req.params;
  // get the category
  const category = await Category.findById(categoryId).select("-__v");
  // validate the category
  if (!category) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Category not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, category, "Category found successfully"));
});

const updateCategory = asyncHandler(async (req, res) => {
  // joi schema for validation
  const schema = Joi.object({
    _id: Joi.string().optional(),
    name: Joi.string().min(3).max(50).optional(),
    isPublic: Joi.boolean().required(),
  });

  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }
  // get category id from the params
  const { categoryId } = req.params;
  // get category
  const category = await Category.findById(categoryId);
  // validate the category
  if (!category) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Category not found"));
  }
  // get thumbnail from the request
  const thumbnail = req.file;
  if (thumbnail) {
    if (
      thumbnail.mimetype !== "image/jpeg" &&
      thumbnail.mimetype !== "image/png"
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid image format"));
    }
    // upload image to cloudinary
    const thumbnailUrl = await uploadFile(thumbnail);
    // validate the image url
    if (!thumbnailUrl) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Thumbnail upload failed"));
    }
    // delete the old thumbnail from cloudinary
    const oldThumbnail = category.thumbnail;
    if (oldThumbnail) {
      const publicId = oldThumbnail.split('/').pop().split('.')[0];
      await deleteFile(publicId, res)
    }
    // update the category
    category.thumbnail = thumbnailUrl;
  }
  // Update fields if they are provided and different
  const fieldsToUpdate = ["name", "isPublic"];
  let hasUpdates = false;

  fieldsToUpdate.forEach((field) => {
    if (value[field] !== undefined && value[field] !== category[field]) {
      category[field] = value[field];
      hasUpdates = true;
    }
  });

  if (!hasUpdates && !thumbnail) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No fields to update"));
  }

  // Save updated category
  const updatedCategory = await category.save({ validateBeforeSave: false });
  // validate the category
  if (!updatedCategory) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Category update failed"));
  }
  // send the response
  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedCategory, "Category updated successfully")
    );
});

// delete category
const deleteCategory = asyncHandler(async (req, res) => {
  // get category id from the params
  const { categoryId } = req.params;
  // get the category
  const category = await Category.findById(categoryId);
  // validate the category
  if (!category) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Category not found"));
  }
  // delete thumbnail from cloudinary
  if (category.thumbnail) {
    const publicId = category.thumbnail.split('/').pop().split('.')[0];
    await deleteFile(publicId, res)
  }
  // delete the blog
  await Category.findByIdAndDelete(category._id);
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Category deleted successfully"));
});

export {
  createCategory,
  getAllCategories,
  getAllCategoriesNames,
  getCategory,
  updateCategory,
  deleteCategory,
};
