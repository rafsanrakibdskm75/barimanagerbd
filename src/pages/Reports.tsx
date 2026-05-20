import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import BoltIcon from '@mui/icons-material/Bolt';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { supabase, MONTHS_EN, MONTHS_BN } from '../lib/supabase';
import { useTheme } from '@mui/material/styles';
import { useSettings } from '../contexts/SettingsContext';

export default function Reports() {
  const { t, settings } = useSettings();
  const isEn = settings?.default_language === 'en';
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<{ month: string; collected: number; pending: number; electric: number }[]>([]);
  const [statusData, setStatusData] = useState<{ name: string; value: number }[]>([]);
  const [flatReport, setFlatReport] = useState<any[]>([]);
  const theme = useTheme();
  const years = [2023, 2024, 2025, 2026, 2027];
  const MONTHS = isEn ? MONTHS_EN : MONTHS_BN;

  useEffect(() => { load(); }, [filterYear, filterMonth, isEn]);

  const load = async () => {
    setLoading(true);

    const [collectionsRes, meterRes, flatsRes] = await Promise.all([
      supabase.from('rent_collections').select('*').eq('year', filterYear),
      supabase.from('meter_readings').select('*').eq('year', filterYear),
      supabase.from('flats').select('*, house:houses(name), tenants(full_name)'),
    ]);

    const allCollections = collectionsRes.data ?? [];
    const allMeter = meterRes.data ?? [];

    // Monthly bar chart data
    const monthly = MONTHS.map((m, i) => {
      const month = i + 1;
      const monthCols = allCollections.filter(c => c.month === month);
      const monthMeter = allMeter.filter(r => r.month === month);
      return {
        month: m.slice(0, 3),
        collected: monthCols.filter(c => c.payment_status !== 'pending').reduce((s, c) => s + c.amount_paid, 0),
        pending: monthCols.filter(c => c.payment_status === 'pending').reduce((s, c) => s + c.total_payable, 0),
        electric: monthMeter.reduce((s, r) => s + r.total_bill, 0),
      };
    });
    setMonthlyData(monthly);

    // Status pie for selected month
    const monthCols = allCollections.filter(c => c.month === filterMonth);
    setStatusData([
      { name: t('পাওয়া গেছে', 'Paid'), value: monthCols.filter(c => c.payment_status === 'paid').length },
      { name: t('আংশিক', 'Partial'), value: monthCols.filter(c => c.payment_status === 'partial').length },
      { name: t('বাকি', 'Due'), value: monthCols.filter(c => c.payment_status === 'pending').length },
    ]);

    // Per-flat report
    const flats = flatsRes.data ?? [];
    setFlatReport(flats.map(flat => {
      const col = allCollections.find(c => c.flat_id === flat.id && c.month === filterMonth);
      const meter = allMeter.find(r => r.flat_id === flat.id && r.month === filterMonth);
      return {
        flat_number: flat.flat_number,
        house_name: (flat as any).house?.name ?? '—',
        tenant_name: (flat as any).tenants?.[0]?.full_name ?? '—',
        monthly_rent: flat.monthly_rent,
        electric_bill: meter?.total_bill ?? col?.electric_bill ?? 0,
        total_payable: col?.total_payable ?? flat.monthly_rent,
        amount_paid: col?.amount_paid ?? 0,
        due_amount: col?.due_amount ?? (col?.total_payable ?? flat.monthly_rent),
        status: col?.payment_status ?? 'pending',
      };
    }));
    setLoading(false);
  };

  const PIE_COLORS = [theme.palette.success.main, theme.palette.warning.main, theme.palette.error.main];
  const yearTotal = monthlyData.reduce((s, m) => s + m.collected, 0);
  const yearPending = monthlyData.reduce((s, m) => s + m.pending, 0);
  const yearElectric = monthlyData.reduce((s, m) => s + m.electric, 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('রিপোর্ট ও বিশ্লেষণ', 'Reports & Analytics')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('আর্থিক তথ্য ও পরিসংখ্যান', 'Financial data and statistics')}</Typography>
        </Box>
        <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => window.print()}>
          {t('প্রিন্ট করুন', 'Print')}
        </Button>
      </Box>

      {/* Report banner */}
      <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2, mb: 3, border: '2px solid', borderColor: 'primary.main' }}>
        <Typography variant="h5" fontWeight={700} align="center" mb={1}>
          {t('বাড়ি ম্যানেজার BD — রাজস্ব রিপোর্ট', 'Bari Manager BD — Revenue Report')}
        </Typography>
        <Typography variant="body2" align="center" fontWeight={600}>
          {MONTHS[filterMonth - 1]} {filterYear}
        </Typography>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('মাস', 'Month')}</InputLabel>
          <Select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} label={t('মাস', 'Month')}>
            {MONTHS_EN.map((m, i) => <MenuItem key={i} value={i + 1}>{isEn ? m : MONTHS_BN[i]}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>{t('বছর', 'Year')}</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label={t('বছর', 'Year')}>
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <>
          {/* Summary cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            {[
              { icon: <TrendingUpIcon color="success" fontSize="small" />, label_bn: `${filterYear} — মোট সংগৃহীত`, label_en: `${filterYear} — Total Collected`, value: `৳${yearTotal.toLocaleString()}`, color: 'success.main', bg: 'success.50' },
              { icon: <AssessmentIcon color="error" fontSize="small" />, label_bn: `${filterYear} — মোট বাকি`, label_en: `${filterYear} — Total Pending`, value: `৳${yearPending.toLocaleString()}`, color: 'error.main', bg: 'error.50' },
              { icon: <BoltIcon color="warning" fontSize="small" />, label_bn: `${filterYear} — মোট বিদ্যুৎ বিল`, label_en: `${filterYear} — Total Electric`, value: `৳${yearElectric.toLocaleString()}`, color: 'warning.main', bg: undefined },
            ].map(({ icon, label_bn, label_en, value, color, bg }) => (
              <Grid key={label_en} size={{ xs: 6, md: 4 }}>
                <Card sx={bg ? { bgcolor: bg } : {}}>
                  <CardContent sx={{ py: 2, px: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      {icon}
                      <Typography variant="caption" color="text.secondary">{t(label_bn, label_en)}</Typography>
                    </Box>
                    <Typography variant="h5" fontWeight={700} color={color}>{value}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Charts */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, md: 8 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    {t(`বার্ষিক ভাড়া সংগ্রহ — ${filterYear}`, `Annual Rent Collection — ${filterYear}`)}
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `৳${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} />
                      <Bar dataKey="collected" name={t('সংগৃহীত', 'Collected')} fill={theme.palette.primary.main} radius={[3, 3, 0, 0]} />
                      <Bar dataKey="pending" name={t('বাকি', 'Pending')} fill={theme.palette.error.light} radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} mb={2}>
                    {MONTHS[filterMonth - 1]} {filterYear} — {t('অবস্থা', 'Status')}
                  </Typography>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {statusData.map((_, idx) => <Cell key={idx} fill={PIE_COLORS[idx]} />)}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Flat-level table */}
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                {t('ফ্ল্যাট-ভিত্তিক রিপোর্ট', 'Flat-wise Report')} — {MONTHS[filterMonth - 1]} {filterYear}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.main' }}>
                      {[t('ফ্ল্যাট','Flat'), t('বাড়ি','House'), t('ভাড়াটে','Tenant'), t('ভাড়া','Rent'), t('বিদ্যুৎ','Electric'), t('মোট দেয়','Payable'), t('পরিশোধ','Paid'), t('বাকি','Due'), t('অবস্থা','Status')].map(h => (
                        <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', py: 1.5 }}>{h}</TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {flatReport.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center">
                          <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>{t('কোনো ডেটা নেই', 'No data')}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : flatReport.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell><Typography variant="body2" fontWeight={600}>{t('ফ্ল্যাট', 'Flat')} {row.flat_number}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{row.house_name}</Typography></TableCell>
                        <TableCell><Typography variant="caption">{row.tenant_name}</Typography></TableCell>
                        <TableCell><Typography variant="body2">৳{row.monthly_rent.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2">৳{row.electric_bill.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" fontWeight={600}>৳{row.total_payable.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="success.main" fontWeight={600}>৳{row.amount_paid.toLocaleString()}</Typography></TableCell>
                        <TableCell><Typography variant="body2" color="error.main" fontWeight={600}>৳{row.due_amount.toLocaleString()}</Typography></TableCell>
                        <TableCell>
                          <Chip
                            label={row.status === 'paid' ? t('পাওয়া গেছে','Paid') : row.status === 'partial' ? t('আংশিক','Partial') : t('বাকি','Due')}
                            color={row.status === 'paid' ? 'success' : row.status === 'partial' ? 'warning' : 'error'}
                            size="small" sx={{ fontSize: '0.65rem' }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {flatReport.length > 0 && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Grid container spacing={2}>
                    {[
                      { label_bn: 'মোট দেয়', label_en: 'Total Payable', value: flatReport.reduce((s, r) => s + r.total_payable, 0) },
                      { label_bn: 'মোট সংগৃহীত', label_en: 'Total Collected', value: flatReport.reduce((s, r) => s + r.amount_paid, 0), color: 'success.main' },
                      { label_bn: 'মোট বাকি', label_en: 'Total Due', value: flatReport.reduce((s, r) => s + r.due_amount, 0), color: 'error.main' },
                      { label_bn: 'মোট বিদ্যুৎ বিল', label_en: 'Total Electric', value: flatReport.reduce((s, r) => s + r.electric_bill, 0), color: 'warning.main' },
                    ].map(({ label_bn, label_en, value, color }) => (
                      <Grid key={label_en} size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" color="text.secondary">{t(label_bn, label_en)}</Typography>
                        <Typography variant="h6" fontWeight={700} color={color ?? 'text.primary'}>৳{value.toLocaleString()}</Typography>
                      </Grid>
                    ))}
                  </Grid>
                </>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </Box>
  );
}
