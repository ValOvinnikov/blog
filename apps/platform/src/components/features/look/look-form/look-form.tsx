'use client';

import type { TLocaleIsoCode } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import { hasArrayGotMultipleItems, isUndefined } from '@blog/utils/primitives';
import { LookEditCards } from '@platform/components/features/look/look-form/components/look-edit-cards';
import { LookFormProvider } from '@platform/components/features/look/look-form-provider';
import { LookJumpIndex } from '@platform/components/features/look/look-jump-index';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import { LOOK_EDIT_PANEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { LOOK_ROW } from '@platform/constants/look-row';
import { SETTINGS_FORM_STACK } from '@platform/constants/settings-form';
import { VIEW_TABS_VARIANT } from '@platform/constants/view-tabs';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { buildLookRowSummaries } from '@platform/utils/look-form-values/look-row-summaries';
import {
  SITE_PARTS_ROWS,
  STYLE_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { lookFormVariants } from './look-form-variants';
import { LOOK_ROW_TITLE_KEY } from './look-row-title-key';
import { useLookFormState } from './use-look-form-state';
import { useLookOpenRows } from './use-look-open-rows';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  siteHost: string;
  initialValues: TLookFormValues;
  plan: TTenantPlan;
  liveLocales: readonly TLocaleIsoCode[];
  hasReaderAccounts: boolean;
  hasCookieBanner: boolean;
  savedAt?: Date;
  archivedAt?: Date;
};

const SHELL_LAYOUT = {
  isWide: true,
  isTitleHiddenBelowLg: true,
  stack: SETTINGS_FORM_STACK.LOOK,
};

export const LookForm = ({
  tenantId,
  tenantName,
  siteHost,
  initialValues,
  plan,
  liveLocales,
  hasReaderAccounts,
  hasCookieBanner,
  savedAt,
  archivedAt,
}: TLookFormProps) => {
  const layoutRef = useRef<HTMLDivElement>(null);
  const layoutWidth = useElementSize(layoutRef)?.width;
  const { view, hasTabPanels, tabsProps, panelProps } = useViewTabs({
    isTabbed: isUndefined(layoutWidth)
      ? undefined
      : layoutWidth < LOOK_LAYOUT_LIMIT.TWO_COLUMN_MIN_WIDTH,
  });
  const t = useTranslations('lookForm');
  const hasMultipleLanguages = hasArrayGotMultipleItems(liveLocales);
  const { groupProps, revealRow, revealCard, engageCardAt, jumpIndex } =
    useLookOpenRows();
  const { lookForm, isPending, form, errorTitle } = useLookFormState({
    tenantId,
    tenantName,
    initialValues,
    plan,
    savedAt,
    archivedAt,
    revealInvalidField: (row) => {
      tabsProps.onChange('edit');
      revealRow(row);
    },
  });

  const unsavedCards = Object.values(LOOK_ROW)
    .filter(lookForm.hasCardChanges)
    .map((row) => ({
      name: t(LOOK_ROW_TITLE_KEY[row]),
      onSelect: () => revealCard(row),
    }));

  const isPreviewTab = hasTabPanels && view === 'preview';
  const { layout, columns, editPanel, previewPanel } = lookFormVariants();

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('subtitle')}
      form={form}
      errorTitle={errorTitle}
      layout={SHELL_LAYOUT}
      unsavedCards={unsavedCards}
      isSaveBarHidden={isPreviewTab}
    >
      <LookFormProvider value={lookForm}>
        <div ref={layoutRef} className={layout()}>
          <ViewTabs
            {...tabsProps}
            variant={VIEW_TABS_VARIANT.UNDERLINE}
            isSticky={true}
            ariaLabel={t('viewTabsAriaLabel')}
          />
          {!isPreviewTab && <LookJumpIndex {...jumpIndex} />}
          <div className={columns()}>
            <div
              {...panelProps('edit')}
              inert={isPending}
              onFocus={(event) => engageCardAt(event.target)}
              data-testid={LOOK_EDIT_PANEL_TEST_ID}
              className={editPanel({ isActive: view === 'edit' })}
            >
              <LookEditCards
                styleGroup={groupProps(STYLE_ROWS)}
                sitePartsGroup={groupProps(SITE_PARTS_ROWS)}
                hasCookieBanner={hasCookieBanner}
                hasMultipleLanguages={hasMultipleLanguages}
                summaries={buildLookRowSummaries(lookForm.values, t, {
                  hasMultipleLanguages,
                })}
              />
            </div>

            <div
              {...panelProps('preview')}
              className={previewPanel({ isActive: view === 'preview' })}
            >
              <LookPreview
                liveLocales={liveLocales}
                hasReaderAccounts={hasReaderAccounts}
                siteHost={siteHost}
              />
            </div>
          </div>
        </div>
      </LookFormProvider>
    </SettingsFormShell>
  );
};
