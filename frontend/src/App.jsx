import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SharePreview from './pages/SharePreview';
import About from './pages/About';
import Support from './pages/Support';
import Profile from './pages/Profile';

function Landing() {
  const { user } = useContext(AuthContext);
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white">
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="text-center animate-fade-in glass-panel p-10 rounded-3xl max-w-3xl">
          <h1 className="text-6xl font-extrabold gradient-text mb-6">Store & Share with Ease</h1>
          <p className="text-xl text-gray-300 mb-10">
            A premium, cloud-based file storage system with military-grade security and a futuristic design.
          </p>
          <div className="flex space-x-4 justify-center">
            <Link to="/register" className="px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] transition-colors rounded-xl font-bold shadow-xl shadow-indigo-500/30 text-lg">
              Start for free
            </Link>
            <Link to="/login" className="px-8 py-4 glass-panel hover:bg-[var(--color-card)] transition-colors rounded-xl font-bold text-lg">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-transparent text-white font-sans">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/share/:shareId" element={<SharePreview />} />
            <Route path="/about" element={<About />} />
            <Route path="/support" element={<Support />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
