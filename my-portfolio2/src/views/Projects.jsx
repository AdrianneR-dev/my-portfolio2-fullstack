import React, { useState } from 'react';
import { useFetch } from '../hooks/useFetch';

export default function Projects() {
  // Replace with your real GitHub username
  const { data: repos, loading, error } = useFetch('https://api.github.com/users/AdrianneR-dev/repos?sort=updated');
  const [search, setSearch] = useState('');

  const filteredRepos = repos?.filter(repo => 
    repo.name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">Repositories & Metrics</h2>
      <input
        type="text"
        placeholder="Search repositories..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md px-4 py-2 mb-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading && <p>Loading repositories...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {/* Implicit Grid layout handles all viewport sizes without media query overload */}
      <div className="grid gap-6" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
        {filteredRepos.map((repo) => (
          <div key={repo.id} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:shadow-zinc-400/40 dark:hover:shadow-black/60 hover:border-zinc-300 dark:hover:border-zinc-600">
            <div>
              <h3 className="text-xl font-semibold mb-2 truncate text-blue-600 dark:text-blue-400">
                <a href={repo.html_url} target="_blank" rel="noreferrer" className="hover:underline">{repo.name}</a>
              </h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 h-auto">
              {repo.description || "No description provided."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span>⭐ {repo.stargazers_count}</span>
              <span>🍴 {repo.forks_count}</span>
              {repo.language && <span className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded">{repo.language}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}