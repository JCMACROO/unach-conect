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
import Contributions from './pages/Contributions';
import Search from './pages/Search';
import TutorProfile from './pages/TutorProfile';
import PartnerRedeem from './pages/PartnerRedeem';

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
        <Route path="/contributions" element={<Contributions />} />
        <Route path="/search" element={<Search />} />
        <Route path="/tutors/:id" element={<TutorProfile />} />
        <Route path="/partner/redeem" element={<PartnerRedeem />} />
      </Routes>
    </Router>
  );
}

export default App;
