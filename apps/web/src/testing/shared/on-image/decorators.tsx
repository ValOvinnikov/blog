import { BRAND_VARIANT } from '@shinefold/config';
import type { Decorator } from '@storybook/nextjs-vite';

export const onImageDecorators: Decorator[] = [
  (Story) => (
    <div className="dark">
      <div
        data-skin={BRAND_VARIANT.PRIMARY}
        className="skin-on-image bg-ambient p-8"
      >
        <Story />
      </div>
    </div>
  ),
];
