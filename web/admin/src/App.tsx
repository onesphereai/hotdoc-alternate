import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/LoginForm';
import { PracticeSignup } from './components/PracticeSignup';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Practices } from './pages/Practices';
import { Providers } from './pages/Providers';
import { DebugPage } from './components/DebugPage';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/debug" element={<DebugPage />} />
      <Route path="/login" element={<LoginForm />} />
      
      {/* Show signup if no user is logged in */}
      {!user && (
        <>
          <Route path="/signup" element={<PracticeSignup />} />
          <Route path="/" element={<Navigate to="/signup" replace />} />
        </>
      )}

      {/* Protected routes for authenticated users */}
      {user && (
        <>
          <Route 
            path="/dashboard" 
            element={
              <Layout>
                <Dashboard />
              </Layout>
            } 
          />
          <Route 
            path="/practices" 
            element={
              <Layout>
                <Practices />
              </Layout>
            } 
          />
          <Route 
            path="/providers" 
            element={
              <Layout>
                <Providers />
              </Layout>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </>
      )}
      
      {/* Fallback routes */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/signup"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;