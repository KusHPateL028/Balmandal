import mongoose, { Schema } from "mongoose";

const pincodeSchema = new Schema({
  officename: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  officetype: {
    type: String,
  },
  district: {
    type: String,
  },
  statename: {
    type: String,
  },
  latitude: {
    type: Number,
  },
  longitude: {
    type: Number,
  },
});

export const Pincode = mongoose.model("Pincode", pincodeSchema);
