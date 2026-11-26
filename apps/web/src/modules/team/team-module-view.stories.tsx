import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  GRID_COLUMNS,
  SOCIAL_PLATFORMS,
} from '@shinefold/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LandingPageLayout } from '@web/components/pages/landing-page/landing-page-layout';
import { MOCK_CTA_ACTIONS } from '@web/testing/modules/cta/fixtures';
import { mockSanityImage } from '@web/testing/modules/hero/fixtures';
import { mockTeamMember } from '@web/testing/modules/team/fixtures';
import { mockLandingSectionNavigation } from '@web/testing/pages/landing-page/fixtures';
import { mockHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { mockPortableTextBlock } from '@web/testing/shared/portable-text/fixtures';
import { MOCK_OUTLINED_BRAND_TINT_SECTION } from '@web/testing/shared/section-appearance/fixtures';

import { TeamModuleView } from './team-module-view';

const members = [
  mockTeamMember({
    id: 'team-member-1',
    name: 'Jordan Reyes',
    role: 'VP Engineering',
  }),
  mockTeamMember({
    id: 'team-member-2',
    name: 'Priya Nair',
    role: 'Head of Product',
  }),
  mockTeamMember({
    id: 'team-member-3',
    name: 'Marco Duarte',
    role: 'Founder',
  }),
];

const moreMembers = [
  mockTeamMember({ id: 'team-member-4', name: 'Sana Ito' }),
  mockTeamMember({ id: 'team-member-5', name: 'Wale Adebayo' }),
  mockTeamMember({ id: 'team-member-6', name: 'Elin Kask' }),
  mockTeamMember({ id: 'team-member-7', name: 'Noor Haddad' }),
  mockTeamMember({ id: 'team-member-8', name: 'Tomás Rivera' }),
  mockTeamMember({ id: 'team-member-9', name: 'Ines Duarte' }),
];

const bio = [
  mockPortableTextBlock(
    'Leads the engineering org with a focus on reliability and developer experience.',
  ),
];

const socialLinks = [
  {
    platform: SOCIAL_PLATFORMS.GITHUB,
    link: {
      label: 'GitHub',
      href: 'https://github.com/example',
      target: '_blank' as const,
      platform: undefined,
    },
  },
  {
    platform: SOCIAL_PLATFORMS.LINKEDIN,
    link: {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/example',
      target: '_blank' as const,
      platform: undefined,
    },
  },
];

const CIRCLE_LEFT_CARD = {
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
} as const;

const CIRCLE_CENTRE_CARD = {
  imageShape: CARD_IMAGE_SHAPE.CIRCLE,
  cardAlignment: CONTENT_ALIGNMENT.CENTER,
} as const;

const SQUARE_LEFT_CARD = {
  imageShape: CARD_IMAGE_SHAPE.SQUARE,
  cardAlignment: CONTENT_ALIGNMENT.LEFT,
} as const;

const AUTO_GRID = { columns: undefined, showBios: false };

const AUTO_GRID_WITH_BIOS = { columns: undefined, showBios: true };

const meta = {
  title: 'Modules/TeamModule',
  component: TeamModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
  },
  args: {
    section: { brandVariant: BRAND_VARIANT.PRIMARY, layout: undefined },
    headingBlock: mockHeadingBlock({ heading: 'Meet the team' }),
    members,
    grid: AUTO_GRID,
    card: CIRCLE_LEFT_CARD,
    displayMode: DISPLAY_MODE.GRID,
    ctaButtons: [],
    contentAlignment: undefined,
    id: 'team-1',
  },
} satisfies Meta<typeof TeamModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithPhotos: TStory = {
  args: {
    members: members.map((member) => ({
      ...member,
      image: mockSanityImage(),
    })),
  },
};

export const SquareShape: TStory = {
  args: {
    card: SQUARE_LEFT_CARD,
    members: members.map((member) => ({
      ...member,
      image: mockSanityImage(),
    })),
  },
};

export const SquareShapeInitials: TStory = {
  args: {
    card: SQUARE_LEFT_CARD,
  },
};

export const WithBios: TStory = {
  args: {
    grid: AUTO_GRID_WITH_BIOS,
    members: members.map((member) => ({ ...member, bio })),
  },
};

export const WithSocialLinks: TStory = {
  args: {
    members: members.map((member) => ({ ...member, socialLinks })),
  },
};

export const Carousel: TStory = {
  args: { displayMode: DISPLAY_MODE.CAROUSEL },
};

export const CarouselTwoMembersLeft: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    members: members.slice(0, 2),
    contentAlignment: CONTENT_ALIGNMENT.LEFT,
  },
};

export const CarouselTwoMembersCentre: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    members: members.slice(0, 2),
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    card: CIRCLE_CENTRE_CARD,
  },
};

export const CarouselOverflowCentre: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    members: [...members, ...moreMembers.slice(0, 3)],
  },
};

export const WithActions: TStory = {
  args: { ctaButtons: MOCK_CTA_ACTIONS },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    card: CIRCLE_CENTRE_CARD,
  },
};

export const SixMembers: TStory = {
  args: {
    members: [...members, ...moreMembers.slice(0, 3)],
  },
};

export const SevenMembersWithBios: TStory = {
  args: {
    grid: AUTO_GRID_WITH_BIOS,
    members: [...members, ...moreMembers.slice(0, 4)].map((member) => ({
      ...member,
      bio,
    })),
  },
};

export const NineMembers: TStory = {
  args: {
    members: [...members, ...moreMembers],
  },
};

export const Spotlight: TStory = {
  args: {
    grid: AUTO_GRID_WITH_BIOS,
    members: [
      {
        ...members[2]!,
        image: mockSanityImage(),
        bio,
        socialLinks,
      },
    ],
  },
};

export const SpotlightSquareInitials: TStory = {
  args: {
    card: SQUARE_LEFT_CARD,
    displayMode: DISPLAY_MODE.CAROUSEL,
    members: [mockTeamMember()],
  },
};

export const SocialLinksAlignedAcrossRow: TStory = {
  args: {
    grid: AUTO_GRID_WITH_BIOS,
    members: [
      { ...members[0]!, bio, socialLinks },
      {
        ...members[1]!,
        bio: [...bio, ...bio, ...bio],
        socialLinks,
      },
      { ...members[2]!, socialLinks },
    ],
  },
};

export const TabletThreePerRow: TStory = {
  globals: { viewport: 'tablet' },
  args: SixMembers.args,
};

export const SquarePhotosWithBios: TStory = {
  args: {
    grid: AUTO_GRID_WITH_BIOS,
    card: SQUARE_LEFT_CARD,
    members: [...members, ...moreMembers.slice(0, 2)].map((member) => ({
      ...member,
      image: mockSanityImage(),
      bio,
    })),
  },
};

export const MobileSquarePhotosWithBios: TStory = {
  globals: { viewport: 'mobile' },
  args: SquarePhotosWithBios.args,
};

export const TabletSquarePhotosWithBios: TStory = {
  globals: { viewport: 'tablet' },
  args: SquarePhotosWithBios.args,
};

export const SquarePhotosCentreAligned: TStory = {
  args: {
    ...SquarePhotosWithBios.args,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    card: { ...SQUARE_LEFT_CARD, cardAlignment: CONTENT_ALIGNMENT.CENTER },
  },
};

export const SquarePhotosNextToSidebar: TStory = {
  globals: { viewport: 'desktop' },
  args: SquarePhotosWithBios.args,
  decorators: [
    (Story) => (
      <LandingPageLayout
        topBlock={null}
        navigation={{ sectionNavigation: mockLandingSectionNavigation() }}
      >
        <Story />
      </LandingPageLayout>
    ),
  ],
};

export const SquarePhotosInSixHundredPixelColumn: TStory = {
  globals: { viewport: 'desktop' },
  args: SquarePhotosWithBios.args,
  decorators: [
    (Story) => (
      <div className="max-w-[600px]">
        <Story />
      </div>
    ),
  ],
};

export const MobileCarouselTwoPerView: TStory = {
  globals: { viewport: 'mobile' },
  args: { ...SixMembers.args, displayMode: DISPLAY_MODE.CAROUSEL },
};

export const TabletCarouselThreePerView: TStory = {
  globals: { viewport: 'tablet' },
  args: { ...SixMembers.args, displayMode: DISPLAY_MODE.CAROUSEL },
};

export const DesktopCarouselThreePerView: TStory = {
  globals: { viewport: 'desktop' },
  args: { ...SixMembers.args, displayMode: DISPLAY_MODE.CAROUSEL },
};

export const SquarePhotosOutlinedOnBrandTint: TStory = {
  args: {
    ...SquareShape.args,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
};

export const CirclePhotosOutlinedOnBrandTint: TStory = {
  args: {
    ...WithPhotos.args,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
};

export const CarouselOutlinedOnBrandTint: TStory = {
  args: {
    ...SquareShape.args,
    displayMode: DISPLAY_MODE.CAROUSEL,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
};

export const SpotlightSquareOutlinedOnBrandTint: TStory = {
  args: {
    ...Spotlight.args,
    card: SQUARE_LEFT_CARD,
    section: MOCK_OUTLINED_BRAND_TINT_SECTION,
  },
};

export const TwoColumnsSixMembers: TStory = {
  args: {
    ...SixMembers.args,
    grid: { columns: GRID_COLUMNS.TWO, showBios: false },
  },
};
