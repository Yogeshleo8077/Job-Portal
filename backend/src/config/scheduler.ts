import cron from 'node-cron';
import { env } from './env';
import { scraperService } from '../modules/scraper/scraper.service';

// Bonus (Module 6): schedule scraping every 6 hours.
// Enabled only when SCRAPER_ENABLE_CRON=true so local/dev runs stay quiet.
export function startScheduler() {
  if (!env.scraper.enableCron) return;

  if (!cron.validate(env.scraper.cronExpression)) {
    // eslint-disable-next-line no-console
    console.warn(`[scheduler] invalid cron expression: ${env.scraper.cronExpression}`);
    return;
  }

  cron.schedule(env.scraper.cronExpression, async () => {
    // eslint-disable-next-line no-console
    console.log('[scheduler] running scheduled scrape…');
    try {
      const reports = await scraperService.run();
      const added = reports.reduce((n, r) => n + r.added, 0);
      // eslint-disable-next-line no-console
      console.log(`[scheduler] scrape complete — ${added} new jobs`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[scheduler] scrape failed:', (err as Error).message);
    }
  });

  // eslint-disable-next-line no-console
  console.log(`[scheduler] scraper cron enabled: ${env.scraper.cronExpression}`);
}
