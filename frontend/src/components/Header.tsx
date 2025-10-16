import React from 'react';

const JoyverseLogo = () => (
  <div className="flex items-center gap-2">
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="20" r="20" fill="#a18cd1" />
      <text x="20" y="27" textAnchor="middle" fontSize="22" fill="#fff" fontFamily="Quicksand, Arial, sans-serif" fontWeight="bold">J</text>
    </svg>
    <span className="text-3xl font-extrabold text-purple-700 tracking-wide drop-shadow" style={{fontFamily: 'Quicksand, Arial, sans-serif'}}>Joyverse</span>
  </div>
);

const FloatingSparkles = () => (
  <>
    <span className="absolute left-10 top-2 animate-pulse opacity-60">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="7" fill="#FFD700"/></svg>
    </span>
    <span className="absolute right-16 top-4 animate-bounce opacity-40">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#FF69B4"/></svg>
    </span>
    <span className="absolute left-1/2 top-1/2 animate-pulse opacity-30">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#00FFFF"/></svg>
    </span>
  </>
);

const Header = () => (
  <header
    className="w-full relative flex items-center justify-between px-8 py-4 rounded-b-2xl shadow-lg"
    style={{
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px 0 rgba(161,140,209,0.10)'
    }}
  >
    <FloatingSparkles />
    <JoyverseLogo />
    <nav className="flex gap-6 items-center">
      <a href="/" className="text-purple-700 font-semibold hover:bg-purple-100 px-4 py-2 rounded-full transition">Home</a>
      <a href="/about" className="text-purple-700 font-semibold hover:bg-purple-100 px-4 py-2 rounded-full transition">About</a>
      <a href="/faq" className="text-purple-700 font-semibold hover:bg-purple-100 px-4 py-2 rounded-full transition">FAQ</a>
      <a href="/feedback" className="text-purple-700 font-semibold hover:bg-purple-100 px-4 py-2 rounded-full transition">Feedback</a>
      <a href="/signup" className="ml-2 bg-purple-500 hover:bg-purple-600 text-white px-5 py-2 rounded-full font-bold shadow transition">Sign Up</a>
    </nav>
  </header>
);

export default Header; 