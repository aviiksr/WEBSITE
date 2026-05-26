import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Cloud, Download, FileText, AlertCircle } from 'lucide-react';

const SharePreview = () => {
  const { shareId } = useParams();
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSharedFile = async () => {
      try {
        const { data } = await axios.get(`${import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000'}/api/files/shared/${shareId}`);
        setFileData(data);
      } catch (err) {
        setError(err.response?.data?.message || 'File not found or link expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchSharedFile();
  }, [shareId]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-transparent text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-transparent text-white">
        <AlertCircle size={64} className="text-red-500 mb-4" />
        <h2 className="text-2xl font-bold">{error}</h2>
        <Link to="/" className="mt-6 text-[var(--color-primary)] hover:underline">Go Home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-transparent text-white">
      <nav className="glass-panel p-4 flex justify-center">
        <Link to="/" className="flex items-center space-x-2 text-2xl font-bold gradient-text">
          <Cloud className="text-[var(--color-primary)]" />
          <span>CloudPro</span>
        </Link>
      </nav>
      
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="glass-panel p-8 rounded-2xl max-w-lg w-full text-center shadow-2xl shadow-indigo-500/10">
          <div className="bg-indigo-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-[var(--color-primary)]">
            <FileText size={48} />
          </div>
          <h2 className="text-2xl font-bold mb-2 truncate" title={fileData.file.originalName}>
            {fileData.file.originalName}
          </h2>
          <p className="text-gray-400 mb-8">
            Size: {(fileData.file.size / 1024).toFixed(2)} KB
          </p>
          <a 
            href={fileData.downloadUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 w-full bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] py-4 rounded-xl font-bold transition shadow-lg shadow-indigo-500/30"
          >
            <Download size={24} />
            <span>Download File</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default SharePreview;
