import Link from 'next/link';

const features = [
  {
    title: 'Smart Job Search',
    body: 'Filter by skills, location, work mode, salary and experience with instant results.',
    icon: '🔍',
  },
  {
    title: 'For Employers',
    body: 'Post jobs, manage listings, and review applicants ranked by AI match score.',
    icon: '🏢',
  },
  {
    title: 'Job Aggregation',
    body: 'We scrape fresh roles from public sources so you never miss an opportunity.',
    icon: '🔄',
  },
  {
    title: 'AI Resume Matching',
    body: 'Every application is scored against the role using Claude for a smarter shortlist.',
    icon: '🤖',
  },
];

export default function HomePage() {
  return (
    <div className="space-y-16">
      <section className="pt-8 text-center">
        <span className="badge bg-brand-50 text-brand-700">AI-Ready Job Portal</span>
        <h1 className="mx-auto mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
          Find your next role. Hire the right people.
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          A full-stack job board with authentication, employer tools, job aggregation,
          and AI-powered resume matching.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/jobs" className="btn-primary">
            Browse Jobs
          </Link>
          <Link href="/register" className="btn-ghost">
            Create an account
          </Link>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <div key={f.title} className="card">
            <div className="text-3xl">{f.icon}</div>
            <h3 className="mt-3 font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-1 text-sm text-slate-600">{f.body}</p>
          </div>
        ))}
      </section>

      <section className="card bg-brand-600 text-center text-white">
        <h2 className="text-2xl font-bold">Ready to get started?</h2>
        <p className="mt-2 text-brand-100">
          Sign up as a candidate to apply, or as an employer to post jobs.
        </p>
        <div className="mt-5 flex justify-center gap-3">
          <Link href="/register" className="btn bg-white text-brand-700 hover:bg-brand-50">
            Sign up free
          </Link>
        </div>
      </section>
    </div>
  );
}
