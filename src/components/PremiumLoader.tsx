import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import { useSettings } from '../contexts/SettingsContext';

interface PremiumLoaderProps {
  fullScreen?: boolean;
  message?: string;
  height?: string | number;
}

export default function PremiumLoader({ fullScreen = false, message, height = 300 }: PremiumLoaderProps) {
  const { settings, t } = useSettings();
  const animations = settings?.animations_enabled !== false;

  const pulseStyle = animations
    ? {
        animation: 'loaderPulse 2s ease-in-out infinite',
        '@keyframes loaderPulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: 0.95, filter: 'drop-shadow(0 0 12px rgba(27, 138, 78, 0.4))' },
          '50%': { transform: 'scale(1.08)', opacity: 1, filter: 'drop-shadow(0 0 25px rgba(27, 138, 78, 0.7))' },
        },
      }
    : {
        filter: 'drop-shadow(0 0 12px rgba(27, 138, 78, 0.3))',
      };

  const textStyle = animations
    ? {
        animation: 'loaderText 2s ease-in-out infinite',
        '@keyframes loaderText': {
          '0%, 100%': { opacity: 0.75 },
          '50%': { opacity: 1 },
        },
      }
    : {
        opacity: 0.9,
      };


  return (
    <Box sx={fullScreen ? {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      bgcolor: settings?.theme_mode === 'dark' ? '#121212' : '#f8f9fa',
      p: 3,
    } : {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: height,
      width: '100%',
      p: 3,
    }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          maxWidth: 320,
          width: '100%',
        }}
      >
        {/* Pulsing Green House & Leaf Brand SVG */}
        <Box
          sx={{
            width: 80,
            height: 80,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #1b8a4e 0%, #0d5c33 100%)',
            color: 'white',
            mb: 3,
            ...pulseStyle,
            transition: 'all 0.5s ease',
          }}
        >
          <svg
            width="44"
            height="44"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Outline of the modern house */}
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
            {/* Elegant leaf emblem embedded on the side */}
            <path
              d="M12 2C15 5 17 8 16 11C15 13.5 13 14 12 14"
              stroke="#A3E635"
              strokeWidth="2"
            />
          </svg>
        </Box>

        {/* Dynamic Translated Brand Title */}
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{
            color: settings?.theme_mode === 'dark' ? '#ffffff' : '#1b8a4e',
            letterSpacing: '0.5px',
            mb: 0.5,
            ...textStyle,
          }}
        >
          {t('বাড়ি ম্যানেজার BD', 'Bari Manager BD')}
        </Typography>

        {/* Dynamic loading sub-message */}
        <Typography
          variant="caption"
          sx={{
            color: 'text.secondary',
            mb: 3.5,
            fontWeight: 500,
            letterSpacing: '0.2px',
          }}
        >
          {message || t('অনুগ্ৰহ করে অপেক্ষা করুন...', 'Please wait a moment...')}
        </Typography>

        {/* Premium linear loading bar */}
        <Box sx={{ width: '80%', overflow: 'hidden', borderRadius: '4px' }}>
          <LinearProgress
            sx={{
              height: 5,
              borderRadius: 3,
              bgcolor: settings?.theme_mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
              '& .MuiLinearProgress-bar': {
                background: 'linear-gradient(90deg, #1b8a4e, #a3e635)',
                borderRadius: 3,
                animationDuration: animations ? '1.5s' : '0s', // Disables sliding bar animation if off
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
