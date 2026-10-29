import {
  BRAND_VARIANT,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  ICONS,
  SIZE,
} from '@blog/config';
import { Icon } from '@blog/ui/components/atoms/icon';
import { TextLink } from '@blog/ui/components/atoms/text-link';
import { objectKeys } from '@blog/utils/primitives';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { Footer, type TFooterProps } from './footer';
import { footerVariants } from './footer-variants';

const groups: { heading: string; links: { href?: string; label: string }[] }[] =
  [
    {
      heading: 'Read',
      links: [
        { href: '/blog', label: 'Blog' },
        { href: '/guides', label: 'Guides' },
        { href: '/topics', label: 'Topics' },
      ],
    },
    {
      heading: 'Studio',
      links: [
        { href: '/about', label: 'About' },
        { href: '/team', label: 'Team' },
        { href: '/contact', label: 'Contact' },
      ],
    },
    {
      heading: 'Elsewhere',
      links: [
        { href: '/newsletter', label: 'Newsletter' },
        { href: '/rss.xml', label: 'RSS feed' },
      ],
    },
    {
      heading: 'Visit',
      links: [{ label: 'Mon–Fri, 9am–5pm' }],
    },
  ];

const FullContent = (
  <>
    <Footer.Logo>
      <img src="https://placehold.co/120x32" alt="My Blog" />
    </Footer.Logo>
    <Footer.About>
      Notes on building software — backend, frontend and the tools between.
    </Footer.About>
    <Footer.Address>{'12 Harbour Street\nBristol BS1 4RN'}</Footer.Address>
    <Footer.Social>
      <TextLink appearance="nav" href="https://github.com" ariaLabel="GitHub">
        <Icon name={ICONS.GITHUB} size={SIZE.SM} />
      </TextLink>
      <TextLink
        appearance="nav"
        href="https://linkedin.com"
        ariaLabel="LinkedIn"
      >
        <Icon name={ICONS.LINKEDIN} size={SIZE.SM} />
      </TextLink>
    </Footer.Social>
    <Footer.Groups ariaLabel="Footer">
      {groups.map(({ heading, links }) => (
        <Footer.Group key={heading} heading={heading} headingLevel={2}>
          {links.map(({ href, label }) => (
            <Footer.GroupItem key={label}>
              <TextLink appearance="nav" href={href}>
                {label}
              </TextLink>
            </Footer.GroupItem>
          ))}
        </Footer.Group>
      ))}
    </Footer.Groups>
    <Footer.Wordmark>My Blog</Footer.Wordmark>
    <Footer.Copyright title="My Blog" year={2027} />
    <Footer.FinePrint ariaLabel="Legal">
      <TextLink appearance="nav" href="/privacy">
        Privacy policy
      </TextLink>
      <TextLink appearance="nav" href="/terms">
        Terms
      </TextLink>
      <TextLink appearance="nav" href="/cookies">
        <Icon name={ICONS.COOKIE} size={SIZE.SM} />
        Cookie settings
      </TextLink>
    </Footer.FinePrint>
  </>
);

const meta = {
  title: 'Organisms/Footer',
  component: Footer,
  tags: ['autodocs'],
  args: {
    children: FullContent,
  },
  argTypes: {
    layout: {
      control: 'select',
      options: objectKeys(footerVariants.variants.layout),
    },
    surface: {
      control: 'select',
      options: objectKeys(footerVariants.variants.surface),
    },
    tone: {
      control: 'select',
      options: objectKeys(footerVariants.variants.tone),
    },
  },
} satisfies Meta<typeof Footer>;

export default meta;
type TStory = StoryObj<typeof meta>;

const AllTones = (args: TFooterProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
    {Object.values(BRAND_VARIANT).map((tone) => (
      <Footer key={tone} {...args} tone={tone} />
    ))}
  </div>
);

export const Columns: TStory = {
  args: { layout: FOOTER_LAYOUT.COLUMNS },
};

export const Centred: TStory = {
  args: { layout: FOOTER_LAYOUT.CENTRED },
};

export const Compact: TStory = {
  args: { layout: FOOTER_LAYOUT.COMPACT },
};

export const BigWordmark: TStory = {
  args: { layout: FOOTER_LAYOUT.BIG_WORDMARK },
};

export const Card: TStory = {
  args: { surface: FOOTER_SURFACE.CARD },
};

export const Skins: TStory = {
  render: AllTones,
};

export const SkinsDark: TStory = {
  render: AllTones,
  globals: { theme: 'dark' },
};

export const CardSkins: TStory = {
  args: { surface: FOOTER_SURFACE.CARD },
  render: AllTones,
};

export const CardSkinsDark: TStory = {
  args: { surface: FOOTER_SURFACE.CARD },
  render: AllTones,
  globals: { theme: 'dark' },
};

// The groups' two-per-row grid only applies below `md`, so this pins the narrow canvas.
export const Phone: TStory = {
  globals: { viewport: 'phone' },
};

export const WithoutGroupsAboutOrAddress: TStory = {
  args: {
    children: (
      <>
        <Footer.Copyright title="My Blog" year={2027} />
        <Footer.FinePrint ariaLabel="Legal">
          <TextLink appearance="nav" href="/privacy">
            Privacy policy
          </TextLink>
        </Footer.FinePrint>
      </>
    ),
  },
};

export const Minimal: TStory = {
  args: {
    children: <Footer.Copyright title="My Blog" year={2027} />,
  },
};
