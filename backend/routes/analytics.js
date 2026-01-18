const express = require("express")
const router = express.Router()
const Lead = require("../models/Lead")
const LeadHistory = require("../models/LeadHistory")
const auth = require("../middleware/auth")

router.get("/", auth, async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments()
    const convertedLeads = await Lead.countDocuments({ stage: "converted" })

    const stages = ["new", "contacted", "qualified", "converted"]
    const leadsByStage = {}

    for (const stage of stages) {
      leadsByStage[stage] = await Lead.countDocuments({ stage })
    }

    // ✅ UNIQUE COMPANIES COUNT (FIX)
    const companiesAgg = await Lead.aggregate([
      { $group: { _id: "$company" } },
      { $count: "count" }
    ])
    const uniqueCompanies = companiesAgg[0]?.count || 0

    res.json({
      totalLeads,
      convertedLeads,
      uniqueCompanies,   // <-- NEW
      leadsByStage
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})


// ===== HISTORY ===== (FIXED - NOW RETURNS ALL FIELDS)
router.get("/history", auth, async (req, res) => {
  try {
    const history = await LeadHistory.find().sort({ createdAt: 1 })
    const safe = history.map(h => ({
      createdAt: h.createdAt.toISOString(),
      action: h.action,
      oldStage: h.oldStage,
      newStage: h.newStage,
      leadId: h.leadId
    }))
    res.json(safe)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})

module.exports = router