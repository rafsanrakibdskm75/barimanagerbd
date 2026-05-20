import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningIcon from '@mui/icons-material/Warning';
import PaymentsIcon from '@mui/icons-material/Payments';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import { supabase, MONTHS_EN, MONTHS_BN, PAYMENT_METHOD_LABELS } from '../lib/supabase';
import type { RentCollection, Flat } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import PremiumLoader from '../components/PremiumLoader';

const emptyForm = {
  flat_id: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  monthly_rent: '',
  electric_bill: '0',
  water_bill: '0',
  service_charge: '0',
  amount_paid: '',
  payment_status: 'pending' as 'pending' | 'partial' | 'paid',
  collector_name: '',
  collector_phone: '',
  payment_method: 'cash' as 'cash' | 'bkash' | 'nagad' | 'bank_transfer',
  transaction_id: '',
  collection_date: new Date().toISOString().slice(0, 16),
  notes: '',
};

export default function Collections() {
  const { settings, t } = useSettings();
  const isEn = settings?.default_language === 'en';

  const [collections, setCollections] = useState<(RentCollection & { flat?: Flat & { house?: { name: string }; tenants?: { full_name: string; phone: string }[] } })[]>([]);
  const [unpaidCollections, setUnpaidCollections] = useState<RentCollection[]>([]);
  const [flats, setFlats] = useState<(Flat & { house?: { name: string }; tenants?: { full_name: string }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<RentCollection | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [tabValue, setTabValue] = useState(0);
  const { user } = useAuth();
  const years = [2023, 2024, 2025, 2026, 2027];

  // Quick Pay State
  const [quickPayOpen, setQuickPayOpen] = useState(false);
  const [quickPayCollection, setQuickPayCollection] = useState<RentCollection | null>(null);
  const [quickPayAmount, setQuickPayAmount] = useState('');
  const [quickPayCollector, setQuickPayCollector] = useState('Admin');
  const [quickPayMethod, setQuickPayMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank_transfer'>('cash');

  useEffect(() => { load(); }, [filterMonth, filterYear]);

  const load = async () => {
    setLoading(true);
    const [colRes, flatsRes, unpaidRes] = await Promise.all([
      supabase.from('rent_collections')
        .select('*, flat:flats(*, house:houses(name), tenants(full_name, phone))')
        .eq('month', filterMonth).eq('year', filterYear)
        .order('created_at', { ascending: false }),
      supabase.from('flats').select('*, house:houses(name), tenants(full_name)').order('flat_number'),
      supabase.from('rent_collections')
        .select('*')
        .neq('payment_status', 'paid')
    ]);
    setCollections((colRes.data ?? []) as any);
    setFlats((flatsRes.data ?? []) as any);
    setUnpaidCollections((unpaidRes.data ?? []) as any);
    setLoading(false);
  };

  const isBefore = (m1: number, y1: number, m2: number, y2: number) => {
    if (y1 < y2) return true;
    if (y1 === y2 && m1 < m2) return true;
    return false;
  };

  const getPreviousDue = (flatId: string) => {
    return unpaidCollections
      .filter(u => u.flat_id === flatId && isBefore(u.month, u.year, filterMonth, filterYear))
      .reduce((sum, u) => sum + (Number(u.total_payable) - Number(u.amount_paid)), 0);
  };

  const openAdd = () => {
    setEditing(null);
    const firstFlat = flats[0];
    setForm({
      ...emptyForm,
      flat_id: firstFlat?.id ?? '',
      monthly_rent: String(firstFlat?.monthly_rent ?? ''),
      water_bill: String(firstFlat?.water_bill ?? 0),
      service_charge: String(firstFlat?.service_charge ?? 0),
      month: String(filterMonth),
      year: String(filterYear),
    });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (c: RentCollection) => {
    setEditing(c);
    setForm({
      flat_id: c.flat_id,
      month: String(c.month),
      year: String(c.year),
      monthly_rent: String(c.monthly_rent),
      electric_bill: String(c.electric_bill),
      water_bill: String(c.water_bill),
      service_charge: String(c.service_charge),
      amount_paid: String(c.amount_paid),
      payment_status: c.payment_status,
      collector_name: c.collector_name ?? '',
      collector_phone: c.collector_phone ?? '',
      payment_method: c.payment_method ?? 'cash',
      transaction_id: c.transaction_id ?? '',
      collection_date: c.collection_date ? c.collection_date.slice(0, 16) : new Date().toISOString().slice(0, 16),
      notes: c.notes ?? '',
    });
    setError('');
    setDialogOpen(true);
  };

  const openQuickPay = (c: RentCollection, totalOutstanding: number) => {
    setQuickPayCollection(c);
    setQuickPayAmount(String(totalOutstanding));
    setQuickPayCollector('Admin');
    setQuickPayMethod((settings?.default_payment_method as any) || 'cash');
    setError('');
    setQuickPayOpen(true);
  };

  const handleFlatChange = (flatId: string) => {
    const flat = flats.find(f => f.id === flatId);
    setForm(prev => ({
      ...prev,
      flat_id: flatId,
      monthly_rent: String(flat?.monthly_rent ?? ''),
      water_bill: String(flat?.water_bill ?? 0),
      service_charge: String(flat?.service_charge ?? 0),
    }));
  };

  const totalPayable = (parseFloat(form.monthly_rent) || 0) + (parseFloat(form.electric_bill) || 0) + (parseFloat(form.water_bill) || 0) + (parseFloat(form.service_charge) || 0);

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const amountPaid = parseFloat(form.amount_paid) || 0;
    const payload = {
      flat_id: form.flat_id,
      month: parseInt(form.month),
      year: parseInt(form.year),
      monthly_rent: parseFloat(form.monthly_rent) || 0,
      electric_bill: parseFloat(form.electric_bill) || 0,
      water_bill: parseFloat(form.water_bill) || 0,
      service_charge: parseFloat(form.service_charge) || 0,
      total_payable: totalPayable,
      amount_paid: amountPaid,
      payment_status: form.payment_status,
      collector_name: form.collector_name,
      collector_phone: form.collector_phone,
      payment_method: form.payment_method,
      transaction_id: form.transaction_id,
      collection_date: amountPaid > 0 ? form.collection_date : null,
      notes: form.notes,
    };
    let err, data: any;
    if (editing) {
      ({ error: err, data } = await supabase.from('rent_collections').update(payload).eq('id', editing.id).select().single());
    } else {
      ({ error: err, data } = await supabase.from('rent_collections').insert(payload).select().single());
    }
    if (!err && data && amountPaid > 0) {
      await supabase.from('collection_history').insert({
        collection_id: data.id,
        flat_id: form.flat_id,
        action: editing ? 'updated' : 'collected',
        amount: amountPaid,
        collector_name: form.collector_name,
        collector_phone: form.collector_phone,
        payment_method: form.payment_method,
        transaction_id: form.transaction_id,
        notes: form.notes,
        performed_by: user?.id,
      });
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDialogOpen(false);
    load();
  };

  const handleQuickPayConfirm = async () => {
    if (!quickPayCollection) return;
    setSaving(true);
    setError('');

    try {
      const flatId = quickPayCollection.flat_id;
      const amountToPay = parseFloat(quickPayAmount) || 0;

      // 1. Fetch all unpaid collections for this flat
      const { data: unpaidCols, error: fetchErr } = await supabase
        .from('rent_collections')
        .select('*')
        .eq('flat_id', flatId)
        .neq('payment_status', 'paid');

      if (fetchErr) throw fetchErr;

      // Sort chronologically (oldest month first)
      const sortedUnpaid = (unpaidCols ?? []).sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });

      let remainingPayment = amountToPay;

      for (const col of sortedUnpaid) {
        if (remainingPayment <= 0) break;

        const colDue = Number(col.total_payable) - Number(col.amount_paid);
        let amountApplied = 0;
        let nextStatus: 'pending' | 'partial' | 'paid' = 'pending';

        if (remainingPayment >= colDue) {
          amountApplied = colDue;
          remainingPayment -= colDue;
          nextStatus = 'paid';
        } else {
          amountApplied = remainingPayment;
          remainingPayment = 0;
          nextStatus = 'partial';
        }

        const nextAmountPaid = Number(col.amount_paid) + amountApplied;

        // Update the collection record
        const { error: updateErr } = await supabase
          .from('rent_collections')
          .update({
            amount_paid: nextAmountPaid,
            payment_status: nextStatus,
            collector_name: quickPayCollector,
            payment_method: quickPayMethod,
            collection_date: new Date().toISOString(),
          })
          .eq('id', col.id);

        if (updateErr) throw updateErr;

        // Create collection history record
        const { error: historyErr } = await supabase
          .from('collection_history')
          .insert({
            collection_id: col.id,
            flat_id: flatId,
            action: 'collected',
            amount: amountApplied,
            collector_name: quickPayCollector,
            payment_method: quickPayMethod,
            performed_by: user?.id,
            notes: 'Quick collected with carry forward distribution',
          });

        if (historyErr) throw historyErr;
      }

      setQuickPayOpen(false);
      load();
    } catch (err: any) {
      setError(err.message || 'Error executing quick pay');
    } finally {
      setSaving(false);
    }
  };

  const getStatusConfig = (status: 'paid' | 'partial' | 'pending') => {
    if (status === 'paid') return { label: t('পাওয়া গেছে', 'Paid'), color: 'success' as const, icon: <CheckCircleIcon fontSize="small" /> };
    if (status === 'partial') return { label: t('আংশিক পরিশোধ', 'Partial'), color: 'warning' as const, icon: <HourglassEmptyIcon fontSize="small" /> };
    return { label: t('বাকি আছে', 'Pending'), color: 'error' as const, icon: <WarningIcon fontSize="small" /> };
  };

  const months = isEn ? MONTHS_EN : MONTHS_BN;

  const tabFiltered = collections.filter(c => {
    if (tabValue === 0) return true;
    if (tabValue === 1) return c.payment_status === 'pending';
    if (tabValue === 2) return c.payment_status === 'partial';
    return c.payment_status === 'paid';
  });

  const totalCollected = collections.filter(c => c.payment_status !== 'pending').reduce((s, c) => s + Number(c.amount_paid), 0);
  const totalPending = collections.reduce((s, c) => s + (Number(c.due_amount) ?? 0), 0);

  const animations = settings?.animations_enabled !== false;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('ভাড়া সংগ্রহ', 'Rent Collection')}</Typography>
          <Typography variant="body2" color="text.secondary">Rent Collection Management</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={flats.length === 0}>
          {t('সংগ্রহ যোগ করুন', 'Add Collection')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('মাস', 'Month')}</InputLabel>
          <Select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} label={t('মাস', 'Month')}>
            {months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>{t('বছর', 'Year')}</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label={t('বছর', 'Year')}>
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'success.50' }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('মোট সংগৃহীত', 'Total Collected')}</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">৳{totalCollected.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 6, md: 3 }}>
          <Card sx={{ bgcolor: 'error.50' }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('মোট বাকি', 'Total Pending')}</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">৳{totalPending.toLocaleString()}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('পাওয়া গেছে', 'Paid')}</Typography>
              <Typography variant="h6" fontWeight={700} color="success.main">{collections.filter(c => c.payment_status === 'paid').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('আংশিক', 'Partial')}</Typography>
              <Typography variant="h6" fontWeight={700} color="warning.main">{collections.filter(c => c.payment_status === 'partial').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 4, md: 2 }}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('বাকি আছে', 'Pending')}</Typography>
              <Typography variant="h6" fontWeight={700} color="error.main">{collections.filter(c => c.payment_status === 'pending').length}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label={`${t('সব', 'All')} (${collections.length})`} />
        <Tab label={`${t('বাকি', 'Pending')} (${collections.filter(c => c.payment_status === 'pending').length})`} />
        <Tab label={`${t('আংশিক', 'Partial')} (${collections.filter(c => c.payment_status === 'partial').length})`} />
        <Tab label={`${t('পাওয়া গেছে', 'Paid')} (${collections.filter(c => c.payment_status === 'paid').length})`} />
      </Tabs>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><PremiumLoader /></Box>
      ) : tabFiltered.length === 0 ? (
        <Alert severity="info">{t('কোনো রেকর্ড নেই।', 'No records found.')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {tabFiltered.map(c => {
            const flat = (c as any).flat;
            const tenant = flat?.tenants?.[0];
            const statusConf = getStatusConfig(c.payment_status);
            const prevDue = getPreviousDue(c.flat_id);
            const currentTotal = Number(c.total_payable);
            const overallTotalPayable = currentTotal + prevDue;

            return (
              <Grid key={c.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card 
                  sx={{ 
                    borderLeft: `4px solid`, 
                    borderLeftColor: `${statusConf.color}.main`,
                    transition: animations ? 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out' : 'none',
                    '&:hover': animations ? {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    } : {},
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={700}>{t('ফ্ল্যাট', 'Flat')} {flat?.flat_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{flat?.house?.name}</Typography>
                      </Box>
                      <Chip
                        icon={statusConf.icon}
                        label={statusConf.label}
                        color={statusConf.color}
                        size="small"
                      />
                    </Box>

                    {tenant && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" fontWeight={600}>{tenant.full_name}</Typography>
                      </Box>
                    )}

                    <Divider sx={{ my: 1 }} />

                    <Grid container spacing={0.5}>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">{t('ভাড়া', 'Rent')}</Typography><Typography variant="body2" fontWeight={600}>৳{c.monthly_rent.toLocaleString()}</Typography></Grid>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">{t('বিদ্যুৎ', 'Electricity')}</Typography><Typography variant="body2" fontWeight={600}>৳{c.electric_bill.toLocaleString()}</Typography></Grid>
                      <Grid size={6}><Typography variant="caption" color="text.secondary">{t('পানি+সার্ভিস', 'Water+Service')}</Typography><Typography variant="body2" fontWeight={600}>৳{(c.water_bill + c.service_charge).toLocaleString()}</Typography></Grid>
                      <Grid size={6}>
                        <Typography variant="caption" color="text.secondary">{t('আগের বাকি', 'Previous Due')}</Typography>
                        <Typography variant="body2" fontWeight={700} color={prevDue > 0 ? "error.main" : "text.secondary"}>
                          ৳{prevDue.toLocaleString()}
                        </Typography>
                      </Grid>
                      <Grid size={12} sx={{ mt: 0.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'primary.50', p: 0.75, borderRadius: 1.5 }}>
                          <Typography variant="caption" fontWeight={600} color="primary.main">{t('সর্বমোট দেয়', 'Total Payable')}</Typography>
                          <Typography variant="body2" fontWeight={700} color="primary.main">৳{overallTotalPayable.toLocaleString()}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1 }} />

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{t('পরিশোধ করা', 'Paid')}</Typography>
                        <Typography variant="body1" fontWeight={700} color="success.main">৳{c.amount_paid.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">{t('বাকি', 'Due')}</Typography>
                        <Typography variant="body1" fontWeight={700} color="error.main">৳{(overallTotalPayable - c.amount_paid).toLocaleString()}</Typography>
                      </Box>
                    </Box>

                    {c.collector_name && (
                      <Box sx={{ mt: 1, p: 1, bgcolor: 'background.default', borderRadius: 1.5 }}>
                        <Typography variant="caption" color="text.secondary">{t('সংগ্রাহক: ', 'Collector: ')}</Typography>
                        <Typography variant="caption" fontWeight={600}>{c.collector_name}</Typography>
                        {c.collector_phone && (
                          <Typography variant="caption" color="text.secondary"> · {c.collector_phone}</Typography>
                        )}
                        <br />
                        <Typography variant="caption" color="text.secondary">{t('পদ্ধতি: ', 'Method: ')}</Typography>
                        <Typography variant="caption">{PAYMENT_METHOD_LABELS[c.payment_method] ?? c.payment_method}</Typography>
                      </Box>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(c)}>
                      {t('আপডেট করুন', 'Update')}
                    </Button>
                    {(overallTotalPayable - c.amount_paid) > 0 && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => openQuickPay(c, overallTotalPayable - c.amount_paid)}
                      >
                        {t('পাওয়া গেছে', 'Received')}
                      </Button>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Main Form Dialog (Add/Edit) */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <PaymentsIcon color="primary" />
            {editing ? t('সংগ্রহ আপডেট করুন', 'Update Collection') : t('নতুন সংগ্রহ রেকর্ড', 'New Collection Record')}
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ফ্ল্যাট *', 'Flat *')}</InputLabel>
                <Select value={form.flat_id} onChange={e => handleFlatChange(e.target.value)} label={t('ফ্ল্যাট *', 'Flat *')}>
                  {flats.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      {t('ফ্ল্যাট', 'Flat')} {f.flat_number} — {(f as any).house?.name} — {(f as any).tenants?.[0]?.full_name ?? t('খালি', 'Vacant')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('মাস', 'Month')}</InputLabel>
                <Select value={form.month} onChange={e => setForm({ ...form, month: String(e.target.value) })} label={t('মাস', 'Month')}>
                  {months.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={6}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('বছর', 'Year')}</InputLabel>
                <Select value={form.year} onChange={e => setForm({ ...form, year: String(e.target.value) })} label={t('বছর', 'Year')}>
                  {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('মাসিক ভাড়া *', 'Monthly Rent *')} type="number" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('বিদ্যুৎ বিল', 'Electricity Bill')} type="number" value={form.electric_bill} onChange={e => setForm({ ...form, electric_bill: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('পানির বিল', 'Water Bill')} type="number" value={form.water_bill} onChange={e => setForm({ ...form, water_bill: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('সার্ভিস চার্জ', 'Service Charge')} type="number" value={form.service_charge} onChange={e => setForm({ ...form, service_charge: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>

            {totalPayable > 0 && (
              <Grid size={{ xs: 12 }}>
                <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" fontWeight={600}>{t('মোট দেয়', 'Total Payable')}</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">৳{totalPayable.toLocaleString()}</Typography>
                </Box>
              </Grid>
            )}

            <Grid size={{ xs: 12 }}><Divider><Typography variant="caption" color="text.secondary">{t('পেমেন্ট তথ্য', 'Payment Information')}</Typography></Divider></Grid>

            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('পরিশোধকৃত পরিমাণ', 'Amount Paid')} type="number" value={form.amount_paid} onChange={e => {
                const paid = parseFloat(e.target.value) || 0;
                const status = paid <= 0 ? 'pending' : paid >= totalPayable ? 'paid' : 'partial';
                setForm({ ...form, amount_paid: e.target.value, payment_status: status });
              }} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('পেমেন্ট অবস্থা', 'Payment Status')}</InputLabel>
                <Select value={form.payment_status} onChange={e => setForm({ ...form, payment_status: e.target.value as any })} label={t('পেমেন্ট অবস্থা', 'Payment Status')}>
                  <MenuItem value="pending">{t('বাকি আছে (Pending)', 'Pending')}</MenuItem>
                  <MenuItem value="partial">{t('আংশিক (Partial)', 'Partial')}</MenuItem>
                  <MenuItem value="paid">{t('পাওয়া গেছে', 'Paid')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('সংগ্রাহকের নাম', 'Collector Name')} value={form.collector_name} onChange={e => setForm({ ...form, collector_name: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('সংগ্রাহকের ফোন', 'Collector Phone')} value={form.collector_phone} onChange={e => setForm({ ...form, collector_phone: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('পেমেন্ট পদ্ধতি', 'Payment Method')}</InputLabel>
                <Select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value as any })} label={t('পেমেন্ট পদ্ধতি', 'Payment Method')}>
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label={t('ট্রানজেকশন ID (ঐচ্ছিক)', 'Transaction ID (Optional)')} value={form.transaction_id} onChange={e => setForm({ ...form, transaction_id: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('সংগ্রহের তারিখ ও সময়', 'Collection Date & Time')} type="datetime-local" value={form.collection_date} onChange={e => setForm({ ...form, collection_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('মন্তব্য / নোট', 'Comments / Notes')} multiline rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.flat_id || !form.monthly_rent}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? t('আপডেট', 'Update') : t('সংরক্ষণ', 'Save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Quick Chronological Pay Dialog */}
      <Dialog open={quickPayOpen} onClose={() => setQuickPayOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <CheckCircleIcon color="success" />
            <Typography variant="h6" fontWeight={700}>{t('দ্রুত পেমেন্ট গ্রহণ', 'Quick Rent Collection')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Typography variant="body2" mb={2} color="text.secondary">
            {t('আগের বকেয়া সহ মোট পরিশোধের বিতরণ ক্রমানুসারে করা হবে (সবচেয়ে পুরনো বকেয়া আগে পরিশোধ হবে)।', 'Payments will be distributed chronologically (oldest outstanding balances will be paid off first).')}
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('পরিশোধকৃত পরিমাণ', 'Amount Received')}
                type="number"
                value={quickPayAmount}
                onChange={e => setQuickPayAmount(e.target.value)}
                InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('সংগ্রাহকের নাম', 'Collector Name')}
                value={quickPayCollector}
                onChange={e => setQuickPayCollector(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('পেমেন্ট পদ্ধতি', 'Payment Method')}</InputLabel>
                <Select
                  value={quickPayMethod}
                  onChange={e => setQuickPayMethod(e.target.value as any)}
                  label={t('পেমেন্ট পদ্ধতি', 'Payment Method')}
                >
                  {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setQuickPayOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button variant="contained" color="success" onClick={handleQuickPayConfirm} disabled={saving || !quickPayAmount}>
            {saving ? <CircularProgress size={20} color="inherit" /> : t('নিশ্চিত করুন', 'Confirm')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
