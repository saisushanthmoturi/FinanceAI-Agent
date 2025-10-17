import { Paper, Typography, List, ListItem, ListItemText, Chip, Box } from '@mui/material';
import { AccountBalance, ShowChart, Shield, Work } from '@mui/icons-material';
import type { FinancialAccount } from '../types';

interface Props {
  accounts: FinancialAccount[];
}

const AccountsList: React.FC<Props> = ({ accounts }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'bank':
        return <AccountBalance />;
      case 'stocks':
      case 'mutual_fund':
        return <ShowChart />;
      case 'insurance':
        return <Shield />;
      case 'epf':
        return <Work />;
      default:
        return <AccountBalance />;
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom>
        Connected Accounts
      </Typography>

      {accounts.length === 0 ? (
        <Box textAlign="center" py={4}>
          <Typography variant="body2" color="text.secondary">
            No accounts connected yet
          </Typography>
        </Box>
      ) : (
        <List>
          {accounts.map((account) => (
            <ListItem
              key={account.id}
              sx={{
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                mb: 1,
              }}
            >
              <Box mr={2}>{getIcon(account.accountType)}</Box>
              <ListItemText
                primary={account.institutionName}
                secondary={`••••${account.accountNumber.slice(-4)}`}
              />
              <Box textAlign="right">
                <Typography variant="h6" fontWeight="bold">
                  ₹{account.balance.toLocaleString('en-IN')}
                </Typography>
                <Chip
                  label={account.accountType.replace('_', ' ')}
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Box>
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default AccountsList;
