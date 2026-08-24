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
      'img-src': "'self' https://*.blob.vercel-storage.com https://authjs.dev",
      'script-src': "'self' 'unsafe-inline'",
      'style-src': "'self' 'unsafe-inline'",
      'font-src': "'self'",
      'connect-src': "'self'",
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
      "'self' https://*.blob.vercel-storage.com https://authjs.dev",
    );
  });

  it('allows the built-in Auth.js sign-in page to load provider logos from authjs.dev', () => {
    const { 'img-src': imgSrc } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(imgSrc).toContain('https://authjs.dev');
  });
});
