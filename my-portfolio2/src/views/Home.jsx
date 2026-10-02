import React, { useEffect, useState } from 'react';
import useTheme from '../components/useTheme';
import { api } from '../lib/api';
import profileImg from '../assets/profile.jpg';
import LikeButton from '../components/LikeButton';

export default function Home() {
  const { isDark, toggleTheme } = useTheme();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .listProjects()
      .then((data) => {
        if (!cancelled) setProjects(data.filter((p) => p.featured));
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="flex flex-col items-center justify-center text-center py-20 animate-fade-in">
      <div className="flex flex-col gap-2 mb-2">
        <h1 className="text-5xl font-extrabold tracking-tight mb-2">
          Hi, I'm <span className="text-blue-600 dark:text-blue-400">Adrianne Rhodes</span>
        </h1>
        <p className="text-xl max-w-2xl mb-2 text-zinc-600 dark:text-zinc-400">
          A passionate Full Stack Developer dedicated to building high-performance web applications.
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          {['HTML', 'CSS', 'React', 'Node.js', 'TailwindCSS', 'JavaScript', 'Git'].map((tech) => (
            <span key={tech} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 rounded-full font-mono text-sm">
              {tech}
            </span>
          ))}
        </div>
        <button
          onClick={toggleTheme}
          className="mt-4 mx-auto px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:opacity-80 transition text-sm"
        >
          {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
        </button>
      </div>

      <section className="mb-2 w-full max-w-4xl mx-auto py-10 px-6 flex flex-col md:flex-row items-center gap-10 text-left">
        <div className="w-48 h-48 shadow-lg flex-shrink-0 overflow-hidden">
          <img
            src={profileImg}
            alt="Portrait of Adrianne Rhodes"
            className="w-full h-full rounded-full object-cover block"
          />
        </div>
        <div>
          <h2 className="text-3xl font-bold mb-4">About Me</h2>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed">
            I'm Adrianne, a Full Stack Developer who loves turning ideas into
            clean, functional web applications. When I'm not coding, you'll
            find me exploring new frameworks, contributing to side projects,
            or refining my craft one commit at a time.
          </p>
        </div>
      </section>

      <section className="w-full max-w-4xl mx-auto py-10 px-6 text-left">
        <h2 className="text-3xl font-bold mb-6">Featured Projects</h2>

        {loading && <p>Loading featured projects...</p>}
        {error && <p className="text-red-500">Couldn't load featured projects: {error}</p>}

        <div className="space-y-8">
          {projects.map((project) => (
            <div key={project._id} className="flex flex-col md:flex-row items-center gap-10">
              {project.imageUrl && (
                <a
                  href={project.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-shrink-0 block rounded-xl overflow-hidden shadow-lg w-full md:w-80 hover:shadow-xl transition-shadow"
                >
                  <img src={project.imageUrl} alt={`${project.title} preview`} className="w-full h-auto" />
                </a>
              )}
              <div className="flex-1">
                <h3 className="text-xl font-semibold mb-2">
                  {project.url ? (
                    <a href={project.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>
                <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed mb-3">
                  {project.description}
                </p>
                <div className="flex items-center gap-3">
                  <LikeButton projectId={project._id} initialCount={project.likeCount} />
                  {project.tags?.map((tag) => (
                    <span key={tag} className="px-2 py-1 text-xs font-mono bg-zinc-100 dark:bg-zinc-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {!loading && !error && projects.length === 0 && (
            <p className="text-zinc-500">No featured projects yet.</p>
          )}
        </div>
      </section>
    </section>
  );
}
