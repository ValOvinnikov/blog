import { BRAND_VARIANT, ICONS, SIZE, type TBrandVariant } from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import {
  BRAND_BAND_LABELS,
  BrandBand,
  focusLastLink,
} from '@blog/ui/testing/brand-bands';
import { objectKeys } from '@blog/utils/primitives';
import { faker } from '@faker-js/faker';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { MediaCard } from './media-card';
import { mediaCardVariants } from './media-card-variants';

const publishedAt = faker.date.past({ years: 2 });
const dateValue = publishedAt.toISOString().slice(0, 10);
const dateLabel = publishedAt.toLocaleDateString('en-GB', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const readingTime = `${faker.number.int({ min: 2, max: 15 })} min`;

const title = faker.lorem.sentence({ min: 4, max: 7 }).replace(/\.$/, '');
const shortTitle = faker.lorem.words(2);
const longTitle = faker.lorem.sentence(22).replace(/\.$/, '');
const href = `/posts/${faker.lorem.slug(3)}`;
const topic = faker.lorem.slug(2);
const tags = faker.helpers.uniqueArray(() => faker.lorem.slug(1), 3);
const excerpt = faker.lorem.sentences(2);
const twoLineExcerpt = faker.lorem.sentence(16);
const leadExcerpt = faker.lorem.sentences(3);
const shortExcerpt = faker.lorem.sentence(10);

const personName = faker.person.fullName();
const personHref = `/team/${faker.lorem.slug(2)}`;
const featureTitle = faker.company.buzzNoun();
const featureHref = `/features/${faker.lorem.slug(2)}`;

const imageAlt = faker.lorem.words(5);
const picsum = (width: number, height: number) =>
  faker.image.urlPicsumPhotos({ width, height });

const arrowIcon = <Icon name={ICONS.ARROW} size={SIZE.SM} />;

const meta = {
  title: 'Molecules/MediaCard',
  component: MediaCard,
  tags: ['autodocs'],
  parameters: { layout: 'padded' },
  argTypes: {
    align: {
      control: 'select',
      options: objectKeys(mediaCardVariants.variants.align),
    },
  },
  args: {
    isInteractive: true,
    excerpt,
    tags,
    children: (
      <>
        <MediaCard.Media>
          <img
            src={picsum(800, 450)}
            alt={imageAlt}
            className="size-full object-cover"
          />
        </MediaCard.Media>
        <MediaCard.Meta
          dateValue={dateValue}
          dateLabel={dateLabel}
          readingTime={readingTime}
        />
        <MediaCard.Title level={3}>
          <MediaCard.Link href={href}>{title}</MediaCard.Link>
        </MediaCard.Title>
        <MediaCard.Footer topic={topic} trailingIcon={arrowIcon} />
      </>
    ),
  },
} satisfies Meta<typeof MediaCard>;

export default meta;
type TStory = StoryObj<typeof meta>;

export const Full: TStory = {};

export const Minimal: TStory = {
  args: {
    excerpt: undefined,
    tags: undefined,
    children: (
      <MediaCard.Title level={3}>
        <a href={href}>{shortTitle}</a>
      </MediaCard.Title>
    ),
  },
};

export const WithoutFooter: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Meta
          dateValue={dateValue}
          dateLabel={dateLabel}
          readingTime={readingTime}
        />
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const WithTags: TStory = {
  args: {
    excerpt: shortExcerpt,
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
        <MediaCard.Footer topic={topic} trailingIcon={arrowIcon} />
      </>
    ),
  },
};

export const WithFooterLeadingIcon: TStory = {
  args: {
    excerpt: shortExcerpt,
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
        <MediaCard.Footer
          topic={topic}
          leadingIcon={<Icon name={ICONS.BOOKMARK} size={SIZE.SM} />}
          trailingIcon={arrowIcon}
        />
      </>
    ),
  },
};

export const AsSecondLevelHeading: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Title level={2}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
        <MediaCard.Footer topic={topic} trailingIcon={arrowIcon} />
      </>
    ),
  },
};

const titledCard = (cardTitle: string) => (
  <>
    <MediaCard.Meta
      dateValue={dateValue}
      dateLabel={dateLabel}
      readingTime={readingTime}
    />
    <MediaCard.Title level={3}>
      <MediaCard.Link href={href}>{cardTitle}</MediaCard.Link>
    </MediaCard.Title>
    <MediaCard.Footer topic={topic} trailingIcon={arrowIcon} />
  </>
);

export const ShortTitle: TStory = {
  args: {
    excerpt: twoLineExcerpt,
    tags: undefined,
    children: titledCard(shortTitle),
  },
};

export const LongTitle: TStory = {
  args: {
    excerpt: twoLineExcerpt,
    tags: undefined,
    children: titledCard(longTitle),
  },
};

export const NarrowColumn: TStory = {
  decorators: [
    (Story) => (
      <div className="w-[187px]">
        <Story />
      </div>
    ),
  ],
  args: {
    excerpt: twoLineExcerpt,
    tags: undefined,
    children: titledCard(longTitle),
  },
};

export const ThreeAcross: TStory = {
  decorators: [
    (Story) => (
      <div className="grid max-w-6xl grid-cols-3 gap-6">
        <Story />
        <Story />
        <Story />
      </div>
    ),
  ],
  args: {
    excerpt: twoLineExcerpt,
    tags: undefined,
    children: titledCard(longTitle),
  },
};

export const Split: TStory = {
  args: {
    isSplit: true,
  },
};

export const Lead: TStory = {
  args: {
    isLead: true,
    excerpt: leadExcerpt,
  },
};

export const LeadSplit: TStory = {
  args: {
    isLead: true,
    isSplit: true,
    excerpt: leadExcerpt,
  },
};

export const LeadSplitShortExcerpt: TStory = {
  args: {
    isLead: true,
    isSplit: true,
    excerpt: faker.lorem.sentence(4),
    tags: undefined,
  },
};

export const LeadSplitLongExcerpt: TStory = {
  args: {
    isLead: true,
    isSplit: true,
    excerpt: faker.lorem.paragraph(6),
    tags: faker.lorem.words(5).split(' '),
  },
};

export const SplitWithoutExcerpt: TStory = {
  args: {
    isSplit: true,
    excerpt: undefined,
    tags: undefined,
  },
};

export const WithAuthorFooter: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
        <MediaCard.Footer
          publishedAt={publishedAt.toISOString()}
          formattedDate={dateLabel}
          authorName={personName}
          authorAvatarSrc={faker.image.avatar()}
        />
      </>
    ),
  },
};

export const WideMedia: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Media shape="wide">
          <img src={picsum(800, 450)} alt={imageAlt} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const WideFlatMedia: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Media shape="wideFlat">
          <img
            src={picsum(1200, 600)}
            alt={imageAlt}
            className="size-full object-cover"
          />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const SquareMedia: TStory = {
  args: {
    children: (
      <>
        <MediaCard.Media shape="square">
          <img src={picsum(600, 600)} alt={imageAlt} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href={href}>{title}</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const CircleMedia: TStory = {
  args: {
    excerpt: undefined,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="circle">
          <img src={faker.image.avatar()} alt={`Portrait of ${personName}`} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href={personHref}>{personName}</a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const IconMedia: TStory = {
  args: {
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={featureHref}>{featureTitle}</MediaCard.Link>
        </MediaCard.Title>
      </>
    ),
  },
};

export const IconPanelMedia: TStory = {
  args: {
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="wide" iconPanel={true}>
          <Icon name={ICONS.ROCKET} size={SIZE.LG} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={featureHref}>{featureTitle}</MediaCard.Link>
        </MediaCard.Title>
      </>
    ),
  },
};

const besideImageCard = (
  shape: 'wide' | 'circle',
  align: 'left' | 'center' = 'left',
): TStory => ({
  args: {
    align,
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape={shape} iconPanel={true}>
          <Icon name={ICONS.ROCKET} size={SIZE.LG} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={featureHref}>{featureTitle}</MediaCard.Link>
        </MediaCard.Title>
      </>
    ),
  },
  render: (args) => (
    <div className="grid max-w-3xl grid-cols-2 gap-6">
      <MediaCard {...args}>
        <MediaCard.Media shape={shape}>
          <img
            src={shape === 'circle' ? faker.image.avatar() : picsum(800, 450)}
            alt={imageAlt}
            className="size-full object-cover"
          />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={featureHref}>{featureTitle}</MediaCard.Link>
        </MediaCard.Title>
      </MediaCard>
      <MediaCard {...args} />
    </div>
  ),
});

export const IconPanelBesideImage = besideImageCard('wide');

export const IconPanelBesideImageCenterAligned = besideImageCard(
  'wide',
  'center',
);

export const IconPanelBesideCircleImage = besideImageCard('circle');

const restingAndFocusedOn = (tone: TBrandVariant): TStory => ({
  name: `On a ${BRAND_BAND_LABELS[tone]} band — at rest and focused`,
  args: IconMedia.args,
  render: (args) => (
    <BrandBand tone={tone}>
      <div style={{ width: 280 }}>
        <MediaCard {...args} />
      </div>
      <div style={{ width: 280 }}>
        <MediaCard {...args} />
      </div>
    </BrandBand>
  ),
  play: focusLastLink,
});

export const OnPrimaryBand = restingAndFocusedOn(BRAND_VARIANT.PRIMARY);

export const OnSecondaryBand = restingAndFocusedOn(BRAND_VARIANT.SECONDARY);

export const OnBrandPrimaryBand = restingAndFocusedOn(
  BRAND_VARIANT.BRAND_PRIMARY,
);

export const Static: TStory = {
  args: {
    isInteractive: false,
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>{featureTitle}</MediaCard.Title>
      </>
    ),
  },
};

export const WithFooterControls: TStory = {
  args: {
    excerpt: faker.person.jobTitle(),
    tags: undefined,
    children: (
      <>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={personHref}>{personName}</MediaCard.Link>
        </MediaCard.Title>
        <MediaCard.Footer>
          <a href="https://github.com" aria-label="GitHub">
            <Icon name={ICONS.GITHUB} size={SIZE.SM} />
          </a>
        </MediaCard.Footer>
      </>
    ),
  },
};

export const IconHovered: TStory = {
  args: {
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <a href={featureHref} autoFocus={true}>
            {featureTitle}
          </a>
        </MediaCard.Title>
      </>
    ),
  },
};

export const CenterAligned: TStory = {
  args: {
    align: 'center',
    excerpt: shortExcerpt,
    tags: undefined,
    children: (
      <>
        <MediaCard.Media shape="icon">
          <Icon name={ICONS.ROCKET} size={SIZE.MD} />
        </MediaCard.Media>
        <MediaCard.Title level={3}>
          <MediaCard.Link href={featureHref}>{featureTitle}</MediaCard.Link>
        </MediaCard.Title>
      </>
    ),
  },
};
