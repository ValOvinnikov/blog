'use client';

import { CONSENT_CATEGORY } from '@shinefold/config';
import { GOOGLE_TAG_MANAGER_ORIGIN } from '@web/config/analytics-origins';
import { CONSENT_STATUS } from '@web/constants/consent';
import { useConsent } from '@web/hooks/use-consent';
import Script from 'next/script';
import { useEffect } from 'react';

export interface IGoogleAnalyticsProps {
  measurementId: string;
}

const toConfigScript = (measurementId: string) =>
  `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config',${JSON.stringify(measurementId)});`;

export const GoogleAnalytics = ({ measurementId }: IGoogleAnalyticsProps) => {
  const { status } = useConsent(CONSENT_CATEGORY.ANALYTICS);
  const isGranted = status === CONSENT_STATUS.GRANTED;

  useEffect(() => {
    // Google's documented opt-out: a loaded gtag sends nothing for this id while the flag is true.
    Reflect.set(window, `ga-disable-${measurementId}`, !isGranted);
  }, [measurementId, isGranted]);

  if (!isGranted) return null;

  return (
    <>
      <Script
        src={`${GOOGLE_TAG_MANAGER_ORIGIN}/gtag/js?id=${encodeURIComponent(measurementId)}`}
      />
      <Script id={`google-analytics-${measurementId}`}>
        {toConfigScript(measurementId)}
      </Script>
    </>
  );
};
