import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
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
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ApartmentIcon from '@mui/icons-material/Apartment';
import PeopleIcon from '@mui/icons-material/People';
import PhoneIcon from '@mui/icons-material/Phone';
import StairsIcon from '@mui/icons-material/Stairs';
import BedIcon from '@mui/icons-material/Bed';
import { supabase } from '../lib/supabase';
import type { Flat, House } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import PremiumLoader from '../components/PremiumLoader';

const emptyForm = {
  house_id: '',
  flat_number: '',
  floor_number: '1',
  room_count: '1',
  monthly_rent: '',
  water_bill: '0',
  service_charge: '0',
  status: 'vacant' as 'occupied' | 'vacant',
};

export default function Flats() {
  const { settings, t } = useSettings();
  const animations = settings?.animations_enabled !== false;
  const [flats, setFlats] = useState<(Flat & { tenants?: { full_name: string; phone: string }[]; house?: { name: string } })[]>([]);
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Flat | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [filterHouse, setFilterHouse] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [flatsRes, housesRes] = await Promise.all([
      supabase.from('flats').select('*, tenants(full_name, phone), house:houses(name)').order('flat_number'),
      supabase.from('houses').select('*').order('name'),
    ]);
    setFlats((flatsRes.data ?? []) as any);
    setHouses(housesRes.data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, house_id: houses[0]?.id ?? '' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (f: Flat) => {
    setEditing(f);
    setForm({
      house_id: f.house_id,
      flat_number: f.flat_number,
      floor_number: String(f.floor_number),
      room_count: String(f.room_count),
      monthly_rent: String(f.monthly_rent),
      water_bill: String(f.water_bill),
      service_charge: String(f.service_charge),
      status: f.status,
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const payload = {
      house_id: form.house_id,
      flat_number: form.flat_number,
      floor_number: parseInt(form.floor_number) || 1,
      room_count: parseInt(form.room_count) || 1,
      monthly_rent: parseFloat(form.monthly_rent) || 0,
      water_bill: parseFloat(form.water_bill) || 0,
      service_charge: parseFloat(form.service_charge) || 0,
      status: form.status,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('flats').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('flats').insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('এই ফ্ল্যাট ডিলিট করবেন?', 'Do you want to delete this flat?'))) return;
    await supabase.from('flats').delete().eq('id', id);
    load();
  };

  const filtered = flats.filter(f => {
    if (filterHouse !== 'all' && f.house_id !== filterHouse) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    return true;
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('ফ্ল্যাট ব্যবস্থাপনা', 'Flat Management')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('সব ফ্ল্যাটের তালিকা ও বিবরণ', 'All flats list and details')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={houses.length === 0}>
          {t('নতুন ফ্ল্যাট', 'New Flat')}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>{t('বাড়ি ফিল্টার', 'Filter House')}</InputLabel>
          <Select value={filterHouse} onChange={e => setFilterHouse(e.target.value)} label={t('বাড়ি ফিল্টার', 'Filter House')}>
            <MenuItem value="all">{t('সব বাড়ি', 'All Houses')}</MenuItem>
            {houses.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>{t('অবস্থা', 'Status')}</InputLabel>
          <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} label={t('অবস্থা', 'Status')}>
            <MenuItem value="all">{t('সব', 'All')}</MenuItem>
            <MenuItem value="occupied">{t('ভাড়া আছে', 'Occupied')}</MenuItem>
            <MenuItem value="vacant">{t('খালি', 'Vacant')}</MenuItem>
          </Select>
        </FormControl>
        <Chip label={`${t('মোট:', 'Total:')} ${filtered.length}`} variant="outlined" size="medium" />
        <Chip label={`${t('ভাড়া:', 'Rented:')} ${filtered.filter(f => f.status === 'occupied').length}`} color="success" variant="outlined" size="medium" />
        <Chip label={`${t('খালি:', 'Vacant:')} ${filtered.filter(f => f.status === 'vacant').length}`} color="warning" variant="outlined" size="medium" />
      </Box>

      {loading ? (
        <PremiumLoader />
      ) : houses.length === 0 ? (
        <Alert severity="warning">{t('প্রথমে একটি বাড়ি যোগ করুন।', 'Please add a house first.')}</Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('কোনো ফ্ল্যাট পাওয়া যায়নি।', 'No flats found.')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(f => {
            const tenant = f.tenants?.[0];
            const houseName = (f as any).house?.name;
            return (
              <Grid key={f.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    transition: animations ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    '&:hover': {
                      transform: animations ? 'translateY(-4px) scale(1.02)' : 'none',
                      boxShadow: animations ? '0 12px 24px rgba(0,0,0,0.12)' : 'none',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: f.status === 'occupied' ? 'success.light' : 'warning.light',
                          color: f.status === 'occupied' ? 'success.dark' : 'warning.dark',
                          width: 48, height: 48,
                        }}
                      >
                        <ApartmentIcon />
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight={700}>{t('ফ্ল্যাট', 'Flat')} {f.flat_number}</Typography>
                        <Typography variant="caption" color="text.secondary">{houseName}</Typography>
                      </Box>
                      <Chip
                        label={f.status === 'occupied' ? t('ভাড়া আছে', 'Occupied') : t('খালি', 'Vacant')}
                        color={f.status === 'occupied' ? 'success' : 'warning'}
                        size="small"
                      />
                    </Box>

                    <Grid container spacing={1} sx={{ mb: 1 }}>
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <StairsIcon fontSize="small" color="action" />
                          <Typography variant="caption">{t('ফ্লোর', 'Floor')} {f.floor_number}</Typography>
                        </Box>
                      </Grid>
                      <Grid size={6}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <BedIcon fontSize="small" color="action" />
                          <Typography variant="caption">{f.room_count} {t('রুম', 'Rooms')}</Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ p: 1.5, bgcolor: 'primary.50', borderRadius: 2, mb: 1 }}>
                      <Typography variant="caption" color="text.secondary">{t('মাসিক ভাড়া', 'Monthly Rent')}</Typography>
                      <Typography variant="h6" fontWeight={700} color="primary.main">
                        ৳{f.monthly_rent.toLocaleString()}
                      </Typography>
                      {(f.water_bill > 0 || f.service_charge > 0) && (
                        <Typography variant="caption" color="text.secondary">
                          + {t('পানি', 'Water')} ৳{f.water_bill} + {t('সার্ভিস', 'Service')} ৳{f.service_charge}
                        </Typography>
                      )}
                    </Box>

                    {tenant ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <PeopleIcon fontSize="small" color="action" />
                          <Typography variant="body2" fontWeight={600}>{tenant.full_name}</Typography>
                        </Box>
                        {tenant.phone && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <PhoneIcon fontSize="small" color="action" />
                            <Typography variant="body2">{tenant.phone}</Typography>
                          </Box>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">{t('ভাড়াটে নেই', 'No tenant')}</Typography>
                    )}
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(f)}>{t('সম্পাদনা', 'Edit')}</Button>
                    <Tooltip title={t('মুছুন', 'Delete')}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(f.id)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('ফ্ল্যাট সম্পাদনা', 'Edit Flat') : t('নতুন ফ্ল্যাট যোগ করুন', 'Add New Flat')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('বাড়ি *', 'House *')}</InputLabel>
                <Select value={form.house_id} onChange={e => setForm({ ...form, house_id: e.target.value })} label={t('বাড়ি *', 'House *')}>
                  {houses.map(h => <MenuItem key={h.id} value={h.id}>{h.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label={t('ফ্ল্যাট নম্বর *', 'Flat Number *')} value={form.flat_number} onChange={e => setForm({ ...form, flat_number: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth label={t('ফ্লোর নম্বর', 'Floor Number')} type="number" value={form.floor_number} onChange={e => setForm({ ...form, floor_number: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth label={t('রুম সংখ্যা', 'Room Count')} type="number" value={form.room_count} onChange={e => setForm({ ...form, room_count: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label={t('মাসিক ভাড়া *', 'Monthly Rent *')} type="number" value={form.monthly_rent} onChange={e => setForm({ ...form, monthly_rent: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth label={t('পানির বিল', 'Water Bill')} type="number" value={form.water_bill} onChange={e => setForm({ ...form, water_bill: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 6, sm: 4 }}>
              <TextField fullWidth label={t('সার্ভিস চার্জ', 'Service Charge')} type="number" value={form.service_charge} onChange={e => setForm({ ...form, service_charge: e.target.value })} InputProps={{ startAdornment: <InputAdornment position="start">৳</InputAdornment> }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('অবস্থা', 'Status')}</InputLabel>
                <Select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'occupied' | 'vacant' })} label={t('অবস্থা', 'Status')}>
                  <MenuItem value="vacant">{t('খালি (Vacant)', 'Vacant')}</MenuItem>
                  <MenuItem value="occupied">{t('ভাড়া আছে (Occupied)', 'Occupied')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.flat_number || !form.monthly_rent}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editing ? t('আপডেট', 'Update') : t('সংরক্ষণ', 'Save'))}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
