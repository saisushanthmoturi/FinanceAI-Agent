import { Paper, Typography, List, ListItem, ListItemText, Box, Chip } from '@mui/material';
import { ArrowUpward, ArrowDownward } from '@mui/icons-material';
import type { Transaction } from '../types';
import { format } from 'date-fns';

interface Props {
  transactions: Transaction[];
}

const RecentTransactions: React.FC<Props> = ({ transactions }) => {
  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Recent Transactions
      </Typography>

      {transactions.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            No recent transactions
          </Typography>
        </Box>
      ) : (
        <List>
          {transactions.slice(0, 10).map((transaction) => (
            <ListItem
              key={transaction.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Box
                mr={2}
                sx={{
                  p: 1,
                  borderRadius: '50%',
                  bgcolor: transaction.type === 'credit' ? 'success.light' : 'error.light',
                }}
              >
                {transaction.type === 'credit' ? (
                  <ArrowDownward color="success" />
                ) : (
                  <ArrowUpward color="error" />
                )}
              </Box>
              <ListItemText
                primary={transaction.description}
                secondary={
                  <>
                    {format(transaction.date, 'MMM dd, yyyy')}
                    {transaction.merchant && ` • ${transaction.merchant}`}
                  </>
                }
              />
              <Box textAlign="right">
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  color={transaction.type === 'credit' ? 'success.main' : 'error.main'}
                >
                  {transaction.type === 'credit' ? '+' : '-'}₹
                  {transaction.amount.toLocaleString('en-IN')}
                </Typography>
                <Chip label={transaction.category} size="small" />
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentTransactions;
