import { SAMPLE_KIND } from '@platform/constants/sample-content';
import { customRender, screen, within } from '@platform/testing/custom-render';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { MOCK_KEPT_SAMPLE_TITLE } from '@platform/testing/sample-content/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME } from '@shinefold/config';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { SampleContentCard } from './sample-content-card';

const { removeSampleContentActionMock } = vi.hoisted(() => ({
  removeSampleContentActionMock: vi.fn(),
}));

vi.mock('@platform/server/sample-content/remove-sample-content-action', () => ({
  removeSampleContentAction: removeSampleContentActionMock,
}));

const t = makeEnTranslator('ownerHomePage.sampleContent');
const tKind = makeEnTranslator('ownerHomePage.sampleContent.kind');

const MOCK_REFERENCED_TITLE = 'Welcome to the blog';
const MOCK_REMOVED_COUNT = 4;

const removed = (overrides = {}) => ({
  outcome: ACTION_OUTCOME.SUCCESS,
  removedCount: MOCK_REMOVED_COUNT,
  keptEdited: [
    { id: 'starter.a', kind: SAMPLE_KIND.PAGE, title: MOCK_KEPT_SAMPLE_TITLE },
  ],
  keptReferenced: [
    { id: 'starter.b', kind: SAMPLE_KIND.PAGE, title: MOCK_REFERENCED_TITLE },
    { id: 'starter.c', kind: SAMPLE_KIND.LINK },
  ],
  ...overrides,
});

const setup = customRender(SampleContentCard, {
  sampleContent: { tenantId: MOCK_TENANT_ID, isWritable: true },
});

describe(`<${SampleContentCard.name}/>`, () => {
  let user: UserEvent;

  beforeEach(() => {
    user = userEvent.setup();
    removeSampleContentActionMock.mockReset().mockResolvedValue(removed());
  });

  it('explains why removal is unavailable on a site that cannot be edited', () => {
    setup({ sampleContent: { tenantId: MOCK_TENANT_ID, isWritable: false } });

    const trigger = screen.getByRole('button', { name: t('trigger') });

    expect(trigger).toHaveAccessibleDescription(t('notWritable'));
  });

  describe('with the confirmation open', () => {
    const confirm = async () => {
      const confirmButton = await screen.findByRole('button', {
        name: t('confirm'),
      });
      await user.click(confirmButton);
    };

    beforeEach(async () => {
      setup();
      const trigger = screen.getByRole('button', { name: t('trigger') });
      await user.click(trigger);
    });

    it('asks before removing anything', async () => {
      const dialog = await screen.findByRole('alertdialog', {
        name: t('dialogTitle'),
      });

      expect(dialog).toBeVisible();
      expect(removeSampleContentActionMock).not.toHaveBeenCalled();
    });

    it('removes the samples and lists the edited and referenced ones apart', async () => {
      await confirm();
      const toast = await screen.findByText(
        t('done', { count: MOCK_REMOVED_COUNT }),
      );
      const edited = screen.getByRole('region', { name: t('keptEditedTitle') });
      const referenced = screen.getByRole('region', {
        name: t('keptReferencedTitle'),
      });
      const editedSample = within(edited).getByText(MOCK_KEPT_SAMPLE_TITLE);
      const referencedSample = within(referenced).getByText(
        MOCK_REFERENCED_TITLE,
      );
      const untitledLink = within(referenced).getByText(tKind('link'));

      expect(removeSampleContentActionMock).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
      );
      expect(toast).toBeVisible();
      expect(editedSample).toBeVisible();
      expect(referencedSample).toBeVisible();
      expect(untitledLink).toBeVisible();
    });

    it('says nothing was kept when every sample was removed', async () => {
      removeSampleContentActionMock.mockResolvedValue(
        removed({ keptEdited: [], keptReferenced: [] }),
      );

      await confirm();
      const nothingKept = await screen.findByText(t('nothingKept'));

      expect(nothingKept).toBeVisible();
    });

    it.each([
      { outcome: ACTION_OUTCOME.SERVER_ERROR, message: t('failed') },
      { outcome: ACTION_OUTCOME.REFUSED, message: t('notWritable') },
    ])(
      'keeps the dialog open with the reason when the action answers $outcome',
      async ({ outcome, message }) => {
        removeSampleContentActionMock.mockResolvedValue({ outcome });

        await confirm();
        const alert = await screen.findByRole('alert');
        const dialog = screen.getByRole('alertdialog');

        expect(alert).toHaveTextContent(message);
        expect(dialog).toBeVisible();
      },
    );
  });
});
