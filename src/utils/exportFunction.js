import { Counter } from "../models/user.model.js";

export const isAnyEmpty = (obj) => {
  for (const key in obj) {
    const value = obj[key];

    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && value.trim() === "") ||
      (Array.isArray(value) && value.length === 0)
    ) {
      return key;
    }
  }
  return null;
};

export const getNextKarykarID = async () => {
  const counter = await Counter.findByIdAndUpdate(
    { _id: "karykarID" },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
};
