import { ApplicationConfig, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { providePrimeNG } from 'primeng/config';
import { definePreset } from '@primeuix/styled';
import { MessageService } from 'primeng/api';

import { authInterceptor } from './core/interceptors/auth.interceptor';
import { routes } from './app.routes';

const indigoPrimary = {
  50: '#EEEDFF', 100: '#D0CEFF', 200: '#A9A5FF',
  300: '#7C77FF', 400: '#6360F0', 500: '#5B4FE0',
  600: '#4C40CD', 700: '#3D33A8', 800: '#2F2783',
  900: '#201B5E', 950: '#120F3A',
};

const inkSurfaceLight = { 0: '#FFFFFF', 50: '#F6F5F2', 100: '#EDEBE4', 200: '#E0DDD4', 300: '#C8C4B8', 400: '#A8A394', 500: '#8A8578', 600: '#6C685E', 700: '#4F4C45', 800: '#34322E', 900: '#1C1B18', 950: '#10131F' };

const inkSurfaceDark = { 0: '#10131F', 50: '#1A1D2E', 100: '#23273C', 200: '#2D324B', 300: '#393F59', 400: '#474D69', 500: '#565C7A', 600: '#676D8C', 700: '#7A809F', 800: '#8F95B3', 900: '#A6ACC8', 950: '#C0C5DD' };

const SHMpreset = definePreset({
  semantic: {
    primary: indigoPrimary,
    colorScheme: {
      light: { primary: indigoPrimary, surface: inkSurfaceLight },
      dark: { primary: indigoPrimary, surface: inkSurfaceDark },
    },
  },
  components: {
    /* ── Boutons ──────────────────────────────────────────── */
    button: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.8rem',
            paddingX: '1.25rem',
            paddingY: '0.5rem',
            transitionDuration: '0.2s',
          },
          text: { color: '#5B4FE0' },
          outlined: {
            color: '#5B4FE0',
            borderColor: 'rgba(91,79,224,0.30)',
          },
        },
        dark: {
          root: {
            borderRadius: '8px',
            fontWeight: '600',
            fontSize: '0.8rem',
            paddingX: '1.25rem',
            paddingY: '0.5rem',
            transitionDuration: '0.2s',
          },
          text: { color: '#7C77FF' },
          outlined: {
            color: '#7C77FF',
            borderColor: 'rgba(124,119,255,0.30)',
          },
        },
      },
    },

    /* ── Input text ───────────────────────────────────────── */
    inputtext: {
      colorScheme: {
        light: {
          root: {
            borderWidth: '1.5px',
            borderRadius: '8px',
            borderColor: 'rgba(16,19,31,0.10)',
            transitionDuration: '0.2s',
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            focusRing: { width: '0', shadow: '0 0 0 2px rgba(91,79,224,0.25)' },
          },
        },
        dark: {
          root: {
            borderWidth: '1.5px',
            borderRadius: '8px',
            borderColor: 'rgba(246,245,242,0.10)',
            transitionDuration: '0.2s',
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            focusRing: { width: '0', shadow: '0 0 0 2px rgba(91,79,224,0.35)' },
          },
        },
      },
    },

    /* ── Textarea ─────────────────────────────────────────── */
    textarea: {
      colorScheme: {
        light: {
          root: {
            borderWidth: '1.5px',
            borderRadius: '8px',
            borderColor: 'rgba(16,19,31,0.10)',
            transitionDuration: '0.2s',
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            focusRing: { width: '0', shadow: '0 0 0 2px rgba(91,79,224,0.25)' },
          },
        },
        dark: {
          root: {
            borderWidth: '1.5px',
            borderRadius: '8px',
            borderColor: 'rgba(246,245,242,0.10)',
            transitionDuration: '0.2s',
            paddingX: '0.75rem',
            paddingY: '0.5rem',
            focusRing: { width: '0', shadow: '0 0 0 2px rgba(91,79,224,0.35)' },
          },
        },
      },
    },

    /* ── Input number ─────────────────────────────────────── */
    inputnumber: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderColor: 'rgba(16,19,31,0.10)' } },
        dark:  { root: { borderRadius: '8px', borderColor: 'rgba(246,245,242,0.10)' } },
      },
    },

    /* ── Password ─────────────────────────────────────────── */
    password: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderColor: 'rgba(16,19,31,0.10)' } },
        dark:  { root: { borderRadius: '8px', borderColor: 'rgba(246,245,242,0.10)' } },
      },
    },

    /* ── Select (dropdown) ────────────────────────────────── */
    select: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderColor: 'rgba(16,19,31,0.10)' } },
        dark:  { root: { borderRadius: '8px', borderColor: 'rgba(246,245,242,0.10)' } },
      },
    },

    /* ── Checkbox ─────────────────────────────────────────── */
    checkbox: {
      colorScheme: {
        light: { root: { borderRadius: '4px', borderWidth: '1.5px' } },
        dark:  { root: { borderRadius: '4px', borderWidth: '1.5px' } },
      },
    },

    /* ── Radio button ─────────────────────────────────────── */
    radiobutton: {
      colorScheme: {
        light: { root: { borderWidth: '1.5px' } },
        dark:  { root: { borderWidth: '1.5px' } },
      },
    },

    /* ── Input switch (toggle) ────────────────────────────── */
    inputswitch: {
      colorScheme: {
        light: { root: { transitionDuration: '0.2s', borderRadius: '9999px' } },
        dark:  { root: { transitionDuration: '0.2s', borderRadius: '9999px' } },
      },
    },

    /* ── Card ─────────────────────────────────────────────── */
    card: {
      colorScheme: {
        light: {
          root: {
            borderRadius: '10px',
            shadow: '0 1px 3px rgba(16,19,31,0.05)',
            borderWidth: '1px',
            borderColor: 'rgba(16,19,31,0.08)',
          },
        },
        dark: {
          root: {
            borderRadius: '10px',
            shadow: '0 1px 3px rgba(0,0,0,0.2)',
            borderWidth: '1px',
            borderColor: 'rgba(246,245,242,0.08)',
          },
        },
      },
    },

    /* ── Panel ────────────────────────────────────────────── */
    panel: {
      colorScheme: {
        light: { root: { borderRadius: '10px' } },
        dark:  { root: { borderRadius: '10px' } },
      },
    },

    /* ── DataTable / Table ────────────────────────────────── */
    datatable: {
      colorScheme: {
        light: {
          root: { borderRadius: '8px' },
          header: { background: '#F6F5F2', borderColor: 'rgba(16,19,31,0.08)' },
          bodyRow: {
            hoverBackground: 'rgba(91,79,224,0.04)',
            borderColor: 'rgba(16,19,31,0.06)',
          },
        },
        dark: {
          root: { borderRadius: '8px' },
          header: { background: '#1A1D2E', borderColor: 'rgba(246,245,242,0.08)' },
          bodyRow: {
            hoverBackground: 'rgba(124,119,255,0.06)',
            borderColor: 'rgba(246,245,242,0.04)',
          },
        },
      },
    },

    /* ── Dialog (modal) ───────────────────────────────────── */
    dialog: {
      colorScheme: {
        light: { root: { borderRadius: '12px', shadow: '0 12px 40px rgba(16,19,31,0.15)' } },
        dark:  { root: { borderRadius: '12px', shadow: '0 12px 40px rgba(0,0,0,0.5)' } },
      },
    },

    /* ── ConfirmDialog ────────────────────────────────────── */
    confirmdialog: {
      colorScheme: {
        light: { root: { borderRadius: '12px' } },
        dark:  { root: { borderRadius: '12px' } },
      },
    },

    /* ── Toast (notification) ─────────────────────────────── */
    toast: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderWidth: '0' } },
        dark:  { root: { borderRadius: '8px', borderWidth: '0' } },
      },
    },

    /* ── Message / InlineMessage ──────────────────────────── */
    message: {
      colorScheme: {
        light: { root: { borderRadius: '8px', borderWidth: '0', fontWeight: '500' } },
        dark:  { root: { borderRadius: '8px', borderWidth: '0', fontWeight: '500' } },
      },
    },

    /* ── Tabs ─────────────────────────────────────────────── */
    tabs: {
      colorScheme: {
        light: {
          tab: {
            borderWidth: '0 0 2px 0',
            fontWeight: '500',
            activeBorderColor: '#5B4FE0',
            activeColor: '#5B4FE0',
          },
        },
        dark: {
          tab: {
            borderWidth: '0 0 2px 0',
            fontWeight: '500',
            activeBorderColor: '#7C77FF',
            activeColor: '#7C77FF',
          },
        },
      },
    },

    /* ── Tag ──────────────────────────────────────────────── */
    tag: {
      colorScheme: {
        light: { root: { borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', paddingX: '0.5rem', paddingY: '0.15rem' } },
        dark:  { root: { borderRadius: '6px', fontWeight: '600', fontSize: '0.75rem', paddingX: '0.5rem', paddingY: '0.15rem' } },
      },
    },

    /* ── Chip ─────────────────────────────────────────────── */
    chip: {
      colorScheme: {
        light: { root: { borderRadius: '9999px', paddingX: '0.5rem', paddingY: '0.25rem' } },
        dark:  { root: { borderRadius: '9999px', paddingX: '0.5rem', paddingY: '0.25rem' } },
      },
    },

    /* ── Badge ────────────────────────────────────────────── */
    badge: {
      colorScheme: {
        light: { root: { borderRadius: '9999px', fontWeight: '700', fontSize: '0.7rem', paddingX: '0.4rem', paddingY: '0.1rem' } },
        dark:  { root: { borderRadius: '9999px', fontWeight: '700', fontSize: '0.7rem', paddingX: '0.4rem', paddingY: '0.1rem' } },
      },
    },

    /* ── Divider ──────────────────────────────────────────── */
    divider: {
      colorScheme: {
        light: { root: { borderColor: 'rgba(16,19,31,0.08)' } },
        dark:  { root: { borderColor: 'rgba(246,245,242,0.08)' } },
      },
    },

    /* ── Tooltip ──────────────────────────────────────────── */
    tooltip: {
      colorScheme: {
        light: { root: { borderRadius: '6px', paddingX: '0.5rem', paddingY: '0.3rem', fontSize: '0.75rem' } },
        dark:  { root: { borderRadius: '6px', paddingX: '0.5rem', paddingY: '0.3rem', fontSize: '0.75rem' } },
      },
    },

    /* ── ProgressBar ──────────────────────────────────────── */
    progressbar: {
      colorScheme: {
        light: { root: { borderRadius: '9999px', height: '8px' } },
        dark:  { root: { borderRadius: '9999px', height: '8px' } },
      },
    },

    /* ── Paginator ────────────────────────────────────────── */
    paginator: {
      colorScheme: {
        light: {
          root: { borderRadius: '8px', padding: '0.5rem' },
          pageButton: { borderRadius: '6px', hoverBackground: 'rgba(91,79,224,0.08)' },
        },
        dark: {
          root: { borderRadius: '8px', padding: '0.5rem' },
          pageButton: { borderRadius: '6px', hoverBackground: 'rgba(124,119,255,0.12)' },
        },
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
    { provide: LOCALE_ID, useValue: 'fr-FR' },
    MessageService,
  ],
};
