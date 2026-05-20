import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import PremiumLoader from '../components/PremiumLoader';
import { useSettings } from '../contexts/SettingsContext';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import PaymentsIcon from '@mui/icons-material/Payments';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, MONTHS_EN } from '../lib/supabase';
import type { RentCollection } from '../lib/supabase';
import { useTheme } from '@mui/material/styles';

type Stats = {
  totalHouses: number;
  totalFlats: number;
  occupiedFlats: number;
  vacantFlats: number;
  monthlyCollected: number;
  monthlyPending: number;
  totalDue: number;
  paidFlats: number;
  partialFlats: number;
  pendingFlats: number;
  todayCollection: number;
};

function StatCard({
  title,
  titleBn,
  value,
  icon,
  color,
  onClick,
}: {
  title: string;
  titleBn: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}) {
  const { settings } = useSettings();
  const animations = settings?.animations_enabled !== false;
  const isEn = settings?.default_language === 'en';

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? 'pointer' : 'default',
        transition: animations ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
        '&:hover': onClick ? {
          transform: animations ? 'translateY(-4px) scale(1.02)' : 'none',
          boxShadow: animations ? '0 12px 28px rgba(0,0,0,0.15)' : 'none',
        } : {},
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {isEn ? title : titleBn}
            </Typography>
            <Typography variant="h4" fontWeight={700} color={color} lineHeight={1.2}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ opacity: 0.7 }}>
              {isEn ? titleBn : title}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}22`, width: 52, height: 52 }}>
            <Box sx={{ color }}>{icon}</Box>
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { settings, t } = useSettings();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentCollections, setRecentCollections] = useState<RentCollection[]>([]);
  const [chartData, setChartData] = useState<{ month: string; collected: number; pending: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const theme = useTheme();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [housesRes, flatsRes, collectionsRes, recentRes, unpaidRes, todayCollectionsRes] = await Promise.all([
        supabase.from('houses').select('id'),
        supabase.from('flats').select('id, status'),
        supabase.from('rent_collections').select('*').eq('month', currentMonth).eq('year', currentYear),
        supabase.from('rent_collections')
          .select('*, flat:flats(flat_number, house:houses(name))')
          .order('updated_at', { ascending: false })
          .limit(5),
        supabase.from('rent_collections').select('due_amount').neq('payment_status', 'paid'),
        supabase.from('rent_collections').select('amount_paid').gte('collection_date', todayStart.toISOString()),
      ]);

      const flats = flatsRes.data ?? [];
      const collections = collectionsRes.data ?? [];
      const unpaidCollections = unpaidRes.data ?? [];
      const todayCollections = todayCollectionsRes.data ?? [];

      const occupied = flats.filter(f => f.status === 'occupied').length;
      const paid = collections.filter(c => c.payment_status === 'paid');
      const partial = collections.filter(c => c.payment_status === 'partial');
      const pending = collections.filter(c => c.payment_status === 'pending');

      setStats({
        totalHouses: housesRes.data?.length ?? 0,
        totalFlats: flats.length,
        occupiedFlats: occupied,
        vacantFlats: flats.length - occupied,
        monthlyCollected: paid.reduce((s, c) => s + c.amount_paid, 0) + partial.reduce((s, c) => s + c.amount_paid, 0),
        monthlyPending: pending.reduce((s, c) => s + c.total_payable, 0),
        totalDue: unpaidCollections.reduce((s, c) => s + (c.due_amount ?? 0), 0),
        paidFlats: paid.length,
        partialFlats: partial.length,
        pendingFlats: pending.length,
        todayCollection: todayCollections.reduce((s, c) => s + c.amount_paid, 0),
      });

      setRecentCollections((recentRes.data ?? []) as unknown as RentCollection[]);

      // Build 6-month chart data
      const chartMonths = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date(currentYear, currentMonth - 1 - i, 1);
        chartMonths.push({ month: d.getMonth() + 1, year: d.getFullYear() });
      }

      const chartRes = await supabase
        .from('rent_collections')
        .select('month, year, amount_paid, total_payable, due_amount');

      const raw = chartRes.data ?? [];
      setChartData(
        chartMonths.map(({ month, year }) => {
          const monthData = raw.filter(r => r.month === month && r.year === year);
          return {
            month: MONTHS_EN[month - 1].slice(0, 3),
            collected: monthData.reduce((s, c) => s + c.amount_paid, 0),
            pending: monthData.reduce((s, c) => s + (c.due_amount ?? 0), 0),
          };
        })
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <PremiumLoader />;
  }

  const s = stats!;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {t('ড্যাশবোর্ড', 'Dashboard')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {settings?.default_language === 'en'
            ? `Dashboard — ${MONTHS_EN[currentMonth - 1]} ${currentYear}`
            : `ড্যাশবোর্ড — ${MONTHS_EN[currentMonth - 1]} ${currentYear}`}
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="মোট বাড়ি" title="Total Houses" value={s.totalHouses} icon={<HomeWorkIcon />} color={theme.palette.primary.main} onClick={() => navigate('/houses')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="মোট ফ্ল্যাট" title="Total Flats" value={s.totalFlats} icon={<ApartmentIcon />} color={theme.palette.info.main} onClick={() => navigate('/flats')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="ভাড়াটে আছে" title="Occupied" value={s.occupiedFlats} icon={<PeopleIcon />} color={theme.palette.success.main} onClick={() => navigate('/tenants')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="খালি আছে" title="Vacant" value={s.vacantFlats} icon={<ApartmentIcon />} color={theme.palette.warning.main} onClick={() => navigate('/flats')} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="আজকের সংগ্রহ" title="Today's Collection" value={`৳${s.todayCollection.toLocaleString()}`} icon={<TrendingUpIcon />} color={theme.palette.success.dark} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="মাসিক সংগ্রহ" title="Monthly Collected" value={`৳${s.monthlyCollected.toLocaleString()}`} icon={<PaymentsIcon />} color={theme.palette.primary.main} onClick={() => navigate('/collections')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="বকেয়া মোট" title="Total Due" value={`৳${s.totalDue.toLocaleString()}`} icon={<WarningIcon />} color={theme.palette.error.main} onClick={() => navigate('/collections')} />
        </Grid>
        <Grid size={{ xs: 6, sm: 3 }}>
          <StatCard titleBn="পেন্ডিং ফ্ল্যাট" title="Pending Flats" value={s.pendingFlats} icon={<HourglassEmptyIcon />} color={theme.palette.warning.main} onClick={() => navigate('/collections')} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={2}>
                ৬ মাসের সংগ্রহ — 6 Month Collection
              </Typography>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v) => `৳${Number(v).toLocaleString()}`} />
                  <Bar dataKey="collected" name="Collected" fill={theme.palette.primary.main} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pending" name="Pending" fill={theme.palette.error.light} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} mb={1.5}>
                এই মাসের অবস্থা — This Month Status
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip icon={<CheckCircleIcon />} label={`পাওয়া গেছে: ${s.paidFlats}`} color="success" variant="filled" size="small" />
                <Chip icon={<HourglassEmptyIcon />} label={`আংশিক: ${s.partialFlats}`} color="warning" variant="filled" size="small" />
                <Chip icon={<WarningIcon />} label={`বাকি: ${s.pendingFlats}`} color="error" variant="filled" size="small" />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ pb: '12px !important' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="h6" fontWeight={600}>
                  সাম্প্রতিক সংগ্রহ
                </Typography>
                <Button size="small" endIcon={<ArrowForwardIcon />} onClick={() => navigate('/history')}>
                  সব দেখুন
                </Button>
              </Box>
              {recentCollections.length === 0 ? (
                <Alert severity="info" variant="outlined">কোনো সংগ্রহ নেই</Alert>
              ) : (
                <List dense disablePadding>
                  {recentCollections.map((c, i) => {
                    const flat = (c as any).flat;
                    return (
                      <Box key={c.id}>
                        <ListItem disablePadding sx={{ py: 0.5 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ width: 36, height: 36, bgcolor: c.payment_status === 'paid' ? 'success.light' : c.payment_status === 'partial' ? 'warning.light' : 'error.light', fontSize: '0.75rem' }}>
                              {c.payment_status === 'paid' ? <CheckCircleIcon sx={{ fontSize: 18, color: 'success.dark' }} /> : c.payment_status === 'partial' ? <HourglassEmptyIcon sx={{ fontSize: 18, color: 'warning.dark' }} /> : <WarningIcon sx={{ fontSize: 18, color: 'error.dark' }} />}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={`Flat ${flat?.flat_number ?? '—'} — ${flat?.house?.name ?? ''}`}
                            secondary={`৳${c.amount_paid.toLocaleString()} · ${MONTHS_EN[c.month - 1]} ${c.year}`}
                            primaryTypographyProps={{ fontSize: '0.8rem', fontWeight: 600 }}
                            secondaryTypographyProps={{ fontSize: '0.72rem' }}
                          />
                          <Chip
                            label={c.payment_status === 'paid' ? 'পাওয়া গেছে' : c.payment_status === 'partial' ? 'আংশিক' : 'বাকি'}
                            color={c.payment_status === 'paid' ? 'success' : c.payment_status === 'partial' ? 'warning' : 'error'}
                            size="small"
                            sx={{ fontSize: '0.65rem' }}
                          />
                        </ListItem>
                        {i < recentCollections.length - 1 && <Divider variant="inset" component="li" />}
                      </Box>
                    );
                  })}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
