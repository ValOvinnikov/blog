import { buildContentSecurityPolicy } from './content-security-policy';

const parseDirectives = (policy: string): Record<string, string> =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ');
      return [name, values.join(' ')];
    }),
  );

describe(buildContentSecurityPolicy, () => {
  it('sets every directive to its expected value in production', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(directives).toEqual({
      'default-src': "'self'",
      'img-src':
        "'self' https://*.blob.vercel-storage.com https://authjs.dev https://cdn.sanity.io",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'font-src': "'self'",
      'connect-src': "'self' https://*.api.sanity.io https://sanity-cdn.com",
      'frame-ancestors': "'none'",
      'base-uri': "'self'",
      'form-action': "'self' https://github.com https://accounts.google.com",
      'object-src': "'none'",
    });
  });

  it('adds unsafe-eval to script-src in dev only, leaving every other directive unchanged', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy({ isDev: true }),
    );

    expect(directives['script-src']).toBe(
      "'self' 'unsafe-inline' 'unsafe-eval'",
    );
    expect(directives['img-src']).toBe(
      "'self' https://*.blob.vercel-storage.com https://authjs.dev https://cdn.sanity.io",
    );
  });

  it('allows the built-in Auth.js sign-in page to load provider logos from authjs.dev', () => {
    const { 'img-src': imgSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(imgSrc).toContain('https://authjs.dev');
  });

  it('allows the embedded Studio to reach cdn.sanity.io for asset previews and any tenant project host for data', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(directives['img-src']).toContain('https://cdn.sanity.io');
    expect(directives['connect-src']).toContain('https://*.api.sanity.io');
  });

  it('allows the embedded Studio to reach sanity-cdn.com for its own version check', () => {
    const { 'connect-src': connectSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(connectSrc).toContain('https://sanity-cdn.com');
  });
});
