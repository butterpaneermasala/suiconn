import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { SuiParsedData } from '@mysten/sui/client';
import { formatAddress } from "@mysten/sui/utils";
import FloatingBubbles from '../components/FloatingBubbles';
import CoralReef from '../components/CoralReef';
// import { Toaster } from "sonner";

// UI Components
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../components/ui/card";

import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
  BatchPrediction as BatchIcon,
  // TrendingUp as TrendingUpIcon,
  Group as UsersIcon,
  AccountBalanceWallet as WalletIcon,
  Security as ShieldIcon,
  // ArrowRight as ArrowUpRightIcon,
  // AccessTime as ClockIcon,
  Timeline as ActivityIcon,
  AutoAwesome
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

// Underwater overlay component
const UnderwaterOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-40">
    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-950/30 mix-blend-overlay"></div>
    <div className="absolute inset-0" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      opacity: 0.3,
    }}></div>
  </div>
);

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
  const [globalPaymentHistory, setGlobalPaymentHistory] = useState<PaymentRecord[]>([]);
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
        const newHistory = history.map((item: any) => {
          const timestamp = Number(item.fields.timestamp);
          return {
          from: item.fields.from,
            amount: Number(item.fields.amount) / 1e9,
            memo: item.fields.memo || "No memo",
            timestamp: timestamp,
          };
        });
        setPaymentHistory(newHistory);
        
        // Update global payment history
        setGlobalPaymentHistory(prev => {
          const existingIds = new Set(prev.map((p: PaymentRecord) => `${p.from}-${p.timestamp}`));
          const newRecords = newHistory.filter((p: PaymentRecord) => !existingIds.has(`${p.from}-${p.timestamp}`));
          return [...prev, ...newRecords];
        });
      } else {
        setPaymentHistory([]);
      }
    } catch (err) {
      setPaymentHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPaymentHistory = async () => {
    if (!friendListId) return;
    setLoading(true);
    try {
      const friendListObj = await suiClient.getObject({
        id: friendListId,
        options: { showContent: true }
      });

      if (friendListObj.data?.content?.dataType !== 'moveObject') {
        return;
      }

      const fields = friendListObj.data.content.fields as any;
      if (!fields.payments) {
        return;
      }

      const { data: paymentFields } = await suiClient.getDynamicFields({
        parentId: fields.payments.fields.id.id
      });

      let allTransactions: PaymentRecord[] = [];

      for (const field of paymentFields) {
        if (field.name.type === 'address') {
          const paymentObj = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true }
          });

          if (paymentObj.data?.content?.dataType === 'moveObject') {
            const paymentFields = paymentObj.data.content.fields as any;
            const history = paymentFields.value || [];
            const transactions = history.map((item: any) => ({
              from: item.fields.from,
              amount: Number(item.fields.amount) / 1e9,
              memo: item.fields.memo || "No memo",
              timestamp: Number(item.fields.timestamp),
            }));
            allTransactions = [...allTransactions, ...transactions];
          }
        }
      }

      setGlobalPaymentHistory(allTransactions);
    } catch (err) {
      console.error('Failed to fetch all payment history:', err);
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
      await fetchAllPaymentHistory();
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
      await fetchAllPaymentHistory();
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
      fetchAllPaymentHistory();
    } else {
      setFriends([]);
      setGlobalPaymentHistory([]);
    }
  }, [friendListId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 relative overflow-hidden">
      <UnderwaterOverlay />
      <CoralReef />
      <FloatingBubbles />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Header Section */}
        <Card className="mb-8 backdrop-blur-xl bg-white/15 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <CardTitle className="text-2xl sm:text-3xl font-bold text-white group-hover:text-cyan-300 transition-colors duration-300">SuiConn Dashboard</CardTitle>
                <CardDescription className="text-gray-300">
                  Manage your friends and make payments on Sui
                </CardDescription>
              </div>
              <div className="flex gap-4">
                <ConnectButton />
                {connected && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      disconnect();
                      setFriends([]);
                      setFriendListId(null);
                    }}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Add this after the header section and before the main content */}
        {connected && !friendListId && !loading && (
          <Card className="mb-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl animate-on-scroll">
            <CardContent className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                  <UsersIcon className="w-10 h-10 text-cyan-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-4">Create Your Friend List</h2>
                <p className="text-gray-300 mb-8">
                  You need to create a friend list before you can start adding friends and making payments.
                  This is a one-time setup that will be stored on the blockchain.
                </p>
                <Button
                  onClick={createFriendList}
                  className="w-full sm:w-auto text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500 font-semibold"
                >
                  <AutoAwesome className="mr-3 w-6 h-6" />
                  Create Friend List
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {connected ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6 sm:space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card className="backdrop-blur-2xl bg-white/15 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Friends</p>
                        <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-cyan-300 transition-colors duration-300">{friends.length}</h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <UsersIcon className="text-cyan-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-2xl bg-white/15 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Transactions</p>
                        <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-purple-300 transition-colors duration-300">
                          {globalPaymentHistory.length}
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <ActivityIcon className="text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="backdrop-blur-2xl bg-white/15 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Total Volume</p>
                        <h3 className="text-2xl font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors duration-300">
                          {globalPaymentHistory.reduce((acc, curr) => acc + curr.amount, 0).toFixed(2)} SUI
                        </h3>
                      </div>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <WalletIcon className="text-emerald-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Add Friend Section */}
              <Card className="backdrop-blur-2xl bg-white/15 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">Add New Friend</CardTitle>
                  <CardDescription className="text-gray-300">
                    Add a new friend to your network
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <input
                      type="text"
                      placeholder="Friend's Address"
                      value={friendAddress}
                      onChange={(e) => setFriendAddress(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/15 text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                    <input
                      type="text"
                      placeholder="Friend's Name"
                      value={friendName}
                      onChange={(e) => setFriendName(e.target.value)}
                      className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/15 text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                    <Button
                      onClick={handleAddFriend}
                      disabled={loading || !friendAddress || !friendName}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl transition-all duration-300"
                    >
                      <AddIcon /> Add Friend
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Friends List */}
              <Card className="backdrop-blur-3xl bg-white/15 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <CardTitle className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">Friends List</CardTitle>
                      <CardDescription className="text-gray-300">
                        Manage your friends and make payments
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleOpenBatchDialog}
                        disabled={friends.length === 0}
                        className="border-white/20 bg-white/15 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      >
                        <BatchIcon /> Batch Payment
                      </Button>
                      <Button
                        variant="outline"
                        onClick={fetchFriends}
                        disabled={loading}
                        className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      >
                        <RefreshIcon /> Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {friends.map((friend) => (
                      <Card key={friend.addr} className="backdrop-blur-3xl bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300 group">
                        <CardContent className="p-4">
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                              <h3 className="font-medium text-white group-hover:text-cyan-300 transition-colors duration-300">{friend.name}</h3>
                              <p className="text-sm text-gray-300">
                                {formatAddress(friend.addr)}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenPaymentDialog(friend)}
                                className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                              >
                                <PaymentIcon /> Pay
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenHistoryDialog(friend)}
                                className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                              >
                                <HistoryIcon /> History
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveFriend(friend.addr, friend.name)}
                                className="rounded-xl transition-all duration-300"
                              >
                                <DeleteIcon /> Remove
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Activity Feed */}
            <div className="space-y-6 sm:space-y-8">
              {/* Recent Activity */}
              <Card className="backdrop-blur-3xl bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">Recent Activity</CardTitle>
                  <CardDescription className="text-gray-300">
                    Latest transactions and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {paymentHistory.slice(0, 5).map((record, index) => (
                      <div key={index} className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                          <ActivityIcon className="text-cyan-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm text-white">Payment to {formatAddress(record.from)}</p>
                          <p className="text-xs text-gray-400">{record.amount.toFixed(2)} SUI</p>
                          <p className="text-xs text-gray-400 mt-1">{record.memo}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="backdrop-blur-3xl bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">Quick Actions</CardTitle>
                  <CardDescription className="text-gray-300">
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                      variant="outline"
                      className="h-auto py-4 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      onClick={() => friends.length > 0 && handleOpenBatchDialog()}
                      disabled={friends.length === 0}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <BatchIcon className="w-6 h-6" />
                        <span>Batch Payment</span>
                      </div>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-auto py-4 border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl transition-all duration-300"
                      onClick={() => friends.length > 0 && fetchFriends()}
                      disabled={friends.length === 0}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <RefreshIcon className="w-6 h-6" />
                        <span>Refresh List</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Status */}
              <Card className="backdrop-blur-3xl bg-white/5 border border-white/10 shadow-xl hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white group-hover:text-cyan-300 transition-colors duration-300">Security Status</CardTitle>
                  <CardDescription className="text-gray-300">
                    Your account security information
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <ShieldIcon className="text-emerald-400" />
                        <span className="text-white">Wallet Connected</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <WalletIcon className="text-emerald-400" />
                        <span className="text-white">Sui Network</span>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                  <WalletIcon className="w-8 sm:w-10 h-8 sm:h-10 text-cyan-400" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">Connect Your Wallet</h2>
                <p className="text-sm sm:text-base text-gray-300 mb-8">
                  Connect your wallet to manage friends and make payments on the Sui blockchain
                </p>
                <ConnectButton />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Dialog */}
        {paymentDialogOpen && selectedFriend && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Send Payment</CardTitle>
                <CardDescription className="text-gray-300">
                  Send payment to {selectedFriend.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-white">Amount (SUI)</label>
                    <input
                      type="number"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white mt-1 backdrop-blur-xl"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-white">Memo</label>
                    <input
                      type="text"
                      value={paymentMemo}
                      onChange={(e) => setPaymentMemo(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white mt-1 backdrop-blur-xl"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleClosePaymentDialog}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handlePayFriend}
                  disabled={loading || !paymentAmount}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl"
                >
                  Send Payment
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* History Dialog */}
        {historyDialogOpen && selectedFriend && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Payment History</CardTitle>
                <CardDescription className="text-gray-300">
                  Payment history for {selectedFriend.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {paymentHistory.length > 0 ? (
                  <div className="space-y-4">
                    {paymentHistory.map((record, index) => (
                      <div key={index} className="backdrop-blur-3xl bg-white/5 rounded-xl border border-white/10 p-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div>
                            <p className="text-sm text-gray-400">From: {formatAddress(record.from)}</p>
                            <p className="text-sm text-gray-400">Amount: {record.amount.toFixed(2)} SUI</p>
                            <p className="text-sm text-gray-400">Memo: {record.memo}</p>
                          </div>
                          <div className="text-sm text-gray-400 text-right">
                            <p>Epoch: {record.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">No payment history found</p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleCloseHistoryDialog}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                >
                  Close
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}

        {/* Batch Payment Dialog */}
        {batchDialogOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl backdrop-blur-3xl bg-white/5 border border-white/10 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-white">Batch Payment</CardTitle>
                <CardDescription className="text-gray-300">
                  Send payments to multiple friends at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {batchPayments.map((payment, index) => (
                    <div key={index} className="flex flex-col sm:flex-row gap-4">
                      <select
                        value={payment.recipient}
                        onChange={(e) => handleBatchPaymentChange(index, 'recipient', e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
                      >
                        <option value="" className="bg-slate-900 text-white">Select Friend</option>
                        {friends.map((friend) => (
                          <option key={friend.addr} value={friend.addr} className="bg-slate-900 text-white">
                            {friend.name} ({formatAddress(friend.addr)})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Amount (SUI)"
                        value={payment.amount}
                        onChange={(e) => handleBatchPaymentChange(index, 'amount', e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white placeholder-gray-400 backdrop-blur-xl"
                      />
                      {index > 0 && (
                        <Button
                          variant="destructive"
                          size="icon"
                          onClick={() => removeBatchPaymentField(index)}
                          className="rounded-xl"
                        >
                          <DeleteIcon />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    onClick={addBatchPaymentField}
                    className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                  >
                    <AddIcon /> Add Recipient
                  </Button>
                  <div>
                    <label className="text-sm font-medium text-white">Memo</label>
                    <input
                      type="text"
                      value={batchMemo}
                      onChange={(e) => setBatchMemo(e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-white/20 bg-white/5 text-white mt-1 backdrop-blur-xl"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseBatchDialog}
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleBatchPayFriends}
                  disabled={loading || batchPayments.some(p => !p.recipient || !p.amount)}
                  className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 rounded-xl"
                >
                  Send Payments
                </Button>
              </CardFooter>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
