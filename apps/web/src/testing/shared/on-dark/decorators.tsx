import { BRAND_VARIANT } from '@blog/config';
import type { Decorator } from '@storybook/nextjs-vite';
import { Section } from '@web/components/shared/section';

export const onDarkDecorators: Decorator[] = [
  (Story) => (
    <Section brandVariant={BRAND_VARIANT.PRIMARY}>
      <Story />
    </Section>
  ),
];
