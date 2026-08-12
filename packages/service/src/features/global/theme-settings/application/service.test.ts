import { createThemeSettingsService } from './service';

describe('createThemeSettingsService', () => {
  it('exposes v1.getTheme as a function', () => {
    const svc = createThemeSettingsService();
    expect(typeof svc.v1.getTheme).toBe('function');
  });
});
