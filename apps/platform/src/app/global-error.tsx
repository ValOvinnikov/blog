'use client';

import '../../index.css';

import { LOCALE_BCP47_TAGS, LOCALE_ISO_CODES } from '@blog/config';
import { DeadEndView } from '@platform/components/features/layout/dead-end-view';
import { Button } from '@platform/components/shared/button';
import { inter } from '@platform/config/font-loaders/inter-font';
import { BUTTON_VARIANT } from '@platform/constants/button';
import { NextIntlClientProvider } from 'next-intl';

const globalErrorCopy = {
  brandName: 'Valstack',
  badge: 'Error',
  title: 'Valstack is having trouble',
  description:
    'Something broke on our side. Reload the page, and if it keeps happening, come back in a few minutes.',
  reload: 'Reload',
};

type TProps = {
  error: Error & { digest?: string };
  retry: () => void;
};

/** Replaces the whole document when `[locale]/layout.tsx` throws, so it sits above every provider that layout sets up. */
export default function GlobalError({ retry }: TProps) {
  return (
    <html lang={LOCALE_BCP47_TAGS.EN}>
      <body className={`${inter.variable} font-admin text-admin-14`}>
        <NextIntlClientProvider
          locale={LOCALE_ISO_CODES.EN}
          messages={{
            centeredCardFrame: { brandName: globalErrorCopy.brandName },
          }}
        >
          <DeadEndView
            badge={{ label: globalErrorCopy.badge, tone: 'bad' }}
            title={globalErrorCopy.title}
            description={globalErrorCopy.description}
            action={
              <Button
                variant={BUTTON_VARIANT.SECONDARY}
                onClick={() => retry()}
              >
                {globalErrorCopy.reload}
              </Button>
            }
          />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
