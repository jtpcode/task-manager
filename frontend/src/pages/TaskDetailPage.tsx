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
import AddTaskEntryForm from '../components/AddTaskEntryForm';
import AiSummary from '../components/AiSummary';
import TaskEntryRow from '../components/TaskEntryRow';
import { useAuth } from '../hooks/useAuth';
import { fetchTaskEntries } from '../services/tasks.service';
import { ApiError } from '../services/apiError';
import type { Task, TaskEntry } from '../types/api';

interface LocationState {
  task?: Task;
}

const TaskDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const task = (location.state as LocationState | null)?.task ?? null;

  const [entries, setEntries] = useState<TaskEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const taskId = Number(id);

  useEffect(() => {
    const load = async () => {
      try {
        setEntries(await fetchTaskEntries(taskId));
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
          navigate('/login', { replace: true });
        } else if (err instanceof ApiError && err.status === 404) {
          setError('Task not found.');
        } else {
          setError('Could not load task entries. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [taskId, logout, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'grey.100' }}>
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Task Manager
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 900, mx: 'auto', mt: 4, px: 2 }}>
        <Box sx={{ mb: 3 }}>
          <Button onClick={() => navigate('/')} size="small">
            ← Back to Tasks
          </Button>
        </Box>

        {task && (
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 0.5 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                {task.title}
              </Typography>
              <Chip
                label={task.status}
                color={task.status === 'OPEN' ? 'success' : 'default'}
                size="small"
              />
            </Box>
          </Box>
        )}

        <Typography variant="h6" sx={{ mb: 2 }}>
          Task Entries
        </Typography>

        <AddTaskEntryForm
          taskId={taskId}
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
          <Typography color="text.secondary">No task entries logged.</Typography>
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
                  <TaskEntryRow key={entry.id} entry={entry} />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Divider sx={{ my: 3 }} />

        <AiSummary taskId={taskId} />
      </Box>
    </Box>
  );
};

export default TaskDetailPage;
