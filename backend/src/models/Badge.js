const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
    {
        attribueA: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
        badgeType: {
            type: String,
            enum: ["innovateur", "collaborateur", "expert", "mentor", "contributeur", "leader"],
            required: true,
        },
        justification: { type: String, default: "" },
        attribuePar: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membre",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Badge", badgeSchema);
