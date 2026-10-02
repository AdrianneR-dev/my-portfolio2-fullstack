import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';
import useAuth from '../context/useAuth';

export default function Guestbook() {
  const { isAdmin } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await api.listMessages();
      setMessages(data);
    } catch (err) {
      setError(err.message || 'Failed to load messages.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      const created = await api.createMessage({ name, message });
      setMessages((prev) => [created, ...prev]);
      setName('');
      setMessage('');
    } catch (err) {
      setFormError(err.message || 'Could not post your message.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMessage(id);
      setMessages((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      setError(err.message || 'Could not delete message.');
    }
  }

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Guestbook</h2>

      <form onSubmit={handleSubmit} className="mb-10 space-y-3 max-w-lg">
        <input
          type="text"
          placeholder="Your name"
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Leave a message…"
          required
          maxLength={1000}
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {formError && <p className="text-red-500 text-sm">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition disabled:opacity-60"
        >
          {submitting ? 'Posting…' : 'Post message'}
        </button>
      </form>

      {loading && <p>Loading messages...</p>}
      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {messages.map((m) => (
          <div key={m._id} className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl flex justify-between gap-4">
            <div>
              <p className="font-semibold">{m.name}</p>
              <p className="text-zinc-600 dark:text-zinc-400">{m.message}</p>
              <p className="text-xs text-zinc-400 mt-1">{new Date(m.createdAt).toLocaleString()}</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => handleDelete(m._id)}
                className="text-xs text-red-500 hover:underline shrink-0 h-fit"
              >
                Delete
              </button>
            )}
          </div>
        ))}
        {!loading && messages.length === 0 && (
          <p className="text-zinc-500">No messages yet — be the first to say hi.</p>
        )}
      </div>
    </div>
  );
}
