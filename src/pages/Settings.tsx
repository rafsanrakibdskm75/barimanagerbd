import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import SettingsIcon from '@mui/icons-material/Settings';
import StorageIcon from '@mui/icons-material/Storage';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import SecurityIcon from '@mui/icons-material/Security';
import BackupIcon from '@mui/icons-material/Backup';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import InfoIcon from '@mui/icons-material/Info';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import SyncIcon from '@mui/icons-material/Sync';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import WifiIcon from '@mui/icons-material/Wifi';
import AnimationIcon from '@mui/icons-material/Animation';
import LanguageIcon from '@mui/icons-material/Language';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';

/* ─── helpers ─── */
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

/** Section header with left colour bar */
function SectionTitle({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      <Typography variant="subtitle2" fontWeight={700} color="primary.main">
        {text}
      </Typography>
      <Box sx={{ flex: 1, height: 1, bgcolor: 'divider', ml: 1 }} />
    </Box>
  );
}

/** A clean card wrapper for each settings group */
function SettingCard({ children }: { children: React.ReactNode }) {
  return (
    <Card variant="outlined" sx={{ mb: 2, borderRadius: 3 }}>
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {children}
      </CardContent>
    </Card>
  );
}

const settingsTabs = [
  { label: 'সাধারণ',   labelEn: 'General',       icon: <SettingsIcon /> },
  { label: 'ভাড়া',     labelEn: 'Rent',           icon: <CreditCardIcon /> },
  { label: 'মিটার',    labelEn: 'Meter',          icon: <ElectricMeterIcon /> },
  { label: 'বিজ্ঞপ্তি', labelEn: 'Notifications',  icon: <NotificationsIcon /> },
  { label: 'সিঙ্ক',    labelEn: 'Sync & Backup',  icon: <BackupIcon /> },
  { label: 'সংগ্রহ',   labelEn: 'Collection',     icon: <CreditCardIcon /> },
  { label: 'রিপোর্ট',  labelEn: 'Reports',        icon: <AnalyticsIcon /> },
  { label: 'চেহারা',   labelEn: 'Appearance',     icon: <PaletteIcon /> },
  { label: 'ডেটা',     labelEn: 'Data',           icon: <StorageIcon /> },
  { label: 'নিরাপত্তা', labelEn: 'Security',      icon: <SecurityIcon /> },
  { label: 'সম্পর্কে', labelEn: 'About',          icon: <InfoIcon /> },
];

export default function Settings() {
  const {
    settings, loading, updateSettings,
    deleteAllData, deleteTableData, exportDatabase,
    lastSyncTime, importBackup, syncDatabase,
    networkOffline, offlineCacheAge, t,
  } = useSettings();
  const { signOut } = useAuth();

  const [tabValue,       setTabValue]       = useState(0);
  const [saving,         setSaving]         = useState(false);
  const [syncing,        setSyncing]        = useState(false);
  const [message,        setMessage]        = useState('');
  const [msgSeverity,    setMsgSeverity]    = useState<'success'|'error'|'info'>('success');
  const [deleteDialog,   setDeleteDialog]   = useState(false);
  const [deleteTarget,   setDeleteTarget]   = useState<'all' | string>('all');
  const [backupFileInput, setBackupFileInput] = useState<HTMLInputElement | null>(null);

  // Local state for snappy inputs
  const [localSettings, setLocalSettings] = useState<any>(null);

  useEffect(() => {
    if (settings) setLocalSettings({ ...settings });
  }, [settings]);

  /* ── helpers ── */
  const showMsg = (msg: string, sev: 'success'|'error'|'info' = 'success') => {
    setMessage(msg);
    setMsgSeverity(sev);
    setTimeout(() => setMessage(''), 4000);
  };

  const handleSave = async (updates: Record<string, any>) => {
    setSaving(true);
    try {
      await updateSettings(updates);
      showMsg(t('সেটিংস সংরক্ষণ হয়েছে ✓', 'Settings saved ✓'));
    } catch {
      showMsg(t('সংরক্ষণ ব্যর্থ হয়েছে', 'Failed to save settings'), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteData = async () => {
    setSaving(true);
    try {
      if (deleteTarget === 'all') {
        await deleteAllData();
        showMsg(t('সমস্ত ডেটা মুছে দেওয়া হয়েছে', 'All data deleted'));
      } else {
        await deleteTableData(deleteTarget);
        showMsg(t(`${deleteTarget} ডেটা মুছে দেওয়া হয়েছে`, `${deleteTarget} data deleted`));
      }
    } catch {
      showMsg(t('ডেটা মুছতে ত্রুটি', 'Error deleting data'), 'error');
    } finally {
      setSaving(false);
      setDeleteDialog(false);
    }
  };

  const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        setSaving(true);
        showMsg(t('আমদানি হচ্ছে…', 'Importing…'), 'info');
        await importBackup(parsedData);
        showMsg(t('ব্যাকআপ আমদানি সফল ✓', 'Backup imported ✓'));
      } catch {
        showMsg(t('আমদানিতে ত্রুটি', 'Import failed'), 'error');
      } finally {
        setSaving(false);
      }
    };
    reader.readAsText(file);
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      await syncDatabase();
      showMsg(t('সিঙ্ক সম্পন্ন ✓', 'Sync complete ✓'));
    } catch {
      showMsg(t('সিঙ্ক ব্যর্থ হয়েছে', 'Sync failed'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  /* ── guards ── */
  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
      <CircularProgress />
    </Box>
  );
  if (!settings || !localSettings) return (
    <Alert severity="error">{t('সেটিংস লোড করতে ব্যর্থ', 'Failed to load settings')}</Alert>
  );

  /* ── format cache age ── */
  const formattedCacheAge = offlineCacheAge
    ? (settings.default_language === 'en'
        ? new Date(offlineCacheAge).toLocaleString('en-US')
        : new Date(offlineCacheAge).toLocaleString('bn-BD'))
    : t('কখনও না', 'Never');

  const formattedLastSync = lastSyncTime
    ? (settings.default_language === 'en'
        ? lastSyncTime.toLocaleString('en-US')
        : lastSyncTime.toLocaleString('bn-BD'))
    : t('কখনও না', 'Never');

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <Box>
      {/* ── Page header ── */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            {t('সেটিংস', 'Settings')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('আপনার অ্যাপ কনফিগার করুন', 'Settings — Configure Your App')}
          </Typography>
        </Box>

        {/* Network status chip */}
        <Tooltip title={networkOffline
          ? t('ইন্টারনেট সংযোগ নেই', 'No internet connection')
          : t('অনলাইন', 'Online')}>
          <Chip
            icon={networkOffline ? <WifiOffIcon /> : <WifiIcon />}
            label={networkOffline ? t('অফলাইন', 'Offline') : t('অনলাইন', 'Online')}
            color={networkOffline ? 'error' : 'success'}
            variant="outlined"
            size="small"
          />
        </Tooltip>
      </Box>

      {/* Offline banner */}
      {networkOffline && (
        <Alert severity="warning" icon={<WifiOffIcon />} sx={{ mb: 2 }}>
          {t(
            'আপনি বর্তমানে অফলাইনে আছেন। ক্যাশ থেকে ডেটা দেখানো হচ্ছে।',
            'You are currently offline. Data is being served from the local cache.'
          )}
          {offlineCacheAge && (
            <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
              {t('শেষ ক্যাশ:', 'Last cached:')} {formattedCacheAge}
            </Typography>
          )}
        </Alert>
      )}

      {/* ── Tabs ── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={(_, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
        >
          {settingsTabs.map((tab, i) => (
            <Tab key={i} label={t(tab.label, tab.labelEn)} icon={tab.icon} iconPosition="start" />
          ))}
        </Tabs>
      </Box>

      {saving && <LinearProgress sx={{ mb: 1, borderRadius: 1 }} />}

      {/* ══════════════════════════════════════
          TAB 0 — GENERAL
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={0}>

        {/* App Identity */}
        <SettingCard>
          <SectionTitle icon={<HomeWorkIcon fontSize="small" />} text={t('অ্যাপ পরিচয়', 'App Identity')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('অ্যাপ নাম', 'App Name')}
                value={localSettings.app_name ?? ''}
                onChange={e => setLocalSettings({ ...localSettings, app_name: e.target.value })}
                onBlur={() => handleSave({ app_name: localSettings.app_name })}
                helperText={t('অ্যাপের শিরোনাম হিসেবে দেখানো হবে', 'Shown as the app title')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('বাড়ির নাম', 'House Name')}
                value={localSettings.house_name ?? ''}
                onChange={e => setLocalSettings({ ...localSettings, house_name: e.target.value })}
                onBlur={() => handleSave({ house_name: localSettings.house_name })}
                helperText={t('ডিফল্ট বাড়ির নাম', 'Default house name')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('মুদ্রা', 'Currency')}
                value={localSettings.currency ?? '৳ BDT'}
                disabled
                helperText={t('পরিবর্তনযোগ্য নয়', 'Not changeable')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('অ্যাপ সংস্করণ', 'App Version')}
                value={localSettings.app_version ?? '1.0.0'}
                disabled
              />
            </Grid>
          </Grid>
        </SettingCard>

        {/* Language & Region */}
        <SettingCard>
          <SectionTitle icon={<LanguageIcon fontSize="small" />} text={t('ভাষা ও অঞ্চল', 'Language & Region')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ভাষা', 'Language')}</InputLabel>
                <Select
                  value={localSettings.default_language ?? 'bn'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, default_language: val });
                    handleSave({ default_language: val });
                  }}
                  label={t('ভাষা', 'Language')}
                >
                  <MenuItem value="bn">🇧🇩 বাংলা</MenuItem>
                  <MenuItem value="en">🇬🇧 English</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('তারিখ ফর্ম্যাট', 'Date Format')}</InputLabel>
                <Select
                  value={localSettings.date_format ?? 'dd/MM/yyyy'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, date_format: val });
                    handleSave({ date_format: val });
                  }}
                  label={t('তারিখ ফর্ম্যাট', 'Date Format')}
                >
                  <MenuItem value="dd/MM/yyyy">{t('দিন/মাস/বছর', 'Day/Month/Year')} — 20/05/2026</MenuItem>
                  <MenuItem value="MM/dd/yyyy">{t('মাস/দিন/বছর', 'Month/Day/Year')} — 05/20/2026</MenuItem>
                  <MenuItem value="yyyy-MM-dd">{t('বছর-মাস-দিন', 'Year-Month-Day')} — 2026-05-20</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </SettingCard>

        {/* Theme */}
        <SettingCard>
          <SectionTitle icon={<DarkModeIcon fontSize="small" />} text={t('থিম', 'Theme')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('থিম মোড', 'Theme Mode')}</InputLabel>
                <Select
                  value={localSettings.theme_mode ?? 'light'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, theme_mode: val });
                    handleSave({ theme_mode: val });
                  }}
                  label={t('থিম মোড', 'Theme Mode')}
                >
                  <MenuItem value="light">☀️ {t('হালকা', 'Light')}</MenuItem>
                  <MenuItem value="dark">🌙 {t('অন্ধকার', 'Dark')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('থিম রঙ', 'Theme Color')}
                type="color"
                value={localSettings.theme_color ?? '#1b8a4e'}
                onChange={e => setLocalSettings({ ...localSettings, theme_color: e.target.value })}
                onBlur={() => handleSave({ theme_color: localSettings.theme_color })}
                helperText={t('প্রাথমিক রঙ কাস্টমাইজ করুন', 'Customize primary colour')}
              />
            </Grid>
          </Grid>
        </SettingCard>

        {/* Animations & Display */}
        <SettingCard>
          <SectionTitle icon={<AnimationIcon fontSize="small" />} text={t('অ্যানিমেশন ও প্রদর্শন', 'Animations & Display')} />
          <Grid container spacing={1}>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.animations_enabled ?? true}
                    color="primary"
                    onChange={e => {
                      setLocalSettings({ ...localSettings, animations_enabled: e.target.checked });
                      handleSave({ animations_enabled: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('অ্যানিমেশন সক্রিয় করুন', 'Enable Animations')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('পেজ ট্রানজিশন, হোভার ইফেক্ট ও কার্ড অ্যানিমেশন', 'Page transitions, hover effects and card animations')}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.compact_mode ?? false}
                    onChange={e => {
                      setLocalSettings({ ...localSettings, compact_mode: e.target.checked });
                      handleSave({ compact_mode: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('কমপ্যাক্ট মোড', 'Compact Mode')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('কম প্যাডিং ও ছোট আকারের কার্ড', 'Reduced padding and smaller cards')}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ফন্ট সাইজ', 'Font Size')}</InputLabel>
                <Select
                  value={localSettings.font_size ?? 'normal'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, font_size: val });
                    handleSave({ font_size: val });
                  }}
                  label={t('ফন্ট সাইজ', 'Font Size')}
                >
                  <MenuItem value="small">{t('ছোট', 'Small')}</MenuItem>
                  <MenuItem value="normal">{t('সাধারণ', 'Normal')}</MenuItem>
                  <MenuItem value="large">{t('বড়', 'Large')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </SettingCard>

        {/* Offline Mode */}
        <SettingCard>
          <SectionTitle icon={<WifiOffIcon fontSize="small" />} text={t('অফলাইন মোড', 'Offline Mode')} />

          {/* Status row */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
            <Chip
              icon={networkOffline ? <WifiOffIcon /> : <WifiIcon />}
              label={networkOffline ? t('অফলাইন', 'Offline') : t('অনলাইন', 'Online')}
              color={networkOffline ? 'error' : 'success'}
              size="small"
            />
            {offlineCacheAge && (
              <Typography variant="caption" color="text.secondary">
                {t('ক্যাশ:', 'Cache:')} {formattedCacheAge}
              </Typography>
            )}
            {!offlineCacheAge && (
              <Typography variant="caption" color="warning.main">
                {t('এখনো কোনো ক্যাশ নেই — সিঙ্ক করুন', 'No cache yet — press Sync Now')}
              </Typography>
            )}
          </Box>

          <Grid container spacing={1}>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.offline_mode_enabled ?? false}
                    color="warning"
                    onChange={e => {
                      setLocalSettings({ ...localSettings, offline_mode_enabled: e.target.checked });
                      handleSave({ offline_mode_enabled: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('অফলাইন মোড সক্রিয় করুন', 'Enable Offline Mode')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('ইন্টারনেট ছাড়া ক্যাশ থেকে ডেটা দেখুন', 'View data from local cache without internet')}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.auto_sync_enabled ?? true}
                    onChange={e => {
                      setLocalSettings({ ...localSettings, auto_sync_enabled: e.target.checked });
                      handleSave({ auto_sync_enabled: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('স্বয়ংক্রিয় সিঙ্ক', 'Auto Sync')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('অনলাইন হলে স্বয়ংক্রিয়ভাবে ডেটা সিঙ্ক করুন', 'Automatically sync data when online')}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained"
                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                onClick={handleSyncNow}
                disabled={syncing || networkOffline}
                sx={{ mt: 1 }}
              >
                {syncing ? t('সিঙ্ক হচ্ছে…', 'Syncing…') : t('এখনই সিঙ্ক করুন', 'Sync Now')}
              </Button>
              {networkOffline && (
                <Typography variant="caption" color="error.main" sx={{ ml: 2 }}>
                  {t('অফলাইনে সিঙ্ক সম্ভব নয়', 'Cannot sync while offline')}
                </Typography>
              )}
            </Grid>
          </Grid>
        </SettingCard>

      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 1 — RENT
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={1}>
        <SettingCard>
          <SectionTitle icon={<CreditCardIcon fontSize="small" />} text={t('ভাড়া কনফিগারেশন', 'Rent Configuration')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" size="small"
                label={t('ডিফল্ট মাসিক ভাড়া (৳)', 'Default Monthly Rent (৳)')}
                value={localSettings.default_monthly_rent ?? 0}
                onChange={e => setLocalSettings({ ...localSettings, default_monthly_rent: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleSave({ default_monthly_rent: localSettings.default_monthly_rent })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" size="small"
                label={t('ডিউ ডেট (দিন)', 'Due Date (Days after month start)')}
                value={localSettings.due_date ?? 10}
                onChange={e => setLocalSettings({ ...localSettings, due_date: parseInt(e.target.value) || 0 })}
                onBlur={() => handleSave({ due_date: localSettings.due_date })}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth type="number" size="small"
                label={t('দেরী ফি (%)', 'Late Fee (%)')}
                value={localSettings.late_fee_percentage ?? 0}
                onChange={e => setLocalSettings({ ...localSettings, late_fee_percentage: parseFloat(e.target.value) || 0 })}
                onBlur={() => handleSave({ late_fee_percentage: localSettings.late_fee_percentage })}
              />
            </Grid>
          </Grid>
        </SettingCard>

        <SettingCard>
          <SectionTitle icon={<AutoAwesomeIcon fontSize="small" />} text={t('অটোমেশন', 'Automation')} />
          <Grid container spacing={1}>
            {[
              { key: 'auto_bill_generate',       bn: 'স্বয়ংক্রিয় মাসিক বিল তৈরি',       en: 'Auto Monthly Bill Generation',        hint_bn: 'প্রতি মাসের শুরুতে ভাড়া এন্ট্রি তৈরি করে', hint_en: 'Creates rent entries at the start of each month' },
              { key: 'auto_carry_meter_reading',  bn: 'আগের মিটার রিডিং স্বয়ংক্রিয় বহন', en: 'Auto Carry Previous Meter Reading',    hint_bn: 'গত মাসের রিডিং নতুন মাসে কপি করে',          hint_en: 'Copies last month reading to new month' },
              { key: 'partial_payment_enabled',   bn: 'আংশিক পেমেন্ট সক্রিয়',            en: 'Enable Partial Payment',              hint_bn: 'ভাড়াটে আংশিক পরিমাণ দিতে পারবে',          hint_en: 'Tenant can pay a partial amount' },
            ].map(({ key, bn, en, hint_bn, hint_en }) => (
              <Grid key={key} size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings[key] ?? false}
                      onChange={ev => {
                        setLocalSettings({ ...localSettings, [key]: ev.target.checked });
                        handleSave({ [key]: ev.target.checked });
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t(bn, en)}</Typography>
                      <Typography variant="caption" color="text.secondary">{t(hint_bn, hint_en)}</Typography>
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 2 — METER
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={2}>
        <SettingCard>
          <SectionTitle icon={<ElectricMeterIcon fontSize="small" />} text={t('বিদ্যুৎ ও ইউটিলিটি', 'Electricity & Utilities')} />
          <Grid container spacing={2}>
            {[
              { key: 'electricity_per_unit', label_bn: 'বিদ্যুৎ প্রতি ইউনিট (৳)',  label_en: 'Electricity per Unit (৳)' },
              { key: 'water_bill_amount',    label_bn: 'পানির বিল (৳)',            label_en: 'Water Bill (৳)' },
              { key: 'service_charge_amount',label_bn: 'সার্ভিস চার্জ (৳)',        label_en: 'Service Charge (৳)' },
              { key: 'gas_bill_amount',      label_bn: 'গ্যাস বিল (৳)',            label_en: 'Gas Bill (৳)' },
              { key: 'meter_warning_limit',  label_bn: 'মিটার সতর্কতা সীমা (ইউনিট)',label_en: 'Meter Warning Limit (Units)' },
            ].map(({ key, label_bn, label_en }) => (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth type="number" size="small"
                  label={t(label_bn, label_en)}
                  value={localSettings[key] ?? 0}
                  onChange={e => setLocalSettings({ ...localSettings, [key]: parseFloat(e.target.value) || 0 })}
                  onBlur={() => handleSave({ [key]: localSettings[key] })}
                />
              </Grid>
            ))}
          </Grid>
        </SettingCard>

        <SettingCard>
          <SectionTitle icon={<AutoAwesomeIcon fontSize="small" />} text={t('মিটার অটোমেশন', 'Meter Automation')} />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.auto_meter_calculation ?? true}
                onChange={e => {
                  setLocalSettings({ ...localSettings, auto_meter_calculation: e.target.checked });
                  handleSave({ auto_meter_calculation: e.target.checked });
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('স্বয়ংক্রিয় মিটার গণনা', 'Auto Meter Calculation')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('ইউনিট ও মোট বিল স্বয়ংক্রিয়ভাবে হিসাব করে', 'Automatically calculates units and total bill')}
                </Typography>
              </Box>
            }
          />
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 3 — NOTIFICATIONS
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={3}>
        <SettingCard>
          <SectionTitle icon={<NotificationsIcon fontSize="small" />} text={t('বিজ্ঞপ্তি', 'Notifications')} />
          <Grid container spacing={1}>
            {[
              { key: 'pending_rent_reminder',    bn: 'পেন্ডিং ভাড়া রিমাইন্ডার',   en: 'Pending Rent Reminder',  hint_bn: 'বকেয়া ভাড়ার অনুস্মারক',          hint_en: 'Reminder for unpaid rent' },
              { key: 'due_date_notification',    bn: 'ডিউ ডেট বিজ্ঞপ্তি',         en: 'Due Date Notification',  hint_bn: 'পরিশোধের সীমা কাছে আসলে জানান', hint_en: 'Notify when due date is approaching' },
              { key: 'overdue_alert',            bn: 'ওভারডিউ সতর্কতা',            en: 'Overdue Alert',          hint_bn: 'মেয়াদ পার হলে সতর্কতা',           hint_en: 'Alert when payment is overdue' },
              { key: 'push_notification_enabled',bn: 'পুশ বিজ্ঞপ্তি',             en: 'Push Notifications',     hint_bn: 'ব্রাউজার পুশ বিজ্ঞপ্তি',           hint_en: 'Browser push notifications' },
              { key: 'sound_vibration_enabled',  bn: 'সাউন্ড / কম্পন',            en: 'Sound / Vibration',      hint_bn: 'বিজ্ঞপ্তির সাথে শব্দ বা কম্পন',   hint_en: 'Sound or vibration with notifications' },
            ].map(({ key, bn, en, hint_bn, hint_en }) => (
              <Grid key={key} size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings[key] ?? false}
                      onChange={ev => {
                        setLocalSettings({ ...localSettings, [key]: ev.target.checked });
                        handleSave({ [key]: ev.target.checked });
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t(bn, en)}</Typography>
                      <Typography variant="caption" color="text.secondary">{t(hint_bn, hint_en)}</Typography>
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 4 — SYNC & BACKUP
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={4}>
        <SettingCard>
          <SectionTitle icon={<SyncIcon fontSize="small" />} text={t('সিঙ্ক', 'Synchronisation')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                <Chip
                  icon={networkOffline ? <WifiOffIcon /> : <CheckCircleIcon />}
                  label={networkOffline ? t('অফলাইন', 'Offline') : t('অনলাইন', 'Online')}
                  color={networkOffline ? 'error' : 'success'}
                  size="small"
                />
                <Typography variant="caption" color="text.secondary">
                  {t('শেষ সিঙ্ক:', 'Last sync:')} {formattedLastSync}
                </Typography>
                {offlineCacheAge && (
                  <Typography variant="caption" color="text.secondary">
                    {t('ক্যাশ সংরক্ষণ:', 'Cache saved:')} {formattedCacheAge}
                  </Typography>
                )}
              </Box>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.auto_sync_enabled ?? true}
                    onChange={e => {
                      setLocalSettings({ ...localSettings, auto_sync_enabled: e.target.checked });
                      handleSave({ auto_sync_enabled: e.target.checked });
                    }}
                  />
                }
                label={t('স্বয়ংক্রিয় সিঙ্ক সক্রিয়', 'Enable Auto Sync')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                variant="contained"
                startIcon={syncing ? <CircularProgress size={16} color="inherit" /> : <SyncIcon />}
                onClick={handleSyncNow}
                disabled={syncing || networkOffline}
                fullWidth
              >
                {syncing ? t('সিঙ্ক হচ্ছে…', 'Syncing…') : t('এখনই সিঙ্ক করুন', 'Sync Now')}
              </Button>
            </Grid>
          </Grid>
        </SettingCard>

        <SettingCard>
          <SectionTitle icon={<BackupIcon fontSize="small" />} text={t('ব্যাকআপ', 'Backup')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                variant="outlined" startIcon={<CloudDownloadIcon />}
                onClick={exportDatabase} fullWidth disabled={networkOffline}
              >
                {t('ডেটা রপ্তানি করুন (.json)', 'Export Data (.json)')}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button
                variant="outlined" startIcon={<CloudUploadIcon />}
                onClick={() => backupFileInput?.click()} fullWidth
              >
                {t('ব্যাকআপ আমদানি করুন', 'Import Backup')}
              </Button>
              <input
                ref={setBackupFileInput}
                type="file" accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportBackup}
              />
            </Grid>
          </Grid>
        </SettingCard>

        <SettingCard>
          <SectionTitle icon={<WifiOffIcon fontSize="small" />} text={t('অফলাইন মোড', 'Offline Mode')} />
          <FormControlLabel
            control={
              <Switch
                checked={localSettings.offline_mode_enabled ?? false}
                color="warning"
                onChange={e => {
                  setLocalSettings({ ...localSettings, offline_mode_enabled: e.target.checked });
                  handleSave({ offline_mode_enabled: e.target.checked });
                }}
              />
            }
            label={
              <Box>
                <Typography variant="body2" fontWeight={600}>{t('অফলাইন মোড সক্রিয়', 'Enable Offline Mode')}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('ইন্টারনেট ছাড়া ক্যাশ থেকে ডেটা দেখুন', 'Serve data from local cache without internet')}
                </Typography>
              </Box>
            }
          />
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 5 — COLLECTION
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={5}>
        <SettingCard>
          <SectionTitle icon={<CreditCardIcon fontSize="small" />} text={t('পেমেন্ট সেটিংস', 'Payment Settings')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ডিফল্ট পেমেন্ট পদ্ধতি', 'Default Payment Method')}</InputLabel>
                <Select
                  value={localSettings.default_payment_method ?? 'cash'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, default_payment_method: val });
                    handleSave({ default_payment_method: val });
                  }}
                  label={t('ডিফল্ট পেমেন্ট পদ্ধতি', 'Default Payment Method')}
                >
                  <MenuItem value="নগদ">{t('নগদ', 'Cash')}</MenuItem>
                  <MenuItem value="ব্যাংক">{t('ব্যাংক স্থানান্তর', 'Bank Transfer')}</MenuItem>
                  <MenuItem value="মোবাইল">{t('মোবাইল ব্যাংকিং', 'Mobile Banking')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.auto_generate_receipt ?? false}
                    onChange={e => {
                      setLocalSettings({ ...localSettings, auto_generate_receipt: e.target.checked });
                      handleSave({ auto_generate_receipt: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{t('স্বয়ংক্রিয়ভাবে রসিদ তৈরি', 'Auto Generate Receipt')}</Typography>
                    <Typography variant="caption" color="text.secondary">{t('পেমেন্টের পরে স্বয়ংক্রিয়ভাবে রসিদ তৈরি করুন', 'Generate receipt automatically after payment')}</Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 6 — REPORTS
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={6}>
        <SettingCard>
          <SectionTitle icon={<AnalyticsIcon fontSize="small" />} text={t('রিপোর্ট সেটিংস', 'Report Settings')} />
          <Grid container spacing={1}>
            {[
              { key: 'monthly_pdf_export',   bn: 'মাসিক PDF রপ্তানি',          en: 'Monthly PDF Export',      hint_bn: 'প্রতি মাসে PDF রিপোর্ট তৈরি করুন', hint_en: 'Generate PDF report each month' },
              { key: 'excel_export',         bn: 'Excel রপ্তানি',               en: 'Excel Export',            hint_bn: 'Excel ফরম্যাটে ডেটা রপ্তানি করুন', hint_en: 'Export data in Excel format' },
              { key: 'auto_report_generate', bn: 'স্বয়ংক্রিয় রিপোর্ট তৈরি',  en: 'Auto Generate Reports',  hint_bn: 'প্রতি মাসে স্বয়ংক্রিয়ভাবে রিপোর্ট তৈরি', hint_en: 'Automatically generate reports each month' },
            ].map(({ key, bn, en, hint_bn, hint_en }) => (
              <Grid key={key} size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={localSettings[key] ?? false}
                      onChange={ev => {
                        setLocalSettings({ ...localSettings, [key]: ev.target.checked });
                        handleSave({ [key]: ev.target.checked });
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{t(bn, en)}</Typography>
                      <Typography variant="caption" color="text.secondary">{t(hint_bn, hint_en)}</Typography>
                    </Box>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 7 — APPEARANCE
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={7}>
        <SettingCard>
          <SectionTitle icon={<PaletteIcon fontSize="small" />} text={t('চেহারা ও অনুভূতি', 'Look & Feel')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small"
                label={t('থিম রঙ', 'Theme Color')}
                type="color"
                value={localSettings.theme_color ?? '#1b8a4e'}
                onChange={e => setLocalSettings({ ...localSettings, theme_color: e.target.value })}
                onBlur={() => handleSave({ theme_color: localSettings.theme_color })}
                helperText={t('অ্যাপের প্রাথমিক রঙ', 'Primary accent colour')}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ফন্ট সাইজ', 'Font Size')}</InputLabel>
                <Select
                  value={localSettings.font_size ?? 'normal'}
                  onChange={e => {
                    const val = e.target.value;
                    setLocalSettings({ ...localSettings, font_size: val });
                    handleSave({ font_size: val });
                  }}
                  label={t('ফন্ট সাইজ', 'Font Size')}
                >
                  <MenuItem value="small">{t('ছোট', 'Small')}</MenuItem>
                  <MenuItem value="normal">{t('সাধারণ', 'Normal')}</MenuItem>
                  <MenuItem value="large">{t('বড়', 'Large')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.compact_mode ?? false}
                    onChange={e => {
                      setLocalSettings({ ...localSettings, compact_mode: e.target.checked });
                      handleSave({ compact_mode: e.target.checked });
                    }}
                  />
                }
                label={t('কমপ্যাক্ট মোড', 'Compact Mode')}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={localSettings.animations_enabled ?? true}
                    color="primary"
                    onChange={e => {
                      setLocalSettings({ ...localSettings, animations_enabled: e.target.checked });
                      handleSave({ animations_enabled: e.target.checked });
                    }}
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" fontWeight={600}>
                      {t('অ্যানিমেশন সক্রিয় করুন', 'Enable Animations')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('পেজ ট্রানজিশন ও হোভার ইফেক্ট', 'Page transitions & hover effects')}
                    </Typography>
                  </Box>
                }
              />
            </Grid>
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 8 — DATA MANAGEMENT
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={8}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t('সতর্কতা: ডেটা মুছে ফেলা অপরিবর্তনীয়। আগে ব্যাকআপ রপ্তানি করুন।',
             'Warning: Deleting data is irreversible. Please export a backup first.')}
        </Alert>
        <SettingCard>
          <SectionTitle icon={<DeleteIcon fontSize="small" />} text={t('ডেটা মুছুন', 'Delete Data')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Button
                variant="contained" color="error"
                startIcon={<DeleteIcon />} fullWidth
                onClick={() => { setDeleteTarget('all'); setDeleteDialog(true); }}
              >
                {t('সমস্ত ডেটা মুছুন', 'Delete All Data')}
              </Button>
            </Grid>
            {[
              { table: 'houses',           bn: 'বাড়ির ডেটা মুছুন',    en: 'Delete House Data' },
              { table: 'flats',            bn: 'ফ্ল্যাট ডেটা মুছুন',  en: 'Delete Flat Data' },
              { table: 'tenants',          bn: 'ভাড়াটে ডেটা মুছুন',  en: 'Delete Tenant Data' },
              { table: 'rent_collections', bn: 'সংগ্রহ ডেটা মুছুন',   en: 'Delete Collection Data' },
              { table: 'meter_readings',   bn: 'মিটার ডেটা মুছুন',    en: 'Delete Meter Data' },
            ].map(({ table, bn, en }) => (
              <Grid key={table} size={{ xs: 12, sm: 6 }}>
                <Button
                  variant="outlined" color="error"
                  startIcon={<DeleteIcon />} fullWidth
                  onClick={() => { setDeleteTarget(table); setDeleteDialog(true); }}
                >
                  {t(bn, en)}
                </Button>
              </Grid>
            ))}
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 9 — SECURITY
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={9}>
        <SettingCard>
          <SectionTitle icon={<SecurityIcon fontSize="small" />} text={t('অ্যাকাউন্ট নিরাপত্তা', 'Account Security')} />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button variant="contained" color="primary" fullWidth>
                {t('পাসওয়ার্ড পরিবর্তন করুন', 'Change Password')}
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Button variant="outlined" color="error" fullWidth onClick={signOut}>
                {t('লগ আউট করুন', 'Log Out')}
              </Button>
            </Grid>
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ══════════════════════════════════════
          TAB 10 — ABOUT
      ══════════════════════════════════════ */}
      <TabPanel value={tabValue} index={10}>
        <SettingCard>
          <SectionTitle icon={<InfoIcon fontSize="small" />} text={t('অ্যাপ সম্পর্কে', 'About the App')} />
          <Grid container spacing={2}>
            {[
              { label_bn: 'অ্যাপ নাম',    label_en: 'App Name',    value: localSettings.app_name ?? 'Bari Manager BD' },
              { label_bn: 'সংস্করণ',      label_en: 'Version',     value: localSettings.app_version ?? '1.0.0' },
              { label_bn: 'ডেভেলপার',     label_en: 'Developer',   value: 'N-Studio' },
              { label_bn: 'যোগাযোগ',      label_en: 'Contact',     value: 'support@nstudio.com' },
            ].map(({ label_bn, label_en, value }) => (
              <Grid key={label_en} size={{ xs: 12 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
                  <Typography variant="body2" color="text.secondary">{t(label_bn, label_en)}</Typography>
                  <Typography variant="body2" fontWeight={600}>{value}</Typography>
                </Box>
                <Divider />
              </Grid>
            ))}
            <Grid size={{ xs: 12 }}>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button variant="outlined" fullWidth size="small">{t('গোপনীয়তা নীতি', 'Privacy Policy')}</Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button variant="outlined" fullWidth size="small">{t('শর্তাবলী', 'Terms & Conditions')}</Button>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Button variant="outlined" fullWidth size="small">{t('আপডেট চেক করুন', 'Check for Updates')}</Button>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </SettingCard>
      </TabPanel>

      {/* ─── Confirm Delete Dialog ─── */}
      <Dialog open={deleteDialog} onClose={() => setDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>{t('ডেটা মুছে ফেলবেন?', 'Delete Data?')}</DialogTitle>
        <DialogContent>
          <Alert severity="error" variant="outlined" sx={{ mb: 1 }}>
            {t('এই কাজটি অপরিবর্তনীয়!', 'This action is irreversible!')}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            {deleteTarget === 'all'
              ? t('সমস্ত ডেটা স্থায়ীভাবে মুছে যাবে।', 'All data will be permanently deleted.')
              : t(`"${deleteTarget}" টেবিলের সমস্ত ডেটা মুছে যাবে।`, `All records in "${deleteTarget}" will be deleted.`)}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button onClick={handleDeleteData} color="error" variant="contained" disabled={saving}>
            {saving ? <CircularProgress size={20} /> : t('মুছুন', 'Delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ─── Snackbar ─── */}
      <Snackbar
        open={!!message}
        autoHideDuration={4000}
        onClose={() => setMessage('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={msgSeverity} variant="filled" onClose={() => setMessage('')}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
