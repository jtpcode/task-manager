import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useAuth } from '../hooks/useAuth';
import { createMatter } from '../services/matters.service';
import { ApiError } from '../services/apiError';
import type { Matter } from '../types/api';

interface CreateMatterFormProps {
  onSuccess: (matter: Matter) => void;
}

const CreateMatterForm = ({ onSuccess }: CreateMatterFormProps) => {
  const { token } = useAuth();

  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [status, setStatus] = useState<'OPEN' | 'CLOSED'>('OPEN');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);

    try {
      const matter: Matter = await createMatter(token!, { title, clientName, status });
      setTitle('');
      setClientName('');
      setStatus('OPEN');
      onSuccess(matter);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setError('Please fill in all required fields correctly.');
      } else {
        setError('Failed to create matter. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = (e: SelectChangeEvent) => {
    setStatus(e.target.value as 'OPEN' | 'CLOSED');
  };

  return (
    <Box
      component="form"
      onSubmit={(e) => { e.preventDefault(); void handleSubmit(); }}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      {error && <Alert severity="error">{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          size="small"
          sx={{ flex: '1 1 200px' }}
        />
        <TextField
          label="Client Name"
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          required
          size="small"
          sx={{ flex: '1 1 200px' }}
        />
        <FormControl size="small" sx={{ flex: '0 1 140px', minWidth: 120 }}>
          <InputLabel id="status-label">Status</InputLabel>
          <Select
            labelId="status-label"
            value={status}
            label="Status"
            onChange={handleStatusChange}
          >
            <MenuItem value="OPEN">Open</MenuItem>
            <MenuItem value="CLOSED">Closed</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box>
        <Button
          type="submit"
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {submitting ? 'Creating...' : 'Create Matter'}
        </Button>
      </Box>
    </Box>
  );
};

export default CreateMatterForm;
