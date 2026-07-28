import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/styled';
import { MessageService } from 'primeng/api';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';

const honeyPrimary = {
  50: '#FDF7EA', 100: '#F9ECC8', 200: '#F2D990',
  300: '#E8BF55', 400: '#E0AD33', 500: '#D9A02B',
  600: '#B8841C', 700: '#966A15', 800: '#745010',
  900: '#52370C', 950: '#302006',
};

const inkSurfaceLight = { 0: '#FFFFFF', 50: '#F6F5F2', 100: '#EDEBE4', 200: '#E0DDD4', 300: '#C8C4B8', 400: '#A8A394', 500: '#8A8578', 600: '#6C685E', 700: '#4F4C45', 800: '#34322E', 900: '#1C1B18', 950: '#10131F' };

const inkSurfaceDark = { 0: '#10131F', 50: '#1A1D2E', 100: '#23273C', 200: '#2D324B', 300: '#393F59', 400: '#474D69', 500: '#565C7A', 600: '#676D8C', 700: '#7A809F', 800: '#8F95B3', 900: '#A6ACC8', 950: '#C0C5DD' };

const SHMpreset = definePreset({
  semantic: {
    primary: honeyPrimary,
    colorScheme: {
      light: { primary: honeyPrimary, surface: inkSurfaceLight },
      dark: { primary: honeyPrimary, surface: inkSurfaceDark },
    },
  },
  components: {
    button: {
      colorScheme: {
        light: { root: { borderRadius: '8px', fontWeight: '600', paddingX: '1.25rem', paddingY: '0.5rem', transitionDuration: '0.2s' } },
        dark: { root: { borderRadius: '8px', fontWeight: '600', paddingX: '1.25rem', paddingY: '0.5rem', transitionDuration: '0.2s' } },
      },
    },
    inputtext: {
      colorScheme: {
        light: { root: { borderWidth: '1.5px', borderRadius: '8px', borderColor: 'rgba(16,19,31,0.10)', transitionDuration: '0.2s', focusRing: { width: '0', shadow: '0 0 0 2px rgba(217,160,43,0.25)' } } },
        dark: { root: { borderWidth: '1.5px', borderRadius: '8px', borderColor: 'rgba(246,245,242,0.10)', transitionDuration: '0.2s', focusRing: { width: '0', shadow: '0 0 0 2px rgba(217,160,43,0.35)' } } },
      },
    },
    select: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderColor: 'rgba(16,19,31,0.10)' } },
        dark: { root: { borderRadius: '8px', borderColor: 'rgba(246,245,242,0.10)' } },
      },
    },
    card: {
      colorScheme: {
        light: { root: { borderRadius: '10px', shadow: '0 1px 3px rgba(16,19,31,0.05)', borderWidth: '1px', borderColor: 'rgba(16,19,31,0.08)' } },
        dark: { root: { borderRadius: '10px', shadow: '0 1px 3px rgba(0,0,0,0.2)', borderWidth: '1px', borderColor: 'rgba(246,245,242,0.08)' } },
      },
    },
    tag: {
      colorScheme: {
        light: { root: { borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', paddingX: '0.5rem', paddingY: '0.15rem' } },
        dark: { root: { borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', paddingX: '0.5rem', paddingY: '0.15rem' } },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    providePrimeNG({ ripple: true, theme: { preset: SHMpreset, options: { darkModeSelector: '[data-theme="dark"]' } } }),
    MessageService,
  ],
};
