import { Area } from "../models/area.model.js";
import { Pincode } from "../models/pincode.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";
import { isAnyEmpty } from "../utils/exportFunction.js";

const validatePincode = async (name, pincode) => {
  const validatePincode = await Pincode.findOne({ pincode });

  checkCondition(!validatePincode, 400, "Enter valid Pincode");

  const cleanedInputName = name.replace(/\s+/g, "").toLowerCase();

  const matchedPincodeWithName = await Pincode.aggregate([
    {
      $addFields: {
        cleanName: {
          $replaceAll: {
            input: { $toLower: "$officename" },
            find: " ",
            replacement: "",
          },
        },
      },
    },
    {
      $match: {
        cleanName: { $regex: cleanedInputName, $options: "i" },
        pincode: pincode,
      },
    },
  ]);

  checkCondition(
    matchedPincodeWithName.length === 0,
    400,
    "Enter valid Area Name and Pincode"
  );
};

const createArea = asyncHandler(async (req, res) => {
  const { name, pincode } = req.body;

  const anythingEmpty = isAnyEmpty({ name, pincode });

  checkCondition(anythingEmpty, 400, `${anythingEmpty} is required`);

  const existingArea = await Area.findOne({ pincode, name });

  checkCondition(existingArea, 409, "Area already exists");

  await validatePincode(name, pincode);

  const area = await Area.create({ name, pincode });

  const createdArea = await Area.findById(area._id);

  checkCondition(
    !createdArea,
    500,
    "Something went wrong while creating the Area"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdArea, "Area created successfully"));
});

const deleteArea = asyncHandler(async (req, res) => {
  const { id } = req.params;

  checkCondition(!id, 400, "Area ID is required");

  const area = await Area.findByIdAndDelete(id);

  checkCondition(!area, 404, "Role not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Area deleted successfully"));
});

const updateArea = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, pincode } = req.body;

  checkCondition(!id, 400, "Area ID is required");
  checkCondition(!(name || pincode), 400, "Name or Pincode is required");

  const selectedArea = await Area.findById(id);

  await validatePincode(
    name || selectedArea.name,
    pincode || selectedArea.pincode
  );

  const existingArea = await Area.findOne({
    _id: { $ne: id },
    ...(name ? { name } : { name: selectedArea.name }),
  });

  checkCondition(existingArea, 409, "Area with this name already exists");

  const updateData = {};
  if (name) updateData.name = name;
  if (pincode) updateData.pincode = pincode;

  const area = await Area.findByIdAndUpdate(id, updateData, { new: true });

  checkCondition(!area, 404, "Area not found");

  return res
    .status(200)
    .json(new ApiResponse(200, area, "Area updated successfully"));
});

const getArea = asyncHandler(async (req, res) => {
  const area = await Area.find();

  return res
    .status(200)
    .json(new ApiResponse(200, area, "Areas fetched successfully"));
});

export { createArea, deleteArea, updateArea, getArea };
