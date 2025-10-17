import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Flag,
  AddCircle,
  Edit,
  Delete,
  CheckCircle,
  TrendingUp,
  Home,
  DirectionsCar,
  School,
  BeachAccess,
  Celebration,
} from '@mui/icons-material';

interface FinancialGoal {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: 'retirement' | 'house' | 'car' | 'education' | 'vacation' | 'wedding' | 'emergency' | 'other';
  priority: 'high' | 'medium' | 'low';
  monthlyContribution: number;
}

const FinancialGoals: React.FC = () => {
  const [goals, setGoals] = useState<FinancialGoal[]>([
    {
      id: '1',
      title: 'Emergency Fund',
      description: '6 months of expenses',
      targetAmount: 600000,
      currentAmount: 350000,
      deadline: '2025-12-31',
      category: 'emergency',
      priority: 'high',
      monthlyContribution: 25000,
    },
    {
      id: '2',
      title: 'Dream Home',
      description: 'Down payment for 3BHK apartment',
      targetAmount: 2500000,
      currentAmount: 450000,
      deadline: '2027-06-30',
      category: 'house',
      priority: 'high',
      monthlyContribution: 50000,
    },
    {
      id: '3',
      title: 'Retirement Corpus',
      description: 'Build retirement fund',
      targetAmount: 50000000,
      currentAmount: 2500000,
      deadline: '2055-12-31',
      category: 'retirement',
      priority: 'medium',
      monthlyContribution: 40000,
    },
    {
      id: '4',
      title: 'Europe Vacation',
      description: 'Family trip to Europe',
      targetAmount: 500000,
      currentAmount: 120000,
      deadline: '2026-06-30',
      category: 'vacation',
      priority: 'low',
      monthlyContribution: 15000,
    },
  ]);

  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const getGoalIcon = (category: string) => {
    switch (category) {
      case 'house':
        return <Home />;
      case 'car':
        return <DirectionsCar />;
      case 'education':
        return <School />;
      case 'vacation':
        return <BeachAccess />;
      case 'wedding':
        return <Celebration />;
      case 'retirement':
        return <TrendingUp />;
      default:
        return <Flag />;
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 75) return 'success';
    if (progress >= 50) return 'info';
    if (progress >= 25) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      default:
        return 'info';
    }
  };

  const calculateProgress = (current: number, target: number) => {
    return (current / target) * 100;
  };

  const calculateMonthsToGoal = (current: number, target: number, monthly: number) => {
    if (monthly <= 0) return Infinity;
    const remaining = target - current;
    return Math.ceil(remaining / monthly);
  };

  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const totalProgress = (totalCurrentAmount / totalTargetAmount) * 100;
  const completedGoals = goals.filter((g) => calculateProgress(g.currentAmount, g.targetAmount) >= 100).length;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Financial Goals
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Plan and track your financial milestones
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircle />}
          onClick={() => setAddDialogOpen(true)}
          size="large"
        >
          Add Goal
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Goals
              </Typography>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {goals.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completedGoals} completed
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total Target
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                ₹{(totalTargetAmount / 10000000).toFixed(2)}Cr
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Achieved So Far
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main">
                ₹{(totalCurrentAmount / 10000000).toFixed(2)}Cr
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Card elevation={3}>
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Overall Progress
              </Typography>
              <Typography variant="h5" fontWeight="bold">
                {totalProgress.toFixed(1)}%
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalProgress}
                color={getProgressColor(totalProgress)}
                sx={{ mt: 1, height: 6, borderRadius: 3 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goals List */}
      <Grid container spacing={3}>
        {goals.map((goal) => {
          const progress = calculateProgress(goal.currentAmount, goal.targetAmount);
          const monthsToGoal = calculateMonthsToGoal(
            goal.currentAmount,
            goal.targetAmount,
            goal.monthlyContribution
          );
          const remainingAmount = goal.targetAmount - goal.currentAmount;

          return (
            <Grid key={goal.id} size={{ xs: 12, md: 6 }}>
              <Card
                elevation={3}
                sx={{
                  position: 'relative',
                  overflow: 'visible',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    transition: 'transform 0.2s',
                  },
                }}
              >
                <Chip
                  label={goal.priority}
                  color={getPriorityColor(goal.priority)}
                  size="small"
                  sx={{
                    position: 'absolute',
                    top: -12,
                    right: 16,
                    fontWeight: 'bold',
                  }}
                />

                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: 'primary.light',
                          color: 'white',
                          mr: 2,
                        }}
                      >
                        {getGoalIcon(goal.category)}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {goal.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {goal.description}
                        </Typography>
                      </Box>
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton size="small">
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Box mb={2}>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {progress.toFixed(1)}%
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min(progress, 100)}
                      color={getProgressColor(progress)}
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>

                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Current Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        ₹{(goal.currentAmount / 100000).toFixed(1)}L
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                      <Typography variant="caption" color="text.secondary">
                        Target Amount
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        ₹{(goal.targetAmount / 100000).toFixed(1)}L
                      </Typography>
                    </Grid>
                  </Grid>

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: 'background.default',
                    }}
                  >
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Monthly SIP
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="primary">
                          ₹{goal.monthlyContribution.toLocaleString('en-IN')}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Time to Goal
                        </Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {monthsToGoal === Infinity
                            ? 'N/A'
                            : monthsToGoal > 12
                            ? `${Math.floor(monthsToGoal / 12)}y ${monthsToGoal % 12}m`
                            : `${monthsToGoal}m`}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Box>

                  {progress >= 100 && (
                    <Box
                      sx={{
                        mt: 2,
                        p: 1.5,
                        borderRadius: 2,
                        bgcolor: 'success.light',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CheckCircle sx={{ color: 'success.dark', mr: 1 }} />
                      <Typography variant="body2" fontWeight="bold" color="success.dark">
                        Goal Achieved! 🎉
                      </Typography>
                    </Box>
                  )}

                  {progress < 100 && (
                    <Box mt={2}>
                      <Typography variant="caption" color="text.secondary">
                        Remaining: ₹{remainingAmount.toLocaleString('en-IN')} • Deadline:{' '}
                        {new Date(goal.deadline).toLocaleDateString('en-IN')}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Add Goal Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <AddCircle sx={{ mr: 1 }} />
            Add New Financial Goal
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Goal Title"
            variant="outlined"
            placeholder="e.g., Emergency Fund"
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            label="Description"
            variant="outlined"
            multiline
            rows={2}
            placeholder="Brief description of your goal"
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" defaultValue="emergency">
              <MenuItem value="emergency">Emergency Fund</MenuItem>
              <MenuItem value="house">House/Property</MenuItem>
              <MenuItem value="car">Car</MenuItem>
              <MenuItem value="education">Education</MenuItem>
              <MenuItem value="vacation">Vacation</MenuItem>
              <MenuItem value="wedding">Wedding</MenuItem>
              <MenuItem value="retirement">Retirement</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" defaultValue="medium">
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            label="Target Amount (₹)"
            type="number"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Current Amount (₹)"
            type="number"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Monthly Contribution (₹)"
            type="number"
            variant="outlined"
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Target Date"
            type="date"
            variant="outlined"
            InputLabelProps={{ shrink: true }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setAddDialogOpen(false)}>
            Create Goal
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default FinancialGoals;
