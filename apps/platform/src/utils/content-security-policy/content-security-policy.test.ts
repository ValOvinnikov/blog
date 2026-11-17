import { buildContentSecurityPolicy } from './content-security-policy';

const SCRIPT_SRC = 'script-src';
const UNSAFE_EVAL = "'unsafe-eval'";
const FRAME_SRC = 'frame-src';
const FRAME_ANCESTORS = 'frame-ancestors';

const parseDirectives = (policy: string): Record<string, string[]> =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ');
      return [name, values];
    }),
  );

describe(buildContentSecurityPolicy, () => {
  it('keeps unsafe-eval out of script-src in production', () => {
    const directives = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );

    expect(directives[SCRIPT_SRC]).not.toContain(UNSAFE_EVAL);
  });

  it('adds only unsafe-eval to script-src in dev', () => {
    const { [SCRIPT_SRC]: prodScriptSrc, ...prodRest } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );
    const { [SCRIPT_SRC]: devScriptSrc, ...devRest } = parseDirectives(
      buildContentSecurityPolicy({ isDev: true }),
    );

    expect(devScriptSrc).toEqual([...(prodScriptSrc ?? []), UNSAFE_EVAL]);
    expect(devRest).toEqual(prodRest);
  });

  it('lets a draft preview frame any https site and changes nothing else', () => {
    const { [FRAME_SRC]: siteFrameSrc, ...siteRest } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false }),
    );
    const { [FRAME_SRC]: previewFrameSrc, ...previewRest } = parseDirectives(
      buildContentSecurityPolicy({ isDev: false, canFrameAnySecureSite: true }),
    );

    expect(previewFrameSrc).toEqual(['https:']);
    expect(siteFrameSrc).not.toContain('https:');
    expect(previewRest).toEqual(siteRest);
    expect(previewRest[FRAME_ANCESTORS]).toEqual(["'none'"]);
  });
});
