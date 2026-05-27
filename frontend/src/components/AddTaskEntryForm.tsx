import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { createTaskEntry } from '../services/tasks.service';
import { ApiError } from '../services/apiError';
import type { TaskEntry } from '../types/api';

interface AddTaskEntryFormProps {
  taskId: number;
  token: string;
  onSuccess: (entry: TaskEntry) => void;
}

const AddTaskEntryForm = ({ taskId, token, onSuccess }: AddTaskEntryFormProps) => {
  const [description, setDescription] = useState('');
  const [minutes, setMinutes] = useState('');
  const [date, setDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setFormError(null);
    setSubmitting(true);
    try {
      const entry = await createTaskEntry(token, taskId, {
        description,
        minutes: Number(minutes),
        ...(date !== '' && { date }),
      });
      setDescription('');
      setMinutes('');
      setDate('');
      onSuccess(entry);
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'medium' }}>
        Log Time
      </Typography>
      <Box
        component="form"
        onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
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
  );
};

export default AddTaskEntryForm;
