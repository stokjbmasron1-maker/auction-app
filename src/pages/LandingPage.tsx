import React, { useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, TrendingUp, ShieldCheck, Zap, Mail, Globe, MessageCircle, Link as LinkIcon } from 'lucide-react';

// Character-by-character reveal for massive impact
const AnimatedText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };
  
  const child = {
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: { type: "spring" as const, damping: 12, stiffness: 100 },
    },
    hidden: {
      opacity: 0,
      y: 100,
      rotateX: -90,
      scale: 0.5,
      filter: "blur(10px)",
      transition: { type: "spring" as const, damping: 12, stiffness: 100 },
    },
  };

  return (
    <motion.div style={{ display: "inline-block", overflow: "visible" }} variants={container} initial="hidden" animate="visible">
      {words.map((word, index) => (
        <span key={index} style={{ display: "inline-block", marginRight: "0.25em", overflow: "visible" }}>
          {Array.from(word).map((letter, i) => (
            <motion.span variants={child} key={i} style={{ display: "inline-block", transformOrigin: "50% 100%" }}>
              {letter}
            </motion.span>
          ))}
        </span>
      ))}
    </motion.div>
  );
};

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Advanced Scroll Tracking
  const { scrollYProgress } = useScroll();


  // Main Page Transforms
  const yHero = useTransform(scrollYProgress, [0, 1], [0, 1000]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.4], [1, 0.5]);
  const rotateXHero = useTransform(scrollYProgress, [0, 0.5], [0, 45]);

  // Mouse Tracking for 3D Perspective
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { damping: 30, stiffness: 200 });
  const smoothY = useSpring(mouseY, { damping: 30, stiffness: 200 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5; // -0.5 to 0.5
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-15, 15]);

  // Flying cards logic
  const card1X = useTransform(smoothX, [-0.5, 0.5], [-100, 100]);
  const card1Y = useTransform(smoothY, [-0.5, 0.5], [-100, 100]);
  const card2X = useTransform(smoothX, [-0.5, 0.5], [100, -100]);
  const card2Y = useTransform(smoothY, [-0.5, 0.5], [100, -100]);

  return (
    <div ref={containerRef} style={{ background: 'var(--bg-dark)', minHeight: '100vh' }}>
      

        {/* Extreme Background Grid */}
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: -1,
          backgroundSize: '80px 80px',
          backgroundImage: 'linear-gradient(to right, rgba(139, 92, 246, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(139, 92, 246, 0.05) 1px, transparent 1px)',
          transform: 'perspective(500px) rotateX(60deg) scale(2.5) translateY(-100px)',
          animation: 'gridMove 20s linear infinite',
          transformOrigin: 'top center'
        }} />

        {/* Dynamic Glowing Orbs */}
        <motion.div style={{
          position: 'fixed', top: '20%', left: '20%', width: '800px', height: '800px',
          background: 'radial-gradient(circle, var(--accent-primary) 0%, transparent 60%)',
          filter: 'blur(120px)', opacity: 0.15, zIndex: -1,
          x: useTransform(smoothX, [-0.5, 0.5], [-300, 300]),
          y: useTransform(smoothY, [-0.5, 0.5], [-300, 300])
        }} />
        <motion.div style={{
          position: 'fixed', bottom: '10%', right: '10%', width: '700px', height: '700px',
          background: 'radial-gradient(circle, var(--accent-secondary) 0%, transparent 60%)',
          filter: 'blur(120px)', opacity: 0.15, zIndex: -1,
          x: useTransform(smoothX, [-0.5, 0.5], [300, -300]),
          y: useTransform(smoothY, [-0.5, 0.5], [300, -300])
        }} />

        {/* --- MAIN HERO SECTION --- */}
        <motion.section 
          style={{ 
            height: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            y: yHero,
            opacity: opacityHero,
            scale: scaleHero,
            rotateX: rotateXHero,
            perspective: '1200px'
          }}
        >
          {/* Floating 3D Elements */}
          <motion.div style={{
            position: 'absolute', top: '20%', left: '15%', width: '250px', height: '350px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01))',
            borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)', rotateZ: -15, rotateX, rotateY, x: card1X, y: card1Y,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Sparkles size={80} color="var(--accent-primary)" style={{ filter: 'drop-shadow(0 0 20px var(--accent-primary))' }} />
          </motion.div>

          <motion.div style={{
            position: 'absolute', bottom: '25%', right: '15%', width: '280px', height: '220px',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.01))',
            borderRadius: '32px', border: '1px solid rgba(255,255,255,0.2)',
            backdropFilter: 'blur(20px)', rotateZ: 10, rotateX, rotateY, x: card2X, y: card2Y,
            boxShadow: '0 30px 60px rgba(0,0,0,0.5), inset 0 0 20px rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={80} color="var(--accent-secondary)" style={{ filter: 'drop-shadow(0 0 20px var(--accent-secondary))' }} />
          </motion.div>

          {/* Center 3D Text Block */}
          <motion.div 
            style={{ 
              position: 'relative', 
              zIndex: 10, 
              textAlign: 'center', 
              width: '100%'
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0, rotate: -180 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 15, stiffness: 100, delay: 0.2 }}
            >
              <span className="badge badge-primary" style={{ 
                marginBottom: '40px', padding: '12px 24px', fontSize: '16px', 
                textTransform: 'uppercase', letterSpacing: '0.1em',
                boxShadow: '0 0 30px rgba(139, 92, 246, 0.5)' 
              }}>
                Era Baru Lelang Digital
              </span>
            </motion.div>

            <h1 style={{ 
              fontSize: 'clamp(60px, 10vw, 140px)', 
              fontWeight: 900, 
              lineHeight: 0.9,
              letterSpacing: '-0.05em',
              marginBottom: '40px',
              textShadow: '0 20px 40px rgba(0,0,0,0.5)',
              transform: 'translateZ(50px)'
            }}>
              <AnimatedText text="TAWAR." />
              <br />
              <AnimatedText text="MENANG." />
              <br />
              <span style={{ 
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary), var(--accent-primary))',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'gradientMove 3s ease infinite'
              }}>
                <AnimatedText text="SEKARANG." />
              </span>
            </h1>

            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2, type: "spring" }}
              style={{ transform: 'translateZ(30px)' }}
            >
              <motion.button 
                whileHover={{ scale: 1.1, textShadow: '0 0 8px rgb(255,255,255)', boxShadow: '0 0 60px rgba(139, 92, 246, 0.8)' }}
                whileTap={{ scale: 0.9 }}
                className="btn btn-primary"
                onClick={() => navigate('/auction')}
                style={{ 
                  padding: '0 60px', 
                  height: '80px', 
                  fontSize: '22px', 
                  borderRadius: '40px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  position: 'relative',
                  border: '2px solid rgba(255,255,255,0.2)'
                }}
              >
                <span style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: '16px' }}>
                  MULAI SEKARANG <ArrowRight size={28} />
                </span>
                <motion.div 
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                  style={{
                    position: 'absolute', top: 0, left: 0, width: '50%', height: '100%',
                    background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.6), transparent)',
                    transform: 'skewX(-30deg)', zIndex: 1
                  }}
                />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.section>

        {/* --- INSANE MARQUEE --- */}
        <section style={{ 
          overflow: 'hidden', padding: '120px 0', 
          background: 'var(--accent-primary)',
          transform: 'rotate(-4deg) scale(1.1)',
          boxShadow: '0 0 100px rgba(139, 92, 246, 0.5)',
          position: 'relative', zIndex: 10
        }}>
          <motion.div 
            animate={{ x: [0, -2000] }}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            style={{ display: 'flex', gap: '80px', whiteSpace: 'nowrap' }}
          >
            {Array(8).fill("NO WALLET • REALTIME • CRAZY FAST • ").map((text, i) => (
              <span key={i} style={{ 
                fontSize: '10vw', 
                fontWeight: 900, 
                color: 'var(--bg-dark)', 
                letterSpacing: '-0.04em'
              }}>
                {text}
              </span>
            ))}
          </motion.div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section style={{ padding: '200px 24px', position: 'relative', zIndex: 5, background: 'var(--bg-dark)' }}>
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <motion.div 
              initial={{ opacity: 0, scale: 0.5, rotateX: 90 }}
              whileInView={{ opacity: 1, scale: 1, rotateX: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1, type: "spring", bounce: 0.5 }}
              style={{ textAlign: 'center', marginBottom: '120px', perspective: '1000px' }}
            >
              <h2 style={{ fontSize: 'clamp(48px, 8vw, 80px)', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 }}>
                TEKNOLOGI <br/><span style={{ color: 'var(--accent-secondary)' }}>MASA DEPAN</span>
              </h2>
            </motion.div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' }}>
              {[
                { icon: Zap, title: "0ms Lag", desc: "Arsitektur frontend ultra-modern merender ribuan update secara instan." },
                { icon: ShieldCheck, title: "Tanpa Saldo", desc: "Hapus batasan UX yang merepotkan. Tidak ada reload dompet, cukup klik untuk menang." },
                { icon: TrendingUp, title: "Motion Engine", desc: "Setiap interaksi didesain dengan physics framer-motion agar hidup di tangan Anda." }
              ].map((feature, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 150, rotateY: 45 }}
                  whileInView={{ opacity: 1, y: 0, rotateY: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.8, delay: idx * 0.2, type: "spring" }}
                  whileHover={{ 
                    y: -20, 
                    scale: 1.05,
                    rotateX: 10,
                    rotateY: -10,
                    boxShadow: "0 40px 80px rgba(139, 92, 246, 0.4)",
                    borderColor: "var(--accent-primary)",
                    zIndex: 10
                  }}
                  className="glass-panel"
                  style={{ 
                    padding: '60px 40px', 
                    borderRadius: '40px', 
                    border: '2px solid rgba(255,255,255,0.05)',
                    transformStyle: 'preserve-3d',
                    background: 'rgba(10, 10, 15, 0.8)',
                    backdropFilter: 'blur(30px)'
                  }}
                >
                  <motion.div 
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.5 }}
                    style={{ 
                      width: '100px', height: '100px', borderRadius: '30px', 
                      background: 'linear-gradient(135deg, var(--accent-primary), transparent)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginBottom: '40px', color: 'white',
                      boxShadow: '0 20px 40px rgba(139, 92, 246, 0.3)',
                      transform: 'translateZ(50px)'
                    }}
                  >
                    <feature.icon size={48} />
                  </motion.div>
                  <h3 style={{ fontSize: '36px', fontWeight: 900, marginBottom: '20px', letterSpacing: '-0.02em', transform: 'translateZ(30px)' }}>
                    {feature.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '18px', transform: 'translateZ(20px)' }}>
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

      <footer style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '160px 24px 80px 24px',
        background: '#030303',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        borderTop: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Animated Background Mesh */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{
            position: 'absolute', top: '-50%', left: '-20%', width: '1000px', height: '1000px',
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 60%)',
            filter: 'blur(80px)', zIndex: 0
          }}
        />

        {/* Massive Rolling Marquee Background */}
        <div style={{ position: 'absolute', top: '10%', left: 0, width: '100%', opacity: 0.03, pointerEvents: 'none', zIndex: 0 }}>
          <motion.div 
            animate={{ x: [0, -1000] }}
            transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            style={{ display: 'flex', whiteSpace: 'nowrap', gap: '50px' }}
          >
            {Array(5).fill("CONTACT US • LELANGKU •").map((txt, i) => (
              <span key={i} style={{ fontSize: '15vw', fontWeight: 900, lineHeight: 1 }}>{txt}</span>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 100 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          style={{ textAlign: 'center', position: 'relative', zIndex: 10, width: '100%', maxWidth: '800px' }}
        >
          <motion.div 
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <h2 style={{ 
              fontSize: 'clamp(48px, 8vw, 100px)', 
              fontWeight: 900, 
              letterSpacing: '-0.05em', 
              lineHeight: 1, 
              marginBottom: '24px',
              background: 'linear-gradient(to bottom right, #fff, #666)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Siap Memulai?
            </h2>
          </motion.div>
          <p style={{ fontSize: '20px', color: 'var(--text-secondary)', marginBottom: '64px' }}>
            Jangan lewatkan kesempatan untuk mendapatkan barang langka incaranmu.
          </p>
          
          <div style={{ display: 'flex', gap: '32px', justifyContent: 'center', marginBottom: '80px', flexWrap: 'wrap' }}>
            {[
              { icon: MessageCircle, color: '#1DA1F2', name: 'Twitter' },
              { icon: Globe, color: '#E1306C', name: 'Instagram' },
              { icon: Mail, color: '#EA4335', name: 'Email' },
              { icon: LinkIcon, color: '#6e5494', name: 'Github' }
            ].map((social, idx) => (
              <motion.a 
                key={idx}
                href="#" 
                initial={{ opacity: 0, scale: 0 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, type: "spring", stiffness: 200 }}
                whileHover={{ 
                  y: -15, 
                  scale: 1.2, 
                  color: social.color,
                  filter: `drop-shadow(0 10px 20px ${social.color}66)`
                }}
                style={{ 
                  color: 'var(--text-secondary)', 
                  transition: 'color 0.3s',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px'
                }}
              >
                <div style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                  <social.icon size={36} />
                </div>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{social.name}</span>
              </motion.a>
            ))}
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '40px', 
            borderRadius: '32px', 
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-secondary)', fontSize: '18px',
            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
          }}>
            <p style={{ color: 'white', fontWeight: 800, fontSize: '20px' }}>Tim Pengembang LelangKu</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '24px', fontSize: '16px' }}>
              <span style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-primary)' }}>Bryan Chandra (241110637)</span>
              <span style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-primary)' }}>Steven Aurelio (201111110)</span>
              <span style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-primary)' }}>Stevania</span>
              <span style={{ background: 'rgba(139, 92, 246, 0.1)', padding: '8px 16px', borderRadius: '20px', color: 'var(--accent-primary)' }}>Raihan</span>
            </div>
          </div>
          
          <p style={{ marginTop: '64px', fontSize: '14px', opacity: 0.4, fontWeight: 600, letterSpacing: '0.1em' }}>
            © 2026 LELANGKU. ALL RIGHTS RESERVED.
          </p>
        </motion.div>
      </footer>

      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes gridMove {
          0% { background-position: 0 0; }
          100% { background-position: 0 80px; }
        }
      `}</style>
    </div>
  );
};
