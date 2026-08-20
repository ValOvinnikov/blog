import type { TModulePageContext } from '@blog/config';
import { customRenderAsync, screen } from '@web/testing/custom-render';

import { ModuleRenderer } from './module-renderer';

const { ctaModuleMock } = vi.hoisted(() => ({
  ctaModuleMock: vi.fn(({ id }: { id: string; locale: string }) => (
    <div data-testid="stub-cta">{id}</div>
  )),
}));

vi.mock('./module-map', () => ({
  MODULE_MAP: {
    module_postList: undefined,
    module_content: undefined,
    module_cta: ctaModuleMock,
  },
}));

const setup = customRenderAsync(ModuleRenderer, {
  modules: [{ type: 'module_cta', id: 'cta-doc-id' }],
  locale: 'en',
});

describe('ModuleRenderer', () => {
  beforeEach(() => {
    ctaModuleMock.mockClear();
  });

  it('renders the mapped component for a known module type with its id', async () => {
    await setup();

    expect(screen.getByTestId('stub-cta')).toHaveTextContent('cta-doc-id');
  });

  it('forwards the page context to every module component', async () => {
    const context: TModulePageContext = { type: 'BLOG', isPaginated: false };

    await setup({ context });

    expect(ctaModuleMock).toHaveBeenCalledWith({
      id: 'cta-doc-id',
      locale: 'en',
      context,
    });
  });

  it('renders modules with an undefined context when the caller omits one', async () => {
    await setup();

    expect(ctaModuleMock).toHaveBeenCalledWith({
      id: 'cta-doc-id',
      locale: 'en',
      context: undefined,
    });
  });

  it('renders nothing for an unknown module type and warns', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const { container } = await setup({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      modules: [{ type: 'module_unknown' as any, id: 'x-id' }],
    });

    expect(container).toBeEmptyDOMElement();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
