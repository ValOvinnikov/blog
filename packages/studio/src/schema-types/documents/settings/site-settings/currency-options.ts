const currencyDisplayNames = new Intl.DisplayNames(['en'], {
  type: 'currency',
});

export const currencyOptionList = Intl.supportedValuesOf('currency').map(
  (code) => ({
    title: `${code} — ${currencyDisplayNames.of(code)}`,
    value: code,
  }),
);
