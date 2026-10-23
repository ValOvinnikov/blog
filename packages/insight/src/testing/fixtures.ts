export const MOCK_LINE_SEPARATOR = String.fromCharCode(0x2028);
export const MOCK_PARAGRAPH_SEPARATOR = String.fromCharCode(0x2029);
export const MOCK_SERVICE = 'web';
export const MOCK_EVENT = 'request.failed';
export const MOCK_ERROR_MESSAGE = 'boom';
export const MOCK_SEPARATORS = [
  ['U+2028', MOCK_LINE_SEPARATOR],
  ['U+2029', MOCK_PARAGRAPH_SEPARATOR],
] as const;
