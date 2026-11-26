import { userEvent, within } from 'storybook/test';

export const openMobileSelector =
  (name: RegExp | string) =>
  async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name }));
  };
