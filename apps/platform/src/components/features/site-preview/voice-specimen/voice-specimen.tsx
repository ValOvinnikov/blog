import {
  SITE_MESSAGES_BY_LOCALE,
  SIZE,
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { Button } from '@blog/ui/components/atoms/button';
import { Eyebrow } from '@blog/ui/components/atoms/eyebrow';
import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { Panel } from '@blog/ui/components/molecules/panel';
import { BookmarksList } from '@blog/ui/components/organisms/bookmarks-list';
import { VoiceKeyFrame } from '@platform/components/features/site-preview/voice-key-frame';
import { VoiceRichText } from '@platform/components/features/site-preview/voice-rich-text';
import {
  resolveVoiceValue,
  voiceFieldsOf,
  type TVoiceField,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import type { CSSProperties, ReactNode } from 'react';

import { voiceSpecimenVariants } from './voice-specimen-variants';

export type TVoiceSpecimenTheme = {
  tokenStyle: CSSProperties;
  isDark: boolean;
  headingFontFamily: string;
  bodyFontFamily: string;
};

export type TVoiceSpecimenProps = {
  surface: TVoiceSurface;
  locale: TLocaleIsoCode;
  values: TVoiceLocaleDraft;
  openListFieldId?: TVoiceFieldId;
  focusedFieldId?: TVoiceFieldId;
  theme: TVoiceSpecimenTheme;
};

type TListSample = 'blogList' | 'topic' | 'tag' | 'topics' | 'tags';

type TSpecimenPlacement =
  | { slot: 'eyebrow' | 'heading' | 'body' }
  | { slot: 'list'; sample: TListSample }
  | { slot: 'bookmarks' };

const SPECIMEN_PLACEMENT: Record<TVoiceFieldId, TSpecimenPlacement> = {
  blogListEmpty: { slot: 'list', sample: 'blogList' },
  topicEmpty: { slot: 'list', sample: 'topic' },
  tagEmpty: { slot: 'list', sample: 'tag' },
  topicsEmpty: { slot: 'list', sample: 'topics' },
  tagsEmpty: { slot: 'list', sample: 'tags' },
  notFoundEyebrow: { slot: 'eyebrow' },
  notFoundHeading: { slot: 'heading' },
  notFoundSupportingText: { slot: 'body' },
  localeErrorTitle: { slot: 'heading' },
  localeErrorDescription: { slot: 'body' },
  bookmarksEmpty: { slot: 'bookmarks' },
};

export const VoiceSpecimen = ({
  surface,
  locale,
  values,
  openListFieldId,
  focusedFieldId,
  theme,
}: TVoiceSpecimenProps) => {
  const t = useTranslations('voiceSpecimen');
  const site = SITE_MESSAGES_BY_LOCALE[locale];
  const { tokenStyle, isDark, headingFontFamily, bodyFontFamily } = theme;
  const s = voiceSpecimenVariants({ isDark });
  const fields = voiceFieldsOf(surface);

  const valueOf = (field: TVoiceField) =>
    resolveVoiceValue(locale, field, values[field.id]);

  const framed = (
    field: TVoiceField,
    children: ReactNode,
    isInline = false,
  ) => (
    <VoiceKeyFrame
      fieldId={field.id}
      isFocused={field.id === focusedFieldId}
      isInline={isInline}
    >
      {children}
    </VoiceKeyFrame>
  );

  const placed = (slot: TSpecimenPlacement['slot']) =>
    fields.filter(({ id }) => SPECIMEN_PLACEMENT[id].slot === slot);

  const renderPage = (actions: ReactNode) => {
    const [eyebrow] = placed('eyebrow');
    const [heading] = placed('heading');
    const [body] = placed('body');
    const eyebrowText = eyebrow && valueOf(eyebrow);

    return (
      <div className={s.page()}>
        {eyebrow &&
          typeof eyebrowText === 'string' &&
          eyebrowText.trim() !== '' &&
          framed(eyebrow, <Eyebrow>{eyebrowText}</Eyebrow>)}
        {heading &&
          framed(
            heading,
            <Heading level={3} visual="hero">
              <VoiceRichText value={valueOf(heading)} />
            </Heading>,
          )}
        {body && (
          <Text className={s.copy()}>
            {framed(body, <VoiceRichText value={valueOf(body)} />, true)}
          </Text>
        )}
        <div className={s.actions()}>{actions}</div>
      </div>
    );
  };

  const renderList = () => {
    const lists = placed('list');
    const field = lists.find(({ id }) => id === openListFieldId) ?? lists[0];
    if (!field) return null;
    const placement = SPECIMEN_PLACEMENT[field.id];
    if (placement.slot !== 'list') return null;
    const heading = t(`lists.${placement.sample}.heading`);

    return (
      <div className={s.listPage()}>
        <Eyebrow>{t(`lists.${placement.sample}.eyebrow`)}</Eyebrow>
        <Heading level={3} visual="section">
          {heading}
        </Heading>
        <Text variant="meta">{t(`lists.${placement.sample}.count`)}</Text>
        <p className={s.emptyMessage()}>
          {framed(
            field,
            <VoiceRichText value={valueOf(field)} params={{ name: heading }} />,
            true,
          )}
        </p>
      </div>
    );
  };

  const renderBookmarks = () => {
    const [field] = placed('bookmarks');
    if (!field) return null;

    return (
      <div className={s.bookmarksPage()}>
        <Heading level={3} visual="page">
          {site.bookmarksPage.title}
        </Heading>
        <Panel>
          <Panel.Header headingLevel={4}>
            {site.bookmarksPage.listHeading}
          </Panel.Header>
          <Panel.Body>
            <BookmarksList
              rows={[]}
              emptyMessage={framed(
                field,
                <VoiceRichText value={valueOf(field)} />,
                true,
              )}
            />
          </Panel.Body>
        </Panel>
      </div>
    );
  };

  const SPECIMEN_BY_SURFACE: Record<TVoiceSurface, () => ReactNode> = {
    [VOICE_SURFACE.NOT_FOUND]: () =>
      renderPage(
        <LinkButton href="#" variant="ghost" size={SIZE.SM}>
          {site.notFound.returnHome}
        </LinkButton>,
      ),
    [VOICE_SURFACE.ERROR]: () =>
      renderPage(
        <>
          <Button type="button" size={SIZE.SM}>
            {site.localeErrorPage.retry}
          </Button>
          <LinkButton href="#" variant="ghost" size={SIZE.SM}>
            {site.localeErrorPage.goHome}
          </LinkButton>
        </>,
      ),
    [VOICE_SURFACE.ARCHIVE]: renderList,
    [VOICE_SURFACE.BOOKMARKS]: renderBookmarks,
  };

  return (
    <div
      inert={true}
      className={s.root()}
      style={
        {
          ...tokenStyle,
          '--font-display': headingFontFamily,
          '--font-read': bodyFontFamily,
        } as CSSProperties
      }
      data-testid={`voice-specimen-${surface}`}
    >
      {SPECIMEN_BY_SURFACE[surface]()}
    </div>
  );
};
