import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Project } from '../src/models/Project.js';
import { Skill } from '../src/models/Skill.js';
import { User } from '../src/models/User.js';

// Ported from the previously-hardcoded "Featured Projects" section in
// src/views/Home.jsx and the skills groups in src/views/Experience.jsx.
const projectsSeed = [
  {
    title: 'Digital Store-front Capstone',
    description:
      "For this capstone project, I created a digital storefront for my e-commerce beauty brand, Salvg (pronounced Salvage) Beauty. This is a live demo — you can't purchase anything from this site.",
    url: 'https://adrianner-dev.github.io/TheDigitalStoreFrontCapstone/',
    imageUrl: '',
    tags: ['React', 'E-commerce', 'Capstone'],
    featured: true,
    order: 0,
  },
];

const skillsSeed = [
  { name: 'JavaScript (ES6+)', category: 'Languages', level: 'advanced', order: 0 },
  { name: 'HTML5/CSS3', category: 'Languages', level: 'advanced', order: 1 },
  { name: 'React', category: 'Frameworks & Libs', level: 'advanced', order: 0 },
  { name: 'Tailwind CSS', category: 'Frameworks & Libs', level: 'intermediate', order: 1 },
  { name: 'Node.js', category: 'Frameworks & Libs', level: 'intermediate', order: 2 },
  { name: 'Express', category: 'Frameworks & Libs', level: 'intermediate', order: 3 },
  { name: 'Git', category: 'Tools & Clouds', level: 'advanced', order: 0 },
  { name: 'MongoDB', category: 'Tools & Clouds', level: 'intermediate', order: 1 },
];

async function seedProjects() {
  for (const data of projectsSeed) {
    await Project.findOneAndUpdate({ title: data.title }, data, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[seed] upserted ${projectsSeed.length} project(s)`);
}

async function seedSkills() {
  for (const data of skillsSeed) {
    await Skill.findOneAndUpdate({ name: data.name }, data, { upsert: true, new: true, runValidators: true });
  }
  console.log(`[seed] upserted ${skillsSeed.length} skill(s)`);
}

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    console.log('[seed] SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD not set — skipping admin bootstrap.');
    return;
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`[seed] admin ${email} already exists — leaving as-is.`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email, passwordHash, role: 'admin' });
  console.log(`[seed] created admin user ${email}. Log in and change the password immediately.`);
}

async function main() {
  await connectDB();
  await seedProjects();
  await seedSkills();
  await seedAdmin();
  await disconnectDB();
  console.log('[seed] done.');
}

main().catch((err) => {
  console.error('[seed] failed:', err);
  process.exit(1);
});
