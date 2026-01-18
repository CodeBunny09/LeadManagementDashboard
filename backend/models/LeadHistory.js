const mongoose = require("mongoose")

const LeadHistorySchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Lead",
    required: true
  },
  action: {
    type: String,
    enum: ["created", "updated"],
    required: true
  },
  oldStage: String,
  newStage: String
}, { timestamps: true })   // <-- IMPORTANT: timestamps adds createdAt

module.exports = mongoose.model("LeadHistory", LeadHistorySchema)
