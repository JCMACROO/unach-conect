import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import TutorApply from './pages/TutorApply';
import AdminDashboard from './pages/AdminDashboard';
import AdminCatalog from './pages/AdminCatalog';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tutor/apply" element={<TutorApply />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/catalog" element={<AdminCatalog />} />
      </Routes>
    </Router>
  );
}

export default App;
