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
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AddTimeEntryForm from '../components/AddTimeEntryForm';
import AiSummary from '../components/AiSummary';
import TimeEntryRow from '../components/TimeEntryRow';
import { useAuth } from '../hooks/useAuth';
import { fetchTimeEntries } from '../services/matters.service';
import { ApiError } from '../services/apiError';
import type { Matter, TimeEntry } from '../types/api';

interface LocationState {
  matter?: Matter;
}

const MatterDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { token, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const matter = (location.state as LocationState | null)?.matter ?? null;

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        <AddTimeEntryForm
          matterId={matterId}
          token={token!}
          onSuccess={(entry) =>
            setEntries((prev) =>
              [...prev, entry].sort((a, b) => {
                const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
                if (dateDiff !== 0) return dateDiff;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              }),
            )
          }
        />

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
                  <TimeEntryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 3 }} />

        <AiSummary matterId={matterId} token={token!} />
      </Box>
    </Box>
  );
};

export default MatterDetailPage;
