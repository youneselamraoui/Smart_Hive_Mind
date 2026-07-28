const mongoose = require("mongoose");

const forumSchema = new mongoose.Schema({
    nom: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    thematiques: [{ type: mongoose.Schema.Types.ObjectId, ref: "Thematique" }],
});

module.exports = mongoose.model("Forum", forumSchema);
