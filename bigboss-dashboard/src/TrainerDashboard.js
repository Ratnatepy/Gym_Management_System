import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

function TrainerDashboard() {
  // State management
  const [trainers, setTrainers] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [editingTrainer, setEditingTrainer] = useState(null);
  const [newTrainer, setNewTrainer] = useState({
    name: '',
    email: '',
    specialty: '',
    experience: '',
    schedule: '',
    rating: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Show toast message
  const showToast = useCallback((message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  }, []);

  // Fetch all trainers
  const fetchTrainers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/trainers');
      setTrainers(res.data);
    } catch (error) {
      console.error('Fetch error:', error);
      showToast('❌ Failed to load trainers');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Fetch trainers on component mount
  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  // Toggle dark/light mode
  const toggleDarkMode = () => {
    const mode = !darkMode;
    setDarkMode(mode);
    localStorage.setItem('darkMode', mode);
  };

  // Handle input changes for forms
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (showEditModal) {
      setEditingTrainer(prev => ({ ...prev, [name]: value }));
    } else {
      setNewTrainer(prev => ({ ...prev, [name]: value }));
    }
  };

  // Add new trainer
  const handleAddTrainer = async () => {
    try {
      await axios.post('http://localhost:5000/api/trainers', newTrainer);
      showToast('✅ Trainer added successfully');
      setShowAddModal(false);
      setNewTrainer({ name: '', email: '', specialty: '', experience: '', schedule: '', rating: '' });
      fetchTrainers();
    } catch (error) {
      console.error('Add error:', error);
      showToast(`❌ Failed to add trainer: ${error.response?.data?.message || error.message}`);
    }
  };

  // Prepare trainer for editing
  const handleEditClick = (trainer) => {
    setEditingTrainer(trainer);
    setShowEditModal(true);
  };

  // Update existing trainer
  const handleEditTrainer = async () => {
    if (!editingTrainer?.trainer_id) {
      showToast('❌ Invalid trainer ID');
      return;
    }

    try {
      const payload = {
        name: editingTrainer.name,
        email: editingTrainer.email,
        specialty: editingTrainer.specialty,
        experience: parseInt(editingTrainer.experience),
        schedule: editingTrainer.schedule,
        rating: parseFloat(editingTrainer.rating)
      };

      await axios.put(
        `http://localhost:5000/api/trainers/${editingTrainer.trainer_id}`,
        payload
      );
      showToast('✅ Trainer updated successfully');
      setShowEditModal(false);
      fetchTrainers();
    } catch (error) {
      console.error('Edit error:', error);
      showToast(`❌ Failed to update trainer: ${error.response?.data?.message || error.message}`);
    }
  };

  // Delete trainer
  const handleDeleteTrainer = async (trainer_id) => {
    if (!trainer_id) {
      showToast('❌ Invalid trainer ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this trainer?')) return;

    try {
      setDeletingId(trainer_id);
      await axios.delete(`http://localhost:5000/api/trainers/${trainer_id}`);
      showToast('🗑️ Trainer deleted successfully');
      fetchTrainers();
    } catch (error) {
      console.error('Delete error:', error);
      showToast(`❌ Failed to delete trainer: ${error.response?.data?.message || error.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  // Styles (same as before)
  const containerStyle = {
    padding: '20px',
    backgroundColor: darkMode ? '#121212' : '#f9fafb',
    color: darkMode ? '#fff' : '#000',
    minHeight: '100vh'
  };

  const buttonStyle = {
    padding: '10px 15px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: 'bold',
    marginRight: '10px',
    marginBottom: '10px',
    transition: 'all 0.2s'
  };

  const primaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#ff9800',
    color: '#fff',
    ':hover': {
      backgroundColor: '#e68a00'
    }
  };

  const secondaryButtonStyle = {
    ...buttonStyle,
    backgroundColor: darkMode ? '#333' : '#e0e0e0',
    color: darkMode ? '#fff' : '#000'
  };

  const dangerButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#f44336',
    color: '#fff'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    color: darkMode ? '#fff' : '#000',
    marginTop: '20px'
  };

  const tableHeaderStyle = {
    backgroundColor: darkMode ? '#333' : '#f5f5f5',
    padding: '12px',
    textAlign: 'left',
    borderBottom: `2px solid ${darkMode ? '#444' : '#ddd'}`
  };

  const tableCellStyle = {
    padding: '12px',
    borderBottom: `1px solid ${darkMode ? '#333' : '#e0e0e0'}`
  };

  const toastStyle = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '15px',
    borderRadius: '6px',
    backgroundColor: '#333',
    color: '#fff',
    zIndex: 1000,
    boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    animation: 'fadeIn 0.3s'
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
    zIndex: 1000
  };

  const modalContentStyle = {
    padding: '25px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
    backgroundColor: darkMode ? '#1e1e1e' : '#fff',
    color: darkMode ? '#fff' : '#000'
  };

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
    fontSize: '16px',
    marginBottom: '15px',
    backgroundColor: darkMode ? '#333' : '#fff',
    color: darkMode ? '#fff' : '#000'
  };

  return (
    <div style={containerStyle}>
      {/* Header and controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ margin: 0 }}>Trainer Management</h1>
        <div>
          <button onClick={toggleDarkMode} style={secondaryButtonStyle}>
            {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
          </button>
          <button 
            onClick={() => setShowAddModal(true)} 
            style={primaryButtonStyle}
          >
            + Add Trainer
          </button>
        </div>
      </div>

      {/* Toast notification */}
      {toastMessage && (
        <div style={toastStyle}>
          {toastMessage}
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            border: `4px solid ${darkMode ? '#333' : '#f3f3f3'}`,
            borderTop: `4px solid #ff9800`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Loading trainers...</p>
        </div>
      )}

      {/* Trainers table */}
      {!isLoading && (
        <div style={{ overflowX: 'auto' }}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>ID</th>
                <th style={tableHeaderStyle}>Name</th>
                <th style={tableHeaderStyle}>Email</th>
                <th style={tableHeaderStyle}>Specialty</th>
                <th style={tableHeaderStyle}>Experience (years)</th>
                <th style={tableHeaderStyle}>Schedule</th>
                <th style={tableHeaderStyle}>Rating</th>
                <th style={tableHeaderStyle}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {trainers.map(trainer => (
                <tr key={trainer.trainer_id}>
                  <td style={tableCellStyle}>{trainer.trainer_id}</td>
                  <td style={tableCellStyle}>{trainer.name}</td>
                  <td style={tableCellStyle}>{trainer.email}</td>
                  <td style={tableCellStyle}>{trainer.specialty}</td>
                  <td style={tableCellStyle}>{trainer.experience}</td>
                  <td style={tableCellStyle}>{trainer.schedule}</td>
                  <td style={tableCellStyle}>{trainer.rating}</td>
                  <td style={tableCellStyle}>
                    <button 
                      onClick={() => handleEditClick(trainer)}
                      style={{ ...secondaryButtonStyle, marginRight: '5px' }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDeleteTrainer(trainer.trainer_id)}
                      style={dangerButtonStyle}
                      disabled={deletingId === trainer.trainer_id}
                    >
                      {deletingId === trainer.trainer_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Trainer Modal */}
      {showAddModal && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Add New Trainer</h2>
            {['name', 'email', 'specialty', 'experience', 'schedule', 'rating'].map(field => (
              <div key={field}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                <input
                  type={field === 'experience' ? 'number' : field === 'rating' ? 'number' : 'text'}
                  step={field === 'rating' ? '0.1' : undefined}
                  name={field}
                  value={newTrainer[field]}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowAddModal(false)} 
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddTrainer} 
                style={{ ...primaryButtonStyle, marginLeft: '10px' }}
              >
                Add Trainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Trainer Modal */}
      {showEditModal && editingTrainer && (
        <div style={modalStyle}>
          <div style={modalContentStyle}>
            <h2 style={{ marginTop: 0 }}>Edit Trainer</h2>
            {['name', 'email', 'specialty', 'experience', 'schedule', 'rating'].map(field => (
              <div key={field}>
                <label style={{ display: 'block', marginBottom: '5px' }}>
                  {field.charAt(0).toUpperCase() + field.slice(1)}:
                </label>
                <input
                  type={field === 'experience' ? 'number' : field === 'rating' ? 'number' : 'text'}
                  step={field === 'rating' ? '0.1' : undefined}
                  name={field}
                  value={editingTrainer[field] || ''}
                  onChange={handleInputChange}
                  style={inputStyle}
                />
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
              <button 
                onClick={() => setShowEditModal(false)} 
                style={secondaryButtonStyle}
              >
                Cancel
              </button>
              <button 
                onClick={handleEditTrainer} 
                style={{ ...primaryButtonStyle, marginLeft: '10px' }}
              >
                Update Trainer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global styles */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default TrainerDashboard;
