import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface NavLinkProps {
  to: string;
  children: ReactNode;
  className?: string;
}

const Navbar = () => {
  return (
    <nav className="bg-white/90 backdrop-blur-sm fixed w-full top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-purple-600">JoyVerse</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink to="/phonetics-game">Phonetic Sounds</NavLink>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/faq">FAQ</NavLink>
            <NavLink to="/feedback">Feedback</NavLink>
            <NavLink to="/therapist-auth">Sign Up</NavLink>
            <NavLink to="/child-login" className="bg-purple-600 text-white px-4 py-2 rounded-full hover:bg-purple-700 transition-colors">
              Login
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900 focus:outline-none">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className="md:hidden">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <MobileNavLink to="/phonetics-game">Phonetic Sounds</MobileNavLink>
          <MobileNavLink to="/">Home</MobileNavLink>
          <MobileNavLink to="/about">About Us</MobileNavLink>
          <MobileNavLink to="/faq">FAQ</MobileNavLink>
          <MobileNavLink to="/feedback">Feedback</MobileNavLink>
          <MobileNavLink to="/therapist-auth">Sign Up</MobileNavLink>
          <MobileNavLink to="/child-login">Login</MobileNavLink>
        </div>
      </div>
    </nav>
  );
};

// NavLink component for desktop
const NavLink = ({ to, children, className = '' }: NavLinkProps) => (
  <Link
    to={to}
    className={`text-gray-600 hover:text-purple-600 transition-colors ${className}`}
  >
    <motion.span
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.span>
  </Link>
);

// NavLink component for mobile
const MobileNavLink = ({ to, children }: NavLinkProps) => (
  <Link
    to={to}
    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-purple-600 hover:bg-gray-50 transition-colors"
  >
    {children}
  </Link>
);

export default Navbar; 