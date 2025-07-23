import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";
import { getNextKarykarID, isAnyEmpty } from "../utils/exportFunction.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import sendMail from "../utils/MailHandler.js";

const validateRoleId = async (id) => {
  const exists = await Role.exists({ _id: id });
  checkCondition(!exists, 404, `Role not found`);
};

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId } = req.body;

  const anythingEmpty = isAnyEmpty({
    name,
    email,
    password,
    roleId,
  });

  checkCondition(anythingEmpty, 400, `${anythingEmpty} is required`);

  const existedUser = await User.findOne({ email });

  checkCondition(existedUser, 409, "User with email already exist");

  await validateRoleId(roleId);

  let avatarLocalPath;

  if (req.files && Array.isArray(req.files) && req.files.avatar.length > 0) {
    avatarLocalPath = req.files?.avatar[0]?.path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);

  const karykarID = String(await getNextKarykarID()).padStart(4, "0");
  const username =
    name
      .split(" ")[0]
      .replace(/^\w/, (c) => c.toUpperCase())
      .toLowerCase() + karykarID;

  const user = await User.create({
    name,
    email,
    avatar: avatar?.url || "",
    password,
    username,
    roleId,
    karykarID,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  checkCondition(
    !createdUser,
    500,
    "Something went wrong while registering the user"
  );

  sendMail()

  const responseSabha = await User.aggregate([
    {
      $match: { _id: createdUser._id },
    },
    {
      $lookup: {
        from: "roles",
        localField: "roleId",
        foreignField: "_id",
        as: "role",
        pipeline: [
          {
            $project: {
              name: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        role: { $arrayElemAt: ["$role", 0] },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        avatar: 1,
        username: 1,
        role: 1,
        karykarID: 1,
      },
    },
  ]);

  return res
    .status(201)
    .json(new ApiResponse(201, responseSabha, "User registered Successfully"));
});

export { createUser };
