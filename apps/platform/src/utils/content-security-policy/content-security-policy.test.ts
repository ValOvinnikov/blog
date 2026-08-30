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
        "'self' https://*.blob.vercel-storage.com https://authjs.dev https://cdn.sanity.io https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'font-src': "'self' https://design-system-static.sanity.io",
      'connect-src': "'self' https://*.sanity.io https://sanity-cdn.com",
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
      "'self' https://*.blob.vercel-storage.com https://authjs.dev https://cdn.sanity.io https://avatars.githubusercontent.com https://lh3.googleusercontent.com",
    );
  });

  it('allows the built-in Auth.js sign-in page to load provider logos from authjs.dev', () => {
    const { 'img-src': imgSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(imgSrc).toContain('https://authjs.dev');
  });

  it("allows the Studio's user menu to load the signed-in user's OAuth avatar from GitHub and Google", () => {
    const { 'img-src': imgSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(imgSrc).toContain('https://avatars.githubusercontent.com');
    expect(imgSrc).toContain('https://lh3.googleusercontent.com');
  });

  it('allows the embedded Studio to reach cdn.sanity.io for asset previews and any tenant project host for data', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(directives['img-src']).toContain('https://cdn.sanity.io');
    expect(directives['connect-src']).toContain('https://*.sanity.io');
  });

  it('allows the embedded Studio to reach sanity-cdn.com for its own version check', () => {
    const { 'connect-src': connectSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(connectSrc).toContain('https://sanity-cdn.com');
  });

  it('allows the embedded Studio to load its Inter webfont from design-system-static.sanity.io', () => {
    const { 'font-src': fontSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(fontSrc).toContain('https://design-system-static.sanity.io');
  });

  it('collapses every sanity.io subdomain into one wildcard entry, without enumerating api.sanity.io separately', () => {
    const { 'connect-src': connectSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(connectSrc).toBe(
      "'self' https://*.sanity.io https://sanity-cdn.com",
    );
  });
});
