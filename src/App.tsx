import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Lessons } from './pages/Lessons';
import { Speaking } from './pages/Speaking';
import { Community } from './pages/Community';
import { Settings } from './pages/Settings';
import { AdminLayout } from './components/admin/AdminLayout';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminLessons } from './pages/admin/AdminLessons';
import { AdminModules } from './pages/admin/AdminModules';
import { AdminContent } from './pages/admin/AdminContent';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/admin/AdminRoute';
import { Toaster } from 'sonner';
import { useRegisterSW } from 'virtual:pwa-register/react';

function App() {
  useRegisterSW({
    onRegistered(r) {
      r && setInterval(() => {
        r.update();
      }, 60 * 60 * 1000); // Check for updates every hour
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    }
  });

  return (
    <Router>
      <AuthProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lessons/*"
              element={
                <ProtectedRoute>
                  <Lessons />
                </ProtectedRoute>
              }
            />
            <Route
              path="/speaking/*"
              element={
                <ProtectedRoute>
                  <Speaking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/community"
              element={
                <ProtectedRoute>
                  <Community />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="lessons" element={<AdminLessons />} />
              <Route path="lessons/:lessonId/modules" element={<AdminModules />} />
              <Route path="modules/:moduleId/content" element={<AdminContent />} />
            </Route>
          </Routes>
        </Layout>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;