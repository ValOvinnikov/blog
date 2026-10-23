import { screen } from '@platform/testing/custom-render';
import {
  ARCHIVED_NOTICE_TEXT,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';

export const expectArchivedOffersNoSave = () => {
  const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
  const saveButton = screen.queryByRole('button', { name: SAVE_CHANGES });

  expect(archivedNotice).toBeVisible();
  expect(saveButton).not.toBeInTheDocument();
};
