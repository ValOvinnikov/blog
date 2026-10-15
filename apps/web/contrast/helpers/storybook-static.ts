import { existsSync, readFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

import type { Page, Route } from '@playwright/test';

export const STORYBOOK_ORIGIN = 'http://storybook.contrast';

const STORYBOOK_DIR = join(import.meta.dirname, '../../storybook-static');
const BRIGHT_PHOTO = readFileSync(
  join(import.meta.dirname, '../fixtures/bright-photo.png'),
);
const SANITY_CDN_ORIGIN = 'https://cdn.sanity.io/';
const MODULE_STORY_PATH_PREFIX = './src/modules/';

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.woff2': 'font/woff2',
};

type TIndexEntry = { type: string; id: string; importPath: string };

export const listModuleStoryIds = (): string[] => {
  const indexPath = join(STORYBOOK_DIR, 'index.json');
  if (!existsSync(indexPath)) {
    throw new Error(
      'storybook-static/index.json is missing — run `pnpm --filter web storybook:build` first.',
    );
  }
  const { entries } = JSON.parse(readFileSync(indexPath, 'utf8')) as {
    entries: Record<string, TIndexEntry>;
  };
  return Object.values(entries)
    .filter(
      ({ type, importPath }) =>
        type === 'story' && importPath.startsWith(MODULE_STORY_PATH_PREFIX),
    )
    .map(({ id }) => id)
    .sort();
};

const fulfilFromStorybook = async (route: Route, pathname: string) => {
  const relativePath = normalize(decodeURIComponent(pathname)).replace(
    /^(\.\.[/\\])+/,
    '',
  );
  const filePath = join(STORYBOOK_DIR, relativePath);
  if (!filePath.startsWith(STORYBOOK_DIR) || !existsSync(filePath)) {
    await route.fulfill({ status: 404 });
    return;
  }
  await route.fulfill({
    body: readFileSync(filePath),
    contentType: CONTENT_TYPES[extname(filePath)] ?? 'application/octet-stream',
  });
};

export const serveStorybookStatic = async (page: Page) => {
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === STORYBOOK_ORIGIN) {
      await fulfilFromStorybook(route, url.pathname);
      return;
    }
    if (url.href.startsWith(SANITY_CDN_ORIGIN)) {
      await route.fulfill({ body: BRIGHT_PHOTO, contentType: 'image/png' });
      return;
    }
    await route.abort();
  });
};
