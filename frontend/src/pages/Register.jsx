import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import { UserPlus, Mail, Lock, User } from 'lucide-react';

const HUDClock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const secs = time.getSeconds();
  const mins = time.getMinutes();
  const hrs = time.getHours();

  const secDeg = secs * 6;
  const minDeg = mins * 6 + secs * 0.1;
  const hrDeg = (hrs % 12) * 30 + mins * 0.5;

  return (
    <div className="flex flex-col items-center justify-center p-2 select-none pointer-events-none mb-4">
      <div className="relative w-32 h-32 flex items-center justify-center">
        {/* Glow behind the clock */}
        <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl animate-pulse" />
        
        {/* SVG Holographic Clock Face */}
        <svg className="w-full h-full transform -rotate-90 filter drop-shadow-[0_0_8px_rgba(79,70,229,0.4)]" viewBox="0 0 100 100">
          {/* Concentric telemetry rings */}
          <circle cx="50" cy="50" r="48" fill="none" stroke="rgba(79, 70, 229, 0.15)" strokeWidth="1" />
          <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(79, 70, 229, 0.25)" strokeWidth="0.5" strokeDasharray="3 3" />
          <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(99, 102, 241, 0.15)" strokeWidth="1.5" />
          <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1" strokeDasharray="10 5" className="animate-spin" style={{ animationDuration: '60s' }} />
          
          {/* Hour markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = 50 + 36 * Math.cos(angle);
            const y1 = 50 + 36 * Math.sin(angle);
            const x2 = 50 + 40 * Math.cos(angle);
            const y2 = 50 + 40 * Math.sin(angle);
            return (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(99, 102, 241, 0.5)" strokeWidth="1" />
            );
          })}
          
          {/* Clock Hands */}
          {/* Hour Hand (Indigo) */}
          <line 
            x1="50" y1="50" x2="72" y2="50" 
            stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"
            transform={`rotate(${hrDeg} 50 50)`} 
            className="transition-transform duration-500 ease-out"
          />
          {/* Minute Hand (Purple) */}
          <line 
            x1="50" y1="50" x2="84" y2="50" 
            stroke="#8b5cf6" strokeWidth="1.8" strokeLinecap="round"
            transform={`rotate(${minDeg} 50 50)`}
            className="transition-transform duration-500 ease-out"
          />
          {/* Second Hand (Emerald Neon) */}
          <line 
            x1="50" y1="50" x2="88" y2="50" 
            stroke="#10b981" strokeWidth="1.2" strokeLinecap="round"
            transform={`rotate(${secDeg} 50 50)`}
          />
          {/* Center Hub dot */}
          <circle cx="50" cy="50" r="3" fill="#10b981" />
          <circle cx="50" cy="50" r="1.5" fill="#ffffff" />
        </svg>
      </div>
      
      {/* Dynamic Digital HUD clock reading */}
      <span className="text-[9px] font-mono tracking-[4px] text-emerald-400 mt-2 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded uppercase select-none animate-pulse">
        {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white relative overflow-hidden">

      <Navbar />

      <div className="flex-1 flex items-center justify-center p-4 z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="glass-panel w-full max-w-md p-8 rounded-3xl border border-gray-800"
        >
          <HUDClock />

          <h2 className="text-3xl font-extrabold mb-2 text-center gradient-text">Create Account</h2>
          <p className="text-gray-400 text-sm text-center mb-6">Get started with secure cloud storage.</p>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/15 border border-red-500/30 text-red-300 p-3.5 rounded-xl mb-5 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center space-x-1.5">
                <User size={12} />
                <span>Full Name</span>
              </label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Welcome to CloudPro"
                className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center space-x-1.5">
                <Mail size={12} />
                <span>Email Address</span>
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 flex items-center space-x-1.5">
                <Lock size={12} />
                <span>Password</span>
              </label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 py-3 rounded-xl font-bold transition mt-6 flex items-center justify-center shadow-lg shadow-indigo-500/10"
            >
              {loading ? 'Creating Account...' : 'Register'}
            </button>
          </form>

          <p className="mt-6 text-center text-gray-400 text-sm">
            Already have an account? <Link to="/login" className="text-indigo-400 hover:underline font-semibold">Login here</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
