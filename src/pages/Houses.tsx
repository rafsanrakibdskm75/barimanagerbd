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
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import PremiumLoader from '../components/PremiumLoader';
import { useSettings } from '../contexts/SettingsContext';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ApartmentIcon from '@mui/icons-material/Apartment';
import { supabase } from '../lib/supabase';
import type { House } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const emptyForm = {
  name: '',
  owner_name: '',
  address: '',
  total_flats: '',
  caretaker_name: '',
  caretaker_phone: '',
};

export default function Houses() {
  const { settings, t } = useSettings();
  const animations = settings?.animations_enabled !== false;
  const [houses, setHouses] = useState<House[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<House | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('houses').select('*').order('created_at', { ascending: false });
    setHouses(data ?? []);
    setLoading(false);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (h: House) => {
    setEditing(h);
    setForm({
      name: h.name,
      owner_name: h.owner_name,
      address: h.address,
      total_flats: String(h.total_flats),
      caretaker_name: h.caretaker_name ?? '',
      caretaker_phone: h.caretaker_phone ?? '',
    });
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setError('');
    setSaving(true);
    const payload = {
      name: form.name,
      owner_name: form.owner_name,
      address: form.address,
      total_flats: parseInt(form.total_flats) || 0,
      caretaker_name: form.caretaker_name,
      caretaker_phone: form.caretaker_phone,
      created_by: user?.id,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from('houses').update(payload).eq('id', editing.id));
    } else {
      ({ error: err } = await supabase.from('houses').insert(payload));
    }
    setSaving(false);
    if (err) { setError(err.message); return; }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('এই বাড়ি ডিলিট করবেন? সব ফ্ল্যাট ও ডেটা মুছে যাবে।', 'Are you sure you want to delete this house? All flats and data will be deleted.'))) return;
    await supabase.from('houses').delete().eq('id', id);
    load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>{t('বাড়ি ব্যবস্থাপনা', 'House Management')}</Typography>
          <Typography variant="body2" color="text.secondary">{t('বাড়ি তালিকা ও বিবরণ', 'List of houses and details')}</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
          {t('নতুন বাড়ি', 'New House')}
        </Button>
      </Box>

      {loading ? (
        <PremiumLoader />
      ) : houses.length === 0 ? (
        <Alert severity="info">{t('কোনো বাড়ি যোগ করা হয়নি। নতুন বাড়ি যোগ করুন।', 'No houses added yet. Please add a new house.')}</Alert>
      ) : (
        <Grid container spacing={2}>
          {houses.map(h => (
            <Grid key={h.id} size={{ xs: 12, sm: 6, md: 4 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                      <HomeWorkIcon />
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={700} noWrap>{h.name}</Typography>
                      <Chip label={`${h.total_flats} ${t('ফ্ল্যাট', 'Flats')}`} size="small" color="primary" variant="outlined" />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">{t('মালিক:', 'Owner:')}</Typography>
                      <Typography variant="body2" fontWeight={600}>{h.owner_name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" sx={{ mt: 0.1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
                        {h.address}
                      </Typography>
                    </Box>
                    {h.caretaker_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ApartmentIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">{t('কেয়ারটেকার:', 'Caretaker:')}</Typography>
                        <Typography variant="body2">{h.caretaker_name}</Typography>
                      </Box>
                    )}
                    {h.caretaker_phone && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{h.caretaker_phone}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ px: 2, pb: 2 }}>
                  <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(h)}>
                    {t('সম্পাদনা', 'Edit')}
                  </Button>
                  <Tooltip title={t('মুছুন', 'Delete')}>
                    <IconButton size="small" color="error" onClick={() => handleDelete(h.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editing ? t('বাড়ি সম্পাদনা', 'Edit House') : t('নতুন বাড়ি যোগ করুন', 'Add New House')}
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('বাড়ির নাম *', 'House Name *')} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('মালিকের নাম *', 'Owner Name *')} value={form.owner_name} onChange={e => setForm({ ...form, owner_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('ঠিকানা *', 'Address *')} multiline rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth label={t('মোট ফ্ল্যাট', 'Total Flats')} type="number" value={form.total_flats} onChange={e => setForm({ ...form, total_flats: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12, sm: 8 }}>
              <TextField fullWidth label={t('কেয়ারটেকারের নাম', 'Caretaker Name')} value={form.caretaker_name} onChange={e => setForm({ ...form, caretaker_name: e.target.value })} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label={t('কেয়ারটেকার ফোন', 'Caretaker Phone')} value={form.caretaker_phone} onChange={e => setForm({ ...form, caretaker_phone: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)}>{t('বাতিল', 'Cancel')}</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.owner_name}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editing ? t('আপডেট করুন', 'Update') : t('সংরক্ষণ করুন', 'Save'))}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
