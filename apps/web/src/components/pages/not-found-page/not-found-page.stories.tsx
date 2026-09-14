import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { NotFoundPage } from './not-found-page';

const meta = {
  title: 'Pages/NotFoundPage',
  component: NotFoundPage,
  tags: ['autodocs'],
} satisfies Meta<typeof NotFoundPage>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

/**
 * Mimics `[tenant]/[locale]/not-found.tsx`, which renders inside the tenant
 * layout's Header/Footer chrome: the decorator's header/footer bars stand in
 * for that chrome, and `shouldFillViewport={false}` sizes the body to the space
 * between them instead of the full viewport.
 */
export const WithinLayoutChrome: TStory = {
  args: { shouldFillViewport: false },
  decorators: [
    (Story) => (
      <div className="flex min-h-dvh flex-col">
        <div className="bg-brand-primary p-4 text-center text-white">
          Header
        </div>
        <div className="flex flex-1 flex-col">
          <Story />
        </div>
        <div className="bg-brand-primary p-4 text-center text-white">
          Footer
        </div>
      </div>
    ),
  ],
};
