import { useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import type { Matter } from '../types/api';

const formatMinutes = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

interface MatterRowProps {
  matter: Matter;
}

const MatterRow = ({ matter }: MatterRowProps) => {
  const navigate = useNavigate();

  return (
    <TableRow
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
      <TableCell align="right">{formatMinutes(matter.totalMinutes)}</TableCell>
    </TableRow>
  );
};

export default MatterRow;
