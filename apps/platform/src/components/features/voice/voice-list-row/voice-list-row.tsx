import { routes, type TVoiceFieldId, type VOICE_SURFACE } from '@blog/config';
import type { TLocaleIsoCode } from '@blog/config/constants';
import { Accordion } from '@platform/components/shared/accordion';
import { FieldStatus } from '@platform/components/shared/field-status';
import {
  isSameVoiceValue,
  isVoiceValueCustomised,
  voiceDefaultText,
  voiceValueAsText,
  type TVoiceDraftValue,
  type TVoiceField,
} from '@platform/utils/voice-draft/voice-draft';
import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { voiceListRowVariants } from './voice-list-row-variants';

type TVoiceListFieldId = Extract<
  TVoiceField,
  {
    surface: typeof VOICE_SURFACE.ARCHIVE;
  }
>['id'];

const LIST_ROUTE_HINTS: Partial<Record<TVoiceFieldId, string>> = {
  blogListEmpty: routes.blogIndex(),
  topicEmpty: routes.topic('…'),
  tagEmpty: routes.tag('…'),
  topicsEmpty: routes.topics(),
  tagsEmpty: routes.tags(),
} satisfies Record<TVoiceListFieldId, string>;

export type TVoiceListRowProps = {
  field: TVoiceField;
  locale: TLocaleIsoCode;
  value: TVoiceDraftValue;
  savedValue: TVoiceDraftValue;
  hasError: boolean;
  isOpen: boolean;
  children: ReactNode;
};

export const VoiceListRow = ({
  field,
  locale,
  value,
  savedValue,
  hasError,
  isOpen,
  children,
}: TVoiceListRowProps) => {
  const tLabels = useTranslations('voiceFieldLabels');
  const {
    labelGroup,
    label,
    routeHint: routeHintSlot,
    text,
  } = voiceListRowVariants({ hasError });
  const isCustomised = isVoiceValueCustomised(value);
  const routeHint = LIST_ROUTE_HINTS[field.id];

  return (
    <Accordion.Item value={field.id}>
      <Accordion.Trigger>
        <span className={labelGroup()}>
          <span className={label()}>{tLabels(field.id)}</span>
          {routeHint && <span className={routeHintSlot()}>{routeHint}</span>}
        </span>
        {!isOpen && (
          <>
            <span className={text()}>
              {isCustomised
                ? voiceValueAsText(value)
                : voiceDefaultText(locale, field)}
            </span>
            <FieldStatus
              isCustomised={isCustomised}
              isUnsaved={!isSameVoiceValue(value, savedValue)}
            />
          </>
        )}
      </Accordion.Trigger>
      <Accordion.Panel>{children}</Accordion.Panel>
    </Accordion.Item>
  );
};
