'use client';

import { useState, useEffect, useRef } from 'react';
import { useContract } from '../hooks/useContract';
import LoanCreation from '../components/LoanCreation';

export default function Home() {
  const { isConnected, connectWallet, error } = useContract();
  const [isConnecting, setIsConnecting] = useState(false);

  // Handle wallet connection with loading state
  const handleConnectWallet = async () => {
    if (isConnecting) return;
    
    setIsConnecting(true);
    try {
      await connectWallet();
    } catch (error) {
      console.error('Wallet connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };
  
  const [stats, setStats] = useState({
    projects: 0,
    repayment: 0,
    locations: 0,
    impact: 0
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isLoaded, setIsLoaded] = useState(false);
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    size: number;
    opacity: number;
    duration: number;
    delay: number;
  }>>([]);

  const heroRef = useRef(null);

  // Helper function for safe style access
  const setElementStyle = (element: EventTarget | null, styles: Record<string, string>) => {
    if (element && 'style' in element) {
      Object.assign((element as HTMLElement).style, styles);
    }
  };

  // Generate particles on client-side only (SSR-safe)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const generatedParticles = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        opacity: Math.random() * 0.5 + 0.1,
        duration: Math.random() * 10 + 10,
        delay: Math.random() * 5
      }));
      setParticles(generatedParticles);
    }
  }, []);

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX - window.innerWidth / 2) / 50,
        y: (e.clientY - window.innerHeight / 2) / 50
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate statistics with spring physics
  useEffect(() => {
    const animateStats = () => {
      const targetStats = { projects: 1100, repayment: 95, locations: 7, impact: 3 };
      const duration = 3000;
      const steps = 120;
      const stepDuration = duration / steps;

      let currentStep = 0;
      const timer = setInterval(() => {
        currentStep++;
        const progress = currentStep / steps;
        // Spring physics easing
        const springEase = 1 - Math.pow(1 - progress, 4);

        setStats({
          projects: Math.floor(targetStats.projects * springEase),
          repayment: Math.floor(targetStats.repayment * springEase),
          locations: Math.floor(targetStats.locations * springEase),
          impact: Math.floor(targetStats.impact * springEase)
        });

        if (currentStep >= steps) {
          clearInterval(timer);
        }
      }, stepDuration);
    };

    setTimeout(() => {
      setIsLoaded(true);
      animateStats();
    }, 500);
  }, []);

  return (
    <main style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #0a0a0a 100%)',
      overflow: 'hidden',
      position: 'relative',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      {/* Dynamic Particle Background with Mouse Parallax */}
      <div style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        zIndex: 1
      }}>
        {/* Floating particles - SSR Safe */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            style={{
              position: 'absolute',
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              background: `rgba(254, 159, 20, ${particle.opacity})`,
              borderRadius: '50%',
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animation: `float ${particle.duration}s infinite linear`,
              animationDelay: `${particle.delay}s`,
              transform: `translate(${mousePosition.x * 0.1}px, ${mousePosition.y * 0.1}px)`,
              transition: 'transform 0.1s ease-out'
            }}
          />
        ))}
        
        {/* Dynamic gradient orbs with mouse parallax */}
        <div style={{
          position: 'absolute',
          top: '10%',
          left: '10%',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(33, 79, 150, 0.3) 0%, rgba(33, 79, 150, 0.1) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(80px)',
          transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
          transition: 'transform 0.1s ease-out'
        }} />
        
        <div style={{
          position: 'absolute',
          bottom: '10%',
          right: '10%',
          width: '800px',
          height: '800px',
          background: 'radial-gradient(circle, rgba(254, 159, 20, 0.2) 0%, rgba(254, 159, 20, 0.05) 50%, transparent 70%)',
          borderRadius: '50%',
          filter: 'blur(100px)',
          transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
          transition: 'transform 0.1s ease-out'
        }} />
      </div>

      {/* Ultra-Modern Header */}
      <header style={{
        position: 'relative',
        zIndex: 100,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1.5rem 0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                position: 'relative',
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #214F96 0%, #FE9F14 50%, #214F96 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 20px 40px rgba(33, 79, 150, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                animation: 'pulse 2s infinite'
              }}>
                <span style={{ 
                  color: 'white', 
                  fontWeight: 'bold', 
                  fontSize: '24px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  K
                </span>
                <div style={{
                  position: 'absolute',
                  inset: '-2px',
                  background: 'linear-gradient(135deg, #214F96, #FE9F14, #214F96)',
                  borderRadius: '22px',
                  zIndex: -1,
                  filter: 'blur(8px)',
                  opacity: 0.6
                }} />
              </div>
              <div>
                <h1 style={{
                  fontSize: '28px',
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  letterSpacing: '-0.02em'
                }}>
                  Koinonia Ventures
                </h1>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  fontWeight: '500',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  Blockchain Micro-Lending
                </div>
              </div>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <nav style={{
                display: 'flex',
                gap: '2rem'
              }}>
                {['Platform', 'Impact', 'Locations', 'About'].map((item) => (
                  <a
                    key={item}
                    href="#"
                    style={{
                      color: '#cbd5e1',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: '500',
                      padding: '8px 16px',
                      borderRadius: '12px',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      setElementStyle(e.target, { color: '#ffffff', background: 'rgba(255, 255, 255, 0.1)' });
                    }}
                    onMouseLeave={(e) => {
                      setElementStyle(e.target, { color: '#cbd5e1', background: 'transparent' });
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
              
              <button 
                onClick={handleConnectWallet}
                disabled={isConnecting}
                style={{
                  background: isConnected 
                    ? 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)' 
                    : isConnecting
                    ? 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'
                    : 'linear-gradient(135deg, #214F96 0%, #1D4ED8 100%)',
                  color: 'white',
                  padding: '14px 28px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '14px',
                  border: 'none',
                  cursor: isConnecting ? 'not-allowed' : 'pointer',
                  boxShadow: '0 10px 25px rgba(33, 79, 150, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isConnecting ? 0.7 : 1
                }}
                onMouseEnter={(e) => {
                  if (!isConnecting) {
                    setElementStyle(e.target, { 
                      transform: 'translateY(-2px) scale(1.02)',
                      boxShadow: '0 20px 40px rgba(33, 79, 150, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                    });
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isConnecting) {
                    setElementStyle(e.target, { 
                      transform: 'translateY(0) scale(1)',
                      boxShadow: '0 10px 25px rgba(33, 79, 150, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                    });
                  }
                }}
              >
                <span style={{ position: 'relative', zIndex: 1 }}>
                  {isConnecting ? '🔄 Connecting...' : isConnected ? '✅ Connected' : '🦊 Connect Wallet'}
                </span>
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
                  opacity: 0,
                  transition: 'opacity 0.3s ease'
                }} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '1rem',
          margin: '2rem auto',
          maxWidth: '1200px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#ef4444', fontSize: '14px', margin: '0' }}>
            ❌ Wallet Error: {error}
          </p>
        </div>
      )}
      
      {/* Hero Section - The Crown Jewel */}
      <section ref={heroRef} style={{
        position: 'relative',
        zIndex: 10,
        padding: '8rem 0 6rem 0',
        textAlign: 'center',
        overflow: 'hidden'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          {/* Main Hero Content */}
          <div style={{
            marginBottom: '6rem',
            opacity: isLoaded ? 1 : 0,
            transform: isLoaded ? 'translateY(0)' : 'translateY(50px)',
            transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            <div style={{
              display: 'inline-block',
              padding: '8px 24px',
              background: 'rgba(254, 159, 20, 0.1)',
              border: '1px solid rgba(254, 159, 20, 0.2)',
              borderRadius: '50px',
              marginBottom: '2rem',
              fontSize: '14px',
              fontWeight: '600',
              color: '#FE9F14',
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              🚀 Now Live on Blockchain
            </div>
            
            <h2 style={{
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              fontWeight: '800',
              lineHeight: '1.1',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              letterSpacing: '-0.02em'
            }}>
              EMPOWERING OPPORTUNITY
              <br />
              <span style={{
                background: 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                THROUGH FELLOWSHIP
              </span>
            </h2>
            
            <p style={{
              fontSize: '1.5rem',
              color: '#94a3b8',
              maxWidth: '800px',
              margin: '0 auto 3rem auto',
              lineHeight: '1.6',
              fontWeight: '400'
            }}>
              Revolutionizing micro-lending through blockchain technology. 
              Every transaction is transparent, every impact is measurable, 
              every dream is achievable.
            </p>

            {/* CTA Buttons */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button style={{
                background: 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '20px',
                fontWeight: '700',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(254, 159, 20, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                setElementStyle(e.target, { 
                  transform: 'translateY(-3px) scale(1.05)',
                  boxShadow: '0 30px 60px rgba(254, 159, 20, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                });
              }}
              onMouseLeave={(e) => {
                setElementStyle(e.target, { 
                  transform: 'translateY(0) scale(1)',
                  boxShadow: '0 20px 40px rgba(254, 159, 20, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                });
              }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Start Lending Now
                  <span style={{ fontSize: '20px' }}>→</span>
                </span>
              </button>
              
              <button style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                color: 'white',
                padding: '20px 40px',
                borderRadius: '20px',
                fontWeight: '600',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                setElementStyle(e.target, { 
                  background: 'rgba(255, 255, 255, 0.2)',
                  transform: 'translateY(-2px)'
                });
              }}
              onMouseLeave={(e) => {
                setElementStyle(e.target, { 
                  background: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(0)'
                });
              }}
              >
                Watch Demo
              </button>
            </div>
          </div>
          
          {/* Loan Creation Section */}
      <section style={{
        background: 'rgba(255, 255, 255, 0.02)',
        borderTop: '1px solid rgba(255, 255, 255, 0.05)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        padding: '4rem 0'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{
            textAlign: 'center',
            marginBottom: '3rem'
          }}>
            <h2 style={{
              color: 'white',
              fontSize: '2.5rem',
              fontWeight: '700',
              marginBottom: '1rem'
            }}>
              Create New Loan
            </h2>
            <p style={{
              color: '#94a3b8',
              fontSize: '1.125rem',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Create a new micro-loan request for entrepreneurs in need. 
              All transactions are recorded on the blockchain for transparency.
            </p>
          </div>
          
          <div style={{
            maxWidth: '600px',
            margin: '0 auto'
          }}>
            <LoanCreation />
          </div>
        </div>
      </section>
      
          {/* Spectacular Statistics Grid with Animated Counters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '2rem',
            marginTop: '6rem'
          }}>
            {[
              { value: stats.projects, suffix: '+', label: 'Projects Funded', color: '#FE9F14' },
              { value: stats.repayment, suffix: '%', label: 'Repayment Rate', color: '#10B981' },
              { value: stats.locations, suffix: '', label: 'Active Locations', color: '#3B82F6' },
              { value: stats.impact, suffix: 'x', label: 'Donation Impact', color: '#8B5CF6' }
            ].map((stat, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: '24px',
                  padding: '2.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(30px)',
                  transitionDelay: `${index * 0.1}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px) scale(1.02)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '2px',
                  background: `linear-gradient(90deg, ${stat.color}, transparent)`,
                  opacity: 0.6
                }} />
                
                <div style={{
                  fontSize: '4rem',
                  fontWeight: '800',
                  color: stat.color,
                  marginBottom: '0.5rem',
                  textShadow: `0 0 20px ${stat.color}40`
                }}>
                  {stat.value.toLocaleString()}{stat.suffix}
                </div>
                
                <div style={{
                  color: '#94a3b8',
                  fontSize: '1rem',
                  fontWeight: '600',
                  letterSpacing: '0.02em'
                }}>
                  {stat.label}
                </div>
                
                <div style={{
                  marginTop: '1.5rem',
                  height: '4px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    height: '100%',
                    background: `linear-gradient(90deg, ${stat.color}, ${stat.color}80)`,
                    borderRadius: '2px',
                    width: '85%',
                    animation: 'pulse 2s infinite'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Loan Showcase */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '6rem 0',
        background: 'linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.3) 100%)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h3 style={{
              fontSize: '3rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1rem',
              letterSpacing: '-0.02em'
            }}>
              Live Loan Projects
            </h3>
            <p style={{
              fontSize: '1.25rem',
              color: '#94a3b8',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              Real entrepreneurs, real impact, real-time transparency
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                name: "Iriny's Clothing Store",
                amount: 15000,
                currency: 'EGP',
                progress: 75,
                description: 'Fashion retail in Sohag',
                icon: '👗',
                color: '#FE9F14',
                location: 'Sohag'
              },
              {
                name: "Sameh's Farm Equipment",
                amount: 50000,
                currency: 'EGP',
                progress: 45,
                description: 'Agricultural tools for Matay',
                icon: '🌾',
                color: '#10B981',
                location: 'Matay'
              },
              {
                name: "Romany's Shop",
                amount: 25000,
                currency: 'EGP',
                progress: 90,
                description: 'Convenience store in Banimazar',
                icon: '🏪',
                color: '#3B82F6',
                location: 'Banimazar'
              }
            ].map((loan, index) => (
              <div
                key={index}
                style={{
                  background: 'rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  borderRadius: '28px',
                  padding: '2.5rem',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  opacity: isLoaded ? 1 : 0,
                  transform: isLoaded ? 'translateY(0)' : 'translateY(40px)',
                  transitionDelay: `${index * 0.2}s`
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-15px) scale(1.03) rotate(1deg)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.currentTarget.style.boxShadow = '0 40px 80px rgba(0, 0, 0, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1) rotate(0deg)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
                }}
              >
                {/* Card Header */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '2rem'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}>
                    <div style={{
                      width: '72px',
                      height: '72px',
                      background: `linear-gradient(135deg, ${loan.color}40, ${loan.color}20)`,
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '32px',
                      border: `2px solid ${loan.color}40`
                    }}>
                      {loan.icon}
                    </div>
                    <div>
                      <h4 style={{
                        fontSize: '1.5rem',
                        fontWeight: '700',
                        color: 'white',
                        marginBottom: '0.25rem'
                      }}>
                        {loan.name}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#94a3b8'
                      }}>
                        <span>📍</span>
                        <span>{loan.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: '2rem',
                      fontWeight: '800',
                      color: loan.color,
                      textShadow: `0 0 20px ${loan.color}40`
                    }}>
                      {loan.amount.toLocaleString()}
                    </div>
                    <div style={{
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      {loan.currency}
                    </div>
                  </div>
                </div>

                <p style={{
                  color: '#cbd5e1',
                  marginBottom: '2rem',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {loan.description}
                </p>

                {/* Progress Section */}
                <div style={{ marginBottom: '2rem' }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <span style={{
                      color: '#94a3b8',
                      fontSize: '0.875rem',
                      fontWeight: '600'
                    }}>
                      Repayment Progress
                    </span>
                    <span style={{
                      color: loan.color,
                      fontSize: '1.25rem',
                      fontWeight: '700'
                    }}>
                      {loan.progress}%
                    </span>
                  </div>
                  
                  <div style={{
                    height: '8px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${loan.color}, ${loan.color}80)`,
                      borderRadius: '4px',
                      width: `${loan.progress}%`,
                      transition: 'width 2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)`,
                        animation: 'shimmer 2s infinite'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button style={{
                  width: '100%',
                  background: `linear-gradient(135deg, ${loan.color}20, ${loan.color}10)`,
                  border: `1px solid ${loan.color}40`,
                  color: loan.color,
                  padding: '16px',
                  borderRadius: '16px',
                  fontWeight: '600',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  setElementStyle(e.target, { 
                    background: `linear-gradient(135deg, ${loan.color}30, ${loan.color}20)`,
                    transform: 'translateY(-2px)'
                  });
                }}
                onMouseLeave={(e) => {
                  setElementStyle(e.target, { 
                    background: `linear-gradient(135deg, ${loan.color}20, ${loan.color}10)`,
                    transform: 'translateY(0)'
                  });
                }}
                >
                  View Full Details
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultimate Call to Action */}
      <section style={{
        position: 'relative',
        zIndex: 10,
        padding: '8rem 0',
        background: 'linear-gradient(135deg, rgba(33, 79, 150, 0.1) 0%, rgba(254, 159, 20, 0.1) 100%)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(40px) saturate(180%)',
            borderRadius: '32px',
            padding: '4rem',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: 'linear-gradient(90deg, #214F96, #FE9F14, #214F96)',
              opacity: 0.8
            }} />
            
            <h3 style={{
              fontSize: '3.5rem',
              fontWeight: '800',
              color: 'white',
              marginBottom: '1.5rem',
              letterSpacing: '-0.02em'
            }}>
              Ready to Transform Lives?
            </h3>
            
            <p style={{
              fontSize: '1.5rem',
              color: '#94a3b8',
              marginBottom: '3rem',
              maxWidth: '800px',
              margin: '0 auto 3rem auto',
              lineHeight: '1.6'
            }}>
              Join the revolution in transparent, blockchain-powered micro-lending. 
              Every donation creates a ripple effect of economic empowerment.
            </p>
            
            <div style={{
              display: 'flex',
              gap: '1.5rem',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button style={{
                background: 'linear-gradient(135deg, #FE9F14 0%, #EA580C 100%)',
                color: 'white',
                padding: '24px 48px',
                borderRadius: '24px',
                fontWeight: '700',
                fontSize: '20px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 20px 40px rgba(254, 159, 20, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onMouseEnter={(e) => {
                setElementStyle(e.target, { 
                  transform: 'translateY(-4px) scale(1.05)',
                  boxShadow: '0 30px 60px rgba(254, 159, 20, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.2)'
                });
              }}
              onMouseLeave={(e) => {
                setElementStyle(e.target, { 
                  transform: 'translateY(0) scale(1)',
                  boxShadow: '0 20px 40px rgba(254, 159, 20, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)'
                });
              }}
              >
                <span style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  Start Your Impact Journey
                  <span style={{ fontSize: '24px' }}>🚀</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(1deg); }
          66% { transform: translateY(-10px) rotate(-1deg); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </main>
  );
}