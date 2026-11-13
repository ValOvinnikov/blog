import { faker } from '@faker-js/faker';
import { renderMarkPng } from '@platform/server/icons/render-mark-png';
import { toIco } from '@platform/server/icons/to-ico';

import { GET } from './route';

vi.mock('@platform/server/icons/render-mark-png', () => ({
  renderMarkPng: vi.fn(),
}));

faker.seed(7308);

const MOCK_PNG = Uint8Array.from([faker.number.int({ min: 0, max: 255 })]);

describe(GET, () => {
  beforeEach(() => {
    vi.mocked(renderMarkPng).mockImplementation(
      () => new Response(MOCK_PNG) as ReturnType<typeof renderMarkPng>,
    );
  });

  it('serves every rendered size of the S box as one icon file', async () => {
    const response = await GET();
    const bytes = new Uint8Array(await response.arrayBuffer());
    const renderedSides = vi
      .mocked(renderMarkPng)
      .mock.calls.map(([side]) => side);
    const expected = toIco(
      renderedSides.map((side) => ({ side, png: MOCK_PNG })),
    );

    expect(response.headers.get('content-type')).toBe('image/x-icon');
    expect(bytes).toEqual(expected);
  });
});
