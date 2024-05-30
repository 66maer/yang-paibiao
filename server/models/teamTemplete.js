const mongoose = require("mongoose");

const teamTempleteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  league: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "League",
    required: true,
  },
  slot_rules: [
    {
      available_xinfa: {
        type: [String],
        required: true,
      },
      allow_rich: {
        type: Boolean,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("TeamTemplete", teamTempleteSchema);
