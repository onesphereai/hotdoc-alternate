import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Home } from './pages/Home';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<div>Search coming soon...</div>} />
          <Route path="/practice/:id" element={<div>Practice details coming soon...</div>} />
          <Route path="/book/:slotId" element={<div>Booking form coming soon...</div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;