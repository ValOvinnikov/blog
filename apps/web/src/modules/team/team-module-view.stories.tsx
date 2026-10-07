import {
  BRAND_VARIANT,
  CARD_IMAGE_SHAPE,
  CONTENT_ALIGNMENT,
  DISPLAY_MODE,
  SOCIAL_PLATFORMS,
} from '@blog/config';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ctaActionsDemo } from '@web/testing/modules/cta/fixtures';
import { makeSanityImage } from '@web/testing/modules/hero/fixtures';
import { makeTeamMember } from '@web/testing/modules/team/fixtures';
import { makeHeadingBlock } from '@web/testing/shared/heading-block/fixtures';
import { portableTextBlock } from '@web/testing/shared/portable-text/fixtures';

import { TeamModuleView } from './team-module-view';

const members = [
  makeTeamMember({
    id: 'team-member-1',
    name: 'Jordan Reyes',
    role: 'VP Engineering',
  }),
  makeTeamMember({
    id: 'team-member-2',
    name: 'Priya Nair',
    role: 'Head of Product',
  }),
  makeTeamMember({
    id: 'team-member-3',
    name: 'Marco Duarte',
    role: 'Founder',
  }),
];

const bio = [
  portableTextBlock(
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
      ariaLabel: undefined,
    },
  },
  {
    platform: SOCIAL_PLATFORMS.LINKEDIN,
    link: {
      label: 'LinkedIn',
      href: 'https://www.linkedin.com/in/example',
      target: '_blank' as const,
      platform: undefined,
      ariaLabel: undefined,
    },
  },
];

const meta = {
  title: 'Modules/TeamModule',
  component: TeamModuleView,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  argTypes: {
    brandVariant: {
      control: 'select',
      options: [BRAND_VARIANT.PRIMARY, BRAND_VARIANT.SECONDARY],
    },
    contentAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    cardAlignment: {
      control: 'select',
      options: [CONTENT_ALIGNMENT.LEFT, CONTENT_ALIGNMENT.CENTER],
    },
    displayMode: {
      control: 'select',
      options: Object.values(DISPLAY_MODE),
    },
    imageShape: {
      control: 'select',
      options: [CARD_IMAGE_SHAPE.CIRCLE, CARD_IMAGE_SHAPE.SQUARE],
    },
  },
  args: {
    brandVariant: BRAND_VARIANT.PRIMARY,
    headingBlock: makeHeadingBlock({ heading: 'Meet the team' }),
    members,
    showBios: false,
    showSocialLinks: false,
    imageShape: CARD_IMAGE_SHAPE.CIRCLE,
    displayMode: DISPLAY_MODE.GRID,
    cardAlignment: CONTENT_ALIGNMENT.LEFT,
    ctaButtons: [],
    contentAlignment: undefined,
    layout: undefined,
    titleId: 'team-title',
    dataTestId: 'team-module-team-1',
  },
} satisfies Meta<typeof TeamModuleView>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Default: TStory = {};

export const WithPhotos: TStory = {
  args: {
    members: members.map((member) => ({
      ...member,
      image: makeSanityImage(),
    })),
  },
};

export const SquareShape: TStory = {
  args: {
    imageShape: CARD_IMAGE_SHAPE.SQUARE,
    members: members.map((member) => ({
      ...member,
      image: makeSanityImage(),
    })),
  },
};

export const SquareShapeInitials: TStory = {
  args: {
    imageShape: CARD_IMAGE_SHAPE.SQUARE,
  },
};

export const WithBios: TStory = {
  args: {
    showBios: true,
    members: members.map((member) => ({ ...member, bio })),
  },
};

export const WithSocialLinks: TStory = {
  args: {
    showSocialLinks: true,
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
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const CarouselOverflowCentre: TStory = {
  args: {
    displayMode: DISPLAY_MODE.CAROUSEL,
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    members: [
      ...members,
      makeTeamMember({ id: 'team-member-4', name: 'Sana Ito' }),
      makeTeamMember({ id: 'team-member-5', name: 'Wale Adebayo' }),
      makeTeamMember({ id: 'team-member-6', name: 'Elin Kask' }),
    ],
  },
};

export const WithActions: TStory = {
  args: { ctaButtons: ctaActionsDemo },
};

export const CenterAligned: TStory = {
  args: {
    contentAlignment: CONTENT_ALIGNMENT.CENTER,
    cardAlignment: CONTENT_ALIGNMENT.CENTER,
  },
};

export const SixMembers: TStory = {
  args: {
    members: [
      ...members,
      makeTeamMember({ id: 'team-member-4', name: 'Sana Ito' }),
      makeTeamMember({ id: 'team-member-5', name: 'Wale Adebayo' }),
      makeTeamMember({ id: 'team-member-6', name: 'Elin Kask' }),
    ],
  },
};

export const SevenMembersWithBios: TStory = {
  args: {
    showBios: true,
    members: [
      ...members,
      makeTeamMember({ id: 'team-member-4', name: 'Sana Ito' }),
      makeTeamMember({ id: 'team-member-5', name: 'Wale Adebayo' }),
      makeTeamMember({ id: 'team-member-6', name: 'Elin Kask' }),
      makeTeamMember({ id: 'team-member-7', name: 'Noor Haddad' }),
    ].map((member) => ({ ...member, bio })),
  },
};

export const NineMembers: TStory = {
  args: {
    members: [
      ...members,
      makeTeamMember({ id: 'team-member-4', name: 'Sana Ito' }),
      makeTeamMember({ id: 'team-member-5', name: 'Wale Adebayo' }),
      makeTeamMember({ id: 'team-member-6', name: 'Elin Kask' }),
      makeTeamMember({ id: 'team-member-7', name: 'Noor Haddad' }),
      makeTeamMember({ id: 'team-member-8', name: 'Tomás Rivera' }),
      makeTeamMember({ id: 'team-member-9', name: 'Ines Duarte' }),
    ],
  },
};

export const Spotlight: TStory = {
  args: {
    showBios: true,
    showSocialLinks: true,
    members: [
      makeTeamMember({
        name: 'Marco Duarte',
        role: 'Founder',
        image: makeSanityImage(),
        bio,
        socialLinks,
      }),
    ],
  },
};

export const SpotlightSquareInitials: TStory = {
  args: {
    imageShape: CARD_IMAGE_SHAPE.SQUARE,
    displayMode: DISPLAY_MODE.CAROUSEL,
    members: [makeTeamMember()],
  },
};

export const SocialLinksAlignedAcrossRow: TStory = {
  args: {
    showBios: true,
    showSocialLinks: true,
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

export const TabletTwoPerRow: TStory = {
  globals: { viewport: 'tablet' },
  args: SixMembers.args,
};

export const TabletCarouselTwoPerView: TStory = {
  globals: { viewport: 'tablet' },
  args: { ...SixMembers.args, displayMode: DISPLAY_MODE.CAROUSEL },
};
