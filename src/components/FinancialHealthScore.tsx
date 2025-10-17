import { Paper, Typography, Box, LinearProgress, Chip } from '@mui/material';
import { CheckCircle, Warning } from '@mui/icons-material';
import type { FinancialHealthScore as HealthScoreType } from '../types';

interface Props {
  score: HealthScoreType;
}

const FinancialHealthScore: React.FC<Props> = ({ score }) => {
  const getColor = (value: number) => {
    if (value >= 75) return 'success';
    if (value >= 50) return 'warning';
    return 'error';
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Financial Health Score
      </Typography>

      {/* Overall Score */}
      <Box textAlign="center" my={3}>
        <Typography variant="h2" fontWeight="bold" color={`${getColor(score.overallScore)}.main`}>
          {score.overallScore}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          out of 100
        </Typography>
      </Box>

      {/* Component Scores */}
      <Box my={2}>
        <Typography variant="subtitle2" gutterBottom>
          Score Breakdown
        </Typography>
        {Object.entries(score.components).map(([key, value]) => (
          <Box key={key} mb={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {Math.round(value)}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={value}
              color={getColor(value)}
              sx={{ height: 8, borderRadius: 4 }}
            />
          </Box>
        ))}
      </Box>

      {/* Strengths & Weaknesses */}
      <Box mt={3}>
        {score.strengths.length > 0 && (
          <Box mb={2}>
            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
              <CheckCircle color="success" fontSize="small" sx={{ mr: 0.5 }} />
              Strengths
            </Typography>
            {score.strengths.map((strength, idx) => (
              <Chip key={idx} label={strength} color="success" size="small" sx={{ m: 0.5 }} />
            ))}
          </Box>
        )}

        {score.weaknesses.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom display="flex" alignItems="center">
              <Warning color="warning" fontSize="small" sx={{ mr: 0.5 }} />
              Areas to Improve
            </Typography>
            {score.weaknesses.map((weakness, idx) => (
              <Chip key={idx} label={weakness} color="warning" size="small" sx={{ m: 0.5 }} />
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default FinancialHealthScore;
