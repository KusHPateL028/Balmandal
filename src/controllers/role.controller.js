import { Role } from "../models/role.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";

const createRole = asyncHandler(async (req, res) => {
  const { name } = req.body;

  checkCondition(!name, 400, "Role name is required");

  const existingRole = await Role.findOne({ name });

  checkCondition(existingRole, 409, "Role already exists");

  const role = await Role.create({ name });

  const createdRole = await Role.findById(role._id);

  checkCondition(
    !createdRole,
    500,
    "Something went wrong while creating the user"
  );

  return res
    .status(201)
    .json(new ApiResponse(201, createdRole, "Role created successfully"));
});

const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;

  checkCondition(!id, 400, "Role ID is required");

  const role = await Role.findByIdAndDelete(id);

  checkCondition(!role, 404, "Role not found");

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Role deleted successfully"));
});

const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  checkCondition(!id, 400, "Role ID is required");
  checkCondition(!name, 400, "Role name is required");

  const existingRole = await Role.findOne({ _id: { $ne: id }, name });

  checkCondition(existingRole, 409, "Role with this name already exists");

  const role = await Role.findByIdAndUpdate(id, { name }, { new: true });

  checkCondition(!role, 404, "Role not found");

  return res
    .status(200)
    .json(new ApiResponse(200, role, "Role updated successfully"));
});

const getRole = asyncHandler(async (req, res) => {
  const roles = await Role.find();

  return res
    .status(200)
    .json(new ApiResponse(200, roles, "Roles fetched successfully"));
});

export { createRole, deleteRole, updateRole, getRole };
