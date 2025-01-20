import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const categorySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
});

categorySchema.plugin(mongooseAggregatePaginate);

export const Category = mongoose.model("Category", categorySchema);
