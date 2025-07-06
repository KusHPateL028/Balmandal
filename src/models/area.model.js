import mongoose, { Schema } from "mongoose";

const areaSchema = new Schema({
    name: {
        type:String,
        required: true,
    },
    pincode: {
        type: Number,
        required: true,
    }
}, { timestamps: true });

export const Area = mongoose.model("Area", areaSchema);
