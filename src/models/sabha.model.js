import mongoose, { Schema } from "mongoose";

const sabhaSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    areaId: {
      type: Schema.Types.ObjectId,
      ref: "Area",
      required: true,
    },
    sanchalakId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sahSanchalakId: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    nirikshakId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

export const Sabha = mongoose.model("Sabha", sabhaSchema);
