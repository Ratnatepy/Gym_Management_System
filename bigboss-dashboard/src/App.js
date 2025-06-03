import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminDashboard from './AdminDashboard';
import TrainerDashboard from './TrainerDashboard';
import PaymentDashboard from './PaymentDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/trainers" element={<TrainerDashboard />} />
        <Route path="/payments" element={<PaymentDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;

