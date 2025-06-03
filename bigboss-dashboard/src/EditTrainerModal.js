import React, { useState, useEffect } from 'react';
import axios from 'axios';

function EditTrainerModal({ trainer, onClose, onSuccess, darkMode }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialty: '',
    experience: '',
    schedule: '',
    rating: ''
  });

  useEffect(() => {
    if (trainer) {
      setFormData({
        name: trainer.name || '',
        email: trainer.email || '',
        specialty: trainer.specialty || '',
        experience: trainer.experience || '',
        schedule: trainer.schedule || '',
        rating: trainer.rating || ''
      });
    }
  }, [trainer]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Edit (Update) trainer
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const requiredFields = ['name', 'email', 'specialty', 'experience', 'schedule', 'rating'];
      for (let field of requiredFields) {
        if (!formData[field]) {
          alert('❌ Please fill in all fields');
          return;
        }
      }

      const payload = {
        name: formData.name,
        email: formData.email,
        specialty: formData.specialty,
        experience: parseInt(formData.experience),
        schedule: formData.schedule,
        rating: parseFloat(formData.rating)
      };

      const res = await axios.put(`http://localhost:5000/api/trainers/${trainer.trainer_id}`, payload);

      if (res.status === 200) {
        alert('✅ Trainer updated successfully');
        onSuccess();
        onClose();
      } else {
        alert('❌ Unexpected server response');
      }
    } catch (error) {
      console.error('Edit trainer error:', error);
      alert('❌ Failed to update trainer');
    }
  };

  // Delete trainer
  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this trainer?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/trainers/${trainer.trainer_id}`);
      alert('🗑️ Trainer deleted successfully');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Delete trainer error:', error);
      alert('❌ Failed to delete trainer');
    }
  };

  return (
    <div style={modalStyle}>
      <div style={{ ...modalContentStyle, backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000' }}>
        <h2>Edit Trainer</h2>
        <form onSubmit={handleSubmit}>
          {['name', 'email', 'specialty', 'experience', 'schedule', 'rating'].map(field => (
            <div key={field}>
              <label style={{ display: 'block', marginBottom: '5px' }}>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              <input
                name={field}
                value={formData[field]}
                onChange={handleChange}
                type={field === 'experience' || field === 'rating' ? 'number' : 'text'}
                step={field === 'rating' ? '0.1' : undefined}
                style={inputStyle}
              />
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', gap: '10px' }}>
            <button
              type="button"
              onClick={handleDelete}
              style={{ ...buttonStyle, backgroundColor: '#f44336' }}
            >
              Delete
            </button>
            <button type="submit" style={buttonStyle}>Update</button>
            <button
              type="button"
              onClick={onClose}
              style={{ ...buttonStyle, backgroundColor: '#6c757d' }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const modalStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
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

export default EditTrainerModal;
