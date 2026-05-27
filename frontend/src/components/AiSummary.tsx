import { useState } from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { fetchSummary } from '../services/tasks.service';
import { ApiError } from '../services/apiError';

interface AiSummaryProps {
  taskId: number;
}

const AiSummary = ({ taskId }: AiSummaryProps) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setError(null);
    setLoading(true);
    try {
      const { summary: fetched } = await fetchSummary(taskId);
      setSummary(fetched);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 400) {
        setError('No time entries logged yet — add some entries first.');
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Rate limit exceeded. Please wait a moment and try again.');
      } else if (err instanceof ApiError && err.status === 503) {
        setError('AI summary is not available (API key not configured).');
      } else {
        setError('Failed to generate summary. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
        <Typography variant="h6">AI Summary</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => { void handleFetch(); }}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        >
          {loading ? 'Generating...' : summary ? 'Regenerate' : 'Get AI Summary'}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {summary && (
        <Paper sx={{ p: 3 }}>
          <Typography>{summary}</Typography>
        </Paper>
      )}
    </Box>
  );
};

export default AiSummary;
