import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import PaymentsIcon from '@mui/icons-material/Payments';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LanguageIcon from '@mui/icons-material/Language';
import Fade from '@mui/material/Fade';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { runAutoMonthlyRentGeneration } from '../lib/autoRentService';

const DRAWER_WIDTH = 260;

const navItems = [
  { label: 'ড্যাশবোর্ড', labelEn: 'Dashboard', icon: <DashboardIcon />, path: '/' },
  { label: 'বাড়ি', labelEn: 'Houses', icon: <HomeWorkIcon />, path: '/houses' },
  { label: 'ফ্ল্যাট', labelEn: 'Flats', icon: <ApartmentIcon />, path: '/flats' },
  { label: 'ভাড়াটে', labelEn: 'Tenants', icon: <PeopleIcon />, path: '/tenants' },
  { label: 'মিটার রিডিং', labelEn: 'Meter', icon: <ElectricMeterIcon />, path: '/meter' },
  { label: 'মিটার ইতিহাস', labelEn: 'Meter History', icon: <HistoryIcon />, path: '/meter-history' },
  { label: 'ভাড়া সংগ্রহ', labelEn: 'Rent Collection', icon: <PaymentsIcon />, path: '/collections' },
  { label: 'সংগ্রহ ইতিহাস', labelEn: 'Collection History', icon: <HistoryIcon />, path: '/history' },
  { label: 'রিপোর্ট', labelEn: 'Reports', icon: <AssessmentIcon />, path: '/reports' },
  { label: 'সেটিংস', labelEn: 'Settings', icon: <SettingsIcon />, path: '/settings' },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { settings, updateSettings, t } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isEn = settings?.default_language === 'en';
  // Safe fallback so animations is never undefined even before settings load
  const animations = settings == null ? true : settings.animations_enabled !== false;
  const lang = settings?.default_language ?? 'bn';

  useEffect(() => {
    if (user) {
      runAutoMonthlyRentGeneration();
    }
  }, [user]);

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 3,
          background: 'linear-gradient(135deg, #0d5c33 0%, #1b8a4e 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
          <HomeWorkIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h6" fontWeight={700} lineHeight={1.2}>
              {t('বাড়ি ম্যানেজার', 'Bari Manager')}
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              Bari Manager BD
            </Typography>
          </Box>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar 
            src="/admin-avatar.png"
            sx={{ width: 36, height: 36, bgcolor: 'rgba(255,255,255,0.2)', fontSize: '0.9rem' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? 'A'}
          </Avatar>
          <Box sx={{ overflow: 'hidden' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              Admin
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.75 }} noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>
      </Box>

      <List sx={{ flex: 1, py: 1 }}>
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ px: 1, mb: 0.5 }}>
              <ListItemButton
                onClick={() => {
                  navigate(item.path);
                  if (isMobile) setMobileOpen(false);
                }}
                sx={{
                  borderRadius: 2,
                  bgcolor: active ? 'primary.main' : 'transparent',
                  color: active ? 'white' : 'text.primary',
                  '&:hover': {
                    bgcolor: active ? 'primary.dark' : 'action.hover',
                  },
                  '& .MuiListItemIcon-root': {
                    color: active ? 'white' : 'text.secondary',
                    minWidth: 40,
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={isEn ? item.labelEn : item.label}
                  secondary={isEn ? item.label : item.labelEn}
                  primaryTypographyProps={{ fontWeight: active ? 600 : 400, fontSize: '0.9rem' }}
                  secondaryTypographyProps={{ fontSize: '0.7rem', color: active ? 'rgba(255,255,255,0.7)' : undefined }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider />
      <List sx={{ py: 1 }}>
        <ListItem disablePadding sx={{ px: 1, mb: 0.5 }}>
          <ListItemButton
            onClick={() => {
              const nextLang = settings?.default_language === 'bn' ? 'en' : 'bn';
              updateSettings({ default_language: nextLang });
            }}
            sx={{
              borderRadius: 2,
              color: 'text.primary',
              '& .MuiListItemIcon-root': { color: 'primary.main', minWidth: 40 },
            }}
          >
            <ListItemIcon><LanguageIcon /></ListItemIcon>
            <ListItemText
              primary={isEn ? 'বাংলা সংস্করণ' : 'English Version'}
              secondary={isEn ? 'বাংলায় দেখতে ট্যাপ করুন' : 'Tap to switch to English'}
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.68rem' }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ px: 1 }}>
          <ListItemButton
            onClick={signOut}
            sx={{ borderRadius: 2, color: 'error.main', '& .MuiListItemIcon-root': { color: 'error.main', minWidth: 40 } }}
          >
            <ListItemIcon><LogoutIcon /></ListItemIcon>
            <ListItemText
              primary={t('লগআউট', 'Logout')}
              secondary={t('Logout', 'Log out of account')}
              primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
              secondaryTypographyProps={{ fontSize: '0.68rem' }}
            />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
              border: 'none',
              boxShadow: '2px 0 12px rgba(0,0,0,0.08)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: DRAWER_WIDTH,
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {isMobile && (
          <AppBar
            position="sticky"
            elevation={0}
            sx={{
              background: 'linear-gradient(135deg, #0d5c33 0%, #1b8a4e 100%)',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Toolbar>
              <IconButton
                color="inherit"
                edge="start"
                onClick={() => setMobileOpen(true)}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
              <HomeWorkIcon sx={{ mr: 1 }} />
              <Typography variant="h6" fontWeight={700} noWrap>
                {t('বাড়ি ম্যানেজার BD', 'Bari Manager BD')}
              </Typography>
              <Box flex={1} />
              <Tooltip title={t('লগআউট', 'Logout')}>
                <IconButton color="inherit" onClick={signOut} size="small">
                  <LogoutIcon />
                </IconButton>
              </Tooltip>
            </Toolbar>
          </AppBar>
        )}

        {/* key includes lang so the page content area re-mounts instantly when language switches */}
        <Fade in={true} key={`${location.pathname}-${lang}`} timeout={animations ? 450 : 0}>
          <Box sx={{ flex: 1, p: { xs: 2, md: 3 }, bgcolor: 'background.default' }}>
            {children}
          </Box>
        </Fade>
      </Box>
    </Box>
  );
}
