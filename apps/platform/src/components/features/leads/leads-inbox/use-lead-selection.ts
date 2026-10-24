import { ACTION_OUTCOME, type TMaybeUndefined } from '@blog/config';
import { useLeadsTenantId } from '@platform/components/features/leads/leads-tenant-provider';
import { useToast } from '@platform/context/toast-provider';
import { setLeadReadAction } from '@platform/server/leads/set-lead-read-action';
import type { TInboxLead } from '@platform/server/leads/to-inbox-lead';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

type TUseLeadSelectionInput = {
  updateLead: (id: string, change: Partial<TInboxLead>) => void;
  removeLead: (id: string) => void;
};

export const useLeadSelection = ({
  updateLead,
  removeLead,
}: TUseLeadSelectionInput) => {
  const t = useTranslations('leadsInbox');
  const tenantId = useLeadsTenantId();
  const router = useRouter();
  const toast = useToast();
  const [selectedId, setSelectedId] = useState<TMaybeUndefined<string>>();

  const setReadState = async (
    { id, isRead: wasRead }: TInboxLead,
    isRead: boolean,
  ) => {
    updateLead(id, { isRead });
    const result = await setLeadReadAction(tenantId, id, isRead);
    if (result.outcome === ACTION_OUTCOME.SUCCESS) {
      router.refresh();
      return;
    }
    updateLead(id, { isRead: wasRead });
    toast.error({ message: t('readStateFailed') });
  };

  const open = (lead: TInboxLead) => {
    setSelectedId(lead.id);
    if (!lead.isRead) void setReadState(lead, true);
  };

  const markUnread = (lead: TInboxLead) => {
    setSelectedId(undefined);
    void setReadState(lead, false);
  };

  const close = () => setSelectedId(undefined);

  const handleDeleted = (id: string) => {
    removeLead(id);
    setSelectedId(undefined);
    router.refresh();
  };

  return { selectedId, open, markUnread, close, handleDeleted };
};
