import { prisma } from '../../config/prisma';

// Module 5 — Job Scraping.
// Sources are public JSON feeds that explicitly permit automated access:
//   - RemoteOK   : https://remoteok.com/api        (public jobs API)
//   - Arbeitnow  : https://www.arbeitnow.com/api/job-board-api  (public feed)
// We store source, URL, company, title, location, description, skills, posted date,
// and prevent duplicates via a unique constraint on sourceUrl (upsert on conflict).

export interface ScrapeReport {
  source: string;
  fetched: number;
  added: number;
  duplicatesSkipped: number;
  errors: string[];
}

interface NormalizedJob {
  source: string;
  sourceUrl: string;
  externalId?: string;
  title: string;
  company: string;
  location?: string;
  description?: string;
  skills: string[];
  postedDate?: Date;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'JobPortalScraper/1.0 (+assessment)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

// --- RemoteOK ---
async function scrapeRemoteOK(): Promise<NormalizedJob[]> {
  const data = (await fetchJson('https://remoteok.com/api')) as any[];
  // First element is legal/metadata; skip it.
  return data
    .filter((row) => row && row.id && row.position)
    .map((row) => ({
      source: 'remoteok',
      sourceUrl: row.url ?? `https://remoteok.com/remote-jobs/${row.id}`,
      externalId: String(row.id),
      title: row.position,
      company: row.company ?? 'Unknown',
      location: row.location || 'Remote',
      description: typeof row.description === 'string' ? row.description : undefined,
      skills: Array.isArray(row.tags) ? row.tags.slice(0, 20) : [],
      postedDate: row.date ? new Date(row.date) : undefined,
    }));
}

// --- Arbeitnow ---
async function scrapeArbeitnow(): Promise<NormalizedJob[]> {
  const data = (await fetchJson('https://www.arbeitnow.com/api/job-board-api')) as {
    data?: any[];
  };
  return (data.data ?? [])
    .filter((row) => row && row.slug && row.title)
    .map((row) => ({
      source: 'arbeitnow',
      sourceUrl: row.url ?? `https://www.arbeitnow.com/view/${row.slug}`,
      externalId: row.slug,
      title: row.title,
      company: row.company_name ?? 'Unknown',
      location: row.location || (row.remote ? 'Remote' : undefined),
      description: typeof row.description === 'string' ? row.description : undefined,
      skills: Array.isArray(row.tags) ? row.tags.slice(0, 20) : [],
      postedDate: row.created_at ? new Date(row.created_at * 1000) : undefined,
    }));
}

const SOURCES: Record<string, () => Promise<NormalizedJob[]>> = {
  remoteok: scrapeRemoteOK,
  arbeitnow: scrapeArbeitnow,
};

async function persist(jobs: NormalizedJob[], report: ScrapeReport) {
  for (const job of jobs) {
    try {
      const existing = await prisma.scrapedJob.findUnique({
        where: { sourceUrl: job.sourceUrl },
      });
      if (existing) {
        report.duplicatesSkipped += 1;
        continue;
      }
      await prisma.scrapedJob.create({ data: job });
      report.added += 1;
    } catch (err) {
      report.errors.push(`${job.sourceUrl}: ${(err as Error).message}`);
    }
  }
}

export const scraperService = {
  availableSources: () => Object.keys(SOURCES),

  // Scrape one or all sources. Returns a per-source report.
  async run(sources?: string[]): Promise<ScrapeReport[]> {
    const selected = sources?.length
      ? sources.filter((s) => s in SOURCES)
      : Object.keys(SOURCES);

    const reports: ScrapeReport[] = [];
    for (const source of selected) {
      const report: ScrapeReport = {
        source,
        fetched: 0,
        added: 0,
        duplicatesSkipped: 0,
        errors: [],
      };
      try {
        const jobs = await SOURCES[source]();
        report.fetched = jobs.length;
        await persist(jobs, report);
      } catch (err) {
        report.errors.push((err as Error).message);
      }
      reports.push(report);
    }
    return reports;
  },

  async list(page = 1, limit = 20, search?: string) {
    const where = search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' as const } },
            { company: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [total, data] = await Promise.all([
      prisma.scrapedJob.count({ where }),
      prisma.scrapedJob.findMany({
        where,
        orderBy: { scrapedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);
    return { data, total };
  },
};
