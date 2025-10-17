import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Chip,
  LinearProgress,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import {
  Psychology,
  TrendingUp,
  Warning,
  CheckCircle,
  Calculate,
  Insights,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { geminiService } from '../services/gemini';
import type { SimulationResult, MonthlyProjection } from '../types';

interface SimulationParams {
  scenarioType: string;
  currentAge: number;
  retirementAge: number;
  currentSavings: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlySavings: number;
  expectedReturnRate: number;
  inflationRate: number;
  retirementExpenses: number;
}

const ScenarioSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    scenarioType: 'retirement',
    currentAge: 30,
    retirementAge: 60,
    currentSavings: 500000,
    monthlyIncome: 100000,
    monthlyExpenses: 60000,
    monthlySavings: 40000,
    expectedReturnRate: 12,
    inflationRate: 6,
    retirementExpenses: 50000,
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimulationResult | null>(null);

  const handleParamChange = (key: keyof SimulationParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      // Run Monte Carlo simulation
      const simResults = await runMonteCarloSimulation(params);
      setResults(simResults);
    } catch (error) {
      console.error('Simulation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const runMonteCarloSimulation = async (params: SimulationParams): Promise<SimulationResult> => {
    const iterations = 1000;
    const yearsToSimulate = params.retirementAge - params.currentAge;
    const monthsToSimulate = yearsToSimulate * 12;

    // Monte Carlo simulation
    const finalNetWorths: number[] = [];
    const monthlyProjections: MonthlyProjection[] = [];

    for (let i = 0; i < iterations; i++) {
      let currentNetWorth = params.currentSavings;
      const monthlyData: number[] = [];

      for (let month = 0; month < monthsToSimulate; month++) {
        // Add randomness to returns (normal distribution)
        const monthlyReturn = (params.expectedReturnRate / 12 / 100) + (Math.random() - 0.5) * 0.02;
        const monthlyInflation = params.inflationRate / 12 / 100;

        // Calculate growth
        currentNetWorth = currentNetWorth * (1 + monthlyReturn);
        currentNetWorth += params.monthlySavings;

        monthlyData.push(currentNetWorth);

        // Store aggregate data for first iteration
        if (i === 0 && month % 6 === 0) {
          monthlyProjections.push({
            month,
            income: params.monthlyIncome,
            expenses: params.monthlyExpenses * Math.pow(1 + monthlyInflation, month),
            savings: params.monthlySavings,
            investments: currentNetWorth,
            netWorth: currentNetWorth,
          });
        }
      }

      finalNetWorths.push(currentNetWorth);
    }

    // Sort results
    finalNetWorths.sort((a, b) => a - b);

    const bestCase = finalNetWorths[Math.floor(iterations * 0.95)];
    const worstCase = finalNetWorths[Math.floor(iterations * 0.05)];
    const median = finalNetWorths[Math.floor(iterations * 0.5)];

    // Calculate success probability (can sustain retirement)
    const requiredCorpus = params.retirementExpenses * 12 * 25; // 25x annual expenses
    const successfulRuns = finalNetWorths.filter((nw) => nw >= requiredCorpus).length;
    const successProbability = (successfulRuns / iterations) * 100;

    // Generate AI recommendations
    const aiAnalysis = await geminiService.analyzeScenario({
      params,
      successProbability,
      median,
      bestCase,
      worstCase,
    });

    return {
      successProbability,
      projectedNetWorth: finalNetWorths,
      monthlyBreakdown: monthlyProjections,
      bestCaseScenario: bestCase,
      worstCaseScenario: worstCase,
      medianScenario: median,
      riskFactors: aiAnalysis.riskFactors || [
        'Market volatility during retirement years',
        'Inflation higher than expected',
        'Unexpected medical expenses',
      ],
      recommendations: aiAnalysis.recommendations || [
        'Increase monthly savings by ₹10,000',
        'Consider debt mutual funds for stable returns',
        'Build emergency fund of 6 months expenses',
      ],
    };
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box mb={4}>
        <Box display="flex" alignItems="center" mb={2}>
          <Psychology sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              AI Scenario Simulator
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monte Carlo simulation with 1,000 iterations
            </Typography>
          </Box>
        </Box>
        <Alert severity="info" sx={{ mt: 2 }}>
          <strong>How it works:</strong> We run 1,000 different scenarios with varying market returns
          to predict your financial future with statistical confidence.
        </Alert>
      </Box>

      <Grid container spacing={3}>
        {/* Input Parameters */}
        <Grid size={{ xs: 12, lg: 4 }}>
          <Paper elevation={3} sx={{ p: 3, position: 'sticky', top: 20 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Simulation Parameters
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Scenario Type</InputLabel>
              <Select
                value={params.scenarioType}
                label="Scenario Type"
                onChange={(e) => handleParamChange('scenarioType', e.target.value)}
              >
                <MenuItem value="retirement">Retirement Planning</MenuItem>
                <MenuItem value="job_loss">Job Loss Impact</MenuItem>
                <MenuItem value="investment">Investment Growth</MenuItem>
                <MenuItem value="expense">Major Expense</MenuItem>
              </Select>
            </FormControl>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Current Age: {params.currentAge}
              </Typography>
              <Slider
                value={params.currentAge}
                onChange={(_, v) => handleParamChange('currentAge', v as number)}
                min={20}
                max={60}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Retirement Age: {params.retirementAge}
              </Typography>
              <Slider
                value={params.retirementAge}
                onChange={(_, v) => handleParamChange('retirementAge', v as number)}
                min={params.currentAge + 5}
                max={75}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              fullWidth
              label="Current Savings (₹)"
              type="number"
              value={params.currentSavings}
              onChange={(e) => handleParamChange('currentSavings', Number(e.target.value))}
              sx={{ mt: 3 }}
            />

            <TextField
              fullWidth
              label="Monthly Income (₹)"
              type="number"
              value={params.monthlyIncome}
              onChange={(e) => handleParamChange('monthlyIncome', Number(e.target.value))}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Monthly Expenses (₹)"
              type="number"
              value={params.monthlyExpenses}
              onChange={(e) => handleParamChange('monthlyExpenses', Number(e.target.value))}
              sx={{ mt: 2 }}
            />

            <TextField
              fullWidth
              label="Monthly Savings (₹)"
              type="number"
              value={params.monthlySavings}
              onChange={(e) => handleParamChange('monthlySavings', Number(e.target.value))}
              sx={{ mt: 2 }}
            />

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Expected Return Rate: {params.expectedReturnRate}% p.a.
              </Typography>
              <Slider
                value={params.expectedReturnRate}
                onChange={(_, v) => handleParamChange('expectedReturnRate', v as number)}
                min={5}
                max={20}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" gutterBottom>
                Inflation Rate: {params.inflationRate}% p.a.
              </Typography>
              <Slider
                value={params.inflationRate}
                onChange={(_, v) => handleParamChange('inflationRate', v as number)}
                min={3}
                max={10}
                step={0.5}
                marks
                valueLabelDisplay="auto"
              />
            </Box>

            <TextField
              fullWidth
              label="Post-Retirement Monthly Expenses (₹)"
              type="number"
              value={params.retirementExpenses}
              onChange={(e) => handleParamChange('retirementExpenses', Number(e.target.value))}
              sx={{ mt: 3 }}
            />

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={loading ? <CircularProgress size={20} /> : <Calculate />}
              onClick={runSimulation}
              disabled={loading}
              sx={{ mt: 4 }}
            >
              {loading ? 'Running Simulation...' : 'Run Simulation'}
            </Button>
          </Paper>
        </Grid>

        {/* Results */}
        <Grid size={{ xs: 12, lg: 8 }}>
          {loading && (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
              <CircularProgress size={60} />
              <Typography variant="h6" sx={{ mt: 3 }}>
                Running Monte Carlo Simulation...
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Analyzing 1,000 different scenarios
              </Typography>
              <LinearProgress sx={{ mt: 3 }} />
            </Paper>
          )}

          {!loading && !results && (
            <Paper elevation={3} sx={{ p: 6, textAlign: 'center' }}>
              <Insights sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Configure parameters and run simulation
              </Typography>
            </Paper>
          )}

          {!loading && results && (
            <>
              {/* Success Probability */}
              <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Simulation Results
                </Typography>

                <Grid container spacing={3} sx={{ mt: 2 }}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card
                      sx={{
                        background: `linear-gradient(135deg, ${
                          results.successProbability > 75 ? '#4caf50' : results.successProbability > 50 ? '#ff9800' : '#f44336'
                        } 0%, ${
                          results.successProbability > 75 ? '#66bb6a' : results.successProbability > 50 ? '#ffa726' : '#e57373'
                        } 100%)`,
                        color: 'white',
                      }}
                    >
                      <CardContent>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                              Success Probability
                            </Typography>
                            <Typography variant="h3" fontWeight="bold">
                              {results.successProbability.toFixed(1)}%
                            </Typography>
                          </Box>
                          {results.successProbability > 75 ? (
                            <CheckCircle sx={{ fontSize: 60, opacity: 0.8 }} />
                          ) : (
                            <Warning sx={{ fontSize: 60, opacity: 0.8 }} />
                          )}
                        </Box>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                          Based on 1,000 Monte Carlo simulations
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Projected Net Worth (Median)
                        </Typography>
                        <Typography variant="h4" fontWeight="bold" color="primary">
                          ₹{(results.medianScenario / 10000000).toFixed(2)} Cr
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <Box display="flex" justifyContent="space-between" mb={1}>
                            <Typography variant="caption" color="text.secondary">
                              Best Case
                            </Typography>
                            <Typography variant="caption" fontWeight="bold" color="success.main">
                              ₹{(results.bestCaseScenario / 10000000).toFixed(2)} Cr
                            </Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="caption" color="text.secondary">
                              Worst Case
                            </Typography>
                            <Typography variant="caption" fontWeight="bold" color="error.main">
                              ₹{(results.worstCaseScenario / 10000000).toFixed(2)} Cr
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Paper>

              {/* Chart */}
              <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  Wealth Accumulation Timeline
                </Typography>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={results.monthlyBreakdown}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1976d2" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="month"
                      tickFormatter={(month) => `Year ${Math.floor(month / 12)}`}
                    />
                    <YAxis tickFormatter={(value) => `₹${(value / 100000).toFixed(0)}L`} />
                    <Tooltip
                      formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                      labelFormatter={(month) => `Month ${month} (Year ${Math.floor(Number(month) / 12)})`}
                    />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#1976d2"
                      fillOpacity={1}
                      fill="url(#colorNetWorth)"
                      name="Net Worth"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Paper>

              {/* Risk Factors */}
              <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  <Warning sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Risk Factors
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {results.riskFactors.map((risk, idx) => (
                    <Chip
                      key={idx}
                      label={risk}
                      color="warning"
                      sx={{ mr: 1, mb: 1 }}
                      icon={<Warning />}
                    />
                  ))}
                </Box>
              </Paper>

              {/* Recommendations */}
              <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  <TrendingUp sx={{ mr: 1, verticalAlign: 'middle' }} />
                  AI Recommendations
                </Typography>
                <Box sx={{ mt: 2 }}>
                  {results.recommendations.map((rec, idx) => (
                    <Alert key={idx} severity="info" sx={{ mb: 2 }}>
                      {rec}
                    </Alert>
                  ))}
                </Box>
              </Paper>
            </>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default ScenarioSimulator;
