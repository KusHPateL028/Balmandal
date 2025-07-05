import mongoose, { Schema } from "mongoose";

const areaSchema = new Schema({
    name: {
        type:String,
        required: true,
        unique: true,
    },
    pincode: {
        type: Number,
        required: true,
        unique: true,
    }
}, { timestamps: true });

export const Area = mongoose.model("Area", areaSchema);
