import { useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import type { Task } from '../types/api';
import { formatMinutes } from '../utils/formatters';

interface TaskRowProps {
  task: Task;
}

const TaskRow = ({ task }: TaskRowProps) => {
  const navigate = useNavigate();

  return (
    <TableRow
      hover
      onClick={() => navigate(`/tasks/${task.id}`, { state: { task } })}
      sx={{ cursor: 'pointer' }}
    >
      <TableCell>{task.title}</TableCell>
      <TableCell>
        <Chip
          label={task.status}
          color={task.status === 'OPEN' ? 'success' : 'default'}
          size="small"
        />
      </TableCell>
      <TableCell align="right">{formatMinutes(task.totalMinutes)}</TableCell>
    </TableRow>
  );
};

export default TaskRow;
