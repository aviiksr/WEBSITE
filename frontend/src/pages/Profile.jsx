import { useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { User, Mail, Calendar, HardDrive, ShieldCheck, Star } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

const Profile = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading || !user) return <div className="min-h-screen bg-transparent flex items-center justify-center text-white">Loading...</div>;

  const totalUsedMB = parseFloat((user.usedStorage / (1024 * 1024)).toFixed(2));
  const maxStorageMB = 15360; // 15GB limit

  const displayUsed = totalUsedMB >= 1024 
    ? `${(totalUsedMB / 1024).toFixed(2)} GB` 
    : `${totalUsedMB} MB`;

  const chartData = [
    { name: 'Used', value: parseFloat(totalUsedMB) },
    { name: 'Free', value: Math.max(maxStorageMB - parseFloat(totalUsedMB), 0) }
  ];
  const COLORS = ['#6366F1', '#334155'];

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden flex flex-col">
      <Navbar />

      <main className="container mx-auto px-6 py-12 flex-1 flex items-center justify-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {/* Identity Card */}
          <div className="glass-panel p-8 rounded-3xl col-span-1 md:col-span-1 flex flex-col items-center text-center relative overflow-hidden border border-indigo-500/20 shadow-2xl shadow-indigo-500/10">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-600/40 to-purple-600/10"></div>
            
            <div className="relative mt-8 mb-6">
              <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-5xl font-black shadow-[0_0_40px_rgba(99,102,241,0.4)] border-4 border-slate-900">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-500 rounded-full border-4 border-slate-900 flex items-center justify-center" title="Online">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>

            <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
            <p className="text-indigo-400 font-medium mb-6 flex items-center space-x-1">
              <ShieldCheck size={16} />
              <span>Standard User</span>
            </p>

            <button className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition font-semibold text-sm mb-3">
              Edit Profile
            </button>
            <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl transition font-semibold text-sm shadow-lg shadow-indigo-500/25">
              Change Password
            </button>
          </div>

          {/* Details & Storage */}
          <div className="col-span-1 md:col-span-2 flex flex-col gap-6">
            
            {/* Account Details */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50">
              <h3 className="text-xl font-bold mb-6 flex items-center space-x-2">
                <User className="text-indigo-400" />
                <span>Account Information</span>
              </h3>
              
              <div className="space-y-5">
                <div className="flex items-center space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5">Email Address</p>
                    <p className="font-medium text-lg">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50">
                  <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                    <Calendar size={20} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-0.5">Member Since</p>
                    <p className="font-medium text-lg">
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Usage */}
            <div className="glass-panel p-8 rounded-3xl border border-slate-700/50 flex flex-col md:flex-row items-center gap-8">
              <div className="flex-1 w-full">
                <h3 className="text-xl font-bold mb-2 flex items-center space-x-2">
                  <HardDrive className="text-cyan-400" />
                  <span>Storage Allocation</span>
                </h3>
                <p className="text-gray-400 mb-6 text-sm">You are currently using {displayUsed} of your 15 GB free allocation.</p>
                
                <div className="bg-slate-900/80 rounded-2xl p-5 border border-amber-500/20 relative overflow-hidden group cursor-pointer">
                  <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition duration-500"></div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2 text-amber-400">
                      <Star size={18} className="animate-pulse" />
                      <span className="font-bold">Upgrade to Premium</span>
                    </div>
                    <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded font-bold">100 GB</span>
                  </div>
                  <p className="text-xs text-gray-400">Get unlimited speed and massive storage for your files.</p>
                </div>
              </div>

              <div className="w-40 h-40 shrink-0 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={35}
                      outerRadius={55}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={4}
                    >
                      {chartData.map((entry, index) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                  <span className="text-xs text-gray-400 font-bold">Used</span>
                  <span className="text-sm font-black text-indigo-400">{Math.round((totalUsedMB / maxStorageMB) * 100)}%</span>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Profile;
