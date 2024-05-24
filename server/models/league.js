const mongoose = require("mongoose");

const leagueSchema = new mongoose.Schema({
  leagueGroupNumber: {
    type: String,
    required: true,
    unique: true,
  },
  leagueName: {
    type: String,
    required: true,
    maxlength: 10,
  },
  leagueKey: {
    type: String,
    required: true,
    maxlength: 30,
  },
  leagueServer: {
    type: String,
    required: true,
    maxlength: 10,
  },
  leagueLeader: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  leagueAssistant: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
  leagueMember: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  ],
});

leagueSchema.index({ leagueGroupNumber: 1 });

leagueSchema.index({ leagueKey: 1 });

leagueSchema.index({ leagueName: 1, leagueServer: 1 });

leagueSchema.methods.addAssistant = function (assistantId) {
  this.leagueAssistant.push(assistantId);
  return this.save();
};

leagueSchema.methods.addMember = function (memberId) {
  this.leagueMember.push(memberId);
  return this.save();
};

module.exports = mongoose.model("League", leagueSchema);
