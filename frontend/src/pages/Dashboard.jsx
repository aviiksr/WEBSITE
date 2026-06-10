import { useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import PremiumModal from '../components/PremiumModal';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, Trash2, Share2, Download, X, FileText, Video, Music, Code, Archive, Folder, Clock, Users, Star, ArrowLeft, Plus, FolderPlus, ChevronDown, CheckSquare, Square, RefreshCw, Send, MessageCircle, Link2 } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const Dashboard = () => {
  const { user, loading, fetchProfile } = useContext(AuthContext);
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [trashFiles, setTrashFiles] = useState([]);
  const [activeTab, setActiveTab] = useState('files');
  const [activities, setActivities] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // New File/Folder state
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [showNewTextModal, setShowNewTextModal] = useState(false);
  const [shareFileModal, setShareFileModal] = useState(null);
  const [shareEmailInput, setShareEmailInput] = useState('');
  const [generatedShareLink, setGeneratedShareLink] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  const [contextMenu, setContextMenu] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [displayLimit, setDisplayLimit] = useState(50);
  const selectedFilesSet = new Set(selectedFiles);

  // Upload Modal State
  const [pendingUploadFiles, setPendingUploadFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showUploadConfigModal, setShowUploadConfigModal] = useState(false);
  const [targetFolderForUpload, setTargetFolderForUpload] = useState('');
  const [showFolderDropdown, setShowFolderDropdown] = useState(false);
  const [isCreatingNewFolder, setIsCreatingNewFolder] = useState(false);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Close menu when clicking outside (simple approach: hide when clicking on main container)
  useEffect(() => {
    const handleClickOutside = () => {
      setShowNewMenu(false);
      setContextMenu(null);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    setSelectedCategory(null);
    setSelectedFiles([]);
    setDisplayLimit(50);
  }, [activeTab]);

  const fetchFiles = useCallback(async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setFiles(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchTrash = useCallback(async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/trash`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setTrashFiles(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/activity`, {
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

  const onDrop = (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    confirmUpload(acceptedFiles, selectedCategory || '');
  };

  const { getRootProps: getRootPropsMain, getInputProps: getInputPropsMain, isDragActive } = useDropzone({ onDrop });

  const folderInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleManualUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    
    e.target.value = null; // reset so it triggers again for the same file
    setPendingUploadFiles(files);
    setTargetFolderForUpload(selectedCategory || '');
    setIsCreatingNewFolder(false);
    setShowUploadConfigModal(true);
  };

  const confirmUpload = async (filesToUpload, targetCategoryStr) => {
    setPendingUploadFiles(filesToUpload);
    setShowUploadModal(true);
    setIsUploading(true);
    setUploadProgress(0);
    let completed = 0;
    let failed = 0;
    let targetCategory = targetCategoryStr.trim();
    if (targetCategory === 'Uncategorized' || targetCategory === 'Uncategorized (Root)') {
      targetCategory = '';
    }
    
    const batchSize = 4;
    for (let i = 0; i < filesToUpload.length; i += batchSize) {
      const batch = filesToUpload.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        let finalCategory = targetCategory;
        
        if (file.webkitRelativePath) {
          const parts = file.webkitRelativePath.split('/');
          if (parts.length > 1) {
            const rootFolder = parts[0];
            if (finalCategory) {
              finalCategory = `${finalCategory}/${rootFolder}`;
            } else {
              finalCategory = rootFolder;
            }
          }
        }
        
        if (!finalCategory) {
          finalCategory = 'Uncategorized';
        }
        
        formData.append('category', finalCategory);

        try {
          await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files`, formData, {
            headers: { 
              Authorization: `Bearer ${user.token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              if (filesToUpload.length === 1) {
                const filePercent = (progressEvent.loaded / progressEvent.total);
                const totalPercent = Math.round(((completed + filePercent) * 100) / filesToUpload.length);
                setUploadProgress(totalPercent);
              }
            }
          });
          completed++;
        } catch (err) {
          console.error("Upload failed for file:", file.name, err);
          failed++;
        }
        setUploadProgress(Math.round(((completed + failed) * 100) / filesToUpload.length));
      }));
    }
    
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setShowUploadModal(false);
      setPendingUploadFiles([]);
      fetchFiles();
      fetchActivities();
      fetchProfile();
      
      if (failed > 0) {
        alert(`Failed to upload ${failed} item(s). Please try again or check file sizes.`);
      } else if (completed > 1) {
        showToast(`${completed} items uploaded successfully!`);
      } else if (completed === 1) {
        showToast(`Item uploaded successfully!`);
      }
    }, 500);
  };

  const handleMoveFile = async (fileId, newCategory) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${fileId}`, 
        { category: newCategory },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      fetchFiles();
      showToast(`Moved to ${newCategory}`);
    } catch (error) {
      console.error(error);
      showToast('Failed to move file');
    }
  };

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/category`, { categoryName: newFolderName }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      // Refresh the user profile from the backend to get the new custom category
      await fetchProfile();
      setShowNewFolderModal(false);
      fetchActivities();
      showToast(`Folder '${newFolderName}' created successfully`);
      setNewFolderName('');
    } catch (err) {
      console.error(err);
      alert('Failed to create folder');
    }
  };

  const handleCreateTextFile = async (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/text`, { 
        filename: newFileName, 
        content: newFileContent,
        category: selectedCategory || 'Documents' 
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      setShowNewTextModal(false);
      setNewFileName('');
      setNewFileContent('');
      fetchFiles();
      fetchActivities();
      fetchProfile();
      const newFile = response.data;
      showToast(`Text file created successfully in ${newFile.category || 'Documents'} folder`);
    } catch (err) {
      console.error(err);
      alert('Failed to create text file');
    }
  };

  const handleContextMenu = (e, file) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Move file to trash?')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${id}`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchFiles();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleRestore = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${id}/restore`, {}, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchTrash();
      fetchActivities();
      fetchProfile();
      alert('File restored successfully!');
    } catch (err) {
      console.error(err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (window.confirm('Permanently delete this file? This cannot be undone.')) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${id}/permanent`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        fetchTrash();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (window.confirm(`Move ${selectedFiles.length} files to trash?`)) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/bulk-delete`, { fileIds: selectedFiles }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSelectedFiles([]);
        fetchFiles();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
        alert('Some files failed to delete. Check console.');
      }
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (window.confirm(`Permanently delete ${selectedFiles.length} files? This cannot be undone.`)) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/bulk-permanent-delete`, { fileIds: selectedFiles }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSelectedFiles([]);
        fetchTrash();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
        alert('Some files failed to delete permanently.');
      }
    }
  };

  const handleBulkRestore = async () => {
    if (window.confirm(`Restore ${selectedFiles.length} files to their original location?`)) {
      try {
        await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/bulk-restore`, { fileIds: selectedFiles }, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSelectedFiles([]);
        fetchTrash();
        fetchFiles();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
        alert('Some files failed to restore.');
      }
    }
  };

  const handleEmptyTrash = async () => {
    if (window.confirm(`Permanently delete ALL files in trash? This cannot be undone.`)) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/empty-trash`, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setSelectedFiles([]);
        fetchTrash();
        fetchActivities();
        fetchProfile();
      } catch (err) {
        console.error(err);
        alert('Failed to empty trash completely.');
      }
    }
  };

  const generateShareLink = async (id, recipientEmail = '') => {
    try {
      const payload = recipientEmail ? { recipientEmail } : {};
      const { data } = await axios.post(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${id}/share`, payload, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      fetchFiles();
      fetchActivities();
      return `${window.location.origin}/share/${data.shareId}`;
    } catch (err) {
      console.error(err);
      alert('Failed to generate share link.');
      return null;
    }
  };

  const executeShare = async (method) => {
    if (!shareFileModal) return;
    const link = await generateShareLink(shareFileModal._id, method === 'email' ? shareEmailInput : '');
    if (!link) return;
    
    setGeneratedShareLink(link);
    const text = encodeURIComponent(`Check out this file I shared via CloudPro: ${shareFileModal.originalName}`);
    const encodedLink = encodeURIComponent(link);

    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${text}%20${encodedLink}`, '_blank');
    } else if (method === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodedLink}&text=${text}`, '_blank');
    } else if (method === 'copy') {
      navigator.clipboard.writeText(link);
      alert('Link copied to clipboard!');
    } else if (method === 'email') {
      alert(`File shared successfully with ${shareEmailInput}!`);
      setShareFileModal(null);
    }
  };

  const handleFavorite = async (id) => {
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${id}/favorite`, {}, {
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
      const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/${file._id}/download`, {
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
  const maxStorageGB = user?.isPremium ? 100 : 15;
  const maxStorageMB = maxStorageGB * 1024;

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
  
  const allCategories = new Set(Object.keys(categoryCount));
  if (user?.customCategories) {
    user.customCategories.forEach(cat => allCategories.add(cat));
  }
  const folderList = Array.from(allCategories).sort();

  const getMediaType = (file) => {
    const mime = file.mimeType || '';
    const ext = file.originalName ? file.originalName.split('.').pop().toLowerCase() : '';
    if (mime.startsWith('video/')) return 'Video';
    if (mime.startsWith('image/')) return 'Image';
    if (mime.startsWith('audio/')) return 'Audio';
    if (mime === 'application/pdf' || ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx', 'csv'].includes(ext)) return 'Document';
    if (['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)) return 'Archive';
    return 'Other';
  };

  const mediaTypeSize = files.reduce((acc, file) => {
    const type = getMediaType(file);
    acc[type] = (acc[type] || 0) + (file.size || 0);
    return acc;
  }, {});

  const totalFilesSize = Object.values(mediaTypeSize).reduce((a, b) => a + b, 0);

  const barChartData = Object.keys(mediaTypeSize).map(key => ({
    name: key,
    percentage: totalFilesSize > 0 ? parseFloat(((mediaTypeSize[key] / totalFilesSize) * 100).toFixed(1)) : 0,
    sizeMB: parseFloat((mediaTypeSize[key] / (1024 * 1024)).toFixed(2))
  })).sort((a, b) => b.percentage - a.percentage);

  const renderPreview = () => {
    if (!previewFile) return null;
    
    if (previewFile.mimeType.startsWith('image/')) {
      const ext = previewFile.originalName ? previewFile.originalName.split('.').pop().toLowerCase() : '';
      if (ext === 'heic' || ext === 'heif' || previewFile.mimeType.includes('heic')) {
        return (
          <div className="flex flex-col items-center justify-center h-[40vh] w-full bg-gray-800 rounded-lg p-8">
            <File size={64} className="text-gray-400 mb-4" />
            <p className="text-gray-300 text-center mb-2">HEIC images cannot be displayed directly in the browser.</p>
            <p className="text-gray-400 text-sm text-center mb-6">Please download the file to view it on your device.</p>
            <a href={previewFile.url} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-lg transition font-medium">
              Download Image
            </a>
          </div>
        );
      }
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
      if (ext === 'heic' || ext === 'heif' || mime.includes('heic')) {
        return (
          <div className="relative w-12 h-12 bg-slate-800 rounded-lg shadow-md border border-gray-700 shrink-0 flex flex-col items-center justify-center overflow-hidden select-none">
            <File size={20} className="text-gray-400 mb-2" />
            <div className="absolute bottom-0 w-full bg-indigo-600 text-white font-extrabold text-[8px] py-[1px] text-center tracking-tighter">HEIC</div>
          </div>
        );
      }
      return (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700 bg-slate-800 flex items-center justify-center shrink-0 shadow-md">
          <img src={file.url} alt={file.originalName} className="w-full h-full object-cover" loading="lazy" />
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

  const toggleSelection = (e, fileId) => {
    e.stopPropagation();
    setSelectedFiles(prev => prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]);
  };

  const renderFileCard = (file) => {
    const isSelected = selectedFilesSet.has(file._id);
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        key={file._id} 
        draggable={true}
        onDragStart={(e) => {
          e.dataTransfer.setData('fileId', file._id);
        }}
        className={`relative bg-[var(--color-card)] p-4 rounded-xl border transition group cursor-pointer ${isSelected ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-500'}`}
        onClick={() => {
          if (selectedFiles.length > 0) {
            toggleSelection({ stopPropagation: () => {} }, file._id);
          } else {
            setPreviewFile(file);
          }
        }}
        onContextMenu={(e) => handleContextMenu(e, file)}
      >
        <button 
          onClick={(e) => toggleSelection(e, file._id)}
          className={`absolute top-3 right-3 z-10 transition ${isSelected ? 'text-indigo-400 opacity-100' : 'text-gray-500 opacity-0 group-hover:opacity-100'}`}
        >
          {isSelected ? <CheckSquare size={20} /> : <Square size={20} />}
        </button>
        <div className="flex items-center space-x-3 mb-4 mt-2">
        {getFileIcon(file)}
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate" title={file.originalName}>{file.originalName}</p>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
            <span className="text-[10px] bg-indigo-500/30 text-indigo-300 px-2 py-0.5 rounded-full">{file.category || 'Others'}</span>
          </div>
          <p className="text-[10px] text-gray-500 mt-1 flex items-center">
            <Clock size={10} className="mr-1" />
            {new Date(file.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
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
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition" onClick={(e) => e.stopPropagation()}>
        {activeTab !== 'trash' ? (
          <>
            <button onClick={() => handleDownloadFile(file)} className="text-gray-400 hover:text-white transition" title="Download">
              <Download size={18} />
            </button>
            <button onClick={() => { setShareFileModal(file); setGeneratedShareLink(''); setShareEmailInput(''); }} className="text-gray-400 hover:text-emerald-400 transition" title="Share">
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
            <button onClick={() => handleRestore(file._id)} className="text-gray-400 hover:text-green-400 transition flex items-center" title="Restore">
              <RefreshCw size={18} className="mr-1" /> <span className="text-xs">Restore</span>
            </button>
            <button onClick={() => handlePermanentDelete(file._id)} className="text-gray-400 hover:text-red-500 transition flex items-center" title="Delete Forever">
              <Trash2 size={18} className="mr-1" /> <span className="text-xs">Delete Forever</span>
            </button>
          </>
        )}
      </div>
    </motion.div>
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
    <div className="min-h-screen bg-transparent text-white relative">
      <input 
        type="file" 
        multiple 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleManualUpload} 
      />
      <input 
        type="file" 
        webkitdirectory="true" 
        directory="true"
        ref={folderInputRef} 
        className="hidden" 
        onChange={handleManualUpload} 
      />

      <Navbar />
      <div className="container mx-auto p-6 flex flex-col lg:flex-row gap-6 relative z-10">
        
        {/* Sidebar */}
        <aside className="w-full lg:w-1/4 space-y-6">
          <div className="glass-panel p-6 rounded-2xl lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] overflow-y-auto custom-scrollbar">
            {/* Menu Bar / Navigation */}
            <div className="mb-6 relative" onClick={(e) => e.stopPropagation()}>
              <button 
                onClick={() => setShowNewMenu(!showNewMenu)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center justify-center space-x-2 transition shadow-lg shadow-indigo-600/30"
              >
                <Plus size={20} />
                <span>New</span>
                <ChevronDown size={16} />
              </button>
              
              <AnimatePresence>
                {showNewMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <button 
                      onClick={() => { setShowNewFolderModal(true); setShowNewMenu(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition"
                    >
                      <FolderPlus size={18} className="text-gray-400" />
                      <span>New Folder</span>
                    </button>
                    <button 
                      onClick={() => { setShowNewTextModal(true); setShowNewMenu(false); }}
                      className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition border-t border-slate-700"
                    >
                      <FileText size={18} className="text-gray-400" />
                      <span>New Text File</span>
                    </button>
                    <div className="border-t border-slate-700">
                      <button 
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNewMenu(false);
                          folderInputRef.current?.click();
                        }}
                      >
                        <FolderPlus size={18} className="text-gray-400" />
                        <span>Folder Upload</span>
                      </button>
                      <button 
                        className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition cursor-pointer border-t border-slate-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowNewMenu(false);
                          fileInputRef.current?.click();
                        }}
                      >
                        <UploadCloud size={18} className="text-gray-400" />
                        <span>File Upload</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Hidden File Inputs for Menu */}
              <input 
                type="file" 
                ref={folderInputRef} 
                style={{ display: 'none' }} 
                webkitdirectory="true" 
                directory="true" 
                multiple 
                onChange={handleManualUpload} 
              />
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{ display: 'none' }} 
                multiple 
                onChange={handleManualUpload} 
              />
            </div>

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
              <ResponsiveContainer width="100%" height={192} minWidth={0}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    minAngle={15}
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
            <p className="text-center text-gray-300 font-medium mb-3">{displayUsed} / {maxStorageGB} GB used</p>
            {!user?.isPremium && (
              <button 
                onClick={() => setShowPremiumModal(true)} 
                className="w-full py-2.5 mb-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-sm transition shadow-lg shadow-orange-500/20 active:scale-95"
              >
                👑 Get 100 GB - Buy Premium
              </button>
            )}
            
            <div 
              {...getRootPropsMain()} 
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-[var(--color-primary)] bg-indigo-500/10' : 'border-gray-600 hover:border-gray-400'
              }`}
            >
              <input {...getInputPropsMain()} />
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-2xl font-bold capitalize">
                {activeTab === 'files' && selectedCategory ? (
                  <div className="flex items-center">
                    <button onClick={() => setSelectedCategory(null)} className="mr-3 text-gray-400 hover:text-white transition">
                      <ArrowLeft size={24} />
                    </button>
                    {selectedCategory}
                  </div>
                ) : (
                  activeTab === 'files' ? 'My Files' : activeTab === 'trash' ? 'Trash Box' : activeTab
                )}
              </h2>
              {currentFiles.length > 0 && (
                <div className="flex items-center space-x-3">
                  {selectedFiles.length > 0 ? (
                    <>
                      <span className="text-sm font-medium text-indigo-300">{selectedFiles.length} selected</span>
                      {activeTab === 'trash' ? (
                        <>
                          <button onClick={handleBulkRestore} className="bg-green-500/20 text-green-400 hover:bg-green-500/30 px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center">
                            <RefreshCw size={16} className="mr-1.5" /> Restore
                          </button>
                          <button onClick={handleBulkPermanentDelete} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center">
                            <Trash2 size={16} className="mr-1.5" /> Delete Forever
                          </button>
                        </>
                      ) : (
                        <button onClick={handleBulkDelete} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center">
                          <Trash2 size={16} className="mr-1.5" /> Delete
                        </button>
                      )}
                      <button onClick={() => setSelectedFiles([])} className="bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition text-sm font-medium text-white">
                        Clear
                      </button>
                    </>
                  ) : (
                    <>
                      {activeTab === 'trash' && (
                        <button onClick={handleEmptyTrash} className="bg-red-500/20 text-red-400 hover:bg-red-500/30 px-4 py-1.5 rounded-lg transition text-sm font-medium flex items-center mr-3">
                          Empty Trash
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedFiles(currentFiles.map(f => f._id))} 
                        className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-4 py-1.5 rounded-lg transition text-sm font-medium flex items-center"
                      >
                        <CheckSquare size={16} className="mr-1.5" /> Select All
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
            
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

            {activeTab === 'files' && selectedCategory === null ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                  {folderList.filter(c => c !== 'Uncategorized').map(category => {
                    const categoryFiles = currentFiles.filter(f => (f.category || 'Others') === category);
                    const categoryImages = categoryFiles.filter(f => f.mimeType && f.mimeType.startsWith('image/')).slice(0, 3);
                    
                    return (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        key={category} 
                        onClick={() => setSelectedCategory(category)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={async (e) => {
                          e.preventDefault();
                          const fileId = e.dataTransfer.getData('fileId');
                          if (fileId) {
                            await handleMoveFile(fileId, category);
                          }
                        }}
                        className="bg-[var(--color-card)] p-5 rounded-xl border border-gray-700 hover:border-indigo-500 cursor-pointer flex flex-col items-center text-center transition group shadow-lg hover:shadow-indigo-500/20"
                      >
                        {categoryImages.length > 0 ? (
                          <div className="relative w-16 h-14 mb-2 mt-1 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            {categoryImages.map((img, i) => (
                              <div 
                                key={img._id} 
                                className="absolute rounded-lg shadow-md border border-gray-600 overflow-hidden bg-slate-800"
                                style={{
                                  width: '42px',
                                  height: '42px',
                                  zIndex: i,
                                  transform: `translateX(${(i - 1) * 8}px) translateY(${(1 - i) * 4}px) rotate(${(i - 1) * 6}deg)`
                                }}
                              >
                                <img src={img.url} alt="preview" className="w-full h-full object-cover" />
                              </div>
                            ))}
                            <div className="absolute -bottom-1 -right-2 bg-slate-800 rounded-full p-1 shadow-md border border-gray-600 z-10 text-indigo-400">
                              <Folder size={12} fill="currentColor" className="opacity-80" />
                            </div>
                          </div>
                        ) : (
                          <Folder size={48} className="text-indigo-400 group-hover:text-indigo-300 mb-3" />
                        )}
                        <h4 className="font-bold text-gray-100">{category}</h4>
                        <p className="text-xs text-gray-400 mt-1">{categoryCount[category] || 0} {(categoryCount[category] || 0) === 1 ? 'file' : 'files'}</p>
                      </motion.div>
                    );
                  })}
                </div>

                {currentFiles.length > 0 && (
                  <>
                    <h3 className="text-xl font-bold mb-4 px-2 mt-8">All Files</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {currentFiles.slice(0, displayLimit).map(renderFileCard)}
                    </div>
                    {currentFiles.length > displayLimit && (
                      <div className="flex justify-center mt-6">
                        <button onClick={() => setDisplayLimit(prev => prev + 50)} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-6 py-2 rounded-lg transition font-medium border border-indigo-500/30">Load More</button>
                      </div>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {currentFiles
                    .filter(file => activeTab === 'files' && selectedCategory ? (file.category || 'Others') === selectedCategory : true)
                    .slice(0, displayLimit)
                    .map(renderFileCard)}
                </div>
                {currentFiles.filter(file => activeTab === 'files' && selectedCategory ? (file.category || 'Others') === selectedCategory : true).length > displayLimit && (
                  <div className="flex justify-center mt-6">
                    <button onClick={() => setDisplayLimit(prev => prev + 50)} className="bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 px-6 py-2 rounded-lg transition font-medium border border-indigo-500/30">Load More</button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Categories Chart */}
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="text-xl font-semibold mb-4">File Categories</h3>
              {barChartData.length > 0 ? (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height={256} minWidth={0}>
                    <BarChart data={barChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="name" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} allowDecimals={false} tickFormatter={(value) => `${value}%`} />
                      <RechartsTooltip 
                        cursor={{fill: '#334155'}} 
                        contentStyle={{ backgroundColor: '#1E293B', border: 'none', borderRadius: '8px', color: '#fff' }}
                        formatter={(value, name, props) => [`${value}% (${props.payload.sizeMB} MB)`, 'Storage']}
                      />
                      <Bar dataKey="percentage" fill="#06B6D4" radius={[4, 4, 0, 0]} />
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

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{ top: contextMenu.y, left: contextMenu.x }}
            className="fixed bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-[200] w-48"
            onClick={(e) => e.stopPropagation()}
          >
            {activeTab !== 'trash' ? (
              <button 
                onClick={() => {
                  setContextMenu(null);
                  handleDelete(contextMenu.file._id);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition text-red-400"
              >
                <Trash2 size={18} />
                <span>Delete</span>
              </button>
            ) : (
              <button 
                onClick={() => {
                  setContextMenu(null);
                  handlePermanentDelete(contextMenu.file._id);
                }}
                className="w-full px-4 py-3 text-left hover:bg-slate-700 flex items-center space-x-3 transition text-red-500"
              >
                <Trash2 size={18} />
                <span>Delete Forever</span>
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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

      {/* New Folder Modal */}
      <AnimatePresence>
        {showNewFolderModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowNewFolderModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[var(--color-card)] border border-gray-700 p-6 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FolderPlus className="mr-2 text-indigo-400" /> New Folder
              </h3>
              <form onSubmit={handleCreateFolder}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Folder Name (e.g. 202504_)" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-end space-x-3">
                  <button type="button" onClick={() => setShowNewFolderModal(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-800 transition">Cancel</button>
                  <button type="submit" disabled={!newFolderName.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">Create</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Text File Modal */}
      <AnimatePresence>
        {showNewTextModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShowNewTextModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-2xl bg-[var(--color-card)] border border-gray-700 p-6 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <FileText className="mr-2 text-indigo-400" /> New Text File
              </h3>
              <form onSubmit={handleCreateTextFile}>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Filename (e.g. notes.txt)" 
                  value={newFileName}
                  onChange={(e) => setNewFileName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <textarea 
                  placeholder="Start typing your content here..." 
                  value={newFileContent}
                  onChange={(e) => setNewFileContent(e.target.value)}
                  rows={10}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg p-3 text-white mb-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {selectedCategory ? `Will be saved in: ${selectedCategory}` : 'Will be saved in: Documents (or auto-categorized)'}
                  </span>
                  <div className="flex justify-end space-x-3">
                    <button type="button" onClick={() => setShowNewTextModal(false)} className="px-4 py-2 rounded-lg text-gray-300 hover:bg-slate-800 transition">Cancel</button>
                    <button type="submit" disabled={!newFileName.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed">Save File</button>
                  </div>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Configuration Modal */}
      <AnimatePresence>
        {showUploadConfigModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--color-card)] border border-gray-700 p-6 rounded-2xl shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold flex items-center"><UploadCloud className="mr-2 text-indigo-400" /> Upload Options</h3>
                <button onClick={() => { setShowUploadConfigModal(false); setPendingUploadFiles([]); }} className="text-gray-400 hover:text-white transition"><X size={24} /></button>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-400 mb-2">Target Folder</label>
                <div className="relative">
                  <div className="flex items-center w-full bg-slate-900 border border-slate-700 rounded-xl overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition">
                    <FolderPlus className="text-gray-400 ml-4 shrink-0" size={18} />
                    <input 
                      type="text" 
                      placeholder="Type or select a folder..." 
                      value={targetFolderForUpload}
                      onChange={(e) => {
                        setTargetFolderForUpload(e.target.value);
                        setShowFolderDropdown(true);
                      }}
                      onFocus={() => setShowFolderDropdown(true)}
                      onBlur={() => setTimeout(() => setShowFolderDropdown(false), 200)}
                      className="w-full bg-transparent text-white px-3 py-3 focus:outline-none"
                    />
                    <button 
                      onClick={() => setShowFolderDropdown(!showFolderDropdown)} 
                      className="px-3 py-3 text-gray-400 hover:text-white bg-slate-800 border-l border-slate-700"
                    >
                      <ChevronDown size={18} />
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showFolderDropdown && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-600 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-hidden"
                      >
                        {!targetFolderForUpload && (
                          <div 
                            className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-gray-300 flex items-center border-b border-slate-700/50 transition"
                            onClick={() => {
                              setTargetFolderForUpload('');
                              setShowFolderDropdown(false);
                            }}
                          >
                            <Archive size={16} className="mr-3 text-indigo-400" />
                            <span className="font-medium">Uncategorized (Root Folder)</span>
                          </div>
                        )}
                        
                        {targetFolderForUpload && !folderList.includes(targetFolderForUpload) && (
                          <div 
                            className="px-4 py-3 bg-indigo-600/10 hover:bg-indigo-600/20 cursor-pointer text-indigo-300 font-medium flex items-center border-b border-indigo-500/20 transition"
                            onClick={() => setShowFolderDropdown(false)}
                          >
                            <Plus size={16} className="mr-3" />
                            <span>Create new folder "{targetFolderForUpload}"</span>
                          </div>
                        )}
                        
                        {folderList
                          .filter(f => f !== 'Uncategorized')
                          .filter(f => f.toLowerCase().includes(targetFolderForUpload.toLowerCase()))
                          .map(folder => (
                          <div 
                            key={folder}
                            className="px-4 py-3 hover:bg-slate-700 cursor-pointer text-white flex items-center transition"
                            onClick={() => {
                              setTargetFolderForUpload(folder);
                              setShowFolderDropdown(false);
                            }}
                          >
                            <Folder size={16} className="mr-3 text-gray-400" />
                            <span>{folder}</span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <p className="text-xs text-gray-500 mt-2 ml-1">Select an existing folder or type a new name to create one.</p>
              </div>
              
              <div className="flex space-x-3">
                <button 
                  onClick={() => { setShowUploadConfigModal(false); setPendingUploadFiles([]); }}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setShowUploadConfigModal(false);
                    confirmUpload(pendingUploadFiles, targetFolderForUpload);
                  }}
                  className="flex-[2] py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow-lg shadow-indigo-600/30"
                >
                  Start Upload ({pendingUploadFiles.length})
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Confirmation/Progress Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
            onClick={() => !isUploading && setShowUploadModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[var(--color-card)] border border-gray-700 p-6 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 flex items-center">
                <UploadCloud className="mr-2 text-indigo-400" /> Uploading {pendingUploadFiles.length} item{pendingUploadFiles.length !== 1 ? 's' : ''}...
              </h3>
              
              <div className="w-full py-4">
                <p className="text-sm mb-2 font-medium">Progress... {uploadProgress}%</p>
                <div className="w-full bg-slate-800 rounded-full h-3 mb-2">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-3 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <p className="text-xs text-gray-400 text-center">Please do not close this window.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Modal */}
      <AnimatePresence>
        {shareFileModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[130] flex items-center justify-center bg-black/80 p-4"
            onClick={() => setShareFileModal(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-[var(--color-card)] border border-gray-700 p-6 rounded-2xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold flex items-center"><Share2 className="mr-2 text-indigo-400" /> Share File</h3>
                <button onClick={() => setShareFileModal(null)} className="text-gray-400 hover:text-white transition"><X size={20} /></button>
              </div>
              <p className="text-sm text-gray-400 mb-6 truncate">Sharing: <span className="font-semibold text-white">{shareFileModal.originalName}</span></p>

              <div className="space-y-4">
                {/* Email Option */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Send via Email</label>
                  <div className="flex space-x-2">
                    <input 
                      type="email" 
                      placeholder="recipient@example.com"
                      value={shareEmailInput}
                      onChange={(e) => setShareEmailInput(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-indigo-500"
                    />
                    <button 
                      onClick={() => executeShare('email')}
                      disabled={!shareEmailInput.includes('@')}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white font-medium transition flex items-center"
                    >
                      <Send size={16} />
                    </button>
                  </div>
                </div>

                {/* Direct Link Option */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Direct Link</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button 
                      onClick={() => executeShare('whatsapp')}
                      className="flex flex-col items-center justify-center p-3 bg-green-500/10 hover:bg-green-500/20 text-green-400 rounded-xl transition border border-green-500/20"
                    >
                      <MessageCircle size={24} className="mb-2" />
                      <span className="text-xs font-bold">WhatsApp</span>
                    </button>
                    
                    <button 
                      onClick={() => executeShare('telegram')}
                      className="flex flex-col items-center justify-center p-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-xl transition border border-blue-500/20"
                    >
                      <Send size={24} className="mb-2" />
                      <span className="text-xs font-bold">Telegram</span>
                    </button>

                    <button 
                      onClick={() => executeShare('copy')}
                      className="flex flex-col items-center justify-center p-3 bg-slate-700/50 hover:bg-slate-600 text-white rounded-xl transition border border-slate-600"
                    >
                      <Link2 size={24} className="mb-2" />
                      <span className="text-xs font-bold">Copy Link</span>
                    </button>
                  </div>
                  {generatedShareLink && (
                    <div className="mt-4 p-2 bg-slate-900 rounded-lg text-xs font-mono text-gray-400 truncate border border-slate-700">
                      {generatedShareLink}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Subscription Modal */}
      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-6 right-6 bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-2xl z-[200] font-medium border border-emerald-500"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
