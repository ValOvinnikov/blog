import { routes } from '@blog/config';
import { faker } from '@faker-js/faker';
import { CACHE_CONTROL } from '@web/constants/http';
import { mockDraftMode } from '@web/testing/server/preview/preview';
import { NextRequest } from 'next/server';

import { GET } from './route';

faker.seed(7182);

const { draftModeMock } = vi.hoisted(() => ({ draftModeMock: vi.fn() }));

vi.mock('next/headers', () => ({ draftMode: draftModeMock }));

const MOCK_ORIGIN = `https://${faker.internet.domainName()}`;
const MOCK_PATH = `/${faker.lorem.slug()}`;

const exitPreview = (path: string) =>
  GET(new NextRequest(`${MOCK_ORIGIN}${routes.previewExit(path)}`));

let draftMode: ReturnType<typeof mockDraftMode>;

beforeEach(() => {
  draftMode = mockDraftMode(true);
  draftModeMock.mockResolvedValue(draftMode);
});

describe(GET, () => {
  it('disables Draft Mode and returns privately to the page it was on', async () => {
    const response = await exitPreview(MOCK_PATH);

    expect(draftMode.disable).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe(`${MOCK_ORIGIN}${MOCK_PATH}`);
    expect(response.headers.get('cache-control')).toBe(
      CACHE_CONTROL.PRIVATE_NO_STORE,
    );
  });

  it('returns home from a path off the site', async () => {
    const response = await exitPreview(`//${faker.internet.domainName()}`);

    expect(draftMode.disable).toHaveBeenCalledOnce();
    expect(response.headers.get('location')).toBe(
      `${MOCK_ORIGIN}${routes.home()}`,
    );
  });
});
