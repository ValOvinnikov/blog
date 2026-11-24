import { customRender, screen } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_UNREACHED_REQUEST } from '@platform/testing/unreached-request';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { DeployToDevButton } from './deploy-to-dev-button';

const { startDevDeployActionMock } = vi.hoisted(() => ({
  startDevDeployActionMock: vi.fn(),
}));

vi.mock('@platform/server/releases/start-dev-deploy-action', () => ({
  startDevDeployAction: startDevDeployActionMock,
}));

const t = makeEnTranslator('deployToDevButton');

const setup = customRender(DeployToDevButton, {});

describe(`<${DeployToDevButton.name}/>`, () => {
  let user: UserEvent;

  const deploy = async () => {
    const deployButton = screen.getByRole('button', { name: t('label') });
    await user.click(deployButton);
  };

  beforeEach(() => {
    user = userEvent.setup();
    startDevDeployActionMock
      .mockReset()
      .mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('starts the deploy and says it started', async () => {
    setup();

    await deploy();

    const confirmation = await screen.findByText(t('started'));

    expect(startDevDeployActionMock).toHaveBeenCalledOnce();
    expect(confirmation).toBeVisible();
  });

  it('says nothing was started when the dispatch fails', async () => {
    startDevDeployActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SERVER_ERROR,
    });
    setup();

    await deploy();

    const failure = await screen.findByText(t('startFailed'));

    expect(failure).toBeVisible();
  });

  it('says nothing was started when the request never reaches the server', async () => {
    startDevDeployActionMock.mockRejectedValueOnce(MOCK_UNREACHED_REQUEST);
    setup();

    await deploy();

    const failure = await screen.findByText(t('startFailed'));

    expect(failure).toBeVisible();
  });
});
