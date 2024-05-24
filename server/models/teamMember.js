const mongoose = require("mongoose");

const tesmMemberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  nickname: {
    type: String,
    required: true,
  },
  character_name: String,
  xinfa: {
    type: String,
    required: true,
  },
  tags: [String],
  is_proxy: Boolean,
  is_rich: Boolean,
  is_lock: Boolean,
  is_dove: Boolean,
  signup_time: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TeamMember", tesmMemberSchema);
