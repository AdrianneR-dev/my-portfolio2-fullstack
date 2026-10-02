import React, { useState } from 'react';
import { api, getVisitorId } from '../lib/api';

export default function LikeButton({ projectId, initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(() => {
    const likedIds = JSON.parse(localStorage.getItem('likedProjectIds') || '[]');
    return likedIds.includes(projectId);
  });
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (liked || busy) return;
    setBusy(true);
    try {
      const visitorId = getVisitorId();
      const result = await api.likeProject(projectId, visitorId);
      setCount(result.likeCount);
      setLiked(true);
      const likedIds = JSON.parse(localStorage.getItem('likedProjectIds') || '[]');
      localStorage.setItem('likedProjectIds', JSON.stringify([...new Set([...likedIds, projectId])]));
    } catch {
      // The server is the source of truth for "already liked" (via the unique
      // index), so even if our local cache missed it, the request is still
      // safe to have sent — just surface nothing dramatic to the visitor.
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={liked || busy}
      aria-pressed={liked}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
        liked
          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300 cursor-default'
          : 'bg-zinc-100 dark:bg-zinc-800 hover:bg-pink-100 dark:hover:bg-pink-900/40 hover:text-pink-700 dark:hover:text-pink-300'
      }`}
    >
      <span>{liked ? '❤️' : '🤍'}</span>
      <span>{count}</span>
    </button>
  );
}
