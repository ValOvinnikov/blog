import type { ReactNode } from 'react';

export type TTeamDateProps = {
  date: Date;
  children: ReactNode;
};

export const TeamDate = ({ date, children }: TTeamDateProps) => (
  <time dateTime={date.toISOString()}>{children}</time>
);
