import React from "react";
import { Cpu, Search, MapPin, QrCode, ShieldCheck, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function LandingPage({ onGetStarted }) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1, 
      transition: { staggerChildren: 0.15, delayChildren: 0.2 } 
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="page-wrapper" style={{ minHeight: "100vh", padding: "40px 20px", display: "flex", flexDirection: "column" }}>
      <div className="container" style={{ maxWidth: 900, margin: "auto", padding: "20px 0" }}>
        
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ textAlign: "center", marginBottom: 60 }}
        >
          <div className="navbar__logo" style={{ width: 72, height: 72, margin: "0 auto 24px", background: "var(--signal-glow)" }}>
            <Cpu size={36} color="var(--signal)" />
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(36px, 6vw, 56px)", marginBottom: 16 }}>
            Campus<span style={{ color: "var(--signal)" }}>Search</span>
          </h1>
          <p style={{ fontSize: "clamp(16px, 2vw, 20px)", color: "var(--muted)", maxWidth: 650, margin: "0 auto 32px", lineHeight: 1.6 }}>
            The exclusive peer-to-peer hardware exchange platform for your college.
            Borrow, buy, and sell components safely within your campus. No more waiting for online deliveries.
          </p>
          
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted} 
            className="btn btn-primary" 
            style={{ padding: "16px 36px", fontSize: 16, borderRadius: "var(--radius-full)", boxShadow: "var(--shadow-glow)" }}
          >
            Join Your Campus <ArrowRight size={18} />
          </motion.button>
        </motion.div>

        {/* How it Works / Features */}
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="font-display" 
          style={{ textAlign: "center", marginBottom: 32, fontSize: 24, color: "var(--text)" }}
        >
          How it Works
        </motion.h2>
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 24, marginBottom: 60 }}
        >
          <FeatureCard 
            variants={itemVariants}
            icon={<ShieldCheck size={28} />} 
            step="1"
            title="Verified Identity" 
            desc="Locked exclusively to your college. Every student is verified by Admins using College ID uploads." 
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Search size={28} />} 
            step="2"
            title="Find or Broadcast" 
            desc="Search for Arduinos, sensors, or lab equipment. If it's missing, broadcast a request to all sellers!" 
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<MapPin size={28} />} 
            step="3"
            title="Meet & Inspect" 
            desc="Coordinate a safe meetup on campus via built-in chat. No upfront payments required." 
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<QrCode size={28} />} 
            step="4"
            title="Seamless UPI Pay" 
            desc="Once you receive and verify the item, scan the seller's custom UPI QR code right inside the app." 
          />
        </motion.div>

      </div>
    </div>
  );
}

function FeatureCard({ icon, step, title, desc, variants }) {
  return (
    <motion.div variants={variants} className="card card-glow card-hover" style={{ padding: 24, textAlign: "left", position: "relative", overflow: "hidden" }}>
      <div style={{ 
        position: "absolute", top: -10, right: -10, fontSize: 100, fontWeight: 800, 
        color: "var(--trace)", opacity: 0.1, lineHeight: 1, zIndex: 0 
      }}>
        {step}
      </div>
      <div style={{ color: "var(--signal)", marginBottom: 16, position: "relative", zIndex: 1 }}>{icon}</div>
      <h3 style={{ fontSize: 17, marginBottom: 8, position: "relative", zIndex: 1 }}>{title}</h3>
      <p style={{ fontSize: 13.5, color: "var(--muted)", position: "relative", zIndex: 1, lineHeight: 1.5 }}>{desc}</p>
    </motion.div>
  );
}
