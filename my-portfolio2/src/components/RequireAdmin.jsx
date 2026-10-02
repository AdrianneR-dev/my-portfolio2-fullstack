import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuth from '../context/useAuth';

// This only controls what the UI shows — the backend enforces the real rule
// (requireAdmin middleware) on every request, so this is a UX convenience,
// not a security boundary in itself.
export default function RequireAdmin({ children }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <p className="text-center py-20 text-zinc-500">Checking session…</p>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold mb-2">403 — Admins only</h2>
        <p className="text-zinc-600 dark:text-zinc-400">You're signed in, but this page needs an admin account.</p>
      </div>
    );
  }

  return children;
}
