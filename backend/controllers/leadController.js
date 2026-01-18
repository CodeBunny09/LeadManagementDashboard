const Lead = require('../models/Lead');

exports.getLeads = async (req, res) => {
  const { search, stage, sort, page = 1, limit = 10 } = req.query;
  const query = {};

  if (stage) {
    query.stage = stage;
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { company: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    let leadQuery = Lead.find(query);

    // Sorting
    if (sort === 'asc') leadQuery = leadQuery.sort({ createdAt: 1 });
    else if (sort === 'desc') leadQuery = leadQuery.sort({ createdAt: -1 });

    // Pagination
    const pageNumber = parseInt(page, 10) || 1;
    const pageSize = parseInt(limit, 10) || 10;
    const skip = (pageNumber - 1) * pageSize;
    leadQuery = leadQuery.skip(skip).limit(pageSize);

    const leads = await leadQuery;
    const total = await Lead.countDocuments(query);

    res.json({ leads, total });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getLeadById = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
