import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import type { TransactionArgument } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { SuiParsedData } from '@mysten/sui/client';
import { formatAddress } from "@mysten/sui/utils";
import Grid from '@mui/material/GridLegacy';

// UI Components
import {
  Box,
  Button,
  Card,
  Container,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  BatchPrediction as BatchIcon
} from '@mui/icons-material';

const PACKAGE_ID = '0x615781f0b6e16cbd4b290b20527851be8b23323b0547653c2e9962e8bdce3ff0';
const REGISTRY_OBJECT_ID = '0x06d916bf05ce5a9c850d5303423c07348a3db5435464c8ab1370de63b7c4bab1';
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

interface Friend {
  addr: string;
  name: string;
  timestamp?: number;
}

interface PaymentRecord {
  from: string;
  amount: number;
  memo: string;
  timestamp: number;
}

interface BatchPayment {
  recipient: string;
  amount: string;
}

export default function FriendListApp() {
  const { signAndExecuteTransaction, account, connected, disconnect } = useWallet();
  const [friendAddress, setFriendAddress] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendListId, setFriendListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [batchPayments, setBatchPayments] = useState<BatchPayment[]>([{ recipient: '', amount: '' }]);
  const [batchMemo, setBatchMemo] = useState('');
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  function getTableIdFromRegistryContent(content: SuiParsedData | undefined): string | null {
    if (!content || content.dataType !== 'moveObject') return null;
    const fields = content.fields as any;
    if (fields.lists?.fields?.id?.id) return fields.lists.fields.id.id;
    if (fields.lists?.id?.id) return fields.lists.id.id;
    return null;
  }

  const fetchFriendListId = async () => {
    if (!account?.address) {
      setFriendListId(null);
      setFriends([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const registryObj = await suiClient.getObject({
        id: REGISTRY_OBJECT_ID,
        options: { showContent: true }
      });
      if (!registryObj.data?.content) {
        throw new Error('Registry object not found or invalid');
      }
      const tableId = getTableIdFromRegistryContent(registryObj.data?.content);
      if (!tableId) throw new Error('Could not find tableId in registry content');

      const { data: dynamicFields } = await suiClient.getDynamicFields({
        parentId: tableId
      });

      const normalizedUserAddress = account.address.toLowerCase().replace(/^0x/, '');
      const userEntry = dynamicFields.find((field: any) => {
        if (field.name.type === 'address' && typeof field.name.value === 'string') {
          const normalizedFieldAddress = field.name.value.toLowerCase().replace(/^0x/, '');
          return normalizedFieldAddress === normalizedUserAddress;
        }
        return false;
      });

      if (userEntry) {
        const fieldObj = await suiClient.getObject({
          id: userEntry.objectId,
          options: { showContent: true }
        });
        if (
          fieldObj.data?.content &&
          fieldObj.data.content.dataType === 'moveObject'
        ) {
          const valueId = (fieldObj.data.content.fields as any).value;
          if (typeof valueId === "string") {
            setFriendListId(valueId);
          } else {
            setFriendListId(null);
            setError("Could not extract FriendList object ID from dynamic field");
          }
        } else {
          setFriendListId(null);
          setError("Dynamic field object not found or invalid");
        }
      } else {
        setFriendListId(null);
      }
    } catch (err) {
      setError('Failed to load friend list: ' + (err instanceof Error ? err.message : String(err)));
      setFriendListId(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!friendListId) {
      setFriends([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await suiClient.getObject({
        id: friendListId,
        options: { showContent: true }
      });
      
      const content = resp.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        throw new Error('Invalid friend list format');
      }

      let friendsData: Friend[] = [];
      const fields = content.fields as any;
      
      if (fields.friends) {
        const { data: bagFields } = await suiClient.getDynamicFields({
          parentId: fields.friends.fields.id.id
        });

        for (const field of bagFields) {
          const friendObj = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true }
          });
          
          if (friendObj.data?.content?.dataType === 'moveObject') {
            const friendFields = friendObj.data.content.fields as any;
            const friendValue = friendFields.value?.fields || friendFields;
            
            if (friendValue.addr || field.name.value) {
              friendsData.push({
                addr: friendValue.addr || field.name.value,
                name: friendValue.name || 'Unknown',
                timestamp: friendValue.timestamp
              });
            }
          }
        }
      }
      
      setFriends(friendsData);
    } catch (err) {
      setError('Failed to load friends: ' + (err instanceof Error ? err.message : String(err)));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPaymentHistory = async (friendAddr: string) => {
    if (!friendListId) return;
    setLoading(true);
    try {
      const friendListObj = await suiClient.getObject({
        id: friendListId,
        options: { showContent: true }
      });

      if (friendListObj.data?.content?.dataType !== 'moveObject') {
        setPaymentHistory([]);
        return;
      }

      const fields = friendListObj.data.content.fields as any;
      if (!fields.payments) {
        setPaymentHistory([]);
        return;
      }

      const { data: paymentFields } = await suiClient.getDynamicFields({
        parentId: fields.payments.fields.id.id
      });

      const friendPaymentField = paymentFields.find(field => 
        field.name.type === 'address' && 
        field.name.value === friendAddr
      );

      if (!friendPaymentField) {
        setPaymentHistory([]);
        return;
      }

      const paymentObj = await suiClient.getObject({
        id: friendPaymentField.objectId,
        options: { showContent: true }
      });

      if (paymentObj.data?.content?.dataType === 'moveObject') {
        const paymentFields = paymentObj.data.content.fields as any;
        const history = paymentFields.value || [];
        setPaymentHistory(history.map((item: any) => ({
          from: item.fields.from,
          amount: Number(item.fields.amount),
          memo: item.fields.memo,
          timestamp: Number(item.fields.timestamp)
        })));
      } else {
        setPaymentHistory([]);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const createFriendList = async () => {
    if (!account?.address || !signAndExecuteTransaction) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::create`,
        arguments: [tx.object(REGISTRY_OBJECT_ID)],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      setSuccess("Friend list created successfully!");
      await fetchFriendListId();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!friendListId || !friendAddress || !friendName || !signAndExecuteTransaction) return;
    setLoading(true);
    setError(null);
    try {
      const formattedAddress = friendAddress.startsWith('0x') ? friendAddress : `0x${friendAddress}`;
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::add_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(formattedAddress),
          tx.pure.string(friendName),
        ],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      setSuccess(`Added ${friendName} to your friends list!`);
      setFriendAddress('');
      setFriendName('');
      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (addr: string, name: string) => {
    if (!friendListId || !signAndExecuteTransaction || !addr) return;
    setLoading(true);
    setError(null);
    try {
      const formattedAddress = addr.startsWith('0x') ? addr : `0x${addr}`;
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::remove_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(formattedAddress),
        ],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      setSuccess(`Removed ${name} from your friends list!`);
      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentDialog = (friend: Friend) => {
    setSelectedFriend(friend);
    setPaymentDialogOpen(true);
  };

  const handleOpenHistoryDialog = async (friend: Friend) => {
    setSelectedFriend(friend);
    await fetchPaymentHistory(friend.addr);
    setHistoryDialogOpen(true);
  };

  const handleOpenBatchDialog = () => {
    setBatchDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedFriend(null);
    setPaymentAmount('');
    setPaymentMemo('');
  };

  const handleCloseHistoryDialog = () => {
    setHistoryDialogOpen(false);
    setSelectedFriend(null);
    setPaymentHistory([]);
  };

  const handleCloseBatchDialog = () => {
    setBatchDialogOpen(false);
    setBatchPayments([{ recipient: '', amount: '' }]);
    setBatchMemo('');
  };

  const handlePayFriend = async () => {
    if (!selectedFriend || !paymentAmount || !signAndExecuteTransaction || !friendListId || !account) return;
    setLoading(true);
    setError(null);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount)) throw new Error('Invalid amount');
    
      const tx = new Transaction();
      tx.setGasBudget(200000000);
      
      const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1e9)]);
      
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::pay_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(selectedFriend.addr),
          paymentCoin,
          tx.pure.u64(amount * 1e9),
          tx.pure.string(paymentMemo),
        ],
      });

      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      
      setSuccess(`Sent ${amount} SUI to ${selectedFriend.name}!`);
      handleClosePaymentDialog();
      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchPaymentChange = (index: number, field: keyof BatchPayment, value: string) => {
    const updatedPayments = [...batchPayments];
    updatedPayments[index] = {
      ...updatedPayments[index],
      [field]: value
    };
    setBatchPayments(updatedPayments);
  };

  const addBatchPaymentField = () => {
    if (batchPayments.length < 20) {
      setBatchPayments([...batchPayments, { recipient: '', amount: '' }]);
    }
  };

  const removeBatchPaymentField = (index: number) => {
    if (batchPayments.length > 1) {
      const updatedPayments = [...batchPayments];
      updatedPayments.splice(index, 1);
      setBatchPayments(updatedPayments);
    }
  };

const handleBatchPayFriends = async () => {
  if (!friendListId || !signAndExecuteTransaction || !account) return;
  
  // Validate inputs
  const validPayments = batchPayments.filter(p => 
    p.recipient && p.amount && !isNaN(parseFloat(p.amount)) && parseFloat(p.amount) > 0
  );
  
  if (validPayments.length === 0) {
    setError('Please enter valid payment details');
    return;
  }
  
  setLoading(true);
  setError(null);
  
  try {
    const tx = new Transaction();
    tx.setGasBudget(300000000);
    
    // Calculate total amount and prepare arguments
    const totalAmount = validPayments.reduce((sum, p) => sum + parseFloat(p.amount) * 1e9, 0);
    const recipientAddresses = validPayments.map(p => p.recipient);
    const paymentAmounts = validPayments.map(p => parseFloat(p.amount) * 1e9);
    
    // Split coins for total amount
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(totalAmount)]);
    
    // Create properly typed arguments using 'elements' instead of 'objects'
    const recipientsArg = tx.makeMoveVec({
      elements: recipientAddresses.map(addr => tx.pure.address(addr)),
      type: 'address',
    });
    
    const amountsArg = tx.makeMoveVec({
      elements: paymentAmounts.map(amount => tx.pure.u64(amount)),
      type: 'u64',
    });
    
    // Call batch_pay_friends_simple
    tx.moveCall({
      target: `${PACKAGE_ID}::friend_list::batch_pay_friends_simple`,
      arguments: [
        tx.object(friendListId),
        recipientsArg,
        amountsArg,
        tx.pure.string(batchMemo),
        paymentCoin,
      ],
    });
    
    const response = await signAndExecuteTransaction({ transaction: tx });
    await suiClient.waitForTransaction({
      digest: response.digest,
      timeout: 20000,
      pollInterval: 1000,
    });
    
    setSuccess(`Successfully sent batch payments to ${validPayments.length} friends!`);
    handleCloseBatchDialog();
    await fetchFriends();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Batch payment failed');
  } finally {
    setLoading(false);
  }
};
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  useEffect(() => {
    if (connected && account?.address) {
      fetchFriendListId();
    } else {
      setFriendListId(null);
      setFriends([]);
    }
  }, [account?.address, connected]);

  useEffect(() => {
    if (friendListId) {
      fetchFriends();
    } else {
      setFriends([]);
    }
  }, [friendListId]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" fontWeight="bold">
            suiConn
          </Typography>
          <ConnectButton />
        </Stack>

        {loading && (
          <Box textAlign="center" my={2}>
            <CircularProgress />
            <Typography variant="body1" mt={1}>Processing...</Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {!connected ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" mb={2}>
              Connect your wallet to manage your friends list
            </Typography>
            <ConnectButton />
          </Box>
        ) : !friendListId ? (
          <Box textAlign="center" py={4}>
            <Typography variant="h6" mb={3}>
              Welcome! Create your friend list to get started
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={createFriendList}
              disabled={loading}
            >
              Create Friend List
            </Button>
          </Box>
        ) : (
          <>
            <Card sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" mb={2} fontWeight="bold">
                Add New Friend
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Friend's Address"
                    value={friendAddress}
                    onChange={(e) => setFriendAddress(e.target.value)}
                    placeholder="0x..."
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <TextField
                    fullWidth
                    label="Friend's Name"
                    value={friendName}
                    onChange={(e) => setFriendName(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={handleAddFriend}
                    disabled={!friendAddress || !friendName || loading}
                    startIcon={<AddIcon />}
                    sx={{ height: '56px' }}
                  >
                    Add
                  </Button>
                </Grid>
              </Grid>
            </Card>

            <Card sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">
                  Your Friends ({friends.length})
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    onClick={fetchFriends}
                    disabled={loading}
                    startIcon={<RefreshIcon />}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleOpenBatchDialog}
                    disabled={friends.length === 0 || loading}
                    startIcon={<BatchIcon />}
                  >
                    Batch Pay
                  </Button>
                </Stack>
              </Stack>

              {friends.length === 0 ? (
                <Box textAlign="center" py={4}>
                  <Typography variant="body1" color="text.secondary">
                    No friends added yet
                  </Typography>
                </Box>
              ) : (
                <List>
                  {friends.map((friend, index) => (
                    <div key={index}>
                      <ListItem
                        secondaryAction={
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Payment History">
                              <IconButton
                                edge="end"
                                onClick={() => handleOpenHistoryDialog(friend)}
                              >
                                <HistoryIcon />
                              </IconButton>
                            </Tooltip>
                            <Button
                              variant="contained"
                              size="small"
                              startIcon={<PaymentIcon />}
                              onClick={() => handleOpenPaymentDialog(friend)}
                            >
                              Pay
                            </Button>
                            <Tooltip title="Remove Friend">
                              <IconButton
                                edge="end"
                                onClick={() => handleRemoveFriend(friend.addr, friend.name)}
                                disabled={loading}
                              >
                                <DeleteIcon color="error" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        }
                      >
                        <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                          {friend.name.charAt(0).toUpperCase()}
                        </Avatar>
                        <ListItemText
                          primary={friend.name}
                          secondary={formatAddress(friend.addr)}
                        />
                      </ListItem>
                      {index < friends.length - 1 && <Divider />}
                    </div>
                  ))}
                </List>
              )}
            </Card>
          </>
        )}
      </Paper>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog}>
        <DialogTitle>
          Send Payment to {selectedFriend?.name}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: '400px' }}>
            <TextField
              label="Amount (SUI)"
              type="number"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              fullWidth
            />
            <TextField
              label="Memo"
              value={paymentMemo}
              onChange={(e) => setPaymentMemo(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handlePayFriend}
            disabled={!paymentAmount || loading}
            startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
          >
            Send Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialogOpen} onClose={handleCloseHistoryDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          Payment History with {selectedFriend?.name}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box textAlign="center" py={4}>
              <CircularProgress />
            </Box>
          ) : paymentHistory.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" py={4}>
              No payment history found
            </Typography>
          ) : (
            <List>
              {paymentHistory.map((payment, index) => (
                <div key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip
                            label={`${payment.amount / 1e9} SUI`}
                            color="primary"
                            size="small"
                          />
                          <Typography variant="body2" color="text.secondary">
                            {new Date(payment.timestamp).toLocaleString()}
                          </Typography>
                        </Stack>
                      }
                      secondary={
                        <>
                          <Typography variant="body2">
                            From: {formatAddress(payment.from)}
                          </Typography>
                          {payment.memo && (
                            <Typography variant="body2" fontStyle="italic">
                              Note: {payment.memo}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  {index < paymentHistory.length - 1 && <Divider />}
                </div>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistoryDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Batch Payment Dialog */}
      <Dialog open={batchDialogOpen} onClose={handleCloseBatchDialog} maxWidth="md" fullWidth>
        <DialogTitle>Batch Payment to Friends</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <Typography variant="body1">
              Send payments to multiple friends at once (max 20)
            </Typography>
            
            {batchPayments.map((payment, index) => (
              <Grid container spacing={2} key={index} alignItems="center">
                <Grid item xs={5}>
                  <TextField
                    select
                    fullWidth
                    label="Recipient"
                    value={payment.recipient}
                    onChange={(e) => handleBatchPaymentChange(index, 'recipient', e.target.value)}
                    SelectProps={{
                      native: true,
                    }}
                  >
                    <option value=""></option>
                    {friends.map((friend) => (
                      <option key={friend.addr} value={friend.addr}>
                        {friend.name} ({formatAddress(friend.addr)})
                      </option>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={5}>
                  <TextField
                    fullWidth
                    label="Amount (SUI)"
                    type="number"
                    value={payment.amount}
                    onChange={(e) => handleBatchPaymentChange(index, 'amount', e.target.value)}
                  />
                </Grid>
                <Grid item xs={2}>
                  {batchPayments.length > 1 && (
                    <IconButton onClick={() => removeBatchPaymentField(index)}>
                      <DeleteIcon color="error" />
                    </IconButton>
                  )}
                </Grid>
              </Grid>
            ))}
            
            {batchPayments.length < 20 && (
              <Button
                variant="outlined"
                onClick={addBatchPaymentField}
                startIcon={<AddIcon />}
              >
                Add Another Recipient
              </Button>
            )}
            
            <TextField
              label="Memo (applies to all payments)"
              value={batchMemo}
              onChange={(e) => setBatchMemo(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseBatchDialog}>Cancel</Button>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleBatchPayFriends}
            disabled={loading || batchPayments.every(p => !p.recipient || !p.amount)}
            startIcon={loading ? <CircularProgress size={20} /> : <BatchIcon />}
          >
            Send Batch Payments
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}