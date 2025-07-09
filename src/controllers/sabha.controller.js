import { Sabha } from "../models/sabha.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";
import { isAnyEmpty } from "../utils/exportFunction.js";

const createSabha = asyncHandler(async (req, res) => {
  const { name, areaId } = req.body;

  const anythingEmpty = isAnyEmpty({
    name,
    areaId,
  });

  checkCondition(anythingEmpty, 400, `${anythingEmpty} is required`);

  const existingSabha = await Sabha.findOne({ name, areaId });

  checkCondition(existingSabha, 409, "Sabha already exists");

  const createdSabha = await Sabha.create({
    name,
    areaId,
  });

  checkCondition(
    !createdSabha,
    500,
    "Something went wrong while creating Sabha"
  );

  const responseSabha = await Sabha.aggregate([
    {
      $match: { _id: createdSabha._id },
    },
    {
      $lookup: {
        from: "areas",
        localField: "areaId",
        foreignField: "_id",
        as: "areaDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
              pincode: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        areaDetails: { $arrayElemAt: ["$areaDetails", 0] },
      },
    },
    {
      $project: {
        name: 1,
        areaDetails: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, responseSabha, "Sabha created successfully"));
});

const getSabha = asyncHandler(async (req, res) => {
  const sabha = await Sabha.aggregate([
    {
      $lookup: {
        from: "areas",
        localField: "areaId",
        foreignField: "_id",
        as: "areaDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              pincode: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        areaDetails: { $arrayElemAt: ["$areaDetails", 0] },
      },
    },
    {
      $project: {
        name: 1,
        areaDetails: 1,
      },
    },
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, sabha, "Sabha fetched successfully"));
});

const deleteSabha = asyncHandler(async (req, res) => {
  const { id } = req.params;

  checkCondition(!id, 400, "Sabha ID is required");

  const sabha = await Sabha.findByIdAndDelete(id);

  checkCondition(!sabha, 404, "Sabha not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Sabha deleted successfully"));
});

const updateSabha = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, areaId } = req.body;

  checkCondition(!id, 400, "Sabha ID is required");
  checkCondition(!(name || areaId), 400, "Name or Area Id is required");

  const existingSabha = await Sabha.findOne({ _id: { $ne: id }, name, areaId });

  checkCondition(
    existingSabha,
    409,
    "Sabha with this name and area already exists"
  );

  const updateData = {};
  if (name) updateData.name = name;
  if (areaId) updateData.areaId = areaId;

  const sabha = await Sabha.findOneAndUpdate(
    { _id: id },
    {
      $set: {
        ...(name && { name: name }),
        ...(areaId && { areaId: areaId }),
      },
    },
    {
      new: true,
    }
  )
    .populate({
      path: "areaId",
      model: "Area",
      select: "name pincode _id",
      as: "areaDetails",
    })
    .lean();

  if (sabha) {
    sabha.areaDetails = sabha.areaId;
    delete sabha.areaId;
  }

  checkCondition(!sabha, 404, "Sabha not found");

  return res
    .status(200)
    .json(new ApiResponse(200, sabha, "Sabha updated successfully"));
});

export { createSabha, getSabha, deleteSabha, updateSabha };
