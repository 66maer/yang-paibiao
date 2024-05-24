const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 20,
    },
    team_time: {
      type: Date,
      required: true,
    },
    league: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "League",
      required: true,
    },
    note: String,
    active: {
      type: Boolean,
      default: true,
      required: true,
    },
    slots: [
      {
        rule: {
          available_xinfa: {
            type: [String],
            required: true,
          },
          allow_rich: {
            type: Boolean,
            required: true,
          },
        },
        member: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "TeamMember",
        },
      },
    ],
    candidates: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember",
      },
    ],
    member_record: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "TeamMember",
      },
    ],
  },
  {
    timestamps: true,
  }
);

teamSchema.index({ uuid: 1 });

module.exports = mongoose.model("Team", teamSchema);
