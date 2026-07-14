import Anthropic from '@anthropic-ai/sdk';
import { env } from '../../config/env';

// Bonus feature — AI Resume Matching.
// Scores a candidate against a job using Claude. Degrades gracefully to a
// keyword-overlap heuristic when no ANTHROPIC_API_KEY is configured, so the
// endpoint always returns a result and the app runs without a key.

interface MatchInput {
  jobTitle: string;
  jobDescription: string;
  jobSkills: string[];
  candidateSkills: string[];
  resumeText?: string;
}

export interface MatchResult {
  score: number; // 0-100
  summary: string;
  matchedSkills?: string[];
  missingSkills?: string[];
}

const client = env.anthropic.apiKey
  ? new Anthropic({ apiKey: env.anthropic.apiKey })
  : null;

// Deterministic fallback: skill overlap. Used when Claude isn't configured.
function heuristicMatch(input: MatchInput): MatchResult {
  const jobSkills = input.jobSkills.map((s) => s.toLowerCase());
  const haystack = [
    ...input.candidateSkills.map((s) => s.toLowerCase()),
    (input.resumeText ?? '').toLowerCase(),
  ].join(' ');

  const matched = jobSkills.filter((s) => haystack.includes(s));
  const missing = jobSkills.filter((s) => !haystack.includes(s));
  const score = jobSkills.length
    ? Math.round((matched.length / jobSkills.length) * 100)
    : 50;

  return {
    score,
    summary: `Heuristic match: candidate covers ${matched.length}/${jobSkills.length} required skills.`,
    matchedSkills: matched,
    missingSkills: missing,
  };
}

export const aiService = {
  isEnabled: () => client !== null,

  async matchResume(input: MatchInput): Promise<MatchResult | null> {
    if (!client) return heuristicMatch(input);

    const prompt = `You are an expert technical recruiter. Score how well a candidate matches a job.

JOB TITLE: ${input.jobTitle}
JOB DESCRIPTION: ${input.jobDescription}
REQUIRED SKILLS: ${input.jobSkills.join(', ') || 'not specified'}

CANDIDATE SKILLS: ${input.candidateSkills.join(', ') || 'not specified'}
CANDIDATE RESUME:
${input.resumeText ? input.resumeText.slice(0, 8000) : '(no resume text provided)'}

Return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{"score": <integer 0-100>, "summary": "<2-3 sentence assessment>", "matchedSkills": ["..."], "missingSkills": ["..."]}`;

    try {
      const response = await client.messages.create({
        model: env.anthropic.model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();

      // Strip accidental code fences, then parse.
      const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
      const parsed = JSON.parse(cleaned) as MatchResult;
      return {
        score: Math.max(0, Math.min(100, Math.round(parsed.score))),
        summary: parsed.summary,
        matchedSkills: parsed.matchedSkills ?? [],
        missingSkills: parsed.missingSkills ?? [],
      };
    } catch (err) {
      // On any AI failure, fall back to the heuristic rather than blocking the apply.
      // eslint-disable-next-line no-console
      console.warn('[aiService] Claude matching failed, using heuristic:', (err as Error).message);
      return heuristicMatch(input);
    }
  },
};
