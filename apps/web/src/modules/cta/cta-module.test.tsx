import { customRenderAsync } from '@web/testing/custom-render';

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
});
