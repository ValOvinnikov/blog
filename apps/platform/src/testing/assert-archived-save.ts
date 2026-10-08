import { screen } from '@platform/testing/custom-render';

export const expectArchivedOffersNoSave = () => {
  expect(screen.getByText('This tenant is archived')).toBeVisible();
  expect(
    screen.queryByRole('button', { name: 'Save changes' }),
  ).not.toBeInTheDocument();
};
