import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Shield, Share2, Eye, HardDrive, Layout, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const features = [
    {
      icon: <HardDrive size={28} className="text-emerald-400" />,
      title: "15GB Free Storage",
      description: "Get started immediately with 15GB of free, secure cloud storage on blazing-fast AWS S3 infrastructure."
    },
    {
      icon: <Layout size={28} className="text-indigo-400" />,
      title: "Smart Organization",
      description: "Create custom folders or let our intelligent engine auto-categorize your documents, videos, music, and archives."
    },
    {
      icon: <Play size={28} className="text-cyan-400" />,
      title: "Media Streaming",
      description: "No need to download! Stream your audio and video files directly in the browser with our premium media player."
    },
    {
      icon: <Share2 size={28} className="text-amber-400" />,
      title: "Secure Sharing",
      description: "Generate 1-click shareable links to send files to anyone. Control your data without relying on third-party emails."
    },
    {
      icon: <Eye size={28} className="text-rose-400" />,
      title: "Instant Previews",
      description: "View high-res images, read PDFs, and inspect code files instantly inside our beautiful visual interface."
    },
    {
      icon: <Shield size={28} className="text-purple-400" />,
      title: "Military-Grade Security",
      description: "Your files are protected with robust JWT authentication and dynamic, expiring AWS S3 pre-signed URLs."
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <Navbar />
      
      {/* Sleek Hero Section */}
      <section className="relative pt-16 pb-12 px-6 text-center flex flex-col items-center justify-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl relative z-10"
        >
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 gradient-text">Everything You Need.</h1>
          <p className="text-lg text-gray-400 leading-relaxed">
            CloudPro provides a next-generation file storage, streaming, and sharing hub. Designed for high performance and sleek aesthetics, we give you the tools to govern your data.
          </p>
        </motion.div>
      </section>

      {/* Small Equal Cards Grid */}
      <section className="container mx-auto px-6 pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, duration: 0.4 }}
              className="glass-panel p-6 rounded-2xl border border-slate-800/80 hover:border-indigo-500/50 hover:bg-slate-800/40 transition duration-300 flex flex-col items-start h-full"
            >
              <div className="p-3 bg-slate-800/80 rounded-xl mb-4 border border-slate-700">
                {feature.icon}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed flex-grow">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center justify-center px-8 py-3.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 transition rounded-xl font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95"
          >
            Start Using CloudPro
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
