import { screen, within } from '@web/testing/custom-render';

const NOTIFICATIONS_REGION_NAME = 'Notifications';

export const findToastStatus = () =>
  within(
    screen.getByRole('region', { name: NOTIFICATIONS_REGION_NAME }),
  ).findByRole('status');
