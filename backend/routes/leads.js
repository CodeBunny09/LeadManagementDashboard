const express = require("express")
const router = express.Router()
const Lead = require("../models/Lead")
const LeadHistory = require("../models/LeadHistory")
const auth = require("../middleware/auth")

router.get("/", auth, async (req, res) => {
  try {
    const { search = "", stage = "", page, limit } = req.query

    const query = {}

    if (stage) query.stage = stage

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { company: { $regex: search, $options: "i" } }
      ]
    }

    // If page & limit exist → paginate
    let leads, total

    if (page && limit) {
      const pageNum = parseInt(page)
      const pageSize = parseInt(limit)
      const skip = (pageNum - 1) * pageSize

      leads = await Lead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)

      total = await Lead.countDocuments(query)

    } else {
      // showAll mode
      leads = await Lead.find(query).sort({ createdAt: -1 })
      total = leads.length
    }

    res.json({ leads, total })

  } catch (err) {
    console.error(err)
    res.status(500).json({ message: "Server error" })
  }
})


// CREATE
router.post("/", auth, async (req, res) => {
  try {
    const lead = await Lead.create(req.body)

    await LeadHistory.create({
      leadId: lead._id,
      action: "created",
      newStage: lead.stage
    })

    res.status(201).json(lead)

  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})


// UPDATE
router.put("/:id", auth, async (req, res) => {
  try {
    const oldLead = await Lead.findById(req.params.id)

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    )

    if (!lead) return res.status(404).json({ message: "Lead not found" })

    await LeadHistory.create({
      leadId: lead._id,
      action: "updated",
      oldStage: oldLead.stage,
      newStage: lead.stage
    })

    res.json(lead)

  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})


// DELETE
router.delete("/:id", auth, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id)
    if (!lead) return res.status(404).json({ message: "Lead not found" })
    res.json({ message: "Deleted" })
  } catch (err) {
    res.status(400).json({ message: err.message })
  }
})

module.exports = router
