import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { SuiParsedData } from '@mysten/sui/client';
import { formatAddress } from "@mysten/sui/utils";
// import { bcs } from "@mysten/sui/bcs";  // Replace @mysten/bcs
import Grid from '@mui/material/GridLegacy';
// import { BCS, getSuiMoveConfig } from "@mysten/bcs";

// Create a BCS instance
// const bcs = new BCS(getSuiMoveConfig());


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
  AccountCircle as AccountCircleIcon,
  History as HistoryIcon
} from '@mui/icons-material';

const PACKAGE_ID = '0x689b3ab5e808c8d0b6b20f23211a45fb02a5e42b6e80e2b0304039b22330c279';
const REGISTRY_OBJECT_ID = '0x749a85ea65afc7e1ec0a43f9cccc226f969db27cf7378edaf575117733eb4c6e';
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

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
    // Get the FriendList object
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

    // Get the dynamic fields from the payments table
    const { data: paymentFields } = await suiClient.getDynamicFields({
      parentId: fields.payments.fields.id.id
    });

    // Find the payment history for this friend
    const friendPaymentField = paymentFields.find(field => 
      field.name.type === 'address' && 
      field.name.value === friendAddr
    );

    if (!friendPaymentField) {
      setPaymentHistory([]);
      return;
    }

    // Get the payment history object
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

  const handlePayFriend = async () => {
    if (!selectedFriend || !paymentAmount || !signAndExecuteTransaction || !friendListId) return;
    setLoading(true);
    setError(null);
    try {
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount)) throw new Error('Invalid amount');
      
      const tx = new Transaction();
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amount * 1e9)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::pay_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(selectedFriend.addr),
          coin,
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
            FriendPay
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
                <Button
                  variant="outlined"
                  onClick={fetchFriends}
                  disabled={loading}
                  startIcon={<RefreshIcon />}
                >
                  Refresh
                </Button>
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
    </Container>
  );
}