export function localizedValues(
  type: string,
  values: Partial<Record<string, unknown>>,
) {
  return Object.entries(values).map(([language, value]) => ({
    _key: language,
    _type: type,
    language,
    value,
  }));
}

export function localizedStrings(values: Partial<Record<string, string>>) {
  return localizedValues('internationalizedArrayStringValue', values);
}
