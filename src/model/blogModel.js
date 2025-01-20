import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      required: true,
    },
    detailImage: {
      type: String,
      required: true,
    },
    seoTitle: {
      type: String,
    },
    seoDescription: {
      type: String,
    },
    seoKeywords: {
      type: String,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

blogSchema.plugin(mongooseAggregatePaginate);

export const Blog = mongoose.model("Blog", blogSchema);
