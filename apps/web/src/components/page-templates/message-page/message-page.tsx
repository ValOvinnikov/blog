import { Heading } from '@blog/ui/components/atoms/heading';
import { Text } from '@blog/ui/components/atoms/text';
import { tv } from '@blog/ui/lib/styling';
import type { ReactNode } from 'react';

const s = tv({
  slots: {
    root: [
      'mx-auto w-full max-w-page',
      'flex flex-col items-center gap-6',
      'px-gutter py-page-y text-center',
    ],
    copy: ['max-w-copy'],
  },
})();

export interface IMessagePageProps {
  title: string;
  message: string;
  children: ReactNode;
}

export const MessagePage = ({
  title,
  message,
  children,
}: IMessagePageProps) => (
  <main className={s.root()}>
    <Heading level={1} visual="page">
      {title}
    </Heading>
    <Text className={s.copy()}>{message}</Text>
    {children}
  </main>
);
