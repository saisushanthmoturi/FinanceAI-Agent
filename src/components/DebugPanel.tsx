/**
 * Debug Panel Component
 * Add this temporarily to TaxOptimization page to test the flow
 */

import { useState } from 'react';
import { Box, Button, Paper, Typography, TextField } from '@mui/material';
import { testTaxOptimizationFlow, testDataRetrieval } from '../debug/testTaxOptimization';

interface DebugPanelProps {
  userId: string;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ userId }) => {
  const [output, setOutput] = useState<string>('');
  const [testUserId, setTestUserId] = useState(userId);

  const runFullTest = async () => {
    setOutput('Running test...\n');
    try {
      const result = await testTaxOptimizationFlow(testUserId);
      setOutput((prev) => prev + '\n✓ Test completed successfully!\n' + JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((prev) => prev + '\n✗ Test failed: ' + (error as Error).message);
    }
  };

  const runRetrievalTest = async () => {
    setOutput('Retrieving data...\n');
    try {
      const result = await testDataRetrieval(testUserId);
      setOutput((prev) => prev + '\n✓ Data retrieved:\n' + JSON.stringify(result, null, 2));
    } catch (error) {
      setOutput((prev) => prev + '\n✗ Retrieval failed: ' + (error as Error).message);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3, bgcolor: '#f5f5f5', border: '2px solid #ff9800' }}>
      <Typography variant="h6" gutterBottom color="warning.main">
        🐛 Debug Panel (Remove in Production)
      </Typography>
      
      <Box display="flex" gap={2} mb={2}>
        <TextField
          label="User ID"
          value={testUserId}
          onChange={(e) => setTestUserId(e.target.value)}
          size="small"
          fullWidth
        />
      </Box>

      <Box display="flex" gap={2} mb={2}>
        <Button variant="contained" onClick={runFullTest} size="small">
          Run Full Test
        </Button>
        <Button variant="outlined" onClick={runRetrievalTest} size="small">
          Test Data Retrieval
        </Button>
        <Button variant="outlined" onClick={() => setOutput('')} size="small">
          Clear Output
        </Button>
      </Box>

      <Paper sx={{ p: 2, bgcolor: '#000', color: '#0f0', fontFamily: 'monospace', fontSize: '12px', maxHeight: 400, overflow: 'auto' }}>
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {output || 'No output yet. Click a button to run tests.'}
        </pre>
      </Paper>
    </Paper>
  );
};
