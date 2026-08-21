import { topbarVariants } from './topbar-variants';

export type TTopbarProps = {
  /** e.g. "Platform" or "Tenant · acme". */
  crumb: string;
  /** e.g. "ADMIN" or "OWNER". */
  roleLabel: string;
};

export const Topbar = ({ crumb, roleLabel }: TTopbarProps) => {
  const { root, crumb: crumbClass, role } = topbarVariants();

  return (
    <header className={root()}>
      <p className={crumbClass()}>{crumb}</p>
      <span className={role()}>{roleLabel}</span>
    </header>
  );
};
