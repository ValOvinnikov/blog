const CRAWLER_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|archiver|facebookexternalhit|embedly|preview|lighthouse|headless/i;

export const isCrawler = (userAgent: string | null): boolean =>
  !userAgent || CRAWLER_USER_AGENT_PATTERN.test(userAgent);
