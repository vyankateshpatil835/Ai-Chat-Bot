import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);

  // Track scroll position; requestAnimationFrame keeps this smooth (60fps)
  // instead of firing a state update on every single scroll pixel.
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sample "memory" bubbles floating in the hero — purely decorative content
  const bubbles = [
    { text: "What's the capital of France?", depth: -100, x: '15%', y: '20%' },
    { text: 'Explain closures like I\'m five', depth: -250, x: '70%', y: '15%' },
    { text: 'Debug this async function', depth: -180, x: '10%', y: '65%' },
    { text: 'Summarize our last conversation', depth: -320, x: '75%', y: '60%' },
    { text: 'Write a regex for emails', depth: -60, x: '45%', y: '80%' },
  ];

  return (
    <div className="landing">
      <nav className="landing-nav">
        <span className="landing-logo">continuum</span>
        <div className="landing-nav-links">
          <Link to="/login" className="nav-link">Log in</Link>
          <Link to="/signup" className="nav-cta">Get started</Link>
        </div>
      </nav>

      {/* HERO — 3D bubbles drift based on scroll position */}
      <section className="hero" ref={heroRef}>
        <div className="hero-scene" style={{ perspective: '1200px' }}>
          {bubbles.map((b, i) => (
            <div
              key={i}
              className="hero-bubble"
              style={{
                left: b.x,
                top: b.y,
                transform: `translateZ(${b.depth}px) translateY(${scrollY * (b.depth / -800)}px) rotateX(${scrollY * 0.02}deg)`,
                opacity: Math.max(0, 1 - scrollY / 500),
              }}
            >
              {b.text}
            </div>
          ))}
        </div>

        <div className="hero-content">
          <span className="hero-eyebrow">AI chat, remembered</span>
          <h1 className="hero-title">
            Every conversation
            <br />
            stays exactly where
            <br />
            you left it.
          </h1>
          <p className="hero-subtitle">
            An AI assistant that keeps the thread — across sessions, across days,
            across every question you forgot you asked.
          </p>
          <Link to="/signup" className="hero-button">Start a conversation</Link>
        </div>

        <div className="scroll-hint">scroll</div>
      </section>

      {/* HOW IT WORKS — cards rise and settle as they enter view */}
      <RevealSection scrollY={scrollY} />

      {/* CTA */}
      <section className="final-cta">
        <h2>Pick up where you left off.</h2>
        <p>Free to start. Your history stays yours.</p>
        <Link to="/signup" className="hero-button">Create your account</Link>
      </section>

      <footer className="landing-footer">
        <span>continuum</span>
        <span>Built with Node.js, Express, MongoDB &amp; Gemini</span>
      </footer>
    </div>
  );
}

// Separate component so each card can independently track its own
// scroll-triggered reveal using IntersectionObserver.
function RevealSection() {
  const cards = [
    {
      title: 'Full context, every time',
      text: 'Your assistant reads the whole thread before it replies — no re-explaining yourself.',
    },
    {
      title: 'Private by default',
      text: 'Every conversation is tied to your account alone. No one else sees your history.',
    },
    {
      title: 'Pick up any thread',
      text: 'Jump back into a chat from last week as easily as one from ten seconds ago.',
    },
  ];

  return (
    <section className="features">
      {cards.map((card, i) => (
        <RevealCard key={i} title={card.title} text={card.text} index={i} />
      ))}
    </section>
  );
}

function RevealCard({ title, text, index }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`feature-card ${visible ? 'feature-card-visible' : ''}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <h3>{title}</h3>
      <p>{text}</p>
    </div>
  );
}

export default LandingPage;