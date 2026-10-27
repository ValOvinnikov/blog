import { faker } from '@faker-js/faker';
import { MOCK_SVG_CIRCLE } from '@platform/testing/site-config/fixtures';

import { sanitizeSvgMarkup } from './sanitize-svg-markup';

faker.seed(5998);

const MOCK_ATTACKER_HOST = faker.internet.domainName();
const MOCK_SCRIPT_PAYLOAD = `alert(${faker.lorem.word()})`;
const MOCK_JSDOM_LOAD_ERROR = faker.lorem.words(3);
const PATH_TAG = '<path';
const JSDOM_MODULE = 'jsdom-commonjs';

const svg = (inner: string, attributes = '') =>
  `<svg viewBox="0 0 24 24"${attributes}>${inner}</svg>`;

describe(sanitizeSvgMarkup, () => {
  it.each([
    {
      scenario: 'an embedded script element',
      markup: svg(`<script>${MOCK_SCRIPT_PAYLOAD}</script>${MOCK_SVG_CIRCLE}`),
      removed: ['<script', MOCK_SCRIPT_PAYLOAD],
    },
    {
      scenario: 'an onload event-handler attribute',
      markup: svg(MOCK_SVG_CIRCLE, ` onload="${MOCK_SCRIPT_PAYLOAD}"`),
      removed: ['onload', MOCK_SCRIPT_PAYLOAD],
    },
    {
      scenario: 'a javascript: URI on an anchor href',
      markup: svg(
        `<a href="javascript:${MOCK_SCRIPT_PAYLOAD}">${MOCK_SVG_CIRCLE}</a>`,
      ),
      removed: ['javascript:'],
    },
    {
      scenario: 'a reference to an external origin',
      markup: svg(
        `<a href="https://${MOCK_ATTACKER_HOST}/track">${MOCK_SVG_CIRCLE}</a>`,
      ),
      removed: [MOCK_ATTACKER_HOST],
    },
    {
      scenario: 'an external url() in a presentation attribute',
      markup: svg(`<rect fill="url(https://${MOCK_ATTACKER_HOST}/t.png#x)"/>`),
      removed: [MOCK_ATTACKER_HOST, 'url('],
    },
    {
      scenario: 'an external url() in a style element',
      markup: svg(
        `<style>.a{fill:url(https://${MOCK_ATTACKER_HOST}/t.png)}</style><rect class="a" width="10" height="10"/>`,
      ),
      removed: [MOCK_ATTACKER_HOST, 'url('],
    },
  ])('strips $scenario', async ({ markup, removed }) => {
    const result = await sanitizeSvgMarkup(markup);

    for (const text of removed) {
      expect(result).not.toContain(text);
    }
  });

  it.each([
    {
      scenario: 'a benign SVG',
      markup: svg(MOCK_SVG_CIRCLE.replace('/>', ' fill="currentColor"/>')),
      kept: ['<circle', 'fill="currentColor"'],
    },
    {
      scenario: 'a same-document fragment reference',
      markup: svg(
        `<defs><linearGradient id="g"><stop offset="0" stop-color="red"/></linearGradient></defs><circle r="10" fill="url(#g)"/>`,
      ),
      kept: ['fill="url(#g)"'],
    },
    {
      scenario: 'a data: URI reference in a presentation attribute',
      markup: svg('<rect fill="url(data:image/svg+xml;base64,PHN2Zy8+)"/>'),
      kept: ['url(data:image/svg+xml;base64,PHN2Zy8+)'],
    },
    {
      scenario: 'a fragment url() inside a style element',
      markup: svg(
        '<style>.a{fill:url(#g)}</style><rect class="a" width="10" height="10"/>',
      ),
      kept: ['url(#g)'],
    },
  ])('keeps $scenario', async ({ markup, kept }) => {
    const result = await sanitizeSvgMarkup(markup);

    for (const text of kept) {
      expect(result).toContain(text);
    }
  });

  it('keeps the safe content around a stripped script element', async () => {
    const result = await sanitizeSvgMarkup(
      svg(`<script>${MOCK_SCRIPT_PAYLOAD}</script>${MOCK_SVG_CIRCLE}`),
    );

    expect(result).toContain('<circle');
  });

  it('returns undefined when nothing recognizable as an SVG survives', async () => {
    const result = await sanitizeSvgMarkup(faker.lorem.sentence());

    expect(result).toBeUndefined();
  });

  describe('loading the sanitiser', () => {
    afterEach(() => {
      vi.doUnmock(JSDOM_MODULE);
      vi.resetModules();
    });

    it('does not load jsdom until markup is sanitized', async () => {
      const loadJsdom = vi.fn();
      vi.resetModules();
      vi.doMock(JSDOM_MODULE, async (importOriginal) => {
        loadJsdom();
        return importOriginal();
      });

      const { sanitizeSvgMarkup: freshSanitize } =
        await import('./sanitize-svg-markup');
      expect(loadJsdom).not.toHaveBeenCalled();

      await freshSanitize(svg(''));
      expect(loadJsdom).toHaveBeenCalledOnce();
    });

    it('retries loading the sanitiser after a failed load', async () => {
      let attempts = 0;
      vi.resetModules();
      vi.doMock(JSDOM_MODULE, async (importOriginal) => {
        attempts += 1;
        if (attempts === 1) {
          throw new Error(MOCK_JSDOM_LOAD_ERROR);
        }
        return importOriginal();
      });

      const { sanitizeSvgMarkup: freshSanitize } =
        await import('./sanitize-svg-markup');
      const markup = svg(`${PATH_TAG} d="M0 0h24v24H0z"/>`);

      await expect(freshSanitize(markup)).rejects.toThrow();
      await expect(freshSanitize(markup)).resolves.toContain(PATH_TAG);
    });
  });
});
