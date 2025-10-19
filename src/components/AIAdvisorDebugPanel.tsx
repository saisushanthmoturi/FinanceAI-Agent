/**
 * AI Financial Advisor Debug Panel
 * Add this to the AI Financial Advisor page for testing
 */

import { useState } from 'react';
import { Box, Button, Paper, Typography } from '@mui/material';
import {
  testAIFinancialAdvisor,
  testComparison,
  validateInputs,
} from '../debug/testAIFinancialAdvisor';
import type { UserFinancialInput } from '../services/aiFinancialAdvisor';

interface AIAdvisorDebugPanelProps {
  userId: string;
  currentInput: UserFinancialInput;
}

export const AIAdvisorDebugPanel: React.FC<AIAdvisorDebugPanelProps> = ({
  userId,
  currentInput,
}) => {
  const [output, setOutput] = useState<string>('');

  const runFullTest = async () => {
    setOutput('Running full AI Financial Advisor test...\n');
    try {
      await testAIFinancialAdvisor(userId);
      setOutput((prev) => prev + '\n✅ Test completed! Check browser console for details.');
    } catch (error) {
      setOutput(
        (prev) => prev + '\n❌ Test failed: ' + (error as Error).message
      );
    }
  };

  const runComparisonTest = () => {
    setOutput('Running savings vs investment comparison...\n');
    try {
      testComparison();
      setOutput((prev) => prev + '\n✅ Comparison test completed! Check console.');
    } catch (error) {
      setOutput(
        (prev) => prev + '\n❌ Test failed: ' + (error as Error).message
      );
    }
  };

  const validateCurrentInput = () => {
    setOutput('Validating current input...\n');
    const errors = validateInputs(currentInput);

    if (errors.length === 0) {
      setOutput((prev) => prev + '\n✅ All inputs are valid!');
    } else {
      setOutput((prev) => prev + '\n❌ Validation errors:\n' + errors.map((e) => `  • ${e}`).join('\n'));
    }
  };

  const showCurrentInput = () => {
    setOutput(
      'Current Input:\n' + JSON.stringify(currentInput, null, 2)
    );
  };

  return (
    <Paper
      sx={{
        p: 3,
        mb: 3,
        bgcolor: '#fff3e0',
        border: '2px solid #ff9800',
      }}
    >
      <Typography variant="h6" gutterBottom color="warning.main">
        🐛 AI Advisor Debug Panel (Remove in Production)
      </Typography>

      <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
        <Button variant="contained" onClick={runFullTest} size="small">
          Run Full Test
        </Button>
        <Button variant="outlined" onClick={runComparisonTest} size="small">
          Test Comparison
        </Button>
        <Button variant="outlined" onClick={validateCurrentInput} size="small">
          Validate Inputs
        </Button>
        <Button variant="outlined" onClick={showCurrentInput} size="small">
          Show Current Input
        </Button>
        <Button variant="outlined" onClick={() => setOutput('')} size="small">
          Clear Output
        </Button>
      </Box>

      <Paper
        sx={{
          p: 2,
          bgcolor: '#000',
          color: '#0f0',
          fontFamily: 'monospace',
          fontSize: '12px',
          maxHeight: 400,
          overflow: 'auto',
        }}
      >
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {output || 'No output yet. Click a button to run tests.\n\nOpen browser console (F12) for detailed logs.'}
        </pre>
      </Paper>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        💡 Tip: Open browser console (F12) to see detailed execution logs
      </Typography>
    </Paper>
  );
};
