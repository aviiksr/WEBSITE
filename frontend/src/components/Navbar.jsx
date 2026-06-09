import { Link, useNavigate } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Cloud, LogOut, Info, LifeBuoy, LayoutDashboard, Crown, ArrowLeft } from 'lucide-react';
import PremiumModal from './PremiumModal';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="glass-panel sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-slate-800/80">
      <div className="flex items-center space-x-3">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 text-gray-400 hover:text-white hover:bg-slate-700/50 rounded-full transition flex items-center justify-center"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
        <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-2xl font-bold gradient-text hover:opacity-95 transition">
          <Cloud className="text-[var(--color-primary)] animate-pulse" />
          <span>CloudPro</span>
        </Link>
      </div>
      <div className="flex items-center space-x-5">
        <Link to="/about" className="flex items-center space-x-1.5 text-gray-300 hover:text-indigo-400 transition font-medium hover:scale-102 transform duration-200">
          <Info size={17} className="text-indigo-400/80" />
          <span>About</span>
        </Link>
        <Link to="/support" className="flex items-center space-x-1.5 text-gray-300 hover:text-indigo-400 transition font-medium hover:scale-102 transform duration-200">
          <LifeBuoy size={17} className="text-indigo-400/80 hover:rotate-45 transition duration-300" />
          <span>Support</span>
        </Link>
        {user ? (
          <>
            <Link to="/dashboard" className="flex items-center space-x-1.5 text-gray-300 hover:text-indigo-400 transition font-medium hover:scale-102 transform duration-200">
              <LayoutDashboard size={17} className="text-indigo-400/80" />
              <span>Dashboard</span>
            </Link>
            
            {/* Glowing Active User Profile Pill */}
            <Link to="/profile" className="flex items-center space-x-2.5 bg-gradient-to-r from-slate-900/90 to-indigo-950/40 px-3.5 py-1.5 rounded-full border border-indigo-500/20 shadow-md shadow-indigo-500/5 hover:border-indigo-500/40 hover:shadow-indigo-500/10 hover:cursor-pointer transition duration-300 ml-2 select-none">
              {/* Dynamic User Avatar Initial with active indicator dot */}
              <div className="relative flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs shadow-md shadow-indigo-500/20 font-sans">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute -bottom-0.5 -right-0.5 border-2 border-slate-950 animate-pulse" />
              </div>
              <span className="flex items-center text-sm font-semibold tracking-wide text-gray-200 capitalize font-sans">
                {user.name}
                {user.isPremium && <Crown size={14} className="text-yellow-400 ml-1.5 drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]" />}
              </span>
            </Link>

            {/* Upgrade Button (if not premium) */}
            {!user.isPremium && (
              <button 
                onClick={() => setIsPremiumModalOpen(true)}
                className="flex items-center space-x-1.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white px-3 py-1.5 rounded-lg font-bold text-sm shadow-[0_0_10px_rgba(249,115,22,0.3)] hover:shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300 ml-2"
              >
                <Crown size={16} />
                <span>Upgrade</span>
              </button>
            )}

            {/* Premium Logout Button */}
            <button 
              onClick={handleLogout} 
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-full transition duration-300 transform hover:scale-105 ml-1 border border-transparent hover:border-red-500/10" 
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-gray-300 hover:text-white transition font-medium px-2">Login</Link>
            <Link to="/register" className="bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] px-4 py-2 rounded-xl font-semibold transition shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transform hover:-translate-y-0.5 duration-200">
              Sign Up
            </Link>
          </>
        )}
      </div>
      <PremiumModal isOpen={isPremiumModalOpen} onClose={() => setIsPremiumModalOpen(false)} />
    </nav>
  );
};

export default Navbar;
