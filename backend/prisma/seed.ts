import { PrismaClient, WorkMode, EmploymentType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database…');

  const passwordHash = await bcrypt.hash('Password@123', 12);

  // --- Companies ---
  const acme = await prisma.company.upsert({
    where: { name: 'Acme Corp' },
    update: {},
    create: {
      name: 'Acme Corp',
      website: 'https://acme.example.com',
      description: 'A leading widget manufacturer.',
      location: 'Bengaluru, India',
    },
  });
  const globex = await prisma.company.upsert({
    where: { name: 'Globex' },
    update: {},
    create: {
      name: 'Globex',
      website: 'https://globex.example.com',
      description: 'Global technology solutions.',
      location: 'Remote',
    },
  });

  // --- Users ---
  const admin = await prisma.user.upsert({
    where: { email: 'admin@jobportal.dev' },
    update: {},
    create: {
      email: 'admin@jobportal.dev',
      name: 'Platform Admin',
      role: 'ADMIN',
      passwordHash,
    },
  });

  const employer = await prisma.user.upsert({
    where: { email: 'employer@jobportal.dev' },
    update: {},
    create: {
      email: 'employer@jobportal.dev',
      name: 'Emma Employer',
      role: 'EMPLOYER',
      passwordHash,
      companyId: acme.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'candidate@jobportal.dev' },
    update: {},
    create: {
      email: 'candidate@jobportal.dev',
      name: 'Charlie Candidate',
      role: 'CANDIDATE',
      passwordHash,
      headline: 'Full Stack Developer',
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL'],
      location: 'Bengaluru, India',
    },
  });

  // --- Jobs ---
  const jobs = [
    {
      title: 'Senior Full Stack Engineer',
      description:
        'Build and scale our web platform using React, Node.js and PostgreSQL. ' +
        'Own features end to end and mentor junior engineers.',
      location: 'Bengaluru, India',
      workMode: WorkMode.HYBRID,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 2500000,
      salaryMax: 4000000,
      experienceMin: 4,
      experienceMax: 8,
      skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'AWS'],
      benefits: ['Health insurance', 'Stock options', 'Flexible hours'],
      companyId: acme.id,
    },
    {
      title: 'Frontend Engineer (React)',
      description:
        'Craft delightful UIs with React and Tailwind CSS. Collaborate closely with design.',
      location: 'Remote',
      workMode: WorkMode.REMOTE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 1800000,
      salaryMax: 2800000,
      experienceMin: 2,
      experienceMax: 5,
      skills: ['React', 'Tailwind CSS', 'JavaScript', 'CSS'],
      benefits: ['Remote-first', 'Learning budget'],
      companyId: globex.id,
    },
    {
      title: 'Backend Engineer (Node.js)',
      description: 'Design robust REST APIs and data models. Experience with Prisma a plus.',
      location: 'Pune, India',
      workMode: WorkMode.ONSITE,
      employmentType: EmploymentType.FULL_TIME,
      salaryMin: 2000000,
      salaryMax: 3200000,
      experienceMin: 3,
      experienceMax: 6,
      skills: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Docker'],
      benefits: ['Health insurance', 'Relocation support'],
      companyId: acme.id,
    },
  ];

  for (const job of jobs) {
    const exists = await prisma.job.findFirst({
      where: { title: job.title, companyId: job.companyId },
    });
    if (!exists) {
      await prisma.job.create({ data: { ...job, postedById: employer.id } });
    }
  }

  console.log('✅ Seed complete.');
  console.log('   Admin     : admin@jobportal.dev / Password@123');
  console.log('   Employer  : employer@jobportal.dev / Password@123');
  console.log('   Candidate : candidate@jobportal.dev / Password@123');
  console.log(`   Admin id  : ${admin.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
