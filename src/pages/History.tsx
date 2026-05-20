import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
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
import InputAdornment from '@mui/material/InputAdornment';
import Pagination from '@mui/material/Pagination';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import WarningIcon from '@mui/icons-material/Warning';
import { supabase, MONTHS_EN, PAYMENT_METHOD_LABELS } from '../lib/supabase';
import type { CollectionHistory } from '../lib/supabase';
import { useSettings } from '../contexts/SettingsContext';

const PAGE_SIZE = 20;

export default function History() {
  const { t } = useSettings();
  const [history, setHistory] = useState<(CollectionHistory & { flat?: any; collection?: any })[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => { setPage(1); }, [search]);
  useEffect(() => { load(); }, [page, search]);

  const load = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, count } = await supabase
      .from('collection_history')
      .select(`
        *,
        flat:flats(flat_number, house:houses(name), tenants(full_name)),
        collection:rent_collections(month, year, total_payable, due_amount, payment_status)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    setHistory((data ?? []) as any);
    setTotal(count ?? 0);
    setLoading(false);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const filtered = history.filter(h => {
    if (!search) return true;
    const s = search.toLowerCase();
    const flat = h.flat;
    return (
      flat?.flat_number?.toLowerCase().includes(s) ||
      flat?.house?.name?.toLowerCase().includes(s) ||
      flat?.tenants?.[0]?.full_name?.toLowerCase().includes(s) ||
      h.collector_name?.toLowerCase().includes(s)
    );
  });

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>{t('সংগ্রহের ইতিহাস', 'Collection History')}</Typography>
        <Typography variant="body2" color="text.secondary">{t('সমস্ত পেমেন্ট লেনদেনের রেকর্ড', 'All Payment Transaction Records')}</Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('মোট লেনদেন', 'Total Transactions')}</Typography>
              <Typography variant="h5" fontWeight={700} color="primary.main">{total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card>
            <CardContent sx={{ py: 1.5, px: 2 }}>
              <Typography variant="caption" color="text.secondary">{t('মোট সংগৃহীত', 'Total Collected')}</Typography>
              <Typography variant="h5" fontWeight={700} color="success.main">
                ৳{history.reduce((s, h) => s + h.amount, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TextField
        fullWidth
        placeholder={t('ফ্ল্যাট, ভাড়াটে, সংগ্রাহক দিয়ে খুঁজুন...', 'Search by flat, tenant or collector...')}
        value={search}
        onChange={e => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment> }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Alert severity="info">{search ? t('খোঁজা মেলেনি।', 'No results found.') : t('কোনো ইতিহাস পাওয়া যায়নি।', 'No history found.')}</Alert>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'primary.main' }}>
                  {[t('তারিখ','Date'), t('ফ্ল্যাট','Flat'), t('ভাড়াটে','Tenant'), t('মাস','Month'), t('পরিমাণ','Amount'), t('সংগ্রাহক','Collector'), t('পদ্ধতি','Method'), t('বাকি','Due'), t('অবস্থা','Status')].map(h => (
                    <TableCell key={h} sx={{ color: 'white', fontWeight: 700, fontSize: '0.72rem', py: 1.5, whiteSpace: 'nowrap' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(h => {
                  const flat = h.flat;
                  const tenant = flat?.tenants?.[0];
                  const col = h.collection;
                  const status = col?.payment_status ?? 'pending';
                  return (
                    <TableRow key={h.id} hover>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.72rem' }}>
                        {new Date(h.created_at).toLocaleDateString('en-BD', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(h.created_at).toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                          <Avatar sx={{ width: 26, height: 26, bgcolor: 'primary.light', fontSize: '0.65rem' }}>
                            {flat?.flat_number?.[0]}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600} fontSize="0.75rem">{t('ফ্ল্যাট','Flat')} {flat?.flat_number}</Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">{flat?.house?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonIcon sx={{ fontSize: 14 }} color="action" />
                          <Typography variant="caption">{tenant?.full_name ?? '—'}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" noWrap>
                          {col ? `${MONTHS_EN[col.month - 1].slice(0, 3)} ${col.year}` : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="success.main">৳{h.amount.toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={600}>{h.collector_name || '—'}</Typography>
                        {h.collector_phone && (
                          <Typography variant="caption" color="text.secondary" display="block">{h.collector_phone}</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip label={PAYMENT_METHOD_LABELS[h.payment_method]?.split(' ')[0] ?? h.payment_method} size="small" variant="outlined" sx={{ fontSize: '0.65rem' }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color={col?.due_amount > 0 ? 'error.main' : 'success.main'}>
                          ৳{(col?.due_amount ?? 0).toLocaleString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={status === 'paid' ? <CheckCircleIcon sx={{ fontSize: 12 }} /> : status === 'partial' ? <HourglassEmptyIcon sx={{ fontSize: 12 }} /> : <WarningIcon sx={{ fontSize: 12 }} />}
                          label={status === 'paid' ? t('পাওয়া গেছে','Paid') : status === 'partial' ? t('আংশিক','Partial') : t('বাকি','Due')}
                          color={status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'error'}
                          size="small" sx={{ fontSize: '0.65rem' }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
            </Box>
          )}
          {search && filtered.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('মোট সমন্বয়:', 'Total matched:')} {filtered.length} {t('রেকর্ড', 'records')}
            </Typography>
          )}
        </>
      )}
    </Box>
  );
}
