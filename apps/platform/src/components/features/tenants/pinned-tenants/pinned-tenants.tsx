'use client';

import { usePinnedTenants } from '@platform/components/features/tenants/pinned-tenants-provider';
import { Button } from '@platform/components/shared/button';
import { Card } from '@platform/components/shared/card';
import { Icon } from '@platform/components/shared/icon';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { FOCUS_RING_GROUND } from '@platform/constants/focus-ring';
import { ICON_SIZE } from '@platform/constants/icon';
import { ICONS, SIZE } from '@shinefold/config';
import { hasLength } from '@shinefold/utils/primitives';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';

import { PinnedTenantTile } from './components/tile/pinned-tenant-tile';
import { pinnedTenantsVariants } from './pinned-tenants-variants';
import { useFirstRowCount } from './use-first-row-count';
import { usePinnedTilesFocus } from './use-pinned-tiles-focus';

export const PinnedTenants = () => {
  const t = useTranslations('pinnedTenants');
  const [isExpanded, setIsExpanded] = useState(false);
  const listId = useId();
  const { title, accessibleTitle, count, list } = pinnedTenantsVariants({
    isExpanded,
  });
  const { pinnedTenants } = usePinnedTenants();
  const { listRef, firstRowCount } = useFirstRowCount(pinnedTenants.length);
  const firstRow = firstRowCount ?? pinnedTenants.length;
  const { unpin, unpinButtonRef, toggleRef } = usePinnedTilesFocus({
    listRef,
    firstRow,
    isExpanded,
  });

  if (!hasLength(pinnedTenants)) {
    return null;
  }

  const total = pinnedTenants.length;
  const hasOverflow = firstRow < total;

  return (
    <Card>
      <Card.Header
        title={
          <>
            <span aria-hidden="true" className={title()}>
              <Icon name={ICONS.PIN} size={ICON_SIZE.MD} />
              {t('title')}
              <span className={count()}>{total}</span>
            </span>
            <span className={accessibleTitle()}>
              {t('titleAccessible', { count: total })}
            </span>
          </>
        }
        actions={
          hasOverflow && (
            <Button
              ref={toggleRef}
              variant={BUTTON_VARIANT.SECONDARY}
              size={SIZE.SM}
              focusGround={FOCUS_RING_GROUND.SURFACE_HEAD}
              aria-expanded={isExpanded}
              aria-controls={listId}
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {t(isExpanded ? 'showLess' : 'showAll', { count: total })}
            </Button>
          )
        }
      />
      <Card.Body>
        <ul id={listId} ref={listRef} className={list()}>
          {pinnedTenants.map((tenant, index) => (
            <PinnedTenantTile
              key={tenant.id}
              tenant={tenant}
              isInert={!isExpanded && index >= firstRow}
              onUnpin={() => unpin(tenant)}
              unpinButtonRef={unpinButtonRef(tenant.id)}
            />
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
};
