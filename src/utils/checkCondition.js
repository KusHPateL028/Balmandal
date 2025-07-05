import ApiError from "./ApiError.js";

const checkCondition = (condition, statusCode, message) => {
  if (condition) {
    throw new ApiError(statusCode, message);
  }
};
export default checkCondition
