import {
  SITE_MESSAGES_BY_LOCALE,
  SIZE,
  VOICE_SURFACE,
  type TVoiceFieldId,
  type TVoiceSurface,
} from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { Button } from '@blog/ui/components/atoms/button';
import { LinkButton } from '@blog/ui/components/molecules/link-button';
import { SiteThemeFrame } from '@platform/components/features/site-preview/site-theme-frame';
import type { TSitePreviewTheme } from '@platform/utils/theme-preview-tokens/theme-preview-tokens';
import {
  resolveVoiceValue,
  voiceFieldsOf,
  type TVoiceField,
  type TVoiceLocaleDraft,
} from '@platform/utils/voice-draft/voice-draft';
import type { ReactNode } from 'react';

import { SpecimenBookmarks } from './components/specimen-bookmarks/specimen-bookmarks';
import {
  SpecimenList,
  type TSpecimenListSample,
} from './components/specimen-list/specimen-list';
import { SpecimenPage } from './components/specimen-page/specimen-page';
import { voiceSpecimenVariants } from './voice-specimen-variants';

type TListSample = 'blogList' | 'topic' | 'tag' | 'topics' | 'tags';

export type TVoiceListSamples = Record<TListSample, TSpecimenListSample>;

export type TVoiceSpecimenProps = {
  surface: TVoiceSurface;
  locale: TLocaleIsoCode;
  values: TVoiceLocaleDraft;
  listSamples: TVoiceListSamples;
  openListFieldId?: TVoiceFieldId;
  focusedFieldId?: TVoiceFieldId;
  theme: TSitePreviewTheme;
};

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
  listSamples,
  openListFieldId,
  focusedFieldId,
  theme,
}: TVoiceSpecimenProps) => {
  const site = SITE_MESSAGES_BY_LOCALE[locale];
  const s = voiceSpecimenVariants();
  const fields = voiceFieldsOf(surface);

  const valueOf = (field: TVoiceField) =>
    resolveVoiceValue(locale, field, values[field.id]);

  const placed = (slot: TSpecimenPlacement['slot']) =>
    fields.filter(({ id }) => SPECIMEN_PLACEMENT[id].slot === slot);

  const placedOne = (slot: TSpecimenPlacement['slot']) => {
    const [field] = placed(slot);
    return field && { fieldId: field.id, value: valueOf(field) };
  };

  const page = (actions: ReactNode) => (
    <SpecimenPage
      eyebrow={placedOne('eyebrow')}
      heading={placedOne('heading')}
      body={placedOne('body')}
      focusedFieldId={focusedFieldId}
      actions={actions}
    />
  );

  const list = () => {
    const lists = placed('list');
    const field = lists.find(({ id }) => id === openListFieldId) ?? lists[0];
    if (!field) return null;
    const placement = SPECIMEN_PLACEMENT[field.id];
    if (placement.slot !== 'list') return null;

    return (
      <SpecimenList
        fieldId={field.id}
        value={valueOf(field)}
        sample={listSamples[placement.sample]}
        focusedFieldId={focusedFieldId}
      />
    );
  };

  const bookmarks = () => {
    const field = placedOne('bookmarks');
    if (!field) return null;

    return (
      <SpecimenBookmarks
        {...field}
        focusedFieldId={focusedFieldId}
        pageTitle={site.bookmarksPage.title}
        listHeading={site.bookmarksPage.listHeading}
      />
    );
  };

  const SPECIMEN_BY_SURFACE: Record<TVoiceSurface, () => ReactNode> = {
    [VOICE_SURFACE.NOT_FOUND]: () =>
      page(
        <LinkButton href="#" variant="ghost" size={SIZE.SM}>
          {site.notFound.returnHome}
        </LinkButton>,
      ),
    [VOICE_SURFACE.ERROR]: () =>
      page(
        <>
          <Button type="button" size={SIZE.SM}>
            {site.localeErrorPage.retry}
          </Button>
          <LinkButton href="#" variant="ghost" size={SIZE.SM}>
            {site.localeErrorPage.goHome}
          </LinkButton>
        </>,
      ),
    [VOICE_SURFACE.ARCHIVE]: list,
    [VOICE_SURFACE.BOOKMARKS]: bookmarks,
  };

  return (
    <SiteThemeFrame
      theme={theme}
      className={s.root()}
      testId={`voice-specimen-${surface}`}
    >
      {SPECIMEN_BY_SURFACE[surface]()}
    </SiteThemeFrame>
  );
};
