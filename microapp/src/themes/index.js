import { alpha, createTheme as createMuiTheme } from '@mui/material';
import { createPalette } from './create-palette';
import { createComponents } from './create-components';
import { createShadows } from './create-shadows';
import { createTypography } from './create-typography';

export function createTheme() {
  const palette = createPalette();
    const components = createComponents({ palette });
  const shadows = createShadows();
  const typography = createTypography();

  return createMuiTheme({
    breakpoints: {
      values: {
        xs: 0,
        sm: 600,
        md: 900,
        lg: 1200,
        xl: 1440
      }
    },
    components,
    palette,
    shadows,
    customShadows: {
      button: `0 2px #0000000b`,
      text: `0 -1px 0 rgb(0 0 0 / 12%)`,
      z1: `0px 2px 8px ${alpha(palette.grey[900], 0.15)}`
    },
    shape: {
      borderRadius: 8
    },
    typography
  });
}
