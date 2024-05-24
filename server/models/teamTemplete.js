const mongoose = require("mongoose");

const teamTempleteSchema = new mongoose.Schema({
  templeteName: {
    type: String,
    required: true,
    unique: true,
  },
  leagueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "League",
    required: true,
  },
  slots: [
    {
      rule: {
        type: String,
        required: true,
      },
    },
  ],
});

module.exports = mongoose.model("TeamTemplete", teamTempleteSchema);
