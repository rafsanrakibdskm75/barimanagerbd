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
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import BadgeIcon from '@mui/icons-material/Badge';
import EmergencyIcon from '@mui/icons-material/Emergency';
import SearchIcon from '@mui/icons-material/Search';
import { supabase } from '../lib/supabase';
import type { Tenant, Flat } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';
import PremiumLoader from '../components/PremiumLoader';

const emptyForm = {
  flat_id: '',
  full_name: '',
  phone: '',
  nid_number: '',
  family_members: '1',
  occupation: '',
  move_in_date: new Date().toISOString().split('T')[0],
  emergency_contact: '',
  address: '',
};

export default function Tenants() {
  const { settings, t } = useSettings();
  const animations = settings?.animations_enabled !== false;
  const [tenants, setTenants] = useState<(Tenant & { flat?: Flat & { house?: { name: string } } })[]>([]);
  const [flats, setFlats] = useState<(Flat & { house?: { name: string } })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<(Tenant & { flat?: any }) | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [tenantsRes, flatsRes] = await Promise.all([
      supabase.from('tenants').select('*, flat:flats(*, house:houses(name))').eq('is_active', true).order('full_name'),
      supabase.from('flats').select('*, house:houses(name)').order('flat_number'),
    ]);
    setTenants((tenantsRes.data ?? []) as any);
    setFlats((flatsRes.data ?? []) as any);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...emptyForm, flat_id: flats[0]?.id ?? '' });
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setForm({
      flat_id: t.flat_id,
      full_name: t.full_name,
      phone: t.phone,
      nid_number: t.nid_number ?? '',
      family_members: String(t.family_members),
      occupation: t.occupation,
      move_in_date: t.move_in_date,
      emergency_contact: t.emergency_contact ?? '',
      address: t.address ?? '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const payload = {
      flat_id: form.flat_id,
      full_name: form.full_name,
      phone: form.phone,
      nid_number: form.nid_number,
      family_members: parseInt(form.family_members) || 1,
      occupation: form.occupation,
      move_in_date: form.move_in_date,
      emergency_contact: form.emergency_contact,
      address: form.address,
      is_active: true,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('tenants').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('tenants').insert(payload));
      if (!err) {
        await supabase.from('flats').update({ status: 'occupied' }).eq('id', form.flat_id);
        // Auto-create rent collection record for current month
        const now = new Date();
        const flat = flats.find(f => f.id === form.flat_id);
        if (flat) {
          try {
            await supabase.from('rent_collections').insert({
              flat_id: form.flat_id,
              month: now.getMonth() + 1,
              year: now.getFullYear(),
              monthly_rent: flat.monthly_rent,
              electric_bill: 0,
              water_bill: flat.water_bill,
              service_charge: flat.service_charge,
              total_payable: flat.monthly_rent + flat.water_bill + flat.service_charge,
              amount_paid: 0,
              payment_status: 'pending',
            });
          } catch (_) {}
        }
      }
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (tenantObj: Tenant) => {
    if (!confirm(t('এই ভাড়াটের তথ্য মুছবেন?', 'Are you sure you want to delete this tenant\'s information?'))) return;
    await supabase.from('tenants').update({ is_active: false }).eq('id', tenantObj.id);
    await supabase.from('flats').update({ status: 'vacant' }).eq('id', tenantObj.flat_id);
    load();
  };

  const filtered = tenants.filter(ten =>
    ten.full_name.toLowerCase().includes(search.toLowerCase()) ||
    ten.phone.includes(search) ||
    (ten as any).flat?.flat_number?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('ভাড়াটে ব্যবস্থাপনা', 'Tenant Management')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('ভাড়াটে তালিকা ও বিবরণ', 'List and details of tenants')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} disabled={flats.length === 0}>
          {t('নতুন ভাড়াটে', 'New Tenant')}
        </Button>
      </Box>

      <TextField
        fullWidth
        placeholder={t('নাম, ফোন বা ফ্ল্যাট দিয়ে খুঁজুন...', 'Search by name, phone or flat...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
      />

      {loading ? (
        <PremiumLoader />
      ) : flats.length === 0 ? (
        <Alert severity="warning">{t('প্রথমে ফ্ল্যাট যোগ করুন।', 'Please add a flat first.')}</Alert>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{t('কোনো ভাড়াটে পাওয়া যায়নি।', 'No tenants found.')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(ten => {
            const flat = (ten as any).flat;
            return (
              <Grid key={ten.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    transition: animations ? 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
                    '&:hover': {
                      transform: animations ? 'translateY(-4px) scale(1.02)' : 'none',
                      boxShadow: animations ? '0 12px 24px rgba(0,0,0,0.12)' : 'none',
                    },
                  }}
                  onClick={() => { setSelectedTenant(ten); setSelectedTenant(ten); setDetailOpen(true); }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48, fontSize: '1.2rem', fontWeight: 700 }}>
                        {ten.full_name[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700}>{ten.full_name}</Typography>
                        <Chip label={`${t('ফ্ল্যাট', 'Flat')} ${flat?.flat_number}`} size="small" color="primary" variant="outlined" />
                      </Box>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{ten.phone}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <WorkIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{ten.occupation}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FamilyRestroomIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{ten.family_members} {t('জন পরিবার', 'family members')}</Typography>
                      </Box>
                    </Box>
                  </CardContent>
                  <CardActions sx={{ px: 2, pb: 2 }} onClick={e => e.stopPropagation()}>
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(ten)}>{t('সম্পাদনা', 'Edit')}</Button>
                    <Tooltip title={t('মুছুন', 'Delete')}>
                      <IconButton size="small" color="error" onClick={() => handleDelete(ten)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Box flex={1} />
                    <Tooltip title={t('কল করুন', 'Call')}>
                      <IconButton size="small" color="success" component="a" href={`tel:${ten.phone}`}>
                        <PhoneIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        {selectedTenant && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52, fontSize: '1.4rem', fontWeight: 700 }}>
                  {selectedTenant.full_name[0]}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{selectedTenant.full_name}</Typography>
                  <Chip label={`${t('ফ্ল্যাট', 'Flat')} ${(selectedTenant as any).flat?.flat_number}`} size="small" color="primary" />
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Grid container spacing={2}>
                {[
                  { icon: <PhoneIcon />, label: t('ফোন নম্বর', 'Phone Number'), value: selectedTenant.phone },
                  { icon: <BadgeIcon />, label: t('NID নম্বর', 'NID Number'), value: selectedTenant.nid_number || '—' },
                  { icon: <WorkIcon />, label: t('পেশা', 'Occupation'), value: selectedTenant.occupation },
                  { icon: <FamilyRestroomIcon />, label: t('পরিবারের সদস্য', 'Family Members'), value: `${selectedTenant.family_members} ${t('জন', 'members')}` },
                  { icon: <CalendarMonthIcon />, label: t('প্রবেশের তারিখ', 'Move-in Date'), value: settings?.default_language === 'en' ? new Date(selectedTenant.move_in_date).toLocaleDateString('en-US') : new Date(selectedTenant.move_in_date).toLocaleDateString('bn-BD') },
                  { icon: <EmergencyIcon />, label: t('জরুরি যোগাযোগ', 'Emergency Contact'), value: selectedTenant.emergency_contact || '—' },
                ].map(item => (
                  <Grid key={item.label} size={{ xs: 12, sm: 6 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Box sx={{ color: 'primary.main', mt: 0.2 }}>{item.icon}</Box>
                      <Box>
                        <Typography variant="caption" color="text.secondary">{item.label}</Typography>
                        <Typography variant="body2" fontWeight={600}>{item.value}</Typography>
                      </Box>
                    </Box>
                  </Grid>
                ))}
                {selectedTenant.address && (
                  <Grid size={{ xs: 12 }}>
                    <Box sx={{ p: 1.5, bgcolor: 'background.default', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">{t('স্থায়ী ঠিকানা', 'Permanent Address')}</Typography>
                      <Typography variant="body2" fontWeight={600}>{selectedTenant.address}</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<PhoneIcon />}
                  href={`tel:${selectedTenant.phone}`}
                  component="a"
                  size="small"
                >
                  {t('কল করুন', 'Call')}
                </Button>
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#128C7E' } }}
                  startIcon={<PhoneIcon />}
                  href={`https://wa.me/88${selectedTenant.phone}`}
                  component="a"
                  target="_blank"
                  size="small"
                >
                  WhatsApp
                </Button>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button onClick={() => setDetailOpen(false)}>{t('বন্ধ করুন', 'Close')}</Button>
              <Button variant="outlined" startIcon={<EditIcon />} onClick={() => { setDetailOpen(false); openEdit(selectedTenant); }}>
                {t('সম্পাদনা', 'Edit')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('ভাড়াটে সম্পাদনা', 'Edit Tenant') : t('নতুন ভাড়াটে যোগ করুন', 'Add New Tenant')}</DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('ফ্ল্যাট *', 'Flat *')}</InputLabel>
                <Select value={form.flat_id} onChange={e => setForm({ ...form, flat_id: e.target.value })} label={t('ফ্ল্যাট *', 'Flat *')}>
                  {flats.map(f => (
                    <MenuItem key={f.id} value={f.id}>
                      {t('ফ্ল্যাট', 'Flat')} {f.flat_number} — {(f as any).house?.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('পুরো নাম *', 'Full Name *')} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('ফোন নম্বর *', 'Phone Number *')} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('NID নম্বর (ঐচ্ছিক)', 'NID Number (Optional)')} value={form.nid_number} onChange={e => setForm({ ...form, nid_number: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('পরিবারের সদস্য সংখ্যা', 'Family Members Count')} type="number" value={form.family_members} onChange={e => setForm({ ...form, family_members: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>{t('পেশা *', 'Occupation *')}</InputLabel>
                <Select value={form.occupation} onChange={e => setForm({ ...form, occupation: e.target.value })} label={t('পেশা *', 'Occupation *')}>
                  <MenuItem value="চাকরিজীবী">{t('চাকরিজীবী (Service)', 'Service')}</MenuItem>
                  <MenuItem value="ব্যবসায়ী">{t('ব্যবসায়ী (Business)', 'Business')}</MenuItem>
                  <MenuItem value="শিক্ষক">{t('শিক্ষক (Teacher)', 'Teacher')}</MenuItem>
                  <MenuItem value="ডাক্তার">{t('ডাক্তার (Doctor)', 'Doctor')}</MenuItem>
                  <MenuItem value="প্রকৌশলী">{t('প্রকৌশলী (Engineer)', 'Engineer')}</MenuItem>
                  <MenuItem value="কৃষক">{t('কৃষক (Farmer)', 'Farmer')}</MenuItem>
                  <MenuItem value="অবসরপ্রাপ্ত">{t('অবসরপ্রাপ্ত (Retired)', 'Retired')}</MenuItem>
                  <MenuItem value="শ্রমিক">{t('শ্রমিক (Labor)', 'Labor')}</MenuItem>
                  <MenuItem value="অন্যান্য">{t('অন্যান্য (Other)', 'Other')}</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label={t('প্রবেশের তারিখ *', 'Move-in Date *')} type="date" value={form.move_in_date} onChange={e => setForm({ ...form, move_in_date: e.target.value })} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('জরুরি যোগাযোগ', 'Emergency Contact')} value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('স্থায়ী ঠিকানা', 'Permanent Address')} multiline rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.full_name || !form.occupation}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editing ? t('আপডেট', 'Update') : t('সংরক্ষণ', 'Save'))}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
