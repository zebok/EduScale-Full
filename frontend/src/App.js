import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MinisterioDashboard from './pages/MinisterioDashboard';
import ApplicationForm from './pages/ApplicationForm';
import Prospection from './components/Prospection';
import Admission from './components/Admission';
import Enrollment from './components/Enrollment';
import Relations from './components/Relations';
import MoreInfo from './pages/MoreInfo';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/application-form" element={<ApplicationForm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/more-info" element={<MoreInfo />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/ministerio" element={
            <PrivateRoute>
              <MinisterioDashboard />
            </PrivateRoute>
          } />
          <Route path="/api/prospection" element={
            <PrivateRoute>
              <Prospection />
            </PrivateRoute>
          } />
          <Route path="/api/admission" element={
            <PrivateRoute>
              <Admission />
            </PrivateRoute>
          } />
          <Route path="/api/enrollment" element={
            <PrivateRoute>
              <Enrollment />
            </PrivateRoute>
          } />
          <Route path="/api/relations" element={
            <PrivateRoute>
              <Relations />
            </PrivateRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
