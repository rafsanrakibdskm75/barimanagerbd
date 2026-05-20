import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
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
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import BoltIcon from '@mui/icons-material/Bolt';
import { supabase, MONTHS_EN } from '../lib/supabase';
import type { MeterReading, Flat } from '../lib/supabase';

const emptyForm = {
  flat_id: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  previous_reading: '',
  current_reading: '',
  per_unit_price: '7',
};

export default function Meter() {
  const [readings, setReadings] = useState<(MeterReading & { flat?: Flat & { house?: { name: string }; tenants?: { full_name: string }[] } })[]>([]);
  const [flats, setFlats] = useState<(Flat & { house?: { name: string }; tenants?: { full_name: string }[] })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<MeterReading | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());

  useEffect(() => { load(); }, [filterMonth, filterYear]);

  const load = async () => {
    setLoading(true);
    const [readingsRes, flatsRes] = await Promise.all([
      supabase.from('meter_readings').select('*, flat:flats(*, house:houses(name), tenants(full_name))')
        .eq('month', filterMonth).eq('year', filterYear).order('created_at', { ascending: false }),
      supabase.from('flats').select('*, house:houses(name), tenants(full_name)').order('flat_number'),
    ]);
    setReadings((readingsRes.data ?? []) as any);
    setFlats((flatsRes.data ?? []) as any);
    setLoading(false);
  };

  const openAdd = async () => {
    setEditing(null);
    const firstFlat = flats[0];
    let prevReading = '0';
    if (firstFlat) {
      const prev = await getLastReading(firstFlat.id);
      prevReading = String(prev ?? 0);
    }
    setForm({ ...emptyForm, flat_id: firstFlat?.id ?? '', previous_reading: prevReading, month: String(filterMonth), year: String(filterYear) });
    setError('');
    setDialogOpen(true);
  };

  const getLastReading = async (flatId: string) => {
    const { data } = await supabase
      .from('meter_readings')
      .select('current_reading')
      .eq('flat_id', flatId)
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.current_reading ?? null;
  };

  const handleFlatChange = async (flatId: string) => {
    const prev = await getLastReading(flatId);
    setForm(f => ({ ...f, flat_id: flatId, previous_reading: String(prev ?? 0) }));
  };

  const units = Math.max(0, parseFloat(form.current_reading || '0') - parseFloat(form.previous_reading || '0'));
  const totalBill = units * parseFloat(form.per_unit_price || '0');

  const openEdit = (r: MeterReading) => {
    setEditing(r);
    setForm({
      flat_id: r.flat_id,
      month: String(r.month),
      year: String(r.year),
      previous_reading: String(r.previous_reading),
      current_reading: String(r.current_reading),
      per_unit_price: String(r.per_unit_price),
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    if (parseFloat(form.current_reading) < parseFloat(form.previous_reading)) {
      setError('বর্তমান রিডিং আগের রিডিং-এর কম হতে পারবে না।');
      return;
    }
    setSaving(true);

    const previous = parseFloat(form.previous_reading) || 0;
    const current = parseFloat(form.current_reading) || 0;
    const perUnit = parseFloat(form.per_unit_price) || 7;
    const unitsUsed = Math.max(0, current - previous);
    const totalBill = unitsUsed * perUnit;

    const payload = {
      flat_id: form.flat_id,
      month: parseInt(form.month),
      year: parseInt(form.year),
      previous_reading: previous,
      current_reading: current,
      per_unit_price: perUnit,
    };

    let err;
    if (editing) {
      ({ error: err } = await supabase.from('meter_readings').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('meter_readings').insert(payload));
    }

    if (err) {
      setSaving(false);
      setError(err.message);
      return;
    }

    // Automatically sync to rent_collections
    try {
      // 1. Fetch flat details
      const { data: flat } = await supabase
        .from('flats')
        .select('monthly_rent, water_bill, service_charge')
        .eq('id', payload.flat_id)
        .maybeSingle();

      // 2. Check if a rent collection already exists
      const { data: existingCol } = await supabase
        .from('rent_collections')
        .select('*')
        .eq('flat_id', payload.flat_id)
        .eq('month', payload.month)
        .eq('year', payload.year)
        .maybeSingle();

      if (existingCol) {
        const monthlyRent = Number(existingCol.monthly_rent) || 0;
        const waterBill = Number(existingCol.water_bill) || 0;
        const serviceCharge = Number(existingCol.service_charge) || 0;
        const totalPayable = monthlyRent + waterBill + serviceCharge + totalBill;

        await supabase
          .from('rent_collections')
          .update({
            electric_bill: totalBill,
            total_payable: totalPayable,
          })
          .eq('id', existingCol.id);
      } else {
        const monthlyRent = flat ? Number(flat.monthly_rent) : 0;
        const waterBill = flat ? Number(flat.water_bill) : 0;
        const serviceCharge = flat ? Number(flat.service_charge) : 0;
        const totalPayable = monthlyRent + waterBill + serviceCharge + totalBill;

        await supabase
          .from('rent_collections')
          .insert({
            flat_id: payload.flat_id,
            month: payload.month,
            year: payload.year,
            monthly_rent: monthlyRent,
            electric_bill: totalBill,
            water_bill: waterBill,
            service_charge: serviceCharge,
            total_payable: totalPayable,
            amount_paid: 0,
            payment_status: 'pending',
            notes: 'Automatically generated during meter reading entry',
          });
      }
    } catch (syncErr) {
      console.error('Error syncing meter bill to rent collections:', syncErr);
    }

    setSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('এই রিডিং ডিলিট করবেন?')) return;

    try {
      // Fetch reading details before deleting
      const { data: reading } = await supabase
        .from('meter_readings')
        .select('flat_id, month, year')
        .eq('id', id)
        .maybeSingle();

      const { error: err } = await supabase.from('meter_readings').delete().eq('id', id);

      if (!err && reading) {
        // Sync to rent_collections
        const { data: existingCol } = await supabase
          .from('rent_collections')
          .select('*')
          .eq('flat_id', reading.flat_id)
          .eq('month', reading.month)
          .eq('year', reading.year)
          .maybeSingle();

        if (existingCol) {
          const monthlyRent = Number(existingCol.monthly_rent) || 0;
          const waterBill = Number(existingCol.water_bill) || 0;
          const serviceCharge = Number(existingCol.service_charge) || 0;
          const totalPayable = monthlyRent + waterBill + serviceCharge; // electric_bill is 0

          await supabase
            .from('rent_collections')
            .update({
              electric_bill: 0,
              total_payable: totalPayable,
            })
            .eq('id', existingCol.id);
        }
      }
    } catch (err) {
      console.error('Error deleting meter reading or syncing collection:', err);
    }

    load();
  };

  const years = [2023, 2024, 2025, 2026, 2027];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>মিটার রিডিং</Typography>
          <Typography variant="body2" color="text.secondary">Electricity Meter Calculation</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={flats.length === 0}>
          রিডিং যোগ করুন
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>মাস</InputLabel>
          <Select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} label="মাস">
            {MONTHS_EN.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>বছর</InputLabel>
          <Select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} label="বছর">
            {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
          </Select>
        </FormControl>
        <Chip label={`${MONTHS_EN[filterMonth - 1]} ${filterYear} — ${readings.length}টি রিডিং`} variant="outlined" />
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'primary.main' }}>
                {['ফ্ল্যাট', 'ভাড়াটে', 'আগের রিডিং', 'বর্তমান রিডিং', 'ব্যবহার (ইউনিট)', 'প্রতি ইউনিট', 'মোট বিল', 'কার্যক্রম'].map(h => (
                  <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem', py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {readings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography variant="body2" color="text.secondary">এই মাসে কোনো রিডিং নেই</Typography>
                  </TableCell>
                </TableRow>
              ) : readings.map(r => {
                const flat = (r as any).flat;
                const tenant = flat?.tenants?.[0];
                return (
                  <TableRow key={r.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.light', fontSize: '0.7rem' }}>
                          <ElectricMeterIcon sx={{ fontSize: 14 }} />
                        </Avatar>
                        <Typography variant="body2" fontWeight={600}>ফ্ল্যাট {flat?.flat_number}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="body2">{tenant?.full_name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{r.previous_reading}</Typography></TableCell>
                    <TableCell><Typography variant="body2">{r.current_reading}</Typography></TableCell>
                    <TableCell>
                      <Chip label={`${r.units_used} ইউনিট`} size="small" color="info" variant="outlined" />
                    </TableCell>
                    <TableCell><Typography variant="body2">৳{r.per_unit_price}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} color="primary.main">৳{r.total_bill.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" color="primary" onClick={() => openEdit(r)}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(r.id)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {readings.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Card sx={{ flex: 1, minWidth: 160 }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">মোট ইউনিট ব্যবহার</Typography>
              <Typography variant="h5" fontWeight={700} color="info.main">
                {readings.reduce((s, r) => s + r.units_used, 0)} ইউনিট
              </Typography>
            </CardContent>
          </Card>
          <Card sx={{ flex: 1, minWidth: 160 }}>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">মোট বিদ্যুৎ বিল</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">
                ৳{readings.reduce((s, r) => s + r.total_bill, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <BoltIcon color="warning" />
            {editing ? 'রিডিং সম্পাদনা' : 'নতুন মিটার রিডিং'}
          </Box>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>ফ্ল্যাট *</InputLabel>
                <Select value={form.flat_id} onChange={e => handleFlatChange(e.target.value)} label="ফ্ল্যাট *">
                  {flats.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      ফ্ল্যাট {f.flat_number} — {(f as any).house?.name} — {(f as any).tenants?.[0]?.full_name ?? 'খালি'}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>মাস</InputLabel>
                <Select value={form.month} onChange={e => setForm({ ...form, month: String(e.target.value) })} label="মাস">
                  {MONTHS_EN.map((m, i) => <MenuItem key={i} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>বছর</InputLabel>
                <Select value={form.year} onChange={e => setForm({ ...form, year: String(e.target.value) })} label="বছর">
                  {years.map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="আগের রিডিং *" type="number" value={form.previous_reading} onChange={e => setForm({ ...form, previous_reading: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField fullWidth label="বর্তমান রিডিং *" type="number" value={form.current_reading} onChange={e => setForm({ ...form, current_reading: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="প্রতি ইউনিট দাম (৳)" type="number" value={form.per_unit_price} onChange={e => setForm({ ...form, per_unit_price: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
          </Grid>

          {form.current_reading && form.previous_reading && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ p: 2, bgcolor: 'primary.50', borderRadius: 2 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1}>হিসাব সারসংক্ষেপ</Typography>
                <Grid container spacing={1}>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">ব্যবহৃত ইউনিট</Typography>
                    <Typography variant="h6" fontWeight={700} color="info.main">{units} ইউনিট</Typography>
                  </Grid>
                  <Grid size={6}>
                    <Typography variant="caption" color="text.secondary">মোট বিদ্যুৎ বিল</Typography>
                    <Typography variant="h6" fontWeight={700} color="primary.main">৳{totalBill.toLocaleString()}</Typography>
                  </Grid>
                </Grid>
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>বাতিল</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.flat_id || !form.current_reading}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'আপডেট' : 'সংরক্ষণ'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
