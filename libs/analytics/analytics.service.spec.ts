import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    localStorage.clear();
    service = new AnalyticsService();
    consoleSpy = jest
      .spyOn(console, 'info')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    consoleSpy.mockRestore();
    localStorage.clear();
  });

  it('logs aggregated recipe tracking events when enabled', () => {
    service.trackRecipeTracking({
      action: 'create',
      mealType: 'lunch',
      portion: 1.5,
      platform: 'web',
    });
    expect(consoleSpy).toHaveBeenCalledWith('[analytics]', 'recipeTracking', {
      action: 'create',
      mealType: 'lunch',
      portion: 1.5,
      platform: 'web',
    });
  });

  it('respects opt-out flag in localStorage', () => {
    localStorage.setItem('cooksona.analytics.optOut', '1');
    service.trackRecipeTracking({
      action: 'update',
      mealType: 'dinner',
      portion: 2,
      platform: 'web',
    });
    expect(consoleSpy).not.toHaveBeenCalled();
  });
});
