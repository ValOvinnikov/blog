import { JSON_LD_SCRIPT_TEST_ID } from '@web/constants/json-ld';
import { customRender, screen } from '@web/testing/custom-render';

import { JsonLd } from './json-ld';

const setup = customRender(JsonLd, { schema: {} });

const TEXT_OPTIONS = { normalizeWhitespace: false };

describe(`<${JsonLd.name}/>`, () => {
  it('renders the serialized schema in an application/ld+json script', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello world',
    };

    setup({ schema });

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script).toHaveTextContent(JSON.stringify(schema), TEXT_OPTIONS);
  });

  it.each([
    {
      title: 'a closing script tag',
      schema: { description: '</script><script>alert(1)</script>' },
      serialized:
        '{"description":"\\u003c/script\\u003e\\u003cscript\\u003ealert(1)\\u003c/script\\u003e"}',
    },
    {
      title: 'a bare ampersand',
      schema: { description: 'Tom & Jerry' },
      serialized: '{"description":"Tom \\u0026 Jerry"}',
    },
  ])('escapes $title so the script cannot be broken out of', (testCase) => {
    const { schema, serialized } = testCase;

    setup({ schema });

    const script = screen.getByTestId(JSON_LD_SCRIPT_TEST_ID);
    expect(script).toHaveTextContent(serialized, TEXT_OPTIONS);
  });
});
