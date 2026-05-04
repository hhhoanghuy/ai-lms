import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AssignmentView from './pages/AssignmentView';
import ClassroomView from './pages/ClassroomView';
import ReviewView from './pages/ReviewView';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')));

  const handleLogin = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        
        <Route path="/" element={
          user ? (
            user.role === 'teacher' ? <TeacherDashboard logout={handleLogout} /> : <StudentDashboard logout={handleLogout} />
          ) : <Navigate to="/login" />
        } />

        <Route path="/classroom/:id" element={user ? <ClassroomView /> : <Navigate to="/login" />} />
        <Route path="/assignment/:id" element={user ? <AssignmentView /> : <Navigate to="/login" />} />
        <Route path="/assignment/:id/review/:submissionId" element={user && ['teacher', 'ta'].includes(user.role) ? <ReviewView /> : <Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
