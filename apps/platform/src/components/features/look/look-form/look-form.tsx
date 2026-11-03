'use client';

import type { TLocaleIsoCode } from '@blog/config';
import type { TTenantPlan } from '@blog/db/constants';
import { isUndefined } from '@blog/utils/primitives';
import { LookEditCards } from '@platform/components/features/look/look-form/components/look-edit-cards';
import { LookFormProvider } from '@platform/components/features/look/look-form-provider';
import { LookPreview } from '@platform/components/features/look/look-preview';
import { SettingsFormShell } from '@platform/components/shared/settings-form-shell';
import { useViewTabs, ViewTabs } from '@platform/components/shared/view-tabs';
import { LOOK_LAYOUT_LIMIT } from '@platform/constants/look-layout';
import { VIEW_TABS_VARIANT } from '@platform/constants/view-tabs';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';
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
  hasCompactGap: true,
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
  const { view, tabsProps, panelProps } = useViewTabs({
    isTabbed: isUndefined(layoutWidth)
      ? undefined
      : layoutWidth < LOOK_LAYOUT_LIMIT.TWO_COLUMN_MIN_WIDTH,
  });
  const t = useTranslations('lookForm');
  const { groupProps, revealRow } = useLookOpenRows();
  const { lookForm, isPending, form } = useLookFormState({
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

  const { layout, columns, editPanel, previewPanel } = lookFormVariants();

  return (
    <SettingsFormShell
      title={t('heading')}
      description={t('subtitle')}
      form={form}
      layout={SHELL_LAYOUT}
    >
      <LookFormProvider value={lookForm}>
        <div ref={layoutRef} className={layout()}>
          <ViewTabs
            {...tabsProps}
            variant={VIEW_TABS_VARIANT.UNDERLINE}
            isSticky={true}
            ariaLabel={t('viewTabsAriaLabel')}
          />
          <div className={columns()}>
            <div
              {...panelProps('edit')}
              inert={isPending}
              data-testid="look-form-edit-panel"
              className={editPanel({ isActive: view === 'edit' })}
            >
              <LookEditCards
                styleGroup={groupProps(STYLE_ROWS)}
                sitePartsGroup={groupProps(SITE_PARTS_ROWS)}
                hasCookieBanner={hasCookieBanner}
                hasMultipleLanguages={liveLocales.length > 1}
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
