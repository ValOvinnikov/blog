import { customRenderAsync, screen } from '@web/testing/custom-render';

import { CtaModule } from './cta-module';

const { getCtaMock } = vi.hoisted(() => ({
  getCtaMock: vi.fn(),
}));

vi.mock('@blog/service', () => ({
  service: {
    modules: {
      cta: { v1: { getCta: getCtaMock } },
    },
  },
}));

const setup = customRenderAsync(CtaModule, { id: 'cta-1', locale: 'en' });

describe(CtaModule, () => {
  beforeEach(() => {
    getCtaMock.mockReset();
  });

  it('renders nothing when the fetch fails', async () => {
    getCtaMock.mockResolvedValue({ ok: false, error: new Error('boom') });

    const { container } = await setup();

    expect(container).toBeEmptyDOMElement();
  });

  it('renders the heading with a unique id derived from the module id', async () => {
    getCtaMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Get started', text: undefined, action: undefined },
    });

    await setup();

    const heading = screen.getByRole('heading', {
      level: 2,
      name: 'Get started',
    });
    expect(heading).toHaveAttribute('id', 'cta-cta-1');

    const section = heading.closest('section');
    expect(section).toHaveAttribute('aria-labelledby', 'cta-cta-1');
  });

  it('derives a different heading id for a different module id, avoiding duplicate DOM ids', async () => {
    getCtaMock.mockResolvedValue({
      ok: true,
      data: { heading: 'Join us', text: undefined, action: undefined },
    });

    await setup({ id: 'cta-2' });

    const heading = screen.getByRole('heading', { level: 2, name: 'Join us' });
    expect(heading).toHaveAttribute('id', 'cta-cta-2');
  });
});
