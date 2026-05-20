import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import { green, teal, grey, red, orange } from '@mui/material/colors';

export const getTheme = (mode: 'light' | 'dark') => {
  let theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#1b8a4e',
        light: '#4caf78',
        dark: '#0d5c33',
        contrastText: '#ffffff',
      },
      secondary: {
        main: '#00897b',
        light: '#4ebaaa',
        dark: '#005b4f',
        contrastText: '#ffffff',
      },
      success: {
        main: green[600],
        light: green[400],
        dark: green[800],
      },
      error: {
        main: red[600],
      },
      warning: {
        main: orange[700],
      },
      info: {
        main: teal[600],
      },
      background: {
        default: mode === 'light' ? '#f0f7f4' : '#121e1a',
        paper: mode === 'light' ? '#ffffff' : '#1a2622',
      },
      text: {
        primary: mode === 'light' ? grey[900] : '#ffffff',
        secondary: mode === 'light' ? grey[600] : 'rgba(255, 255, 255, 0.7)',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700 },
      h2: { fontWeight: 700 },
      h3: { fontWeight: 600 },
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: mode === 'light' 
              ? '0 2px 12px rgba(0,0,0,0.08)'
              : '0 2px 12px rgba(0,0,0,0.3)',
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 10,
            textTransform: 'none',
            fontWeight: 600,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 600,
          },
        },
      },
      MuiTextField: {
        defaultProps: {
          variant: 'outlined',
          size: 'small',
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });
  
  return responsiveFontSizes(theme);
};

export { green, teal, grey, red, orange };
export default getTheme('light');

