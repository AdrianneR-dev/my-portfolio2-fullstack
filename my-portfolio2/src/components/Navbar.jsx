import React from 'react';
import { NavLink } from 'react-router-dom';
import useTheme from './useTheme';
import useAuth from '../context/useAuth';

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme();
  const { user, isAdmin, logout } = useAuth();

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-blue-600 text-white'
        : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
    }`;

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-8">

          <NavLink to="/" className="flex-shrink-0 font-bold text-lg tracking-tight">
            DevPortfolio
          </NavLink>

          <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-end">
            <NavLink to="/" end className={linkClass}>Home</NavLink>
            <NavLink to="/projects" className={linkClass}>Projects</NavLink>
            <NavLink to="/experience" className={linkClass}>Experience</NavLink>
            <NavLink to="/guestbook" className={linkClass}>Guestbook</NavLink>
            <NavLink to="/contact" className={linkClass}>Contact</NavLink>

            {isAdmin && <NavLink to="/admin" className={linkClass}>Admin</NavLink>}

            {user ? (
              <button
                onClick={logout}
                className="px-3 py-2 rounded-md text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Log out
              </button>
            ) : (
              <>
                <NavLink to="/login" className={linkClass}>Log in</NavLink>
                <NavLink to="/register" className={linkClass}>Register</NavLink>
              </>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:opacity-80 transition"
              aria-label="Toggle Theme"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
