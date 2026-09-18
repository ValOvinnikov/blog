import { FEATURE_ICONS, type TFeatureIconName } from '@blog/config/constants';
import { linkSchema } from '@blog/studio/schema-types/documents/link/link';
import { titleField } from '@blog/studio/schema-types/fields/title-field/title-field';
import { headingBlockField } from '@blog/studio/schema-types/objects/heading-block/heading-block-field';
import { imageWithAltSchema } from '@blog/studio/schema-types/objects/image-with-alt/image-with-alt';
import { toTitleCase } from '@blog/utils/primitives';
import {
  Book,
  Camera,
  ChartNoAxesCombined,
  Check,
  Clock,
  Cloud,
  Code,
  Cpu,
  Globe,
  Grid2x2,
  Heart,
  IdCard,
  Layers,
  Lightbulb,
  Lock,
  Mail,
  MapPin,
  MessageSquareText,
  Palette,
  Pen,
  Phone,
  Rocket,
  Search,
  Settings,
  ShieldCheck,
  Smile,
  Star,
  Target,
  TrendingUp,
  Users,
  Wrench,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { createElement, type ReactNode } from 'react';
import { defineField, defineType, type SanityDocument } from 'sanity';

const FEATURE_ICON_COMPONENT: Record<TFeatureIconName, LucideIcon> = {
  CODE: Code,
  LAYERS: Layers,
  CPU: Cpu,
  WRENCH: Wrench,
  SETTINGS: Settings,
  ROCKET: Rocket,
  ZAP: Zap,
  TARGET: Target,
  CHART: ChartNoAxesCombined,
  TRENDING_UP: TrendingUp,
  SEARCH: Search,
  CHECK: Check,
  SHIELD_CHECK: ShieldCheck,
  LOCK: Lock,
  CLOCK: Clock,
  CLOUD: Cloud,
  GRID: Grid2x2,
  PALETTE: Palette,
  STAR: Star,
  LIGHTBULB: Lightbulb,
  BOOK: Book,
  PEN: Pen,
  USERS: Users,
  COMMENT: MessageSquareText,
  MAIL: Mail,
  PHONE: Phone,
  SMILE: Smile,
  HEART: Heart,
  GLOBE: Globe,
  MAP_PIN: MapPin,
  CAMERA: Camera,
};

const isFeatureIconName = (value: unknown): value is TFeatureIconName =>
  typeof value === 'string' &&
  (FEATURE_ICONS as readonly string[]).includes(value);

const iconMedia = (icon: unknown): ReactNode =>
  isFeatureIconName(icon)
    ? createElement(FEATURE_ICON_COMPONENT[icon])
    : undefined;

type TFeatureBlockDocument = {
  icon?: string;
  image?: unknown;
};

const asFeatureBlockDocument = (
  document: SanityDocument | undefined,
): TFeatureBlockDocument | undefined =>
  document as TFeatureBlockDocument | undefined;

const validateFeatureHasVisual = (
  document: SanityDocument | undefined,
): string | true => {
  const doc = asFeatureBlockDocument(document);

  return doc?.icon || doc?.image
    ? true
    : 'Add an icon or an image so this card has something to display.';
};

export const featureBlockSchema = defineType({
  name: 'block_feature',
  title: 'Feature Card',
  type: 'document',
  description:
    'One feature — a heading and supporting text from its heading block, plus an icon or image — reusable across every Features module on the site.',
  icon: IdCard,
  validation: (rule) => rule.custom(validateFeatureHasVisual),
  fields: [
    titleField(),
    headingBlockField(),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'The icon shown for this card when it has no image.',
      options: {
        layout: 'dropdown',
        list: FEATURE_ICONS.map((value) => ({
          title: toTitleCase(value),
          value,
        })),
      },
    }),
    defineField({
      name: 'image',
      title: 'Image',
      type: imageWithAltSchema.name,
      description:
        "The image shown for this card, cropped to the shape chosen on the Features module. Takes priority over the card's icon when both are set.",
    }),
    defineField({
      name: 'link',
      title: 'Link',
      type: 'reference',
      description: 'Where this card links to, if anywhere.',
      to: [{ type: linkSchema.name }],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      linkLabel: 'link.label',
      image: 'image',
      icon: 'icon',
    },
    prepare({ title, linkLabel, image, icon }) {
      return {
        title: String(title ?? 'Unknown'),
        subtitle: typeof linkLabel === 'string' ? linkLabel : 'No link',
        media: image ?? iconMedia(icon),
      };
    },
  },
});
