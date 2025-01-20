import { Product } from "../model/productModel.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadFile, deleteFile } from "../utils/cloudinary.js";
import Joi from "joi";

const createProduct = asyncHandler(async (req, res) => {
  // Joi schema for validation
  const ProductSchema = Joi.object({
    name: Joi.string().min(3).max(500).required(),
    productDescription: Joi.string().allow(""),
    productDetail: Joi.string().min(10).max(2000).required(),
    affiliateLink: Joi.string().uri().required(),
    category: Joi.string().required(),
    quantity: Joi.number().integer().positive().required(),
    amount: Joi.number().positive().required(),
    discount: Joi.number().required(),
    sellingPrice: Joi.number().positive().required(),
    isPublic: Joi.boolean().required(),
  });

  // Validate request body
  const { error, value } = ProductSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }

  // Extract validated fields
  const {
    name,
    productDescription,
    productDetail,
    affiliateLink,
    amount,
    discount,
    sellingPrice,
    category,
    quantity,
    isPublic,
  } = value;

  // get thumbnail from the request
  const thumbnail = req.files.thumbnail[0];
  
  // validate the image
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
      .json(new ApiResponse(400, null, "Thumbnail invalid image format"));
  }
  // get big image from the request
  const bigImage = req.files.bigImage[0];
  // validate the image
  if (!bigImage) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Big image is required"));
  }
  if (bigImage.mimetype !== "image/jpeg" && bigImage.mimetype !== "image/png") {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "Big image invalid image format"));
  }
  // upload image to cloudinary
  const thumbnailUrl = await uploadFile(thumbnail);
  const bigImageUrl = await uploadFile(bigImage);
  // validate the image url
  if (!thumbnailUrl || !bigImageUrl) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Image upload failed"));
  }

  // create the product
  const product = await Product.create({
    name,
    productDescription,
    productDetail,
    affiliateLink,
    amount,
    discount,
    sellingPrice,
    category,
    quantity,
    thumbnail: thumbnailUrl,
    isPublic,
    bigImage: bigImageUrl,
  });
  // validate the product creation
  const createdProduct = await Product.findById(product._id);
  if (!createdProduct) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Product creation failed"));
  }
  // send the response
  return res
    .status(201)
    .json(
      new ApiResponse(201, createdProduct.name, "Product created successfully")
    );
});

const getProduct = asyncHandler(async (req, res) => {
  // get product id from the params
  const { productId } = req.params;
  // get the product
  const product = await Product.findById(productId);
  // validate the product
  if (!product) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Product not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, product, "Product found successfully"));
});

const getAllProducts = asyncHandler(async (req, res) => {
  // Build the aggregation pipeline
  const products = await Product.aggregate([
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        name: 1,
        category: 1,
        thumbnail: 1,
        amount: 1,
        discount: 1,
        sellingPrice: 1,
        isPublic: 1,
      },
    },
  ]);

  // Validate the products
  if (!products || products.length === 0) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Products not found"));
  }

  // Send the response
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products found successfully"));
});

// get recent 4 products
const getRecentProducts = asyncHandler(async (req, res) => {
  // get recent 4 products
  const products = await Product.find()
    .sort({ createdAt: -1 })
    .limit(4)
    .select("_id name price thumbnail affiliateLink sellingPrice");
  // validate the products
  if (!products) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Products not found"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, products, "Products found successfully"));
});

// update product
const updateProduct = asyncHandler(async (req, res) => {
  // get product id from the params
  const { productId } = req.params;

  // Joi schema for validation
  const ProductSchema = Joi.object({
    name: Joi.string().optional(),
    productDescription: Joi.string().optional().allow(""),
    productDetail: Joi.string().optional(),
    category: Joi.string().optional(),
    affiliateLink: Joi.string().uri().optional(),
    amount: Joi.number().positive().optional(),
    discount: Joi.number().positive().optional(),
    sellingPrice: Joi.number().positive().optional(),
    quantity: Joi.number().positive().optional(),
    isPublic: Joi.boolean().optional(),
  });

  // Validate request body
  const { error, value } = ProductSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }

  // get the product
  const product = await Product.findById(productId);
  if (!product) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Product not found"));
  }

  // get thumbnail
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
    // upload image to cloudinary
    const thumbnailUrl = await uploadFile(thumbnail);
    // validate the image url
    if (!thumbnailUrl) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Thumbnail upload failed"));
    }
    // delete the old thumbnail from cloudinary
    const oldThumbnail = product.thumbnail;
    if (oldThumbnail) {
      const publicId = oldThumbnail.split('/').pop().split('.')[0];
      await deleteFile(publicId, res)
    }
    // update the category
    product.thumbnail = thumbnailUrl;
  }

  // get big image
  const bigImage = req.files.bigImage ? req.files.bigImage[0] : null;
  if (bigImage) {
    if (
      bigImage.mimetype !== "image/jpeg" &&
      bigImage.mimetype !== "image/png"
    ) {
      return res
        .status(400)
        .json(new ApiResponse(400, null, "Invalid image format"));
    }
    // upload image to cloudinary
    const bigImageUrl = await uploadFile(bigImage);
    // validate the image url
    if (!bigImageUrl) {
      return res
        .status(500)
        .json(new ApiResponse(500, null, "Big image upload failed"));
    }
    // delete the old big image from cloudinary
    const oldBigImage = product.bigImage;
    if (oldBigImage) {    
      const publicId = oldBigImage.split('/').pop().split('.')[0];
      await deleteFile(publicId, res)
    }
    // update the category
    product.bigImage = bigImageUrl;
  }

  // Update fields if they are provided and different
  const fieldsToUpdate = [
    "name",
    "productDescription",
    "productDetail",
    "category",
    "affiliateLink",
    "amount",
    "discount",
    "sellingPrice",
    "quantity",
    "isPublic",
  ];

  let hasUpdates = false;

  fieldsToUpdate.forEach((field) => {
    if (value[field] !== undefined && value[field] !== product[field]) {
      product[field] = value[field];
      hasUpdates = true;
    }
  });

  if (!hasUpdates && !thumbnail && !bigImage) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, "No fields to update"));
  }

  // Save updated product
  const updatedProduct = await product.save({ validateBeforeSave: false });
  if (!updatedProduct) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Product update failed"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, updatedProduct._id, "Product updated successfully")
    );
});

// delete product
const deleteProduct = asyncHandler(async (req, res) => {
  // get product id from the params
  const { productId } = req.params;
  // get the product
  const product = await Product.findById(productId);
  if (!product) {
    return res
      .status(404)
      .json(new ApiResponse(404, null, "Product not found"));
  }
  // delete thumbnail from cloudinary
  if (product.thumbnail) {
      const publicId = product.thumbnail.split('/').pop().split('.')[0];
      await deleteFile(publicId, res)
    }
  // delete big image from cloudinary
  if (product.bigImage) {
      const publicId = product.bigImage.split('/').pop().split('.')[0];
      await deleteFile(publicId, res)
  }
  // delete the product
  const deletedProduct = await Product.findByIdAndDelete(productId);
  if (!deletedProduct) {
    return res
      .status(500)
      .json(new ApiResponse(500, null, "Product delete failed"));
  }
  // send the response
  return res
    .status(200)
    .json(new ApiResponse(200, null, "Product deleted successfully"));
});

export {
  createProduct,
  getProduct,
  getAllProducts,
  getRecentProducts,
  updateProduct,
  deleteProduct,
};
