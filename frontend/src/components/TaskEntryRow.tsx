import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import type { TaskEntry } from '../types/api';
import { formatMinutes, formatDate } from '../utils/formatters';

interface TaskEntryRowProps {
  entry: TaskEntry;
}

const TaskEntryRow = ({ entry }: TaskEntryRowProps) => (
  <TableRow>
    <TableCell>{formatDate(entry.date)}</TableCell>
    <TableCell>{entry.description}</TableCell>
    <TableCell align="right">{formatMinutes(entry.minutes)}</TableCell>
  </TableRow>
);

export default TaskEntryRow;
