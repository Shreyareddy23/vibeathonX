import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { styled } from 'styled-components';
import TherapistSignup from './components/TherapistSignup';
import TherapistLogin from './components/TherapistLogin';
import TherapistDashboard from './components/TherapistDashboard';
import ChildLogin from './components/ChildLogin';
import Landing from './components/Landing';
import Home from './components/Home';
import Game from './components/Game';
import ThemeAssignment from './components/ThemeAssignment';
import TypingGame from './components/TypingGame';
import ReadingExercise from './components/ReadingExercise';
import { ToastProvider } from './components/ToastContext';
import About from './components/About';
import FAQ from './components/FAQ';
import Feedback from './components/Feedback';
import AllSessions, { AllSessionsEmotionView } from './components/AllSessionsEmotionView'
import SuperAdminLogin from './components/SuperAdminLogin';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Authentication state

  return (
    <AppContainer>
      <ToastProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/child-login" element={<ChildLogin />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/feedback" element={<Feedback />} />
          
          {/* Game Route */}
          <Route path="/game/:theme/:level" element={<Game />} />
          <Route path="/typing-game" element={<TypingGame />} />
          <Route path="/reading-exercise" element={<ReadingExercise />} />
          
          {/* Therapist Protected Routes */}
          <Route path="/dashboard" element={<TherapistDashboard />} />
          <Route path="/theme-assignment" element={<ThemeAssignment />} />
          <Route path="/all-sessions-emotions" element={<AllSessionsEmotionView/>} />

          {/* SuperAdmin Routes */}
          <Route
            path="/superadmin/login"
            element={<SuperAdminLogin setIsAuthenticated={setIsAuthenticated} />}
          />
          <Route
            path="/superadmin/dashboard"
            element={
              isAuthenticated ? (
                <SuperAdminDashboard />
              ) : (
                <Navigate to="/superadmin/login" replace />
              )
            }
          />

          {/* Catch-all: redirect to Home if no route matches */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
      </ToastProvider>
    </AppContainer>
  );
};

const AppContainer = styled.div`
  min-height: 100vh;
  width: 100%;
`;

export default App;