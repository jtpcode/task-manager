import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Divider from '@mui/material/Divider';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TextField from '@mui/material/TextField';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuth } from '../hooks/useAuth';
import { fetchTimeEntries, createTimeEntry } from '../services/matters.service';
import { ApiError } from '../services/apiError';
import type { Matter, TimeEntry } from '../types/api';

interface LocationState {
  matter?: Matter;
}

const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

const MatterDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const matter = (location.state as LocationState | null)?.matter ?? null;

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const matterId = Number(id);

  useEffect(() => {
    const load = async () => {
      try {
        setEntries(await fetchTimeEntries(token!, matterId));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
        } else if (err instanceof ApiError && err.status === 404) {
          setError('Matter not found.');
        } else {
          setError('Could not load time entries. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [token, matterId, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const handleAddEntry = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const entry = await createTimeEntry(token!, matterId, {
        description,
        minutes: Number(minutes),
        ...(date !== '' && { date }),
      });
      setEntries((prev) => [entry, ...prev]);
      setDescription('');
      setMinutes('');
      setDate('');
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setFormError('Please fill in all required fields correctly.');
      } else {
        setFormError('Failed to add entry. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Legal Matter Tracker
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Button onClick={() => navigate('/')} size="small">
            ← Back to Matters
          </Button>
        </Box>

        {matter && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {matter.title}
              </Typography>
              <Chip
                label={matter.status}
                color={matter.status === 'OPEN' ? 'success' : 'default'}
                size="small"
              />
            </Box>
            <Typography color="text.secondary">{matter.clientName}</Typography>
          </Box>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Time Entries
        </Typography>

        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium' }}>
            Log Time
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => { e.preventDefault(); void handleAddEntry(); }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            {formError && <Alert severity="error">{formError}</Alert>}
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                size="small"
                sx={{ flex: '2 1 200px' }}
              />
              <TextField
                label="Minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                required
                size="small"
                slotProps={{ htmlInput: { min: 1 } }}
                sx={{ flex: '0 1 110px', minWidth: 90 }}
              />
              <TextField
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ flex: '0 1 160px', minWidth: 140 }}
              />
            </Box>
            <Box>
              <Button
                type="submit"
                variant="contained"
                disabled={submitting}
                startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {submitting ? 'Adding...' : 'Add Entry'}
              </Button>
            </Box>
          </Box>
        </Paper>

        <Divider sx={{ mb: 3 }} />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : entries.length === 0 ? (
          <Typography color="text.secondary">No time entries logged.</Typography>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Time</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>{formatDate(entry.date)}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell align="right">{formatMinutes(entry.minutes)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </Box>
  );
};

export default MatterDetailPage;
