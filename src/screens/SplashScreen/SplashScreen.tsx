import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';

export const SplashScreen: React.FC = () => {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setLoaded(true);
          return 100;
        }
        return p + 2;
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (loaded) {
      const timer = setTimeout(() => navigate('/menu'), 500);
      return () => clearTimeout(timer);
    }
  }, [loaded, navigate]);

  return (
    <div className={`splash ${loaded ? 'splash--fade-out' : ''}`} id="splash-screen">
      {/* Animated background orbs */}
      <div className="splash__orb splash__orb--1" />
      <div className="splash__orb splash__orb--2" />
      <div className="splash__orb splash__orb--3" />

      <div className="splash__content">
        <h1 className="splash__title">CHROMATICA</h1>
        <p className="splash__subtitle">The Art of Potion Craft</p>

        <div className="splash__loader">
          <div className="splash__loader-track">
            <div className="splash__loader-fill" style={{ width: `${progress}%` }} />
          </div>
          <span className="splash__loader-text">
            {loaded ? 'Ready' : `Loading... ${progress}%`}
          </span>
        </div>
      </div>
    </div>
  );
};
