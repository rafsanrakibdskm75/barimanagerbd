import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import InputAdornment from '@mui/material/InputAdornment';
import Grid from '@mui/material/Grid';
import DownloadIcon from '@mui/icons-material/Download';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import SearchIcon from '@mui/icons-material/Search';
import { supabase, MONTHS_EN, MONTHS_BN } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

export default function MeterHistory() {
  const { t, settings } = useSettings();
  const [readings, setReadings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const years = [2023, 2024, 2025, 2026, 2027];

  useEffect(() => { load(); }, [filterYear]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('meter_readings')
      .select('*, flat:flats(flat_number, house:houses(name), tenants(full_name))')
      .eq('year', filterYear)
      .order('month', { ascending: false })
      .order('created_at', { ascending: false });
    setReadings((data ?? []) as any);
    setLoading(false);
  };

  const filtered = readings.filter(r => {
    const s = search.toLowerCase();
    const flat = r.flat;
    return !s ||
      flat?.flat_number?.toLowerCase().includes(s) ||
      flat?.house?.name?.toLowerCase().includes(s) ||
      flat?.tenants?.[0]?.full_name?.toLowerCase().includes(s);
  });

  const MONTHS = settings?.default_language === 'en' ? MONTHS_EN : MONTHS_BN;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('মিটার রিডিং ইতিহাস', 'Meter Reading History')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('সকল মিটার রেকর্ড', 'All Meter Records')}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.print()}>
          {t('প্রিন্ট করুন', 'Print')}
        </Button>
      </Box>

      <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h5" fontWeight={700} align="center" mb={1}>
          {t('বাড়ি ম্যানেজার BD — মিটার রিডিং রিপোর্ট', 'Bari Manager BD — Meter Reading Report')}
        </Typography>
        <Typography variant="body2" align="center" fontWeight={600}>
          {t('বছর:', 'Year:')} {filterYear}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>{t('বছর', 'Year')}</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label={t('বছর', 'Year')}>
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          placeholder={t('ফ্ল্যাট, ভাড়াটে বা বাড়ি দিয়ে খুঁজুন...', 'Search by flat, tenant or house...')}
          value={search}
          onChange={e => setSearch(e.target.value)}
          sx={{ minWidth: 220 }}
          size="small"
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
        />
      </Box>

      {readings.length > 0 && (
        <Grid container spacing={2} sx={{ mb: 2 }}>
          {[
            { label_bn: 'মোট রিডিং', label_en: 'Total Readings', value: readings.length, color: 'primary.main' },
            { label_bn: 'মোট ব্যবহার', label_en: 'Total Units Used', value: `${readings.reduce((s, r) => s + r.units_used, 0).toLocaleString()} u`, color: 'info.main' },
            { label_bn: 'মোট বিল', label_en: 'Total Bill', value: `৳${readings.reduce((s, r) => s + r.total_bill, 0).toLocaleString()}`, color: 'warning.main' },
            { label_bn: 'গড় ইউনিট দাম', label_en: 'Avg Unit Price', value: `৳${(readings.reduce((s, r) => s + r.per_unit_price, 0) / readings.length).toFixed(0)}`, color: 'success.main' },
          ].map(({ label_bn, label_en, value, color }) => (
            <Grid key={label_en} size={{ xs: 6, sm: 3 }}>
              <Card>
                <CardContent sx={{ py: 1.5, px: 2 }}>
                  <Typography variant="caption" color="text.secondary">{t(label_bn, label_en)}</Typography>
                  <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">
          {search ? t('কোনো রিডিং পাওয়া যায়নি', 'No readings found') : t(`${filterYear} সালে কোনো রিডিং নেই`, `No readings for ${filterYear}`)}
        </Alert>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {[
                  t('তারিখ', 'Date'),
                  t('মাস', 'Month'),
                  t('ফ্ল্যাট', 'Flat'),
                  t('ভাড়াটে', 'Tenant'),
                  t('আগের রিডিং', 'Prev Reading'),
                  t('বর্তমান রিডিং', 'Curr Reading'),
                  t('ব্যবহার (ইউনিট)', 'Used (Units)'),
                  t('প্রতি ইউনিট', 'Per Unit'),
                  t('মোট বিল', 'Total Bill'),
                ].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(r => {
                const flat = r.flat;
                const tenant = flat?.tenants?.[0];
                return (
                  <TableRow key={r.id} hover>
                    <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                      {new Date(r.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{MONTHS[r.month - 1]}</Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Avatar sx={{ width: 26, height: 26, bgcolor: 'info.light', fontSize: '0.65rem' }}>
                          <ElectricMeterIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} fontSize="0.75rem">{t('ফ্ল্যাট', 'Flat')} {flat?.flat_number}</Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">{flat?.house?.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{tenant?.full_name ?? '—'}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="body2">{r.previous_reading}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{r.current_reading}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${r.units_used} ${t('ইউনিট', 'units')}`} size="small" color="info" variant="outlined" />
                    </TableCell>
                    <TableCell><Typography variant="body2">৳{r.per_unit_price}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">৳{r.total_bill.toLocaleString()}</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
