import { previewAddressBarVariants } from './preview-address-bar-variants';

export type TPreviewAddressBarProps = {
  address: string;
  isDark: boolean;
};

export const PreviewAddressBar = ({
  address,
  isDark,
}: TPreviewAddressBarProps) => {
  const {
    root,
    dots,
    dot,
    address: addressSlot,
  } = previewAddressBarVariants({
    isDark,
  });

  return (
    <div className={root()}>
      <span aria-hidden="true" className={dots()}>
        <span className={dot()} />
        <span className={dot()} />
        <span className={dot()} />
      </span>
      <span className={addressSlot()}>{address}</span>
    </div>
  );
};
