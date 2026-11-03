import type { TMaybeUndefined } from '@blog/config';
import type { TSuspensionCategory } from '@blog/db/constants';
import type { TSuspensionCase } from '@platform/server/tenants/tenant-suspension-actions';
import { useState } from 'react';

export const useSuspensionForm = () => {
  const [category, setCategory] = useState<TSuspensionCategory | ''>('');
  const [description, setDescription] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);
  const [blockReason, setBlockReason] = useState('');

  const reset = () => {
    setCategory('');
    setDescription('');
    setIsBlocking(false);
    setBlockReason('');
  };

  const suspensionCase: TMaybeUndefined<TSuspensionCase> =
    category && description.trim() ? { category, description } : undefined;
  const ownerEmailBlock = isBlocking ? { reason: blockReason } : undefined;
  const isComplete =
    !!suspensionCase && (!isBlocking || blockReason.trim() !== '');

  return {
    caseFields: {
      category,
      onCategoryChange: setCategory,
      description,
      onDescriptionChange: setDescription,
    },
    blockFields: {
      isBlocking,
      onBlockingChange: setIsBlocking,
      reason: blockReason,
      onReasonChange: setBlockReason,
    },
    suspensionCase,
    ownerEmailBlock,
    isComplete,
    reset,
  };
};
