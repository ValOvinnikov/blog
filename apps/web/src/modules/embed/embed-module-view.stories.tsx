import {
  BRAND_VARIANT,
  CONTAINER_WIDTH,
  CONTENT_ALIGNMENT,
  EMBED_ORIGIN,
  EMBED_PROVIDER,
  MEDIA_RATIO,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConsentPreferencesDialog } from '@web/components/shared/consent-preferences-dialog';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import {
  MOCK_CAL_EMBED,
  mockEmbed,
  mockEmbedModule,
} from '@web/testing/modules/embed/fixtures';
import {
  clearConsentCookie,
  grantConsent,
} from '@web/testing/shared/consent/consent-cookie';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';

import { EmbedModuleView } from './embed-module-view';

const NARROW_LAYOUT = { containerWidth: CONTAINER_WIDTH.NARROW };

const DEMO_MODULE = mockEmbedModule({
  headingBlock: mockHeadingBlock({
    heading: 'See it in two minutes',
    supportingText: 'A short tour of the editor, from first draft to publish.',
  }),
  embed: mockEmbed({
    title: 'Product tour',
    caption: 'Recorded with the November release.',
  }),
  layout: NARROW_LAYOUT,
});

const meta = {
  title: 'Modules/EmbedModule',
  component: EmbedModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  args: {
    module: DEMO_MODULE,
    titleId: 'embed-title',
    dataTestId: 'embed-module-embed-1',
  },
  beforeEach: () => clearConsentCookie,
  decorators: [
    (Story) => (
      <>
        <Story />
        <ConsentPreferencesDialog />
      </>
    ),
  ],
} satisfies Meta<typeof EmbedModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const NotYetAllowed: TStory = {};

export const Allowed: TStory = {
  beforeEach: () => {
    grantConsent();
    return clearConsentCookie;
  },
};

export const NarrowCentred: TStory = {
  args: {
    module: { ...DEMO_MODULE, contentAlignment: CONTENT_ALIGNMENT.CENTER },
  },
};

export const Wide: TStory = {
  args: {
    module: {
      ...DEMO_MODULE,
      layout: { containerWidth: CONTAINER_WIDTH.WIDE },
    },
  },
};

export const WithActions: TStory = {
  args: { module: { ...DEMO_MODULE, ctaButtons: MOCK_CTA_ACTIONS } },
};

export const Short: TStory = {
  args: {
    module: {
      ...DEMO_MODULE,
      embed: mockEmbed({
        title: 'Thirty-second tip',
        ratio: MEDIA_RATIO.VERTICAL,
      }),
    },
  },
};

export const Booking: TStory = {
  args: {
    module: {
      ...DEMO_MODULE,
      headingBlock: mockHeadingBlock({ heading: 'Book a call' }),
      embed: { ...MOCK_CAL_EMBED, title: 'Book an intro call' },
    },
  },
};

export const GoogleMap: TStory = {
  args: {
    module: {
      ...DEMO_MODULE,
      brandVariant: BRAND_VARIANT.SECONDARY,
      headingBlock: mockHeadingBlock({ heading: 'Find us' }),
      embed: mockEmbed({
        provider: EMBED_PROVIDER.GOOGLE_MAPS,
        embedUrl: `${EMBED_ORIGIN.GOOGLE_MAPS}/maps/embed?pb=example`,
        ratio: MEDIA_RATIO.CLASSIC,
        title: 'Our studio',
      }),
    },
  },
};

export const Phone: TStory = {
  globals: { viewport: 'mobile' },
};
