import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../model/userModel.js";
import Joi from "joi";

const login = asyncHandler(async (req, res) => {
  // joi schema for validation
  const schema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  // Validate request body
  const { error, value } = schema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json(new ApiResponse(400, null, error.details[0].message));
  }

  // Extract validated fields
  const { email, password } = value;

  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(404).json(new ApiResponse(404, null, "User not found"));
  }

  // Check password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    return res
      .status(401)
      .json(new ApiResponse(401, null, "Invalid email or password"));
  }

  // send the response
  return res.status(200).json(new ApiResponse(200, user, "Login successful"));
});

export { login };
