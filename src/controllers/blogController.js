import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";
import { Blog } from "../model/blogModel.js";
import Joi from "joi";

// create a blog
const createBlog = asyncHandler(async (req, res) => {
  // Joi schema for validation
  const schema = Joi.object({
    title: Joi.string().min(3).max(50).required(),
    content: Joi.string().required(),
    isPublic: Joi.boolean().required(),
    seoTitle: Joi.string().allow("").optional(),
    seoDescription: Joi.string().allow("").optional(),
    seoKeywords: Joi.string().allow("").optional(),
  });
  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }
  const { title, content, isPublic, seoTitle, seoDescription, seoKeywords } =
    value;

  // get thumbnail from the request
  const thumbnail = req.files.thumbnail ? req.files.thumbnail[0] : null;
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
      .json(new ApiResponse(400, null, "Invalid thumbnail format"));
  }
  // upload thumbnail to cloudinary
  const thumbnailUrl = await uploadFile(thumbnail);
  // validate the thumbnail url
  if (!thumbnailUrl) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Detail Image upload failed"));
  }

  // get detailImage from the request
  const detailImage = req.files.detailImage ? req.files.detailImage[0] : null;
  if (!detailImage) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Detail Image is required"));
  }
  if (
    detailImage.mimetype !== "image/jpeg" &&
    detailImage.mimetype !== "image/png"
  ) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Invalid Detail image format"));
  }
  // upload detail Image to cloudinary
  const detailImageUrl = await uploadFile(detailImage);
  // validate the detailImage url
  if (!detailImageUrl) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Image upload failed"));
  }
  // create the blog
  const blog = await Blog.create({
    title,
    content,
    thumbnail: thumbnailUrl,
    detailImage: detailImageUrl,
    isPublic,
    seoTitle,
    seoDescription,
    seoKeywords,
  });
  // validate the blog creation
  const createdBlog = await Blog.findById(blog._id);
  if (!createdBlog) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Blog creation failed"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, blog.title, "Blog created successfully"));
});

// get blog
const getBlog = asyncHandler(async (req, res) => {
  // get blog id from the params
  const { blogId } = req.params;
  // get the blog
  const blog = await Blog.findById(blogId);
  // validate the blog
  if (!blog) {
    return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, blog, "Blog found successfully"));
});

// get all blogs
const getAllBlogs = asyncHandler(async (req, res) => {
  // get all blogs
  const blogs = await Blog.aggregate([
    {
      $sort: { createdAt: -1 },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        thumbnail: 1,
        isPublic: 1,
      },
    },
  ]);
  // validate the blogs
  if (!blogs) {
    return res.status(404).json(new ApiResponse(404, null, "Blogs not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Blogs found successfully"));
});

// get recent 4 blogs
const getRecentBlogs = asyncHandler(async (req, res) => {
  // get all blogs
  const blogs = await Blog.find()
    .sort({ createdAt: -1 })
    .limit(4)
    .select("_id title thumbnail");
  // validate the blogs
  if (!blogs) {
    return res.status(404).json(new ApiResponse(404, null, "Blogs not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, blogs, "Blogs found successfully"));
});

// update blog
const updateBlog = asyncHandler(async (req, res) => {
  // get blog id from the params
  const { blogId } = req.params;
  // joi schema for validation
  const schema = Joi.object({
    _id: Joi.string().optional(),
    title: Joi.string().min(3).max(50).optional(),
    content: Joi.string().optional(),
    isPublic: Joi.boolean().optional(),
    seoTitle: Joi.string().allow("").optional(),
    seoDescription: Joi.string().allow("").optional(),
    seoKeywords: Joi.string().allow("").optional(),
  });
  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }
  // get the blog
  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
  }
  // get thumbnail from the request
  const thumbnail = req.files.thumbnail ? req.files.thumbnail[0] : null;
  if (thumbnail) {
    if (
      thumbnail.mimetype !== "image/jpeg" &&
      thumbnail.mimetype !== "image/png"
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid image format"));
    }
    // upload thumbnail to cloudinary
    const thumbnailUrl = await uploadFile(thumbnail);
    // validate the thumbnail url
    if (!thumbnailUrl) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Image upload failed"));
    }
    //delete the old thumbnail from cloudinary
    const oldThumbnail = blog.thumbnail;
    if (oldThumbnail) {
      const publicId = oldThumbnail.split('/').pop().split('.')[0];
    await deleteFile(publicId, res)
    }
    // update thumbnail
    blog.thumbnail = thumbnailUrl;
  }
  // get thumbnail from the request
  const detailImage = req.files.detailImage ? req.files.detailImage[0] : null;
  if (detailImage) {
    if (
      detailImage.mimetype !== "image/jpeg" &&
      detailImage.mimetype !== "image/png"
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid detail image format"));
    }
    // upload detailImage to cloudinary
    const detailImageUrl = await uploadFile(detailImage);
    // validate the detailImage url
    if (!detailImageUrl) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Detail image upload failed"));
    }
    //delete the old thumbnail from cloudinary
    const oldDetailImage = blog.thumbnail;
    if (oldDetailImage) {
      const publicId = oldDetailImage.split('/').pop().split('.')[0];
    await deleteFile(publicId, res)
    }
    // update thumbnail
    blog.detailImage = detailImageUrl;
  }

  // Update fields if they are provided and different
  const fieldsToUpdate = [
    "title",
    "content",
    "seoTitle",
    "seoDescription",
    "seoKeywords",
    "isPublic",
  ];
  let hasUpdates = false;

  fieldsToUpdate.forEach((field) => {
    if (value[field] !== undefined && value[field] !== blog[field]) {
      blog[field] = value[field];
      hasUpdates = true;
    }
  });

  if (!hasUpdates && !thumbnail, !detailImage) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No fields to update"));
  }

  // Save updated blog
  const updatedBlog = await blog.save({ validateBeforeSave: false });
  // validate the blog
  if (!updatedBlog) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Blog update failed"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, updatedBlog, "Blog updated successfully"));
});

// delete blog
const deleteBlog = asyncHandler(async (req, res) => {
  // get blog id from the params
  const { blogId } = req.params;
  // get the blog
  const blog = await Blog.findById(blogId);
  if (!blog) {
    return res.status(404).json(new ApiResponse(404, null, "Blog not found"));
  }
  // delete thumbnail from cloudinary
  if (blog.thumbnail) {
    const publicId = blog.thumbnail.split('/').pop().split('.')[0];
    await deleteFile(publicId, res)
  }
  // delete the blog
  await Blog.findByIdAndDelete(blog._id);
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Blog deleted successfully"));
});

export { createBlog, getBlog, getAllBlogs, getRecentBlogs, updateBlog, deleteBlog };
