import React, { useEffect, useState } from 'react';
import { api } from '../lib/api';

export default function Experience() {
  const [activeTab, setActiveTab] = useState('all');

  const timelineData = [
    {
      id: 1,
      role: "Full Stack Developer",
      company: "Mississippi Coding Academy",
      period: "January 2026 - Present",
      type: "work",
      description: "Designed, tested, and shipped fluid client portals using Node.js, Express, and fully controlled React forms.",
    },
    {
      id: 2,
      role: "Information Systems Technology Associate's Degree",
      company: "Hinds Community College",
      period: "2017 - 2019",
      type: "education",
      description: "Focused on computer hardware and software.",
    }
  ];

  const filteredTimeline = activeTab === 'all'
    ? timelineData
    : timelineData.filter(item => item.type === activeTab);

  // Skills now live in MongoDB; search and sort are handled server-side via query params.
  const [skills, setSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('category');
  const [order, setOrder] = useState('asc');

  useEffect(() => {
    let cancelled = false;
    setSkillsLoading(true);
    const timeoutId = setTimeout(() => {
      api
        .listSkills({ search, sort, order })
        .then((data) => {
          if (!cancelled) setSkills(data);
        })
        .catch((err) => {
          if (!cancelled) setSkillsError(err.message);
        })
        .finally(() => {
          if (!cancelled) setSkillsLoading(false);
        });
    }, 250); // debounce search keystrokes

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [search, sort, order]);

  // Group flat skill list by category for display, preserving server-provided order.
  const skillsByCategory = skills.reduce((acc, skill) => {
    (acc[skill.category] ||= []).push(skill);
    return acc;
  }, {});

  return (
    <div className="space-y-12">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold mb-2">Growth & Competencies</h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          A dynamic record of my professional timeline and technical stack.
        </p>
      </div>

      {/* Technical Skills — searchable & sortable, backed by MongoDB */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h3 className="text-xl font-semibold">Technical Skills</h3>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search skills..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="category">Sort: Category</option>
              <option value="name">Sort: Name</option>
              <option value="level">Sort: Level</option>
            </select>
            <button
              type="button"
              onClick={() => setOrder((o) => (o === 'asc' ? 'desc' : 'asc'))}
              className="px-3 py-1.5 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
              aria-label="Toggle sort direction"
            >
              {order === 'asc' ? '↑ Asc' : '↓ Desc'}
            </button>
          </div>
        </div>

        {skillsLoading && <p className="text-sm text-zinc-500">Loading skills...</p>}
        {skillsError && <p className="text-sm text-red-500">Couldn't load skills: {skillsError}</p>}

        <div
          className="grid gap-6"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}
        >
          {Object.entries(skillsByCategory).map(([category, items]) => (
            <div
              key={category}
              className="p-5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-800/30"
            >
              <h4 className="font-bold text-blue-600 dark:text-blue-400 mb-3">{category}</h4>
              <div className="flex flex-wrap gap-2">
                {items.map(item => (
                  <span
                    key={item._id}
                    title={`Level: ${item.level}`}
                    className="px-2 py-1 text-xs font-mono bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded"
                  >
                    {item.name}
                  </span>
                ))}
              </div>
            </div>
          ))}
          {!skillsLoading && !skillsError && skills.length === 0 && (
            <p className="text-zinc-500 text-sm">No skills match "{search}".</p>
          )}
        </div>
      </section>

      <hr className="border-zinc-200 dark:border-zinc-800" />

      {/* Interactive Timeline Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-xl font-semibold">Interactive Timeline</h3>

          {/* Tab Filters */}
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg text-sm self-stretch sm:self-auto">
            {['all', 'work', 'education'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md capitalize transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-zinc-750 shadow-sm font-semibold'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-105'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Timeline Layout */}
        <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-8">
          {filteredTimeline.map((item) => (
            <div key={item.id} className="relative group">
              <span className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase">
                {item.period}
              </span>
              <h4 className="text-lg font-bold mt-1">{item.role}</h4>
              <h5 className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-2">
                {item.company}
              </h5>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
