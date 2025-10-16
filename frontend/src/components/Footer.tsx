import React from 'react';

const Footer = () => (
  <footer
    className="w-full flex justify-center items-center py-3 px-6"
    style={{
      background: 'rgba(255,255,255,0.7)',
      backdropFilter: 'blur(10px)',
      borderTopLeftRadius: '1.5rem',
      borderTopRightRadius: '1.5rem',
      boxShadow: '0 -2px 16px 0 rgba(161,140,209,0.10)',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 40
    }}
  >
    <span className="text-purple-700 text-base font-semibold flex items-center gap-2" style={{fontFamily: 'Quicksand, Arial, sans-serif'}}>
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><circle cx="9" cy="9" r="9" fill="#FFD700"/></svg>
      Made with <span className="text-pink-500 text-lg">♥</span> by Joyverse
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="8" fill="#a18cd1"/></svg>
    </span>
  </footer>
);

export default Footer; 