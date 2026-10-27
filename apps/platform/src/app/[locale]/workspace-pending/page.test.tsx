import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { auth } from '@platform/server/auth/auth';
import { MOCK_SIGN_IN_HREF } from '@platform/testing/auth/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import WorkspacePendingPage from './page';

vi.mock('@platform/server/auth/auth');

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);
const t = makeEnTranslator('workspacePendingPage');

const setup = customRenderAsync(WorkspacePendingPage, {});

describe(`<${WorkspacePendingPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
  });

  it('redirects to sign-in without rendering when there is no session', async () => {
    authMock.mockResolvedValueOnce(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(MOCK_SIGN_IN_HREF);
  });

  it('tells a signed-in user their workspace is not ready', async () => {
    await setup();

    const heading = screen.getByRole('heading', { name: t('heading') });

    expect(heading).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
