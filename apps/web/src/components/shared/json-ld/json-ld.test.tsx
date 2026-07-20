import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { JsonLd } from './json-ld';

describe(`<${JsonLd.name}/>`, () => {
  it('renders a script tag of type application/ld+json with the serialized schema', () => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: 'Hello world',
    };

    const { container } = render(<JsonLd schema={schema} />);

    const script = container.querySelector('script');
    expect(script).toHaveAttribute('type', 'application/ld+json');
    expect(script?.innerHTML).toBe(JSON.stringify(schema));
  });

  it('escapes </script> sequences in string fields to prevent premature tag closure', () => {
    const schema = { description: '</script><script>alert(1)</script>' };

    const { container } = render(<JsonLd schema={schema} />);

    const script = container.querySelector('script');
    expect(script?.innerHTML).not.toContain('</script>');
    expect(script?.innerHTML).toContain('\\u003c/script\\u003e');
  });

  it('escapes a bare ampersand', () => {
    const schema = { description: 'Tom & Jerry' };

    const { container } = render(<JsonLd schema={schema} />);

    const script = container.querySelector('script');
    expect(script?.innerHTML).toBe('{"description":"Tom \\u0026 Jerry"}');
  });
});
