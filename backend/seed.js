require("dotenv").config()
const mongoose = require("mongoose")
const { faker } = require("@faker-js/faker")

const Lead = require("./models/Lead")
const LeadHistory = require("./models/LeadHistory")
const User = require("./models/User")

const MONGO_URI = process.env.MONGO_URI

const stages = ["new", "contacted", "qualified", "converted"]

// Configuration
const CONFIG = {
  totalLeads: 5000,
  timeRangeDays: 180, // 6 months of data
  
  // Realistic conversion probabilities
  stageProgression: {
    newToContacted: 0.85,      // 85% of new leads get contacted
    contactedToQualified: 0.60, // 60% of contacted become qualified
    qualifiedToConverted: 0.45  // 45% of qualified convert
  },
  
  // Time delays between stages (in days)
  stageDelays: {
    newToContacted: { min: 0, max: 3 },       // Contact within 0-3 days
    contactedToQualified: { min: 2, max: 10 }, // Qualify within 2-10 days
    qualifiedToConverted: { min: 5, max: 30 }  // Convert within 5-30 days
  }
}

// Helper: Random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Helper: Add days to a date
function addDays(date, days) {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// Helper: Should progress to next stage based on probability
function shouldProgress(probability) {
  return Math.random() < probability
}

// Generate realistic lead progression
function generateLeadProgression(createdDate) {
  const progression = [{
    stage: "new",
    date: createdDate,
    action: "created"
  }]
  
  let currentDate = new Date(createdDate)
  let currentStage = "new"
  
  // Try to progress: new -> contacted
  if (shouldProgress(CONFIG.stageProgression.newToContacted)) {
    const daysDelay = randomBetween(
      CONFIG.stageDelays.newToContacted.min,
      CONFIG.stageDelays.newToContacted.max
    )
    currentDate = addDays(currentDate, daysDelay)
    currentStage = "contacted"
    
    progression.push({
      stage: "contacted",
      date: currentDate,
      action: "updated",
      oldStage: "new"
    })
    
    // Try to progress: contacted -> qualified
    if (shouldProgress(CONFIG.stageProgression.contactedToQualified)) {
      const daysDelay = randomBetween(
        CONFIG.stageDelays.contactedToQualified.min,
        CONFIG.stageDelays.contactedToQualified.max
      )
      currentDate = addDays(currentDate, daysDelay)
      currentStage = "qualified"
      
      progression.push({
        stage: "qualified",
        date: currentDate,
        action: "updated",
        oldStage: "contacted"
      })
      
      // Try to progress: qualified -> converted
      if (shouldProgress(CONFIG.stageProgression.qualifiedToConverted)) {
        const daysDelay = randomBetween(
          CONFIG.stageDelays.qualifiedToConverted.min,
          CONFIG.stageDelays.qualifiedToConverted.max
        )
        currentDate = addDays(currentDate, daysDelay)
        currentStage = "converted"
        
        progression.push({
          stage: "converted",
          date: currentDate,
          action: "updated",
          oldStage: "qualified"
        })
      }
    }
  }
  
  return {
    finalStage: currentStage,
    progression: progression
  }
}

// Main seeding function
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("🔗 Connected to MongoDB Atlas for seeding")
    console.log("⏳ This may take a minute for 5000+ leads...")
    
    const startTime = Date.now()

    // ===== CLEAR OLD DATA =====
    console.log("🗑️  Clearing old data...")
    await Lead.deleteMany()
    await LeadHistory.deleteMany()
    await User.deleteMany()

    // ===== CREATE ADMIN USER =====
    console.log("👤 Creating admin user...")
    const defaultUser = new User({
      name: "Admin",
      email: "admin@example.com",
      password: "password"
    })
    await defaultUser.save()

    // ===== GENERATE LEADS =====
    console.log(`📊 Generating ${CONFIG.totalLeads} leads...`)
    
    const leadsToInsert = []
    const historyToInsert = []
    
    // Track statistics
    const stats = {
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0
    }

    for (let i = 0; i < CONFIG.totalLeads; i++) {
      // Generate random creation date within the time range
      const daysAgo = randomBetween(0, CONFIG.timeRangeDays)
      const createdDate = addDays(new Date(), -daysAgo)
      
      // Generate realistic progression
      const { finalStage, progression } = generateLeadProgression(createdDate)
      
      // Track statistics
      stats[finalStage]++
      
      // Create lead object - using faker.name.fullName() for compatibility
      const lead = {
        name: faker.name.fullName(),
        email: faker.internet.email(),
        phone: faker.phone.number(),
        company: faker.company.name(),
        stage: finalStage,
        createdAt: createdDate
      }
      
      leadsToInsert.push(lead)
      
      // Store progression for history (we'll insert after getting lead IDs)
      lead._progression = progression
      
      // Progress indicator
      if ((i + 1) % 500 === 0) {
        console.log(`   Generated ${i + 1}/${CONFIG.totalLeads} leads...`)
      }
    }

    // ===== INSERT LEADS =====
    console.log("💾 Inserting leads into database...")
    const insertedLeads = await Lead.insertMany(leadsToInsert)

    // ===== GENERATE HISTORY =====
    console.log("📝 Generating history events...")
    
    insertedLeads.forEach((lead, index) => {
      const progression = leadsToInsert[index]._progression
      
      progression.forEach(event => {
        const historyEntry = {
          leadId: lead._id,
          action: event.action,
          newStage: event.stage,
          createdAt: event.date
        }
        
        if (event.oldStage) {
          historyEntry.oldStage = event.oldStage
        }
        
        historyToInsert.push(historyEntry)
      })
    })

    // ===== INSERT HISTORY =====
    console.log("💾 Inserting history events into database...")
    await LeadHistory.insertMany(historyToInsert)

    // ===== SUMMARY =====
    const endTime = Date.now()
    const duration = ((endTime - startTime) / 1000).toFixed(2)
    
    console.log("\n" + "=".repeat(60))
    console.log("✅ SEEDING COMPLETE!")
    console.log("=".repeat(60))
    console.log(`⏱️  Time taken: ${duration}s`)
    console.log(`📊 Total Leads: ${insertedLeads.length}`)
    console.log(`📝 Total History Events: ${historyToInsert.length}`)
    console.log("\n📈 Lead Distribution by Stage:")
    console.log(`   • New:        ${stats.new.toString().padStart(4)} (${((stats.new / CONFIG.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`   • Contacted:  ${stats.contacted.toString().padStart(4)} (${((stats.contacted / CONFIG.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`   • Qualified:  ${stats.qualified.toString().padStart(4)} (${((stats.qualified / CONFIG.totalLeads) * 100).toFixed(1)}%)`)
    console.log(`   • Converted:  ${stats.converted.toString().padStart(4)} (${((stats.converted / CONFIG.totalLeads) * 100).toFixed(1)}%)`)
    console.log("\n📊 Conversion Metrics:")
    console.log(`   • Contact Rate:     ${((stats.contacted + stats.qualified + stats.converted) / CONFIG.totalLeads * 100).toFixed(1)}%`)
    console.log(`   • Qualification Rate: ${((stats.qualified + stats.converted) / CONFIG.totalLeads * 100).toFixed(1)}%`)
    console.log(`   • Conversion Rate:  ${(stats.converted / CONFIG.totalLeads * 100).toFixed(1)}%`)
    console.log("=".repeat(60))
    
    process.exit(0)
  })
  .catch(err => {
    console.error("❌ Error:", err)
    process.exit(1)
  })