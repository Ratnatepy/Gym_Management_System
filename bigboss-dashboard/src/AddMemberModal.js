import React, { useState } from 'react';
import axios from 'axios';

const AddMemberModal = ({ onClose, onMemberAdded, darkMode }) => {
  const [memberData, setMemberData] = useState({
    name: '',
    email: '',
    phone: '',
    membership_type: '',
    join_date: '',
    dob: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const generatePassword = () => {
    const base = Math.random().toString(36).slice(-8);
    return base.charAt(0).toUpperCase() + base.slice(1) + '@BB';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const formattedValue = ['join_date', 'dob'].includes(name) && value
      ? new Date(value).toISOString().split('T')[0]
      : value;
    setMemberData({ ...memberData, [name]: formattedValue });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const requiredFields = ['name', 'email', 'phone', 'membership_type', 'join_date', 'dob', 'password'];
      for (let field of requiredFields) {
        if (!memberData[field]) {
          alert('❌ Please fill in all fields');
          setIsSubmitting(false);
          return;
        }
      }

      
 const payload = {
  member_name: memberData.name,       // changed 'name' to 'member_name'
  member_email: memberData.email,     // changed 'email' to 'member_email'
  member_tel: memberData.phone,       // changed 'phone' to 'member_tel'
  membership_type: memberData.membership_type,
  join_date: memberData.join_date,
  dob: memberData.dob,
  member_password: memberData.password  // changed 'password' to 'member_password'
};

console.log('Payload:', payload); // Check payload before sending

      const response = await axios.post('http://localhost:5000/api/members', payload);
      
      if (response.status === 201) {
        alert('✅ Member added successfully');
        setMemberData({
          name: '',
          email: '',
          phone: '',
          membership_type: '',
          join_date: '',
          dob: '',
          password: ''
        });
        
        if (typeof onMemberAdded === 'function') {
          await onMemberAdded();
        }
        
        if (typeof onClose === 'function') {
          onClose();
        }
      }
      
    } catch (error) {
      console.error('Add member error:', error);
      if (error.response) {
        if (error.response.status === 409) {
          alert('❌ A member with this email or phone already exists');
        } else {
          alert(`❌ Server error: ${error.response.data?.message || error.message}`);
        }
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <div style={modalStyle}>
      <div style={{ ...modalContentStyle, backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000' }}>
        <h2>Add New Member</h2>
        <form onSubmit={handleSubmit}>
          <input 
            name="name" 
            placeholder="Name" 
            value={memberData.name} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="email" 
            placeholder="Email" 
            type="email" 
            value={memberData.email} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="phone" 
            placeholder="Phone" 
            value={memberData.phone} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <select 
            name="membership_type" 
            value={memberData.membership_type} 
            onChange={handleChange} 
            required 
            style={inputStyle}
          >
            <option value="" disabled>Select Membership Type</option>
            <option value="Standard Membership">Standard Membership</option>
            <option value="Premium Membership">Premium Membership</option>
            <option value="Family Membership">Family Membership</option>
          </select>
          <input 
            name="join_date" 
            type="date" 
            placeholder="Join Date" 
            value={memberData.join_date} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <input 
            name="dob" 
            type="date" 
            placeholder="Date of Birth" 
            value={memberData.dob} 
            onChange={handleChange} 
            required 
            style={inputStyle} 
          />
          <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
            <input 
              name="password" 
              type="text" 
              placeholder="Password" 
              value={memberData.password} 
              onChange={handleChange} 
              required 
              style={{ ...inputStyle, flex: 1 }} 
            />
            <button
              type="button"
              onClick={() => setMemberData({ ...memberData, password: generatePassword() })}
              style={{ ...buttonStyle, backgroundColor: '#28a745', padding: '10px' }}
              disabled={isSubmitting}
            >
              Generate
            </button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              type="button" 
              onClick={onClose} 
              style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ ...buttonStyle, marginLeft: '10px' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddMemberModal;