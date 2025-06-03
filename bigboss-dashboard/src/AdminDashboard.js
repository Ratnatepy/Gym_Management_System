import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AddMemberModal from './AddMemberModal';
import EditMemberModal from './EditMemberModal';
import DashboardCharts from './DashboardCharts';

function DashboardCard({ title, value, darkMode, isLoading }) {
  const icon = {
    'Total Members': '👥',
    'Total Trainers': '💪',
    'Total Income': '💰'
  }[title] || '📊';

  return (
    <div style={{
      backgroundColor: darkMode ? '#1e1e1e' : '#fff',
      color: darkMode ? '#fff' : '#000',
      padding: '20px',
      borderRadius: '10px',
      flex: 1,
      minWidth: '200px',
      boxShadow: '0 0 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ fontSize: '1.5rem', marginRight: '10px' }}>{icon}</span>
        <h4 style={{ margin: 0 }}>{title}</h4>
      </div>
      {isLoading ? (
        <div style={{ height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: `2px solid ${darkMode ? '#444' : '#eee'}`,
            borderTop: `2px solid ${darkMode ? '#4CAF50' : '#2E7D32'}`,
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
        </div>
      ) : (
        <p style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: darkMode ? '#4CAF50' : '#2E7D32',
          margin: 0
        }}>
          {value}
        </p>
      )}
    </div>
  );
}

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [stats, setStats] = useState({ totalMembers: 0, totalTrainers: 0, totalIncome: '$0.00' });
  const [members, setMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const navigate = useNavigate();

  const fetchDashboardStats = useCallback(async () => {
    try {
      const [membersRes, trainersRes, incomeRes] = await Promise.all([
        axios.get('http://localhost:5000/api/members/count'),
        axios.get('http://localhost:5000/api/trainers/count'),
        axios.get('http://localhost:5000/api/payments/total')
      ]);

      setStats({
        totalMembers: membersRes.data?.totalMembers || 0,
        totalTrainers: trainersRes.data?.totalTrainers || 0,
        totalIncome: incomeRes.data?.totalIncome
          ? `$${parseFloat(incomeRes.data.totalIncome).toFixed(2)}`
          : '$0.00'
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setError('⚠️ Failed to fetch statistics');
      setStats({ totalMembers: 0, totalTrainers: 0, totalIncome: '$0.00' });
    }
  }, []);

  const fetchMembers = useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members');
      setMembers(res.data || []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setError('⚠️ Failed to fetch members');
      setMembers([]);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      await Promise.all([fetchDashboardStats(), fetchMembers()]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('⚠️ Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [fetchDashboardStats, fetchMembers]);

  const handleDeleteMember = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this member?')) return;
    try {
      setDeletingId(id);
      await axios.delete(`http://localhost:5000/api/members/${id}`);
      setSuccess('✅ Member deleted successfully');
      await fetchAllData();
    } catch (err) {
      console.error('Delete error:', err);
      setError('❌ Could not delete member');
    } finally {
      setDeletingId(null);
      setTimeout(() => { setError(''); setSuccess(''); }, 3000);
    }
  }, [fetchAllData]);

  const handleEdit = useCallback((member) => {
    setEditingMember(member);
    setShowEditModal(true);
  }, []);

  const handleAddMemberSuccess = useCallback(() => {
    setShowAddModal(false);
    fetchAllData();
    setSuccess('✅ Member added successfully');
    setTimeout(() => setSuccess(''), 3000);
  }, [fetchAllData]);

  const handleEditMemberSuccess = useCallback(() => {
    setShowEditModal(false);
    fetchAllData();
    setSuccess('✅ Member updated successfully');
    setTimeout(() => setSuccess(''), 3000);
  }, [fetchAllData]);

  const formatDate = useCallback((date) => date ? new Date(date).toLocaleDateString() : '-', []);

  const filteredMembers = members.filter(member =>
    member.member_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return (
    <div style={{
      backgroundColor: darkMode ? '#121212' : '#f9fafb',
      color: darkMode ? '#f1f1f1' : '#000',
      minHeight: '100vh',
      padding: '30px',
      position: 'relative',
      paddingBottom: '60px'
    }}>
      {/* UI Added Here */}
      <button
        onClick={() => {
          const mode = !darkMode;
          setDarkMode(mode);
          localStorage.setItem('darkMode', mode);
        }}
        style={{
          position: 'absolute', top: '20px', right: '20px', padding: '8px 14px',
          backgroundColor: darkMode ? '#f1f1f1' : '#111', color: darkMode ? '#111' : '#fff',
          border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}
      >
        {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
      </button>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <img src="/logo.jpg" alt="Logo" width="60" style={{ borderRadius: '10px', marginBottom: '10px' }} />
        <h1>BigBoss Gym Admin Dashboard</h1>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <DashboardCard title="Total Members" value={stats.totalMembers} darkMode={darkMode} isLoading={isLoading} />
        <DashboardCard title="Total Trainers" value={stats.totalTrainers} darkMode={darkMode} isLoading={isLoading} />
        <DashboardCard title="Total Income" value={stats.totalIncome} darkMode={darkMode} isLoading={isLoading} />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
        <input
          type="text"
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: '10px', borderRadius: '6px', border: `1px solid ${darkMode ? '#444' : '#ccc'}`,
            width: '250px', backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000'
          }}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowAddModal(true)} style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#007bff', color: '#fff', border: 'none', cursor: 'pointer' }} disabled={isLoading}>+ Add Member</button>
          <button onClick={() => navigate('/trainers')} style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#ff9800', color: '#fff', border: 'none', cursor: 'pointer' }}>Trainers</button>
          <button onClick={() => navigate('/payments')} style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer' }}>Payments</button>
        </div>
      </div>

      {success && <div style={{ backgroundColor: '#d4edda', color: '#155724', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{success}</div>}
      {error && <div style={{ backgroundColor: '#f8d7da', color: '#721c24', padding: '10px', borderRadius: '6px', marginBottom: '20px', textAlign: 'center' }}>{error}</div>}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ width: '40px', height: '40px', margin: '0 auto', border: '4px solid #f3f3f3', borderTop: '4px solid #3498db', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p>Loading members...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '10px', boxShadow: '0 0 8px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: darkMode ? '#1e1e1e' : '#fff', color: darkMode ? '#fff' : '#000' }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#333' : '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Phone</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Membership</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Join Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>DOB</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMembers.map(member => (
                <tr key={member.member_id} style={{ borderBottom: `1px solid ${darkMode ? '#444' : '#eee'}` }}>
                  <td style={{ padding: '12px' }}>{member.member_id}</td>
                  <td style={{ padding: '12px' }}>{member.member_name}</td>
                  <td style={{ padding: '12px' }}>{member.member_email}</td>
                  <td style={{ padding: '12px' }}>{member.member_tel}</td>
                  <td style={{ padding: '12px' }}>{member.membership_type}</td>
                  <td style={{ padding: '12px' }}>{formatDate(member.join_date)}</td>
                  <td style={{ padding: '12px' }}>{formatDate(member.dob)}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => handleEdit(member)} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#28a745', color: '#fff', border: 'none', cursor: 'pointer' }}>Edit</button>
                    <button disabled={deletingId === member.member_id} onClick={() => handleDeleteMember(member.member_id)} style={{ padding: '8px 12px', borderRadius: '6px', backgroundColor: '#dc3545', color: '#fff', border: 'none', cursor: 'pointer', marginLeft: '8px', opacity: deletingId === member.member_id ? 0.6 : 1 }}>{deletingId === member.member_id ? 'Deleting...' : 'Delete'}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <DashboardCharts darkMode={darkMode} />

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '10px', textAlign: 'center', backgroundColor: darkMode ? '#1e1e1e' : '#f8f9fa', borderTop: `1px solid ${darkMode ? '#333' : '#ddd'}`, color: darkMode ? '#aaa' : '#666', fontSize: '0.9rem' }}>
        © {new Date().getFullYear()} BigBoss Gym. All rights reserved. Developed by Bun Ratnatepy.
      </div>

      {showAddModal && <AddMemberModal onClose={() => setShowAddModal(false)} onSuccess={handleAddMemberSuccess} darkMode={darkMode} />}
      {showEditModal && editingMember && <EditMemberModal member={editingMember} onClose={() => setShowEditModal(false)} onSuccess={handleEditMemberSuccess} darkMode={darkMode} />}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
