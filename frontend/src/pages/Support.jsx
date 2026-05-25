import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { motion } from 'framer-motion';
import { LifeBuoy, Send, ShieldAlert, CheckCircle, Clock, FileWarning, ArrowRight } from 'lucide-react';

const Support = () => {
  const { user } = useContext(AuthContext);
  const [tickets, setTickets] = useState([]);
  const [formData, setFormData] = useState({
    name: user ? user.name : '',
    email: user ? user.email : '',
    type: 'RECOVERY',
    subject: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const fetchTickets = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/support`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTickets(res.data);
    } catch (err) {
      console.error('Error fetching support tickets:', err);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/support`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSuccess(true);
      setFormData({
        name: user ? user.name : '',
        email: user ? user.email : '',
        type: 'RECOVERY',
        subject: '',
        description: ''
      });
      fetchTickets(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit support ticket.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="flex items-center space-x-1 text-xs bg-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/30">
            <Clock size={12} />
            <span>Pending</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="flex items-center space-x-1 text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/30">
            <Clock size={12} className="animate-spin" />
            <span>Restoring</span>
          </span>
        );
      case 'Resolved':
        return (
          <span className="flex items-center space-x-1 text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/30">
            <CheckCircle size={12} />
            <span>Data Restored</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <Navbar />

      <main className="container mx-auto px-6 py-12 flex-1 max-w-6xl">
        {/* Title */}
        <div className="text-center mb-12">
          <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 mb-4">
            <LifeBuoy size={36} />
          </div>
          <h1 className="text-4xl font-extrabold gradient-text">Data Recovery & Backup Support</h1>
          <p className="text-gray-300 max-w-xl mx-auto mt-3">
            Accidentally deleted a file? Lost your local system backup? Submit a recovery request and our engineering team will extract your snapshots from our secure secondary cold vault.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Recovery Guarantee Panel */}
          <div className="space-y-6 lg:col-span-1">
            <div className="glass-panel p-6 rounded-2xl border border-gray-800 relative overflow-hidden">
              {/* Glow background */}
              <div className="absolute -top-12 -right-12 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl"></div>

              <div className="flex items-center space-x-2 text-rose-400 font-bold text-lg mb-4">
                <ShieldAlert size={20} />
                <h3>Backup Vault Shield</h3>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">
                CloudPro utilizes standard multi-region redundant snapshots. Every time a file is uploaded or shared, secondary offline replication safeguards the metadata.
              </p>
              <div className="space-y-3 mt-6">
                <div className="flex items-start space-x-3 text-xs bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  <p className="text-gray-300"><strong>30-Day Cold Archiving:</strong> Deletions are held for 30 days before absolute zero purge.</p>
                </div>
                <div className="flex items-start space-x-3 text-xs bg-slate-800/50 p-3 rounded-lg border border-slate-700">
                  <span className="text-rose-400 mt-0.5">✦</span>
                  <p className="text-gray-300"><strong>2-Hour Response:</strong> Critical data recovery tickets are assigned highest priority.</p>
                </div>
              </div>
            </div>

            <div className="glass-panel p-6 rounded-2xl border border-gray-800">
              <h4 className="font-bold mb-3 text-white">Emergency Hotline</h4>
              <p className="text-xs text-gray-400 leading-relaxed mb-4">
                If you just deleted critical business files, contact backup dispatch. Do not upload new large media to prevent overwriting active cached buffer nodes.
              </p>
              <div className="text-indigo-400 text-sm font-semibold flex items-center space-x-2">
                <span>support@cloudpro.com</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>

          {/* Form and Active Request List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Create Ticket */}
            <div className="glass-panel p-8 rounded-3xl border border-gray-800 relative">
              <h3 className="text-2xl font-bold mb-6 text-white">Submit Recovery Ticket</h3>
              
              {success && (
                <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center space-x-3">
                  <CheckCircle size={24} className="shrink-0" />
                  <p className="text-sm">Support Ticket logged! A confirmation receipt has been printed in your developer log, and the backup team is on it.</p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 text-red-400 rounded-xl flex items-center space-x-3">
                  <FileWarning size={24} className="shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Your Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      required
                      placeholder="John Doe"
                      className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-400 mb-2">Your Email</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required
                      placeholder="john@example.com"
                      className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Request Type</label>
                  <select 
                    name="type" 
                    value={formData.type} 
                    onChange={handleChange}
                    className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition"
                  >
                    <option value="RECOVERY">Accidental Deletion Data Recovery</option>
                    <option value="BACKUP_RESTORE">Full Vault Backup Restore</option>
                    <option value="ACCOUNT">Account Restore & Access</option>
                    <option value="GENERAL">Billing & Premium Help</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Subject / File details</label>
                  <input 
                    type="text" 
                    name="subject" 
                    value={formData.subject} 
                    onChange={handleChange} 
                    required
                    placeholder="e.g. Lost 1GB Video: project_presentation.mp4"
                    className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-400 mb-2">Description / What happened?</label>
                  <textarea 
                    name="description" 
                    rows="4" 
                    value={formData.description} 
                    onChange={handleChange} 
                    required
                    placeholder="Provide details about the files you need recovered (e.g. exact filenames, deletion date, approximate sizes, etc.)"
                    className="w-full bg-[var(--color-card)] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition resize-none" 
                  ></textarea>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition rounded-xl font-bold py-3 text-lg flex items-center justify-center space-x-2"
                >
                  <Send size={18} />
                  <span>{loading ? 'Submitting Recovery Request...' : 'Submit Recovery Ticket'}</span>
                </button>
              </form>
            </div>

            {/* Active Tickets List */}
            {tickets.length > 0 && (
              <div className="glass-panel p-8 rounded-3xl border border-gray-800">
                <h3 className="text-xl font-bold mb-6 text-white">Your Active Recovery Tickets</h3>
                <div className="space-y-4">
                  {tickets.map((t) => (
                    <motion.div 
                      key={t._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[var(--color-card)] p-5 rounded-2xl border border-gray-800 hover:border-gray-700 transition"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-[10px] text-indigo-400 font-mono tracking-wider">TICKET #{t._id.toString().slice(-6).toUpperCase()}</span>
                          <h4 className="font-bold text-white text-base mt-1">{t.subject}</h4>
                        </div>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">{t.description}</p>
                      <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center text-xs text-gray-500">
                        <span>Submitted on: {new Date(t.createdAt).toLocaleDateString()}</span>
                        <span>Type: {t.type.replace('_', ' ')}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      </main>
    </div>
  );
};

export default Support;
