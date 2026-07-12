import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ModuleRenderer } from './module-renderer';

vi.mock('./module-map', () => ({
  MODULE_MAP: {
    module_hero: undefined,
    module_postList: undefined,
    module_content: undefined,
    module_cta: ({ id }: { id: string; locale: string }) => (
      <div data-testid="stub-cta">{id}</div>
    ),
  },
}));

describe('ModuleRenderer', () => {
  it('renders the mapped component for a known module type with its id', async () => {
    const ui = await ModuleRenderer({
      modules: [{ key: 'cta-1', type: 'module_cta', id: 'cta-doc-id' }],
      locale: 'en',
    });

    render(<>{ui}</>);

    expect(screen.getByTestId('stub-cta')).toHaveTextContent('cta-doc-id');
  });

  it('renders nothing for an unknown module type and warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const ui = await ModuleRenderer({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: [{ key: 'x', type: 'module_unknown' as any, id: 'x-id' }],
      locale: 'en',
    });

    const { container } = render(<>{ui}</>);

    expect(container).toBeEmptyDOMElement();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
