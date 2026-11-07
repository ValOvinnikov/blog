'use client';

import type { TLocaleIsoCode } from '@blog/config';
import { LOOK_FIELD, TENANT_PLAN, type TTenantPlan } from '@blog/db/constants';
import { hasArrayGotMultipleItems, isUndefined } from '@blog/utils/primitives';
import { LookEditCards } from '@platform/components/features/look/look-form/components/look-edit-cards';
import { LookFormProvider } from '@platform/components/features/look/look-form-provider';
import { LookJumpIndex } from '@platform/components/features/look/look-jump-index';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import { LOOK_EDIT_PANEL_TEST_ID } from '@platform/constants/look-form';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { SETTINGS_FORM_STACK } from '@platform/constants/settings-form';
import { VIEW_TABS_VARIANT } from '@platform/constants/view-tabs';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
import { toLookFollowTarget } from '@platform/utils/look-follow-target/look-follow-target';
import { buildLookRowSummaries } from '@platform/utils/look-form-values/look-row-summaries';
import {
  SITE_PARTS_ROWS,
  STYLE_ROWS,
} from '@platform/utils/look-open-rows/look-open-rows';
import { useElementSize } from '@platform/utils/use-element-size/use-element-size';
import { useTranslations } from 'next-intl';
import { useRef } from 'react';

import { lookFormVariants } from './look-form-variants';
import { useLookFormState } from './use-look-form-state';
import { useLookOpenRows } from './use-look-open-rows';
import { useLookUnsavedCards } from './use-look-unsaved-cards';

export type TLookFormProps = {
  tenantId: string;
  tenantName: string;
  siteHost: string;
  initialValues: TLookFormValues;
  plan: TTenantPlan;
  isOperator: boolean;
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
  isOperator,
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

  const unsavedCards = useLookUnsavedCards(lookForm, revealCard);

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
                hasGrowthNote={plan === TENANT_PLAN.FREE && !isOperator}
                onSelectCard={jumpIndex.onSelectCard}
                summaries={buildLookRowSummaries(lookForm.values, t, {
                  hasMultipleLanguages:
                    hasMultipleLanguages &&
                    !lookForm.isLocked(LOOK_FIELD.LANGUAGE_SWITCHER_STYLE),
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
                hasCookieBanner={hasCookieBanner}
                siteHost={siteHost}
                followTarget={toLookFollowTarget(
                  jumpIndex.openRows,
                  jumpIndex.editedCard,
                  jumpIndex.isAllOpen,
                )}
                isShown={!hasTabPanels || isPreviewTab}
                isScrollingWithPage={hasTabPanels}
              />
            </div>
          </div>
        </div>
      </LookFormProvider>
    </SettingsFormShell>
  );
};
