import Navbar from '../components/Navbar';
import { motion } from 'framer-motion';
import { Shield, Sparkles, Eye, Cpu, Zap, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const features = [
    {
      icon: <Shield size={32} className="text-emerald-400" />,
      title: "Military-Grade Security",
      description: "Rest easy knowing your files are fully encrypted. We use secure JSON Web Tokens (JWT), hashed user credentials, and generate dynamic AWS S3 pre-signed URLs to prevent unauthorized access."
    },
    {
      icon: <Sparkles size={32} className="text-indigo-400" />,
      title: "Smart Categorization Engine",
      description: "Our custom backend intelligent categorization identifies and organizes your files automatically. Say goodbye to manual sorting; we tag documents, videos, music, archives, and code instantly."
    },
    {
      icon: <Eye size={32} className="text-cyan-400" />,
      title: "Universal File Previews",
      description: "No more downloading files just to see what's in them. Stream videos and audio, read PDFs, and view high-res images directly within our premium visual modal viewer."
    },
    {
      icon: <Cpu size={32} className="text-amber-400" />,
      title: "AWS Cloud Infrastructure",
      description: "Built on Amazon Simple Storage Service (S3), we deliver high reliability, speed, and redundant backups so your digital assets are safe, accessible, and fast to download."
    },
    {
      icon: <Zap size={32} className="text-rose-400" />,
      title: "Live Activity Tracking",
      description: "Understand your storage pattern through beautiful animated charts. Keep an eye on every action—such as uploads, deletions, and shares—with our real-time activity feed timeline."
    }
  ];

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 text-center flex flex-col items-center justify-center">
        {/* Glow Spheres */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl glass-panel p-10 rounded-3xl"
        >
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 text-indigo-400 animate-pulse">
              <Cloud size={48} />
            </div>
          </div>
          <h1 className="text-5xl font-extrabold mb-6 gradient-text">CloudPro Redefined</h1>
          <p className="text-xl text-gray-300 leading-relaxed">
            CloudPro is a next-generation file storage, streaming, and sharing hub. Designed for high performance, intelligence, and sleek aesthetics, we empower you to govern your data with maximum utility.
          </p>
        </motion.div>
      </section>

      {/* Uniqueness Features Section */}
      <section className="container mx-auto px-6 pb-20">
        <h2 className="text-3xl font-bold text-center mb-12 gradient-text">Our Core Uniqueness</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className="glass-panel p-8 rounded-2xl border border-gray-800 hover:border-indigo-500/50 transition duration-300 flex flex-col items-start"
            >
              <div className="p-3 bg-slate-800/80 rounded-xl mb-6 border border-slate-700">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Call to Action */}
        <div className="mt-16 text-center">
          <Link 
            to="/register" 
            className="px-8 py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:opacity-90 transition rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/20"
          >
            Experience CloudPro Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default About;
