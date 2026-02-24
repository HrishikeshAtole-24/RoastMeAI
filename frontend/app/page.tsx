'use client';

import { useState } from 'react';
import styles from './page.module.css';

type RoastLevel = 'soft' | 'medium' | 'brutal';

interface RoastResponse {
  success: boolean;
  roast?: string;
  level?: string;
  name?: string;
  error?: string;
}

export default function Home() {
  const [name, setName] = useState('');
  const [profession, setProfession] = useState('');
  const [about, setAbout] = useState('');
  const [level, setLevel] = useState<RoastLevel>('medium');
  const [roast, setRoast] = useState('');
  const [loading, setLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [roastCache, setRoastCache] = useState<Record<RoastLevel, string>>({
    soft: '',
    medium: '',
    brutal: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !profession.trim()) {
      return;
    }

    setLoading(true);
    setShowResult(false);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          profession: profession.trim(),
          level,
          about: about.trim(),
        }),
      });

      const data: RoastResponse = await response.json();

      if (data.success && data.roast) {
        setRoast(data.roast);
        setRoastCache(prev => ({ ...prev, [level]: data.roast }));
        setShowResult(true);
      } else {
        setRoast(data.error || 'Something went wrong. Even AI gave up on you.');
        setShowResult(true);
      }
    } catch {
      setRoast('Connection failed. The server is probably crying from roasting too many people.');
      setShowResult(true);
    } finally {
      setLoading(false);
    }
  };

  const handleNewRoast = () => {
    setShowResult(false);
    setRoast('');
    setRoastCache({ soft: '', medium: '', brutal: '' });
  };

  const handleReRoast = async (newLevel: RoastLevel) => {
    if (newLevel === level) return;
    
    // Check cache first
    if (roastCache[newLevel]) {
      setLevel(newLevel);
      setRoast(roastCache[newLevel]);
      return;
    }
    
    setLevel(newLevel);
    setLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/roast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          profession: profession.trim(),
          level: newLevel,
          about: about.trim(),
        }),
      });

      const data: RoastResponse = await response.json();

      if (data.success && data.roast) {
        setRoast(data.roast);
        setRoastCache(prev => ({ ...prev, [newLevel]: data.roast }));
      } else {
        setRoast(data.error || 'Something went wrong. Even AI gave up on you.');
      }
    } catch {
      setRoast('Connection failed. The server is probably crying from roasting too many people.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roast);
    } catch {
      console.error('Failed to copy');
    }
  };

  const getLevelIcon = (lvl: RoastLevel) => {
    switch (lvl) {
      case 'soft': return 'fa-face-smile-beam';
      case 'medium': return 'fa-face-meh';
      case 'brutal': return 'fa-skull';
    }
  };

  const getLevelSecondIcon = (lvl: RoastLevel) => {
    switch (lvl) {
      case 'soft': return 'fa-heart';
      case 'medium': return 'fa-bolt';
      case 'brutal': return 'fa-skull-crossbones';
    }
  };

  return (
    <main className={styles.main}>
      {/* Background Effects */}
      <div className={styles.bgEffects}>
        <div className={styles.fireGlow}></div>
        <div className={styles.particles}></div>
      </div>

      {/* Header */}
      <header className={styles.header}>
        <div className={styles.logo}>
          <i className="fa-solid fa-fire"></i>
          <span>RoastMe</span>
          <span className={styles.ai}>AI</span>
        </div>
        <p className={styles.tagline}>
          Powered by
          <img 
            src="./groq.png"
            alt="Groq" 
            className={styles.groqLogo}
          />
          • Faster than your comebacks
        </p>
      </header>

      {/* Main Content */}
      <div className={styles.container}>
        {!showResult ? (
          <div className={styles.formSection}>
            <div className={styles.formHeader}>
              <h1>
                Think you can handle it?
                <i className={`fa-solid fa-fire-flame-curved ${styles.fireIcon}`}></i>
              </h1>
              <p className={styles.subheading}>
                <i className="fa-solid fa-crosshairs"></i>
                Enter your details below and let AI destroy your ego
              </p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Name Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="name">
                  <i className="fa-solid fa-user"></i>
                  What should we call you, victim?
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name..."
                  required
                  maxLength={50}
                />
              </div>

              {/* Profession Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="profession">
                  <i className="fa-solid fa-briefcase"></i>
                  What do you do? (or pretend to do)
                </label>
                <input
                  type="text"
                  id="profession"
                  value={profession}
                  onChange={(e) => setProfession(e.target.value)}
                  placeholder="e.g., Backend Engineer, Student, Professional Procrastinator..."
                  required
                  maxLength={100}
                />
              </div>

              {/* About Input */}
              <div className={styles.inputGroup}>
                <label htmlFor="about">
                  <i className="fa-solid fa-comment-dots"></i>
                  Tell us about yourself (more ammo for us)
                </label>
                <textarea
                  id="about"
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="e.g., I procrastinate a lot, hate frontend, dream of being rich, skip leg day..."
                  rows={3}
                  maxLength={300}
                />
                <span className={styles.charCount}>{about.length}/300</span>
              </div>

              {/* Roast Level Selector - Slider */}
              <div className={styles.levelSelector}>
                <label>
                  <i className="fa-solid fa-fire-flame-curved"></i>
                  Choose your pain level
                </label>
                <div className={styles.sliderContainer}>
                  <div className={styles.sliderTrack}>
                    <div 
                      className={styles.sliderFill} 
                      style={{ 
                        width: level === 'soft' ? '0%' : level === 'medium' ? '50%' : '100%',
                        background: level === 'soft' ? 'var(--soft-color)' : level === 'medium' ? 'var(--medium-color)' : 'var(--brutal-color)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.sliderLabels}>
                    {(['soft', 'medium', 'brutal'] as RoastLevel[]).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        className={`${styles.sliderLabel} ${styles[lvl]} ${level === lvl ? styles.activeLabel : ''}`}
                        onClick={() => setLevel(lvl)}
                      >
                        <i className={`fa-solid ${getLevelIcon(lvl)}`}></i>
                        <span>{lvl}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <p className={styles.levelHint}>
                  {level === 'soft' && <><i className="fa-solid fa-feather"></i> Playful teasing</>}
                  {level === 'medium' && <><i className="fa-solid fa-bolt"></i> Bold and sarcastic</>}
                  {level === 'brutal' && <><i className="fa-solid fa-biohazard"></i> Absolutely savage</>}
                </p>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={styles.submitBtn}
                disabled={loading || !name.trim() || !profession.trim()}
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin"></i>
                    Preparing your destruction...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-fire"></i>
                    ROAST ME
                    <i className="fa-solid fa-fire"></i>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className={styles.resultSection}>
            <div className={styles.resultHeader}>
              <div className={styles.resultIcon}>
                <i className={`fa-solid ${level === 'brutal' ? 'fa-skull' : level === 'soft' ? 'fa-face-smile' : 'fa-face-meh'}`}></i>
              </div>
              <h2>
                {level === 'brutal' ? 'R.I.P. ' : level === 'soft' ? 'Hey there, ' : 'Alright '}
                {name}
                {level === 'brutal' && <i className="fa-solid fa-skull-crossbones"></i>}
              </h2>
              <span className={`${styles.levelBadge} ${styles[level]}`}>
                {level.toUpperCase()} ROAST
              </span>
            </div>

            <div className={styles.roastCard}>
              <div className={styles.quoteIcon}>
                <i className="fa-solid fa-quote-left"></i>
              </div>
              <p className={styles.roastText}>{roast}</p>
              <div className={styles.quoteIconRight}>
                <i className="fa-solid fa-quote-right"></i>
              </div>
            </div>

            {/* Level Switcher on Result Page */}
            <div className={styles.resultLevelSwitch}>
              <span className={styles.switchLabel}>Try different heat:</span>
              <div className={styles.switchButtons}>
                {(['soft', 'medium', 'brutal'] as RoastLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    className={`${styles.switchBtn} ${styles[lvl]} ${level === lvl ? styles.currentLevel : ''}`}
                    onClick={() => handleReRoast(lvl)}
                    disabled={loading}
                  >
                    <i className={`fa-solid ${getLevelIcon(lvl)}`}></i>
                    <span>{lvl}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.resultActions}>
              <button onClick={handleNewRoast} className={styles.newRoastBtn}>
                <i className="fa-solid fa-rotate"></i>
                Roast Me Again
              </button>
              <button onClick={copyToClipboard} className={styles.copyBtn}>
                <i className="fa-solid fa-copy"></i>
                Copy Roast
              </button>
              <button 
                onClick={() => {
                  const text = encodeURIComponent(`I just got ${level} roasted by AI! 🔥\n\n"${roast.slice(0, 200)}..."\n\nTry it yourself!`);
                  window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
                }} 
                className={styles.shareBtn}
              >
                <i className="fa-brands fa-x-twitter"></i>
                Share
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <i className="fa-solid fa-fire"></i>
            <span>RoastMe AI</span>
          </div>
          <p className={styles.footerCredit}>
            Made with <i className="fa-solid fa-heart beating"></i>
          </p>
          <div className={styles.footerLinks}>
            <a href="#" className={styles.footerLink}>
              <i className="fa-brands fa-github"></i>
            </a>
            <a href="#" className={styles.footerLink}>
              <i className="fa-brands fa-x-twitter"></i>
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
