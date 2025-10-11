import {
  Injectable,
  signal,
  WritableSignal,
  computed,
  Signal,
} from '@angular/core';
import {
  Application,
  ApplicationSettings,
  Frame,
  LaunchEventData,
  Page,
  ViewBase,
} from '@nativescript/core';

type ThemeVariant = 'light' | 'dark';

const STORAGE_KEY = 'cooksona.theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly theme: WritableSignal<ThemeVariant>;
  readonly mode: Signal<ThemeVariant>;
  readonly isDark: Signal<boolean>;
  private readonly frameListeners = new WeakMap<Frame, () => void>();
  private readonly pageListeners = new WeakMap<Page, () => void>();

  constructor() {
    const storedTheme = ApplicationSettings.getString(STORAGE_KEY);
    const initialTheme: ThemeVariant =
      storedTheme === 'dark' ? 'dark' : 'light';

    this.theme = signal<ThemeVariant>(initialTheme);
    this.mode = this.theme.asReadonly();
    this.isDark = computed(() => this.theme() === 'dark');

    // Ensure the theme is applied once the root view exists.
    Application.on(Application.launchEvent, (event: LaunchEventData) => {
      this.applyTheme(initialTheme, event.root as ViewBase | undefined);
    });

    // Re-apply when the app returns to foreground or resumes.
    Application.on(Application.resumeEvent, () => {
      this.applyTheme(this.theme());
    });

    // Hot reload or already running apps might not trigger launch again.
    setTimeout(() => this.applyTheme(this.theme()), 0);
  }

  get isDarkMode(): boolean {
    return this.theme() === 'dark';
  }

  toggleTheme(): void {
    this.setTheme(this.isDarkMode ? 'light' : 'dark');
  }

  setTheme(mode: ThemeVariant): void {
    if (this.theme() === mode) {
      return;
    }

    this.theme.set(mode);
    ApplicationSettings.setString(STORAGE_KEY, mode);
    this.applyTheme(mode);
  }

  private applyTheme(mode: ThemeVariant, rootOverride?: ViewBase): void {
    this.updateSystemAppearance(mode);

    const rootView =
      rootOverride ?? (Application.getRootView() as ViewBase | undefined);
    if (!rootView) {
      return;
    }

    const visited = new Set<ViewBase>();
    this.applyThemeRecursive(rootView, mode, visited, true);
  }

  private updateSystemAppearance(mode: ThemeVariant): void {
    const setSystemAppearance = (
      Application as unknown as {
        setSystemAppearance?: (value: ThemeVariant) => void;
      }
    ).setSystemAppearance;

    if (typeof setSystemAppearance === 'function') {
      setSystemAppearance.call(Application, mode);
    }
  }

  private applyThemeRecursive(
    view: ViewBase | undefined,
    mode: ThemeVariant,
    visited: Set<ViewBase>,
    applyClass: boolean,
  ): void {
    if (!view || visited.has(view)) {
      return;
    }

    visited.add(view);

    this.applyThemeToView(view, mode, applyClass);
    this.registerWatchers(view);

    const modalRoots = (
      view as unknown as {
        _getRootModalViews?: () => ViewBase[];
      }
    )._getRootModalViews;
    if (typeof modalRoots === 'function') {
      modalRoots
        .call(view)
        ?.forEach((modal) =>
          this.applyThemeRecursive(modal, mode, visited, true),
        );
    }

    if (view instanceof Frame) {
      this.applyThemeRecursive(view.currentPage, mode, visited, true);
    }

    const eachChildView = (
      view as unknown as {
        eachChildView?: (cb: (child: ViewBase) => boolean) => void;
      }
    ).eachChildView;
    if (typeof eachChildView === 'function') {
      eachChildView.call(view, (child) => {
        this.applyThemeRecursive(child, mode, visited, false);
        return true;
      });
    }

    const eachChild = (
      view as unknown as {
        eachChild?: (cb: (child: ViewBase) => boolean) => void;
      }
    ).eachChild;
    if (typeof eachChild === 'function') {
      eachChild.call(view, (child) => {
        this.applyThemeRecursive(child, mode, visited, false);
        return true;
      });
    }

    view._onCssStateChange?.();
  }

  private applyThemeToView(
    view: ViewBase,
    mode: ThemeVariant,
    shouldApply: boolean,
  ): void {
    const cssClasses = view.cssClasses;
    cssClasses.delete('ns-dark');
    cssClasses.delete('ns-light');
    if (shouldApply) {
      cssClasses.add(mode === 'dark' ? 'ns-dark' : 'ns-light');
    }
  }

  private registerWatchers(view: ViewBase): void {
    if (view instanceof Frame) {
      this.watchFrame(view);
    } else if (view instanceof Page) {
      this.watchPage(view);
    }
  }

  private watchFrame(frame: Frame): void {
    if (this.frameListeners.has(frame)) {
      return;
    }

    const handler = () => {
      const currentPage = frame.currentPage ?? (frame as any)._resolvedPage;
      if (currentPage) {
        this.applyThemeRecursive(
          currentPage,
          this.theme(),
          new Set<ViewBase>(),
          true,
        );
      }
    };

    frame.on(Frame.navigatedToEvent, handler);
    frame.on(ViewBase.loadedEvent, handler);
    const unload = () => {
      frame.off(Frame.navigatedToEvent, handler);
      frame.off(ViewBase.loadedEvent, handler);
      frame.off(ViewBase.unloadedEvent, unload);
      this.frameListeners.delete(frame);
    };
    frame.on(ViewBase.unloadedEvent, unload);

    this.frameListeners.set(frame, handler);
  }

  private watchPage(page: Page): void {
    if (this.pageListeners.has(page)) {
      return;
    }

    const handler = () => {
      this.applyThemeRecursive(page, this.theme(), new Set<ViewBase>(), true);
    };

    page.on(Page.loadedEvent, handler);
    page.on(Page.shownModallyEvent, handler);
    const unload = () => {
      page.off(Page.loadedEvent, handler);
      page.off(Page.shownModallyEvent, handler);
      page.off(ViewBase.unloadedEvent, unload);
      this.pageListeners.delete(page);
    };
    page.on(ViewBase.unloadedEvent, unload);

    this.pageListeners.set(page, handler);
  }
}
