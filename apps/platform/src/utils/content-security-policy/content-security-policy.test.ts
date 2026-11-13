import { buildContentSecurityPolicy } from './content-security-policy';

const SCRIPT_SRC = 'script-src';
const FRAME_SRC = 'frame-src';
const STRIPE_JS_ORIGIN = 'https://js.stripe.com';
const UNSAFE_EVAL = "'unsafe-eval'";

const parseDirectives = (policy: string): Record<string, string[]> =>
  Object.fromEntries(
    policy.split('; ').map((directive) => {
      const [name, ...values] = directive.split(' ');
      return [name, values];
    }),
  );

describe(buildContentSecurityPolicy, () => {
  describe('in production', () => {
    let directives: Record<string, string[]>;

    beforeEach(() => {
      directives = parseDirectives(
        buildContentSecurityPolicy({ isDev: false }),
      );
    });

    it('keeps unsafe-eval out of script-src', () => {
      expect(directives[SCRIPT_SRC]).not.toContain(UNSAFE_EVAL);
    });

    it('allows Stripe.js and its Checkout frame for the Upgrade page', () => {
      expect(directives[SCRIPT_SRC]).toContain(STRIPE_JS_ORIGIN);
      expect(directives[FRAME_SRC]).toContain(STRIPE_JS_ORIGIN);
    });
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
});
