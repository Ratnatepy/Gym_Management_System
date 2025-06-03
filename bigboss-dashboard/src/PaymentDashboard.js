import React, { useState, useEffect } from 'react';
import axios from 'axios';

function PaymentDashboard() {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'true');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [newPayment, setNewPayment] = useState({
    member_id: '',
    total_amount: '',
    payment_method: 'credit',
    promo_used: 'None'
  });

  const [editingPayment, setEditingPayment] = useState(null);

  // Promo options with nicer labels
  const promoOptions = [
    { value: 'None', label: 'No Promotion' },
    { value: 'PROMO10', label: 'Promotion (10%)' },
    { value: 'PROMO15', label: 'Promotion (15%)' },
    { value: 'PROMO20', label: 'Promotion (20%)' }
  ];

  useEffect(() => {
    fetchPayments();
    fetchMembers();
  }, []);

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get('http://localhost:5000/api/payments');
      setPayments(res.data);
    } catch (error) {
      console.error('Failed to fetch payments', error);
      showToast('❌ Failed to load payments');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/members');
      setMembers(res.data);
    } catch (error) {
      console.error('Failed to fetch members', error);
      showToast('❌ Failed to load members');
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const handleAddPayment = async () => {
    if (!newPayment.member_id) {
      showToast('❌ Please enter a Member ID');
      return;
    }
    if (!newPayment.total_amount || parseFloat(newPayment.total_amount) <= 0) {
      showToast('❌ Please enter a valid Amount');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/payments', newPayment);
      showToast(`✅ Payment #${res.data.payment_id} added`);
      setShowAddModal(false);
      setNewPayment({
        member_id: '',
        total_amount: '',
        payment_method: 'credit',
        promo_used: 'None'
      });
      fetchPayments();
    } catch (error) {
      console.error('Failed to add payment', error);
      showToast('❌ Failed to add payment');
    }
  };

  const handleEditPayment = async () => {
    if (!editingPayment.member_id) {
      showToast('❌ Please select a Member');
      return;
    }
    if (!editingPayment.total_amount || parseFloat(editingPayment.total_amount) <= 0) {
      showToast('❌ Please enter a valid Amount');
      return;
    }
    try {
      await axios.put(
        `http://localhost:5000/api/payments/${editingPayment.payment_id}`,
        editingPayment
      );
      showToast('✅ Payment updated');
      setShowEditModal(false);
      fetchPayments();
    } catch (error) {
      console.error('Failed to update payment', error);
      showToast('❌ Failed to update payment');
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return;

    try {
      setDeletingId(id);
      await axios.delete(`http://localhost:5000/api/payments/${id}`);
      showToast('🗑️ Payment deleted');
      fetchPayments();
    } catch (error) {
      console.error('Failed to delete payment', error);
      showToast('❌ Failed to delete payment');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div style={{
      padding: '20px',
      backgroundColor: darkMode ? '#121212' : '#f9fafb',
      color: darkMode ? '#fff' : '#000',
      minHeight: '100vh'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Payment Management</h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: darkMode ? '#ff9800' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      <button
        onClick={() => setShowAddModal(true)}
        style={{
          margin: '20px 0',
          padding: '10px 15px',
          backgroundColor: '#ff9800',
          color: '#fff',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        + Add Payment
      </button>

      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          padding: '15px',
          backgroundColor: '#333',
          color: '#fff',
          borderRadius: '4px',
          zIndex: 1000
        }}>
          {toastMessage}
        </div>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            margin: '0 auto',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #ff9800',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p>Loading payments...</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            color: darkMode ? '#fff' : '#000'
          }}>
            <thead>
              <tr style={{ backgroundColor: darkMode ? '#333' : '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Payment ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Member ID</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Amount</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Method</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Promotion</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => (
                <tr key={payment.payment_id} style={{ borderBottom: `1px solid ${darkMode ? '#333' : '#eee'}` }}>
                  <td style={{ padding: '12px' }}>{payment.payment_id}</td>
                  <td style={{ padding: '12px' }}>{payment.member_id}</td>
                  <td style={{ padding: '12px' }}>${parseFloat(payment.total_amount).toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{payment.payment_method}</td>
                  <td style={{ padding: '12px' }}>{payment.promo_used || 'No Promotion'}</td>
                  <td style={{ padding: '12px' }}>{formatDate(payment.payment_date)}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => {
                        setEditingPayment(payment);
                        setShowEditModal(true);
                      }}
                      style={{
                        marginRight: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#2196F3',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePayment(payment.payment_id)}
                      disabled={deletingId === payment.payment_id}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: deletingId === payment.payment_id ? '#999' : '#f44336',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {deletingId === payment.payment_id ? 'Deleting...' : 'Delete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div style={{
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
        }}>
          <div style={{
            backgroundColor: darkMode ? '#1e1e1e' : '#fff',
            padding: '20px',
            borderRadius: '8px',
            width: '90%',
            maxWidth: '500px'
          }}>
            <h2>Add New Payment</h2>

            {/* Member ID Input without generate button */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Member ID:</label>
              <input
                type="text"
                name="member_id"
                value={newPayment.member_id}
                onChange={(e) => setNewPayment({ ...newPayment, member_id: e.target.value })}
                placeholder="MBR123456"
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000'
                }}
              />
              <small style={{ color: darkMode ? '#ccc' : '#666' }}>Format: MBR + 6 digits (e.g., MBR783364)</small>
            </div>

            {/* Amount input */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Amount:</label>
              <input
                type="number"
                step="0.01"
                placeholder="Enter amount in USD"
                name="total_amount"
                value={newPayment.total_amount}
                onChange={(e) => setNewPayment({ ...newPayment, total_amount: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000'
                }}
              />
            </div>

            {/* Payment method select */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Payment Method:</label>
              <select
                name="payment_method"
                value={newPayment.payment_method}
                onChange={(e) => setNewPayment({ ...newPayment, payment_method: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                <option value="credit">Credit Card</option>
                <option value="aba">ABA</option>
                <option value="wing">Wing</option>
                <option value="cash">Cash</option>
              </select>
            </div>

            {/* Promotion select */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Promotion:</label>
              <select
                name="promo_used"
                value={newPayment.promo_used}
                onChange={(e) => setNewPayment({ ...newPayment, promo_used: e.target.value })}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '4px',
                  border: `1px solid ${darkMode ? '#555' : '#ccc'}`,
                  backgroundColor: darkMode ? '#333' : '#fff',
                  color: darkMode ? '#fff' : '#000',
                  cursor: 'pointer'
                }}
              >
                {promoOptions.map(promo => (
                  <option key={promo.value} value={promo.value}>{promo.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowAddModal(false)}
                style={{
                  marginRight: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#999',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddPayment}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#ff9800',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Payment Modal (unchanged) */}
      {/* ... rest of your code ... */}

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default PaymentDashboard;
