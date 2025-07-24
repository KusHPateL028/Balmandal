import { User } from "../models/user.model.js";
import { Role } from "../models/role.model.js";
import asyncHandler from "../utils/asyncHandler.js";
import checkCondition from "../utils/checkCondition.js";
import { getNextKarykarID, isAnyEmpty } from "../utils/exportFunction.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import sendMail from "../utils/MailHandler.js";
import mongoose from "mongoose";
import { OPTIONS } from "../utils/constant.js";

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

const validateRoleId = async (id) => {
  const exists = await Role.exists({ _id: id });
  checkCondition(!exists, 404, `Role not found`);
};

const sendUserRegisteredMail = async ({
  userEmail,
  name,
  userName,
  password,
  registeredBy,
}) => {
  const subject = "Your Account Has Been Created on Our Website";

  const html = `
    <p>Hi <strong>${name}</strong>,</p>
    <p>You have been registered on our website by <strong>${registeredBy}</strong>.</p>
    <p>Your login credentials are:</p>
    <ul>
      <li><strong>Username:</strong> ${userName}</li>
      <li><strong>Password:</strong> ${password}</li>
    </ul>
    <p><a href="https://your-website.com/login">Click here to login</a></p>
    <p>For security, please change your password after logging in.</p>
    <p>If you were not expecting this, contact our support team.</p>
    <p>Best regards,<br />The Team</p>
  `;

  await sendMail(userEmail, subject, "", html);
};

const userWithRolePipeline = () => [
  {
    $lookup: {
      from: "roles",
      localField: "roleId",
      foreignField: "_id",
      as: "role",
      pipeline: [{ $project: { name: 1, _id: 1 } }],
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
];

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(500, "Something went wrong");
  }
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

  checkCondition(
    !passwordRegex.test(password),
    400,
    "Password must contain uppercase, lowercase, number, special character and be at least 8 characters long"
  );

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
      .toLowerCase()
      .replace(/^\w/, (c) => c.toUpperCase()) + karykarID;

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

  sendUserRegisteredMail({
    userEmail: email,
    name,
    userName: username,
    password,
    registeredBy: "Kush",
  });

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

const loginUser = asyncHandler(async (req, res) => {
  checkCondition(!req.body, 400, "Username and password are required");

  const { username, password } = req.body;

  const isEmpty = isAnyEmpty({ username, password });
  checkCondition(isEmpty, 400, `${isEmpty} is required`);

  const user = await User.findOne({ username });

  checkCondition(!user, 404, "User does not exist");

  const isPaawordValid = await user.isPasswordCorrect(password);

  checkCondition(!isPaawordValid, 401, "Invalid User Credentials");

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
    .populate({
      path: "roleId",
      model: "Role",
      select: "name _id",
      as: "role",
    })
    .lean();

  if (loggedInUser) {
    loggedInUser.role = loggedInUser.roleId;
    delete loggedInUser.roleId;
  }
  return res
    .status(200)
    .cookie("accessToken", accessToken, OPTIONS)
    .cookie("refreshToken", refreshToken, OPTIONS)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User Logged In successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const id = req.user._id;

  await User.findByIdAndUpdate(
    id,
    { $unset: { refreshToken: 1 } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", OPTIONS)
    .clearCookie("refreshToken", OPTIONS)
    .json(new ApiResponse(200, "", "User logged out "));
});

const changePassword = asyncHandler(async (req, res) => {
  checkCondition(
    !req.body,
    400,
    "Old Password, New Password and Confirm Password are required"
  );
  const { oldPassword, newPassword, confirmPassword } = req.body;

  const id = req.user?._id;

  checkCondition(
    !passwordRegex.test(newPassword),
    400,
    "Password must contain uppercase, lowercase, number, special character and be at least 8 characters long"
  );

  const user = await User.findById(id);

  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  const isSameNewPassword = await user.isPasswordCorrect(newPassword);

  checkCondition(!isPasswordCorrect, 400, "Invalid old Password");

  checkCondition(
    newPassword !== confirmPassword,
    400,
    "New Password and Confirm Password should be Same"
  );

  checkCondition(isSameNewPassword, 400, "New Password can't same as old");

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, "", "Password changed Successfully"));
});

const getUser = asyncHandler(async (req, res) => {
  const user = await User.aggregate([...userWithRolePipeline()]);

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User fetched successfully"));
});

const getUserByID = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.aggregate([
    { $match: { karykarID: Number(id) } },
    ...userWithRolePipeline(),
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user,
        user.length ? "User fetched successfully" : "User not found"
      )
    );
});

const getUserByRole = asyncHandler(async (req, res) => {
  const { roleId } = req.params;

  await validateRoleId(roleId);

  const users = await User.aggregate([
    { $match: { roleId: new mongoose.Types.ObjectId(String(roleId)) } },
    ...userWithRolePipeline(),
  ]);

  return res
    .status(200)
    .json(new ApiResponse(200, users, "Users fetched successfully"));
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findOneAndDelete({ karykarID: id });

  checkCondition(!user, 404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "User deleted successfully"));
});

const updateUser = asyncHandler(async (req, res) => {
  const { id: karykarID } = req.params;
  checkCondition(!req.body, 400, "At least one field is required");
  const { name, email, roleId } = req.body;

  checkCondition(!karykarID, 400, "KarykarID is required");
  checkCondition(
    !(name || email || roleId || req.file),
    400,
    "At least one field is required"
  );

  if (roleId) {
    await validateRoleId(roleId);
  }

  if (email) {
    const existingUser = await User.findOne({
      email,
      karykarID: { $ne: karykarID },
    });
    checkCondition(existingUser, 409, "User with this email already exists");
  }

  let avatar;
  if (req.file?.path) {
    avatar = await uploadOnCloudinary(req.file.path);
  }

  const updateData = {};
  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (roleId) updateData.roleId = roleId;
  if (avatar?.url) updateData.avatar = avatar.url;

  const user = await User.findOneAndUpdate({ karykarID }, updateData, {
    new: true,
  });

  checkCondition(!user, 404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "User updated successfully"));
});

export {
  createUser,
  loginUser,
  logoutUser,
  changePassword,
  getUser,
  getUserByRole,
  getUserByID,
  deleteUser,
  updateUser,
};
