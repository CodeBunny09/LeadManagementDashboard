const Lead = require('../models/Lead');

exports.getAnalytics = async (req, res) => {
  try {
    const totalLeads = await Lead.countDocuments();
    const convertedLeads = await Lead.countDocuments({ stage: 'converted' });
    const leadsByStageAggregate = await Lead.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } }
    ]);
    const leadsByStage = {};
    leadsByStageAggregate.forEach(item => {
      leadsByStage[item._id] = item.count;
    });

    res.json({ totalLeads, convertedLeads, leadsByStage });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
