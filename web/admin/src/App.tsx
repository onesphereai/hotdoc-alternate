import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/LoginForm';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Practices } from './pages/Practices';
import { Providers } from './pages/Providers';

const authConfig = {
  userPoolId: import.meta.env.VITE_USER_POOL_ID || '',
  userPoolClientId: import.meta.env.VITE_USER_POOL_CLIENT_ID || '',
  region: 'ap-southeast-2'
};

function App() {
  return (
    <AuthProvider config={authConfig}>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/practices" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Practices />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/providers" 
            element={
              <ProtectedRoute>
                <Layout>
                  <Providers />
                </Layout>
              </ProtectedRoute>
            } 
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;