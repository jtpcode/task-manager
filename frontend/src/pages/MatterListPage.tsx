import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { useAuth } from '../hooks/useAuth';
import { fetchMatters } from '../services/matters.service';
import { ApiError } from '../services/apiError';
import type { Matter } from '../types/api';
import CreateMatterForm from '../components/CreateMatterForm';

const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const MatterListPage = () => {
  const { token, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const [matters, setMatters] = useState<Matter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setMatters(await fetchMatters(token!));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
        } else {
          setError('Could not reach the server. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 'bold', flexGrow: 1 }}>
          Matters
        </Typography>
        <Button
          variant={showForm ? 'outlined' : 'contained'}
          onClick={() => setShowForm((prev) => !prev)}
        >
          {showForm ? 'Cancel' : 'New Matter'}
        </Button>
      </Box>

      <Collapse in={showForm}>
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'medium', mb: 2 }}>
            New Matter
          </Typography>
          <CreateMatterForm
            onSuccess={(matter) => {
              setMatters((prev) => [matter, ...prev]);
              setShowForm(false);
            }}
          />
        </Paper>
      </Collapse>

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
                <TableRow
                  key={matter.id}
                  hover
                  onClick={() => navigate(`/matters/${matter.id}`, { state: { matter } })}
                  sx={{ cursor: 'pointer' }}
                >
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
    </Box>
  );
};

export default MatterListPage;
