import { Sabha } from "../models/sabha.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";
import { isAnyEmpty } from "../utils/exportFunction.js";

const validateUserId = async (id, fieldName) => {
  const exists = await User.exists({ _id: id });
  checkCondition(
    !exists,
    404,
    `${fieldName} (${id}) not found in User collection`
  );
};

const validateUserIdsArray = async (ids, fieldName) => {
  for (const id of ids) {
    await validateUserId(id, `${fieldName} item`);
  }
};

const createSabha = asyncHandler(async (req, res) => {
  const { name, areaId } = req.body;

  const anythingEmpty = isAnyEmpty({
    name,
    areaId,
    sanchalakId,
    sahSanchalakId,
    nirikshakId,
  });

  checkCondition(anythingEmpty, 400, `${anythingEmpty} is required`);

  const existingSabha = await Sabha.findOne({ name, areaId });

  checkCondition(existingSabha, 409, "Sabha already exists");

  await validateUserId(sanchalakId, "Sanchalak");
  await validateUserId(nirikshakId, "Nirikshak");
  await validateUserIdsArray(sahSanchalakId, "Sah Sanchalak");

  const createdSabha = await Sabha.create({
    name,
    areaId,
    sanchalakId,
    sahSanchalakId,
    nirikshakId,
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
      $lookup: {
        from: "users",
        localField: "sanchalakId",
        foreignField: "_id",
        as: "sanchalakDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
              karykarID: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "nirikshakId",
        foreignField: "_id",
        as: "nirikshakDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
              karykarID: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "sahSanchalakId",
        foreignField: "_id",
        as: "sahSanchalakDetails",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
              karykarID: 1,
              username: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        areaDetails: { $arrayElemAt: ["$areaDetails", 0] },
        sanchalakDetails: { $arrayElemAt: ["$sanchalakDetails", 0] },
        nirikshakDetails: { $arrayElemAt: ["$nirikshakDetails", 0] },
      },
    },
    {
      $project: {
        name: 1,
        areaDetails: 1,
        sanchalakDetails: 1,
        nirikshakDetails: 1,
        sahSanchalakDetails: 1,
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
  const { name, areaId, sanchalakId, sahSanchalakId, nirikshakId } = req.body;

  checkCondition(!id, 400, "Sabha ID is required");
  checkCondition(
    !(name || areaId || sanchalakId || sahSanchalakId || nirikshakId),
    400,
    "At least one field is required to update"
  );

  const existingSabha = await Sabha.findOne({ _id: { $ne: id }, name, areaId });

  checkCondition(
    existingSabha,
    409,
    "Sabha with this name and area already exists"
  );

  const updateData = {};
  if (name) updateData.name = name;
  if (areaId) updateData.areaId = areaId;
  if (sanchalakId) {
    await validateUserId(sanchalakId, "Sanchalak");
    updateData.sanchalakId = sanchalakId;
  }
  if (nirikshakId) {
    await validateUserId(nirikshakId, "Nirikshak");
    updateData.nirikshakId = nirikshakId;
  }
  if (sahSanchalakId) {
    await validateUserIdsArray(sahSanchalakId, "Sah Sanchalak");
    updateData.sahSanchalakId = sahSanchalakId;
  }

  const sabha = await Sabha.findOneAndUpdate(
    { _id: id },
    { $set: updateData },
    { new: true }
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

  const responseSabha = {
    name: sabha.name,
    areaDetails: sabha.areaId,
    sanchalakDetails: sabha.sanchalakId,
    nirikshakDetails: sabha.nirikshakId,
    sahSanchalakDetails: sabha.sahSanchalakId,
  };

  return res
    .status(200)
    .json(new ApiResponse(200, responseSabha, "Sabha updated successfully"));
});

export { createSabha, getSabha, deleteSabha, updateSabha };
