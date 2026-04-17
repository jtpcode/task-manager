import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import { useAuth } from '../hooks/useAuth';
import type { Matter } from '../types/api';

function formatMinutes(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export default function MatterListPage() {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatters() {
      try {
        const response = await fetch('/api/matters', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 401) {
          logout();
          navigate('/login', { replace: true });
          return;
        }

        if (!response.ok) {
          setError('Failed to load matters. Please try again.');
          return;
        }

        setMatters(await response.json() as Matter[]);
      } catch {
        setError('Could not reach the server. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    void fetchMatters();
  }, [token, logout, navigate]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ maxWidth: 800, mx: 'auto', mt: 4, px: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
      <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
        Matters
      </Typography>

      {matters.length === 0 ? (
        <Typography color="text.secondary">No matters found.</Typography>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Title</TableCell>
                <TableCell>Client</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Total Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {matters.map((matter) => (
                <TableRow key={matter.id} hover>
                  <TableCell>{matter.title}</TableCell>
                  <TableCell>{matter.clientName}</TableCell>
                  <TableCell>
                    <Chip
                      label={matter.status}
                      color={matter.status === 'OPEN' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    {formatMinutes(matter.totalMinutes)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
