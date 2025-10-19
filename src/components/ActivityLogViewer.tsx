/**
 * Activity Log Component
 * Displays user activity history with filtering and security alerts
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Refresh,
  Security,
  Info,
  Warning,
  Error as ErrorIcon,
} from '@mui/icons-material';
import {
  getUserActivityHistory,
  getSecurityActivities,
  type ActivityLog,
} from '../services/activityLogger';
import { useAppStore } from '../store/useAppStore';
import { format } from 'date-fns';

const ActivityLogViewer: React.FC = () => {
  const { user } = useAppStore();
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);

  const loadActivities = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      if (tabValue === 0) {
        // All activities
        const logs = await getUserActivityHistory(user.id, 100);
        setActivities(logs);
      } else {
        // Security activities only
        const logs = await getSecurityActivities(user.id, 50);
        setActivities(logs);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [user, tabValue]);

  const getSeverityIcon = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'high':
        return <Warning fontSize="small" color="warning" />;
      case 'medium':
        return <Info fontSize="small" color="info" />;
      default:
        return <Security fontSize="small" color="action" />;
    }
  };

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case 'critical':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Alert severity="warning">
        Please log in to view activity logs.
      </Alert>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" fontWeight={600}>
          Activity Log
        </Typography>
        <Tooltip title="Refresh">
          <IconButton onClick={loadActivities} size="small">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label="All Activities" />
        <Tab label="Security Events" />
      </Tabs>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : activities.length === 0 ? (
        <Alert severity="info">No activities found.</Alert>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell width="5%"></TableCell>
                <TableCell width="15%">Date & Time</TableCell>
                <TableCell width="20%">Activity Type</TableCell>
                <TableCell width="40%">Description</TableCell>
                <TableCell width="10%">IP Address</TableCell>
                <TableCell width="10%">Severity</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {activities.map((activity) => (
                <TableRow 
                  key={activity.id}
                  sx={{
                    '&:hover': { backgroundColor: 'action.hover' },
                    ...(activity.severity === 'critical' && {
                      backgroundColor: 'error.lighter',
                    }),
                  }}
                >
                  <TableCell>{getSeverityIcon(activity.severity)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(activity.timestamp), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(activity.timestamp), 'HH:mm:ss')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.type.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {activity.description}
                    </Typography>
                    {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {JSON.stringify(activity.metadata).substring(0, 50)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" fontFamily="monospace">
                      {activity.ipAddress || 'N/A'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={activity.severity?.toUpperCase() || 'LOW'}
                      size="small"
                      color={getSeverityColor(activity.severity) as any}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box mt={2}>
        <Typography variant="caption" color="text.secondary">
          Showing {activities.length} most recent activities
        </Typography>
      </Box>
    </Paper>
  );
};

export default ActivityLogViewer;
