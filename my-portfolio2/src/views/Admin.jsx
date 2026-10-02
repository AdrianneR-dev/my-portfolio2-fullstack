import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

const emptyProject = { title: '', description: '', url: '', tags: '' };
const emptySkill = { name: '', category: 'Other', level: 'intermediate' };

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [skills, setSkills] = useState([]);
  const [newProject, setNewProject] = useState(emptyProject);
  const [newSkill, setNewSkill] = useState(emptySkill);
  const [error, setError] = useState('');

  async function loadAll() {
    try {
      const [p, s] = await Promise.all([api.listProjects(), api.listSkills()]);
      setProjects(p);
      setSkills(s);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleCreateProject(e) {
    e.preventDefault();
    setError('');
    try {
      const tags = newProject.tags.split(',').map((t) => t.trim()).filter(Boolean);
      await api.createProject({ ...newProject, tags });
      setNewProject(emptyProject);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteProject(id) {
    try {
      await api.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateSkill(e) {
    e.preventDefault();
    setError('');
    try {
      await api.createSkill(newSkill);
      setNewSkill(emptySkill);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDeleteSkill(id) {
    try {
      await api.deleteSkill(id);
      setSkills((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  const inputClass =
    'w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="space-y-12">
      <h2 className="text-3xl font-bold">Admin</h2>
      {error && <p className="text-red-500">{error}</p>}

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Projects</h3>
        <form onSubmit={handleCreateProject} className="grid gap-2 sm:grid-cols-2 max-w-2xl">
          <input className={inputClass} placeholder="Title" required value={newProject.title}
            onChange={(e) => setNewProject({ ...newProject, title: e.target.value })} />
          <input className={inputClass} placeholder="URL" value={newProject.url}
            onChange={(e) => setNewProject({ ...newProject, url: e.target.value })} />
          <textarea className={`${inputClass} sm:col-span-2`} placeholder="Description" required rows={2}
            value={newProject.description} onChange={(e) => setNewProject({ ...newProject, description: e.target.value })} />
          <input className={`${inputClass} sm:col-span-2`} placeholder="Tags (comma separated)" value={newProject.tags}
            onChange={(e) => setNewProject({ ...newProject, tags: e.target.value })} />
          <button type="submit" className="sm:col-span-2 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            Add project
          </button>
        </form>

        <div className="space-y-2">
          {projects.map((p) => (
            <div key={p._id} className="flex justify-between items-center p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium">{p.title}</p>
                <p className="text-xs text-zinc-500">❤️ {p.likeCount ?? 0}</p>
              </div>
              <button onClick={() => handleDeleteProject(p._id)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </section>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      <section className="space-y-4">
        <h3 className="text-xl font-semibold">Skills</h3>
        <form onSubmit={handleCreateSkill} className="grid gap-2 sm:grid-cols-3 max-w-2xl">
          <input className={inputClass} placeholder="Name" required value={newSkill.name}
            onChange={(e) => setNewSkill({ ...newSkill, name: e.target.value })} />
          <select className={inputClass} value={newSkill.category}
            onChange={(e) => setNewSkill({ ...newSkill, category: e.target.value })}>
            {['Languages', 'Frameworks & Libs', 'Tools & Clouds', 'Other'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select className={inputClass} value={newSkill.level}
            onChange={(e) => setNewSkill({ ...newSkill, level: e.target.value })}>
            {['beginner', 'intermediate', 'advanced', 'expert'].map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <button type="submit" className="sm:col-span-3 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition">
            Add skill
          </button>
        </form>

        <div className="space-y-2">
          {skills.map((s) => (
            <div key={s._id} className="flex justify-between items-center p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-zinc-500">{s.category} · {s.level}</p>
              </div>
              <button onClick={() => handleDeleteSkill(s._id)} className="text-xs text-red-500 hover:underline">Delete</button>
            </div>
          ))}
        </div>
      </section>

      <p className="text-sm text-zinc-500">Guestbook moderation (deleting messages) is on the <a href="/guestbook" className="underline">Guestbook</a> page.</p>
    </div>
  );
}
