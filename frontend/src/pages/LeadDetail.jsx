import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../services/api';

function LeadDetail() {
  const { id } = useParams();
  const [lead, setLead] = useState(null);

  useEffect(() => {
    API.get(`/api/leads/${id}`)
      .then(res => setLead(res.data))
      .catch(err => console.error(err));
  }, [id]);

  if (!lead) {
    return <div>Loading...</div>;
  }

  return (
    <div className="lead-detail">
      <h2>Lead Details</h2>
      <p><strong>Name:</strong> {lead.name}</p>
      <p><strong>Email:</strong> {lead.email}</p>
      <p><strong>Phone:</strong> {lead.phone}</p>
      <p><strong>Company:</strong> {lead.company}</p>
      <p><strong>Stage:</strong> {lead.stage}</p>
      <p><strong>Created At:</strong> {new Date(lead.createdAt).toLocaleString()}</p>
      <Link to="/dashboard">Back to Dashboard</Link>
    </div>
  );
}

export default LeadDetail;
