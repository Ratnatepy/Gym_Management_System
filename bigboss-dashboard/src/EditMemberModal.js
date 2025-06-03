import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EditMemberModal({ member, onClose, onSuccess, darkMode }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    membership_type: '',
    join_date: ''
  });

  useEffect(() => {
    if (member) {
      setFormData({
        name: member.member_name || '',
        email: member.member_email || '',
        phone: member.member_tel || '',
        dob: member.dob ? member.dob.split('T')[0] : '',
        membership_type: member.membership_type || '',
        join_date: member.join_date ? member.join_date.split('T')[0] : ''
      });
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = ['name', 'email', 'phone', 'dob', 'membership_type', 'join_date'];
      for (let field of requiredFields) {
        if (!formData[field]) {
          alert('❌ Please fill in all fields');
          return;
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        dob: formData.dob,
        membership_type: formData.membership_type,
        join_date: formData.join_date
      };

      const res = await axios.put(`http://localhost:5000/api/members/${member.member_id}`, payload);
      if (res.status === 200) {
        alert('✅ Member updated successfully');
        onSuccess();
        onClose();
      } else {
        alert('❌ Unexpected server response');
      }
    } catch (error) {
      console.error('Edit member error:', error);
      if (error.response) {
        alert('❌ ' + (error.response.data?.message || 'Failed to update member'));
      } else {
        alert('❌ Failed to update member');
      }
    }
  };

  return (
    <div style={modalStyle}>
      <div style={{ ...modalContentStyle, backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000' }}>
        <h2>Edit Member</h2>
        <form onSubmit={handleSubmit}>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" placeholder="Name" value={formData.name} onChange={handleChange} required style={inputStyle} />

          <label htmlFor="email">Email</label>
          <input id="email" name="email" placeholder="Email" type="email" value={formData.email} onChange={handleChange} required style={inputStyle} />

          <label htmlFor="phone">Phone</label>
          <input id="phone" name="phone" placeholder="Phone" value={formData.phone} onChange={handleChange} required style={inputStyle} />

          <label htmlFor="dob">Date of Birth</label>
          <input id="dob" name="dob" placeholder="Date of Birth" type="date" value={formData.dob} onChange={handleChange} required style={inputStyle} />

          <label htmlFor="join_date">Join Date</label>
          <input id="join_date" name="join_date" placeholder="Join Date" type="date" value={formData.join_date} onChange={handleChange} required style={inputStyle} />

          <label htmlFor="membership_type">Membership Type</label>
          <select id="membership_type" name="membership_type" value={formData.membership_type} onChange={handleChange} required style={inputStyle}>
            <option value="" disabled>Select Membership Type</option>
            <option value="Standard Membership">Standard Membership</option>
            <option value="Premium Membership">Premium Membership</option>
            <option value="Family Membership">Family Membership</option>
          </select>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="submit" style={buttonStyle}>Update</button>
            <button type="button" onClick={onClose} style={{ ...buttonStyle, backgroundColor: '#6c757d' }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
};

const modalContentStyle = {
  padding: '20px',
  borderRadius: '10px',
  width: '100%',
  maxWidth: '400px',
  boxShadow: '0 0 10px rgba(0,0,0,0.3)'
};

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px',
  fontSize: '16px',
  borderRadius: '6px',
  border: '1px solid #ccc'
};

const buttonStyle = {
  padding: '10px 16px',
  backgroundColor: '#007bff',
  color: '#fff',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer'
};

export default EditMemberModal;
