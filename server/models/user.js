const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  qqNumber: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  nickname: {
    type: String,
    required: false,
    maxlength: 8,
  },
  leagues: [
    {
      leagueId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "League",
      },
      role: {
        type: String,
        enum: ["leader", "assistant", "member"],
        required: true,
      },
    },
  ],
  characters: [
    {
      characterName: {
        type: String,
        required: true,
      },
      xinfa: {
        type: String,
        required: true,
        maxlength: 10,
      },
    },
  ],
  teamRecords: [
    {
      teamId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
        required: true,
      },
      status: {
        type: String,
        enum: ["attended", "absent"],
        required: true,
      },
      characterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Character",
        required: false,
      },
    },
  ],
});

userSchema.index({ qqNumber: 1 });

userSchema.methods.joinLeague = function (leagueId, role) {
  this.leagues.push({ leagueId, role });
  return this.save();
};

userSchema.methods.addCharacter = function (characterId) {
  this.characters.push({ characterId });
  return this.save();
};

userSchema.methods.addTeamRecord = function (teamId, status, characterId) {
  const teamRecord = { teamId, status };
  if (characterId) {
    teamRecord.characterId = characterId;
  }
  this.teamRecords.push(teamRecord);
  return this.save();
};

module.exports = mongoose.model("User", userSchema);
