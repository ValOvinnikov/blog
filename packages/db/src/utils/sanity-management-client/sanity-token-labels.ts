export type TSanityTokenLabels = {
  management: string;
  read: string;
  write: string;
};

export function buildSanityTokenLabels(
  productName: string,
): TSanityTokenLabels {
  return {
    management: productName,
    read: `${productName} web-read`,
    write: `${productName} web-write`,
  };
}
