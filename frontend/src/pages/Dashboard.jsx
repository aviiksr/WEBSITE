import { useContext, useEffect, useState, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, Trash2, Share2, Download, X, FileText, Video, Music, Code, Archive, Folder, Clock, Users, Star } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [activities, setActivities] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await axios.get('http://127.0.0.1:5000/api/files', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchTrash = useCallback(async () => {
    try {
      const { data } = await axios.get('http://127.0.0.1:5000/api/files/trash', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTrashFiles(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await axios.get('http://127.0.0.1:5000/api/activity', {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setActivities(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      if (activeTab === 'files') {
        fetchFiles();
      } else if (activeTab === 'trash') {
        fetchTrash();
      }
      fetchActivities();
    }
  }, [user, activeTab, fetchFiles, fetchTrash, fetchActivities]);

  const onDrop = useCallback(async (acceptedFiles) => {
    const file = acceptedFiles[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setUploadProgress(0);
    try {
      await axios.post('http://127.0.0.1:5000/api/files', formData, {
        headers: { 
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      fetchFiles();
      fetchActivities();
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, [user, fetchFiles, fetchActivities]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleDelete = async (id) => {
    if (window.confirm('Move file to trash?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/files/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchFiles();
        fetchActivities();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/files/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchTrash();
      fetchActivities();
      alert('File restored successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Permanently delete this file? This cannot be undone.')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/api/files/${id}/permanent`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchTrash();
        fetchActivities();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleShare = async (id) => {
    const recipientEmail = window.prompt("Enter an email address to send this file to directly, or leave blank to just get a shareable link:");
    try {
      const payload = recipientEmail ? { recipientEmail } : {};
      const { data } = await axios.post(`http://127.0.0.1:5000/api/files/${id}/share`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const link = `${window.location.origin}/share/${data.shareId}`;
      navigator.clipboard.writeText(link);
      alert(data.message + ' (Link copied to clipboard!)');
      fetchFiles();
      fetchActivities();
    } catch (err) {
      console.error(err);
      alert('Failed to share file.');
    }
  };

  const handleFavorite = async (id) => {
    try {
      await axios.put(`http://127.0.0.1:5000/api/files/${id}/favorite`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchFiles();
      fetchActivities();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const { data } = await axios.get(`http://127.0.0.1:5000/api/files/${file._id}/download`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err) {
      console.error("Download failed", err);
      alert("Download failed. Please try again.");
    }
  };

  if (loading || !user) return <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center text-white">Loading...</div>;

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

  const categoryCount = files.reduce((acc, file) => {
    const cat = file.category || 'Others';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});
  
  const barChartData = Object.keys(categoryCount).map(key => ({
    name: key,
    count: categoryCount[key]
  }));

  const renderPreview = () => {
    if (!previewFile) return null;
    
    if (previewFile.mimeType.startsWith('image/')) {
      return <img src={previewFile.url} alt={previewFile.originalName} className="max-w-full max-h-[80vh] rounded-lg object-contain" />;
    }
    
    if (previewFile.mimeType.startsWith('video/')) {
      return <video controls src={previewFile.url} className="max-w-full max-h-[80vh] rounded-lg" autoPlay />;
    }
    
    if (previewFile.mimeType.startsWith('audio/')) {
      return <audio controls src={previewFile.url} className="w-full my-8" autoPlay />;
    }
    
    if (previewFile.mimeType === 'application/pdf') {
      return <iframe src={previewFile.url} title={previewFile.originalName} className="w-full h-[80vh] rounded-lg" />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-[40vh] w-full bg-gray-800 rounded-lg p-8">
        <File size={64} className="text-gray-400 mb-4" />
        <p className="text-gray-300 text-center mb-6">Preview not available for this file type.</p>
        <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition font-medium">
          Download to View
        </a>
      </div>
    );
  };

  const getFileIcon = (file) => {
    const mime = file.mimeType || '';
    const cat = file.category || 'Others';
    const ext = file.originalName ? file.originalName.split('.').pop().toLowerCase() : '';
    
    // 1. Image Thumbnail
    if (mime.startsWith('image/')) {
      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700 bg-slate-800 flex items-center justify-center shrink-0 shadow-md">
          <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" />
        </div>
      );
    }
    
    // 2. Video Thumbnail (Filmstrip look with native video preview frame at 1s)
    if (mime.startsWith('video/')) {
      return (
        <div className="relative w-16 h-12 rounded bg-slate-900 border border-gray-800 flex items-center justify-between shrink-0 overflow-hidden px-1 shadow-md">
          {/* Left film perforations */}
          <div className="flex flex-col justify-between h-full py-0.5 text-gray-500 text-[7px] select-none">
            <span>▫</span><span>▫</span><span>▫</span><span>▫</span>
          </div>
          {/* Actual Video Frame at 1 sec */}
          <div className="flex-1 h-full mx-1.5 rounded-sm overflow-hidden bg-black">
            <video src={file.url + '#t=1'} className="w-full h-full object-cover pointer-events-none" muted preload="metadata" />
          </div>
          {/* Right film perforations */}
          <div className="flex flex-col justify-between h-full py-0.5 text-gray-500 text-[7px] select-none">
            <span>▫</span><span>▫</span><span>▫</span><span>▫</span>
          </div>
        </div>
      );
    }

    // 3. High-Fidelity PDF Icon
    if (mime === 'application/pdf' || ext === 'pdf') {
      return (
        <div className="relative w-11 h-14 bg-white rounded-lg shadow-md border border-gray-200 shrink-0 flex flex-col justify-between p-1.5 overflow-hidden select-none">
          <div className="flex flex-col space-y-1">
            <div className="w-5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-7 h-0.5 bg-gray-300 rounded"></div>
          </div>
          {/* Bright Red PDF banner */}
          <div className="w-[120%] -ml-1 bg-red-600 text-white font-extrabold text-[8px] py-0.5 rounded-sm text-center tracking-tighter shadow-sm font-sans">
            PDF
          </div>
          <div className="w-4 h-0.5 bg-gray-300 rounded self-center"></div>
        </div>
      );
    }

    // 4. High-Fidelity Word / Document Icon
    if (['docx', 'doc', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
      return (
        <div className="relative w-11 h-14 bg-white rounded-lg shadow-md border border-gray-200 shrink-0 flex flex-col justify-between p-1.5 overflow-hidden select-none">
          <div className="flex flex-col space-y-1">
            <div className="w-5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-7 h-0.5 bg-gray-300 rounded"></div>
          </div>
          {/* Blue Word badge overlapping bottom left */}
          <div className="absolute bottom-1 left-1 w-5.5 h-5.5 bg-blue-600 rounded flex items-center justify-center text-white font-black text-[9px] shadow font-sans">
            W
          </div>
          <div className="flex flex-col items-end space-y-0.5 pr-0.5">
            <div className="w-2.5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-3.5 h-0.5 bg-gray-300 rounded"></div>
          </div>
        </div>
      );
    }

    // 5. High-Fidelity Excel Icon
    if (['xlsx', 'xls', 'csv'].includes(ext) || mime.includes('excel') || mime.includes('officedocument.spreadsheetml')) {
      return (
        <div className="relative w-11 h-14 bg-white rounded-lg shadow-md border border-gray-200 shrink-0 flex flex-col justify-between p-1.5 overflow-hidden select-none">
          <div className="flex flex-col space-y-1">
            <div className="w-5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-7 h-0.5 bg-gray-300 rounded"></div>
          </div>
          {/* Green Excel badge */}
          <div className="absolute bottom-1 left-1 w-5.5 h-5.5 bg-emerald-600 rounded flex items-center justify-center text-white font-black text-[9px] shadow font-sans">
            X
          </div>
          <div className="flex flex-col items-end space-y-0.5 pr-0.5">
            <div className="w-2.5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-3.5 h-0.5 bg-gray-300 rounded"></div>
          </div>
        </div>
      );
    }

    // 6. High-Fidelity PowerPoint Icon
    if (['pptx', 'ppt'].includes(ext) || mime.includes('powerpoint') || mime.includes('officedocument.presentationml')) {
      return (
        <div className="relative w-11 h-14 bg-white rounded-lg shadow-md border border-gray-200 shrink-0 flex flex-col justify-between p-1.5 overflow-hidden select-none">
          <div className="flex flex-col space-y-1">
            <div className="w-5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-7 h-0.5 bg-gray-300 rounded"></div>
          </div>
          {/* Orange PPT badge */}
          <div className="absolute bottom-1 left-1 w-5.5 h-5.5 bg-orange-600 rounded flex items-center justify-center text-white font-black text-[9px] shadow font-sans">
            P
          </div>
          <div className="flex flex-col items-end space-y-0.5 pr-0.5">
            <div className="w-2.5 h-0.5 bg-gray-300 rounded"></div>
            <div className="w-3.5 h-0.5 bg-gray-300 rounded"></div>
          </div>
        </div>
      );
    }

    // 7. General Fallback with standard style
    let IconComponent = File;
    let bgColor = 'bg-indigo-500/20';
    let textColor = 'text-indigo-400';
    
    if (mime.startsWith('audio/')) {
      IconComponent = Music;
      bgColor = 'bg-pink-500/20';
      textColor = 'text-pink-400';
    } else if (cat === 'Code') {
      IconComponent = Code;
      bgColor = 'bg-amber-500/20';
      textColor = 'text-amber-400';
    } else if (cat === 'Archives') {
      IconComponent = Archive;
      bgColor = 'bg-purple-500/20';
      textColor = 'text-purple-400';
    }
    
    return (
      <div className={`p-3 ${bgColor} rounded-lg ${textColor} shrink-0 flex items-center justify-center`}>
        <IconComponent size={24} />
      </div>
    );
  };

  const getFilteredFiles = () => {
    if (activeTab === 'trash') return trashFiles;
    
    let result = [...files];
    if (activeTab === 'recent') {
      // Recent: files from the last 7 days, or top 10
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter(f => new Date(f.createdAt) > oneWeekAgo).slice(0, 10);
    } else if (activeTab === 'shared') {
      result = result.filter(f => f.shareId);
    } else if (activeTab === 'favorites') {
      result = result.filter(f => f.isFavorite);
    }
    return result;
  };

  const currentFiles = getFilteredFiles();

  return (
    <div className="min-h-screen bg-transparent text-white relative overflow-hidden">

      <Navbar />
      <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-1/4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl sticky top-24">
            {/* Menu Bar / Navigation */}
            <nav className="mb-8 space-y-1">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 px-2">Menu</h3>
              <button 
                onClick={() => setActiveTab('files')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'files' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <Folder size={18} />
                <span className="font-semibold text-sm">My Files</span>
              </button>
              <button 
                onClick={() => setActiveTab('recent')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'recent' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <Clock size={18} />
                <span className="font-medium text-sm">Recent</span>
              </button>
              <button 
                onClick={() => setActiveTab('shared')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'shared' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <Users size={18} />
                <span className="font-medium text-sm">Shared</span>
              </button>
              <button 
                onClick={() => setActiveTab('favorites')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'favorites' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'}`}
              >
                <Star size={18} />
                <span className="font-medium text-sm">Favorites</span>
              </button>
              <button 
                onClick={() => setActiveTab('trash')}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl transition ${activeTab === 'trash' ? 'bg-red-500/20 text-red-400' : 'text-gray-300 hover:bg-red-500/10 hover:text-red-400'}`}
              >
                <Trash2 size={18} />
                <span className="font-medium text-sm">Trash</span>
              </button>
            </nav>

            <h3 className="text-xl font-semibold mb-4 px-2">Storage Usage</h3>
            <div className="h-48 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <p className="text-center text-gray-300 font-medium mb-3">{displayUsed} / 15 GB used</p>
            <button 
              onClick={() => setShowPremiumModal(true)} 
              className="w-full py-2.5 mb-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm transition shadow-lg shadow-orange-500/20 active:scale-95"
            >
              👑 Get 100 GB - Buy Premium
            </button>
            
            <div 
              {...getRootProps()} 
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-[var(--color-primary)] bg-indigo-500/10' : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <UploadCloud size={36} className="mx-auto mb-3 text-[var(--color-primary)]" />
              {isUploading ? (
                <div className="w-full">
                  <p className="text-sm mb-2">Uploading... {uploadProgress}%</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-[var(--color-primary)] h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300">
                  {isDragActive ? "Drop the file here..." : "Drag & drop a file here, or click to select"}
                </p>
              )}
            </div>
          </div>
        </aside>

        <main className="w-full lg:w-3/4">
          <div className="glass-panel p-6 rounded-2xl min-h-[500px]">
            <h2 className="text-2xl font-bold mb-6 capitalize">{activeTab === 'files' ? 'My Files' : activeTab === 'trash' ? 'Trash Box' : activeTab}</h2>
            
            {activeTab === 'trash' && currentFiles.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <Trash2 size={48} className="mx-auto mb-4 opacity-50" />
                <p>Your trash is empty.</p>
              </div>
            )}

            {activeTab !== 'trash' && currentFiles.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                <File size={48} className="mx-auto mb-4 opacity-50" />
                <p>No files found in this section.</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFiles.map((file) => (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={file._id} 
                  className="bg-[var(--color-card)] p-4 rounded-xl border border-gray-700 hover:border-gray-500 transition group cursor-pointer"
                  onClick={() => setPreviewFile(file)}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    {getFileIcon(file)}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate" title={file.originalName}>{file.originalName}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                        <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">{file.category || 'Others'}</span>
                      </div>
                    </div>
                  </div>
                  {file.tags && file.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {file.tags.map((tag, i) => (
                        <span key={i} className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700 opacity-0 group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
                    
                    {activeTab !== 'trash' ? (
                      <>
                        <button onClick={() => handleDownloadFile(file)} className="text-gray-400 hover:text-white transition" title="Download">
                          <Download size={18} />
                        </button>
                        <button onClick={() => handleShare(file._id)} className="text-gray-400 hover:text-emerald-400 transition" title="Share">
                          <Share2 size={18} />
                        </button>
                        <button onClick={() => handleFavorite(file._id)} className={`${file.isFavorite ? 'text-amber-400' : 'text-gray-400'} hover:text-amber-300 transition`} title="Favorite">
                          <Star size={18} fill={file.isFavorite ? 'currentColor' : 'none'} />
                        </button>
                        <button onClick={() => handleDelete(file._id)} className="text-gray-400 hover:text-red-400 transition" title="Delete">
                          <Trash2 size={18} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => handleRestore(file._id)} className="text-gray-400 hover:text-emerald-400 transition flex items-center space-x-1" title="Restore">
                          <span className="text-xs font-semibold">Restore</span>
                        </button>
                        <button onClick={() => handlePermanentDelete(file._id)} className="text-gray-400 hover:text-red-500 transition flex items-center space-x-1" title="Delete Permanently">
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}

                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Categories Chart */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">File Categories</h3>
              {barChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} />
                      <RechartsTooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px' }} />
                      <Bar dataKey="count" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No categories to display.</p>
              )}
            </div>

            {/* Activity Log */}
            <div className="glass-panel p-6 rounded-2xl flex flex-col h-80">
              <h3 className="text-xl font-semibold mb-4">Activity Log</h3>
              <div className="overflow-y-auto flex-1 pr-2 space-y-4 scrollbar-thin">
                {activities.length > 0 ? (
                  activities.map((activity) => (
                    <div key={activity._id} className="flex items-start space-x-3 text-sm">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-indigo-400 flex-shrink-0"></div>
                      <div>
                        <p className="text-gray-200">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(activity.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No recent activity.</p>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* File Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[90vw] max-w-5xl max-h-[95vh] bg-[var(--color-card)] p-4 rounded-xl flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition shadow-lg z-50"
                onClick={() => setPreviewFile(null)}
              >
                <X size={20} />
              </button>
              
              <div className="w-full overflow-hidden flex justify-center items-center rounded-lg">
                {renderPreview()}
              </div>

              <p className="text-center mt-4 font-medium truncate px-4 w-full">{previewFile.originalName}</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Subscription Modal */}
      <AnimatePresence>
        {showPremiumModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setShowPremiumModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-md w-full bg-slate-900 border border-amber-500/30 p-8 rounded-3xl text-center shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Premium Glow effect */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none"></div>

              <button 
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                onClick={() => setShowPremiumModal(false)}
              >
                <X size={24} />
              </button>
              
              <div className="inline-block p-4 bg-amber-500/10 rounded-full text-amber-500 mb-4 animate-pulse">
                <span className="text-3xl">👑</span>
              </div>
              
              <h2 className="text-3xl font-extrabold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">CloudPro Premium</h2>
              <p className="text-gray-400 text-sm mb-6">Unlock massive storage and high performance features</p>
              
              <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-left font-semibold text-lg text-white">Premium Tier</span>
                  <span className="text-right font-extrabold text-2xl text-amber-400">$9.99<span className="text-xs text-gray-400 font-normal">/mo</span></span>
                </div>
                <hr className="border-slate-700 my-3" />
                <ul className="text-left space-y-3 text-sm text-gray-300">
                  <li className="flex items-center">
                    <span className="text-amber-500 mr-2 font-bold">✓</span>
                    <span><strong>100 GB</strong> High-speed Cloud Storage</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-amber-500 mr-2 font-bold">✓</span>
                    <span><strong>Uncapped</strong> download & upload speeds</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-amber-500 mr-2 font-bold">✓</span>
                    <span><strong>True AI</strong> semantic categorization</span>
                  </li>
                  <li className="flex items-center">
                    <span className="text-amber-500 mr-2 font-bold">✓</span>
                    <span><strong>Priority 24/7</strong> dedicated customer support</span>
                  </li>
                </ul>
              </div>

              <button 
                onClick={() => alert("Subscription API integration coming soon! Secure checkout will process via Stripe.")}
                className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl transition shadow-lg shadow-orange-500/30 active:scale-95 mb-3"
              >
                Buy Premium Subscription
              </button>
              <p className="text-xs text-gray-500">Cancel anytime. 7-day money-back guarantee.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
