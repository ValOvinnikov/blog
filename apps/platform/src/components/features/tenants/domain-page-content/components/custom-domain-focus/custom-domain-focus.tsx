'use client';

import { focusRequestedCustomDomainCard } from '@platform/utils/custom-domain-focus/custom-domain-focus';
import { useEffect } from 'react';

export const CustomDomainFocus = () => {
  useEffect(() => {
    focusRequestedCustomDomainCard();
  });

  return null;
};
