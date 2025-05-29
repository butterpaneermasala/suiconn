import { useState, useEffect, useRef } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import FloatingBubbles from '../components/FloatingBubbles';
import CoralReef from '../components/CoralReef';
import { SuiConnUI } from '../components/ui/suiconn-ui';
import type {
  UserProfile,
  FriendRequest,
  Friend,
  SplitPayment,
  SplitParticipant,
  PaymentRecord,
  BatchPayment
} from '../types';
import { Card, CardTitle } from '../components/ui/card';

const PACKAGE_ID = '0xb0d759fa0e301c27bee0b451b80cb9479171fe9674251eaf1d96b8a1d9693a6b';
const REGISTRY_OBJECT_ID = '0x4432099e7bdf4b607f09a28f3e7f0feaa9ee396dba779baf12b5814e23cfda11';
const USER_PROFILES_TABLE_ID = '0x6d4114ff53d3fb8352d0a40638aaccbf58b3833b06f981ceb8a544ed9dfa56f3';
const FRIEND_REQUESTS_TABLE_ID = '0xcfe84647c1b2c4a23dad88e77846552b995c417c7b0b5d8ef36fb7f112ad8610';
const SPLIT_PAYMENTS_TABLE_ID = '0x2e43a39d74678a277ec75e5557c0290b585c8cad25677f4e239b1c61c30ecc4d';
const PAYMENT_HISTORY_TABLE_ID = '0x4eb7d1fa28011028dfa5337d708dee756a6a0d84b7408e552806f0fa778e1499';
const USERNAME_REGISTRY_TABLE_ID = '0xcf30d3fdd6fb90502f3e4e06f10505485c1459d3f69ca2eeab8703fa4efd7d80';
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

// Underwater overlay component
const UnderwaterOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-40">
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-purple-950/40 mix-blend-overlay"></div>
    <div className="absolute inset-0" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      opacity: 0.3,
    }}></div>
  </div>
);

export default function SuiConnApp() {
  const { signAndExecuteTransaction, account, connected, disconnect } = useWallet();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [showBatchPayment, setShowBatchPayment] = useState(false);
  const [selectedFriendForHistory, setSelectedFriendForHistory] = useState<string | null>(null);
  const [friendTransactionHistory, setFriendTransactionHistory] = useState<Record<string, PaymentRecord[]>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSelectorFor, setFriendSelectorFor] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [batchPayments, setBatchPayments] = useState<BatchPayment[]>([{ recipients: [''], amounts: [''], memos: [''] }]);

  // Form states
  const [friendToAdd, setFriendToAdd] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [splitTitle, setSplitTitle] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitParticipants, setSplitParticipants] = useState('');
  const [customSplitAmounts, setCustomSplitAmounts] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);

  // Helper function to get username from address
  const getUsernameFromAddress = async (address: string): Promise<string> => {
    try {
      const entry = await suiClient.getDynamicFieldObject({
        parentId: USER_PROFILES_TABLE_ID,
        name: {
          type: 'address',
          value: address
        }
      });

      if (entry.data?.content?.dataType === 'moveObject') {
        const fields = entry.data.content.fields as any;
        return fields.value.fields.username || address.slice(0, 6) + '...';
      }
      return address.slice(0, 6) + '...';
    } catch {
      return address.slice(0, 6) + '...';
    }
  };

  // Check if user is registered
  const checkRegistered = async (address: string): Promise<boolean> => {
    try {
      const entry = await suiClient.getDynamicFieldObject({
        parentId: USER_PROFILES_TABLE_ID,
        name: {
          type: 'address',
          value: address
        }
      });
      
      return entry.data?.content !== null;
    } catch (err) {
      return false;
    }
  };

  // Fetch user profile
  const fetchUserProfile = async () => {
    if (!account?.address) return;
    setLoading(true);
    
    try {
      const entry = await suiClient.getDynamicFieldObject({
        parentId: USER_PROFILES_TABLE_ID,
        name: {
          type: 'address',
          value: account.address
        }
      });

      if (entry.data?.content?.dataType === 'moveObject') {
        const fields = entry.data.content.fields as any;
        const profileData = fields.value.fields;

        const profile = {
          username: profileData.username || '',
          address: account.address,
          friends: profileData.friends || [],
          groups: profileData.groups || [],
          created_at: parseInt(profileData.created_at) || 0,
          is_active: profileData.is_active || false,
          last_payment_time: parseInt(profileData.last_payment_time) || 0,
          daily_payment_count: parseInt(profileData.daily_payment_count) || 0,
          last_friend_request_time: parseInt(profileData.last_friend_request_time) || 0,
          total_payments_sent: parseInt(profileData.total_payments_sent) || 0,
          total_payments_received: parseInt(profileData.total_payments_received) || 0,
        };
        
        setUserProfile(profile);
        setUsername(profile.username);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history
  const fetchTransactionHistory = async () => {
    if (!account?.address) return;
    try {
      const entry = await suiClient.getDynamicFieldObject({
        parentId: PAYMENT_HISTORY_TABLE_ID,
        name: {
          type: 'address',
          value: account.address
        }
      });

      if (entry.data?.content?.dataType === 'moveObject') {
        const fields = entry.data.content.fields as any;
        const historyArray = fields.value || [];
        
        const historyWithUsernames = await Promise.all(
          historyArray.map(async (record: any) => ({
            id: record.fields.id,
            from: record.fields.from,
            to: record.fields.to,
            amount: parseInt(record.fields.amount),
            memo: record.fields.memo,
            payment_type: record.fields.payment_type,
            related_id: record.fields.related_id,
            timestamp: parseInt(record.fields.timestamp),
            status: record.fields.status,
            fromUsername: await getUsernameFromAddress(record.fields.from),
            toUsername: await getUsernameFromAddress(record.fields.to)
          }))
        );
        
        historyWithUsernames.sort((a, b) => b.timestamp - a.timestamp);
        setPaymentHistory(historyWithUsernames);
        
        // Group by friends for individual friend history
        const friendHistory: {[key: string]: PaymentRecord[]} = {};
        historyWithUsernames.forEach(record => {
          const friendAddress = record.from === account.address ? record.to : record.from;
          if (!friendHistory[friendAddress]) {
            friendHistory[friendAddress] = [];
          }
          friendHistory[friendAddress].push(record);
        });
        setFriendTransactionHistory(friendHistory);
      }
    } catch (err) {
      console.error('Failed to load transaction history:', err);
      setPaymentHistory([]);
      setFriendTransactionHistory({});
    }
  };

  // Fetch split payments
  const fetchSplitPayments = async () => {
    if (!account?.address) return;
    try {
      const splitPaymentsData = await suiClient.getDynamicFields({
        parentId: SPLIT_PAYMENTS_TABLE_ID
      });

      const userSplitPayments: SplitPayment[] = [];

      for (const splitData of splitPaymentsData.data) {
        try {
          const splitEntry = await suiClient.getDynamicFieldObject({
            parentId: SPLIT_PAYMENTS_TABLE_ID,
            name: splitData.name
          });

          if (splitEntry.data?.content?.dataType === 'moveObject') {
            const fields = splitEntry.data.content.fields as any;
            const splitPayment = fields.value.fields;

            const isCreator = splitPayment.creator === account.address;
            const isParticipant = splitPayment.participants.some((p: any) => 
              p.fields.address === account.address
            );

            if (isCreator || isParticipant) {
              const participantsWithUsernames = await Promise.all(
                splitPayment.participants.map(async (p: any) => ({
                  address: p.fields.address,
                  amount_owed: parseInt(p.fields.amount_owed),
                  amount_paid: parseInt(p.fields.amount_paid),
                  has_paid: p.fields.has_paid,
                  username: await getUsernameFromAddress(p.fields.address)
                }))
              );

              userSplitPayments.push({
                id: splitPayment.id,
                creator: splitPayment.creator,
                title: splitPayment.title,
                total_amount: parseInt(splitPayment.total_amount),
                participants: participantsWithUsernames,
                created_at: parseInt(splitPayment.created_at),
                is_completed: splitPayment.is_completed,
                creatorUsername: await getUsernameFromAddress(splitPayment.creator)
              });
            }
          }
    } catch (err) {
          console.error('Error fetching split payment:', err);
        }
      }

      setSplitPayments(userSplitPayments);
    } catch (err) {
      console.error('Failed to load split payments:', err);
      setSplitPayments([]);
    }
  };

  // Fetch friend requests with usernames (only pending ones)
  const fetchFriendRequestsWithUsernames = async () => {
    if (!account?.address) return;
    try {
      const entry = await suiClient.getDynamicFieldObject({ 
        parentId: FRIEND_REQUESTS_TABLE_ID,
        name: { 
          type: 'address',
          value: account.address
        }
      });

      if (entry.data?.content?.dataType === 'moveObject') {
        const fields = entry.data.content.fields as any;
        const requestsArray = fields.value; 
        
        const pendingRequests = await Promise.all(
          requestsArray
            .filter((req: any) => req.fields.status === 0) 
            .map(async (req: any) => ({
              id: req.fields.id,
              from: req.fields.from,
              to: req.fields.to,
              status: req.fields.status,
              created_at: parseInt(req.fields.created_at),
              updated_at: parseInt(req.fields.updated_at),
              fromUsername: await getUsernameFromAddress(req.fields.from)
            }))
        );
        
        setFriendRequests(pendingRequests);
      }
    } catch (err) {
      setFriendRequests([]);
    }
  };

  // Fetch friends list with usernames (Corrected to match Friend interface)
  const fetchFriendsList = async () => {
    if (!userProfile?.friends || userProfile.friends.length === 0) {
      setFriends([]);
      return;
    }
    
    try {
      const friendsWithUsernames: Friend[] = await Promise.all(
        userProfile.friends.map(async (friendAddress: string) => ({
          addr: friendAddress, // Use 'addr' to match Friend interface
          name: await getUsernameFromAddress(friendAddress) // Use 'name' to match Friend interface
        }))
      );
      
      setFriends(friendsWithUsernames);
    } catch (err) {
      setFriends([]);
    }
  };

  // Enhanced useEffect
  useEffect(() => {
    if (connected && account?.address) {
      checkRegistered(account.address).then(isRegistered => {
        if (isRegistered) {
          fetchUserProfile();
          fetchFriendRequestsWithUsernames();
          fetchSplitPayments();
          fetchTransactionHistory();
        } else {
          setUserProfile(null);
        }
      });
    } else {
      setUserProfile(null);
      setFriendRequests([]);
      setFriends([]);
      setSplitPayments([]);
      setPaymentHistory([]);
      setFriendTransactionHistory({});
    }
  }, [connected, account?.address]);

  // Fetch friends list when user profile changes
  useEffect(() => {
    if (userProfile?.friends && userProfile.friends.length > 0) {
      fetchFriendsList();
    } else {
      setFriends([]);
    }
  }, [userProfile]);

  // Contract interaction functions
  const executeTransaction = async (txFunction: (tx: Transaction) => void, successMessage: string) => {
    if (!account?.address) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      const tx = new Transaction();
      tx.setGasBudget(100000000);
      txFunction(tx);
      
      const result = await signAndExecuteTransaction({ transaction: tx });
      setSuccess(successMessage);
      
      setTimeout(() => {
        fetchUserProfile();
        fetchFriendRequestsWithUsernames();
        fetchSplitPayments();
        fetchTransactionHistory();
      }, 3000);
    } catch (err) {
      setError('Transaction failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Friend selector functions
  const openFriendSelector = (purpose: string) => {
    setFriendSelectorFor(purpose);
    setShowFriendSelector(true);
    setSelectedFriends([]);
  };

  const closeFriendSelector = () => {
    setShowFriendSelector(false);
    setSelectedFriends([]);
  };

  const toggleFriendSelection = (friendUsername: string) => {
    setSelectedFriends(prev => 
      prev.includes(friendUsername)
        ? prev.filter(f => f !== friendUsername)
        : [...prev, friendUsername]
    );
  };

  const confirmFriendSelection = () => {
    if (friendSelectorFor === 'split') {
      setSplitParticipants(selectedFriends.join(', '));
    } else if (friendSelectorFor === 'payment') {
      if (selectedFriends.length === 1) {
        setPaymentRecipient(selectedFriends[0]);
      }
    } else if (friendSelectorFor === 'batch') {
      const newBatch = selectedFriends.map(friend => ({
        recipients: [friend],
        amounts: [''],
        memos: ['']
      }));
      setBatchPayments(newBatch);
    }
    closeFriendSelector();
  };

  // Dialog handlers
  const handleOpenPaymentDialog = (friend: Friend) => {
    setSelectedFriend(friend);
    setPaymentRecipient(friend.name);
    setPaymentDialogOpen(true);
  };

  const handleOpenHistoryDialog = async (friend: Friend) => {
    setSelectedFriend(friend);
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
  };

  // Batch payment functions
  const addBatchPaymentRow = () => {
    setBatchPayments([...batchPayments, { recipients: [''], amounts: [''], memos: [''] }]);
  };

  const removeBatchPaymentRow = (index: number) => {
    if (batchPayments.length > 1) {
      setBatchPayments(batchPayments.filter((_, i) => i !== index));
    }
  };

  const updateBatchPayment = (index: number, field: keyof BatchPayment, value: string[]) => {
    const updated = [...batchPayments];
    updated[index] = { ...updated[index], [field]: value };
    setBatchPayments(updated);
  };

  // Contract functions
  const handleRegister = () => {
    executeTransaction((tx) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::register_user`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.string(username),
          tx.object('0x6'),
        ],
      });
    }, 'User registered successfully!');
  };

  const handleSendFriendRequest = () => {
    executeTransaction((tx) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::send_friend_request`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.string(friendToAdd),
          tx.object('0x6'),
        ],
      });
    }, 'Friend request sent!');
  };

  const handleRespondToRequest = (requestId: string, accept: boolean) => {
    executeTransaction((tx) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::respond_to_friend_request`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.id(requestId),
          tx.pure.bool(accept),
          tx.object('0x6'),
        ],
      });
    }, `Friend request ${accept ? 'accepted' : 'rejected'}!`);
  };

  const convertSuiToMist = (suiAmount: string): number => {
    const sui = parseFloat(suiAmount);
    return Math.floor(sui * 1_000_000_000);
  };

  const formatMistToSui = (mistAmount: number): string => {
    return (mistAmount / 1_000_000_000).toFixed(9) + ' SUI';
  };

  const handleSendPayment = () => {
    executeTransaction((tx) => {
      const amountInMist = convertSuiToMist(paymentAmount);
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::send_payment`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.string(paymentRecipient),
          tx.pure.u64(amountInMist),
          tx.pure.string(paymentMemo),
          coin,
          tx.object('0x6'),
        ],
      });
    }, 'Payment sent successfully!');
  };

  // Batch payment execution
  const handleBatchPayment = () => {
    const validPayments = batchPayments.filter(payment => 
      payment.recipients[0] && payment.amounts[0] && parseFloat(payment.amounts[0]) > 0
    );

    if (validPayments.length === 0) {
      setError('Please add at least one valid payment');
      return;
    }

    executeTransaction((tx) => {
      validPayments.forEach(payment => {
        const amountInMist = convertSuiToMist(payment.amounts[0]);
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
        tx.moveCall({
          target: `${PACKAGE_ID}::suiconn::send_payment`,
          arguments: [
            tx.object(REGISTRY_OBJECT_ID),
            tx.pure.string(payment.recipients[0]),
            tx.pure.u64(amountInMist),
            tx.pure.string(payment.memos[0] || 'Batch payment'),
            coin,
            tx.object('0x6'),
          ],
        });
      });
    }, `Batch payment sent to ${validPayments.length} recipients!`);
  };

  // Enhanced split payment creation with type selection
  const handleCreateSplitPayment = () => {
    const participants = splitParticipants.split(',').map(p => p.trim()).filter(p => p);
    
    if (splitType === 'equal') {
      const amountInMist = convertSuiToMist(splitAmount);
      executeTransaction((tx) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::create_split_payment`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.string(splitTitle),
            tx.pure.u64(amountInMist),
            tx.pure.vector('string', participants),
            tx.pure.option('id', null),
          tx.object('0x6'),
        ],
      });
      }, 'Equal split payment created!');
    } else { // Custom split
      const amounts = customSplitAmounts.split(',').map(a => convertSuiToMist(a.trim())).filter(a => a > 0);
      
      if (participants.length !== amounts.length) {
        setError('Number of participants must match number of amounts');
        return;
      }

      executeTransaction((tx) => {
        tx.moveCall({
          target: `${PACKAGE_ID}::suiconn::create_custom_split_payment`,
          arguments: [
            tx.object(REGISTRY_OBJECT_ID),
            tx.pure.string(splitTitle),
            tx.pure.vector('string', participants),
            tx.pure.vector('u64', amounts),
            tx.pure.option('id', null),
            tx.object('0x6'),
          ],
        });
      }, 'Custom split payment created!');
    }
  };

  const handlePaySplitAmount = (splitPaymentId: string, amountOwed: number) => {
    executeTransaction((tx) => {
      const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountOwed)]);
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::pay_split_amount`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
          tx.pure.id(splitPaymentId),
          coin,
          tx.object('0x6'),
        ],
      });
    }, 'Split payment contribution made!');
  };

  // Auto-dismiss messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* User Profile Display */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Your Profile</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center shadow-md">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.username}
                  </div>
                  <div className="text-sm text-gray-300">
                    Username
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center shadow-md">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {friends.length}
                  </div>
                  <div className="text-sm text-gray-300">
                    Friends
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center shadow-md">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_sent}
                  </div>
                  <div className="text-sm text-gray-300">
                    Payments Sent
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 text-center shadow-md">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_received}
                  </div>
                  <div className="text-sm text-gray-300">
                    Payments Received
                  </div>
                </Card>
              </div>
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mt-6">
                <div className="text-sm text-gray-300">
                  <strong>Address:</strong> {formatAddress(account?.address || '')}
                </div>
                <div className="text-sm text-gray-300">
                  <strong>Status:</strong> {userProfile?.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="text-sm text-gray-300">
                  <strong>Pending Requests:</strong> {friendRequests.length}
                </div>
              </Card>
            </Card>

            {/* Split Payments Overview */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Recent Split Payments</CardTitle>
              {splitPayments.length > 0 ? (
                splitPayments.slice(0, 3).map((split, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                      {split.title}
                    </div>
                    <div className="text-sm text-gray-300">
                      Total: {formatMistToSui(split.total_amount)} | 
                      Creator: {split.creatorUsername} | 
                      Status: {split.is_completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-300">No split payments</div>
              )}
              {splitPayments.length > 3 && (
                <button
                  onClick={() => setActiveTab('splits')}
                  className="px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 mt-4">
                  View All Split Payments
                </button>
              )}
            </Card>
          </div>
        );

      case 'friends':
        return (
          <div className="space-y-6">
            {/* Send Friend Request */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Add Friend</CardTitle>
              <input
                type="text"
                value={friendToAdd}
                onChange={(e) => setFriendToAdd(e.target.value)}
                placeholder="Enter friend's username"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
              />
              <button
                onClick={handleSendFriendRequest}
                disabled={loading || !friendToAdd}
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 w-full">
                <svg
                  className="inline-block mr-2 w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </Card>

            {/* Pending Friend Requests */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Pending Requests ({friendRequests.length})</CardTitle>
              {friendRequests.length > 0 ? (
                friendRequests.map((req, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                        {req.fromUsername}
                      </div>
                      <div className="text-sm text-gray-300">
                        From: {formatAddress(req.from)}
                      </div>
                      <div className="text-sm text-gray-300">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, true)}
                        className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500">
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, false)}
                        className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-500/30 border-rose-500">
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-300">No pending friend requests</div>
              )}
            </Card>

            {/* Friends List */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Your Friends ({friends.length})</CardTitle>
              {friends.length > 0 ? (
                friends.map((friend, index) => {
                  const friendHistory = friendTransactionHistory[friend.addr] || [];
                  const totalSent = friendHistory
                    .filter(tx => tx.from === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  const totalReceived = friendHistory
                    .filter(tx => tx.to === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  
                  return (
                    <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                          {friend.name}
                        </div>
                        <div className="text-sm text-gray-300">
                          {formatAddress(friend.addr)}
                        </div>
                        <div className="text-sm text-gray-300">
                          Sent: {formatMistToSui(totalSent)} | Received: {formatMistToSui(totalReceived)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button 
                          onClick={() => handleOpenPaymentDialog(friend)}
                          className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500">
                          Pay
                        </button>
                        <button 
                          onClick={() => handleOpenHistoryDialog(friend)}
                          className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/30 border-amber-500">
                          History
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-300">No friends yet. Send some friend requests!</div>
              )}
            </Card>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            {/* Send Payment */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Send Payment</CardTitle>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={paymentRecipient}
                  onChange={(e) => setPaymentRecipient(e.target.value)}
                  placeholder="Recipient username"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button 
                  onClick={() => openFriendSelector('payment')}
                  className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500"
                  style={{ width: 'auto' }}
                  disabled={friends.length === 0}
                >
                  <svg
                    className="inline-block mr-2 w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Select
                </button>
              </div>
              <input
                type="number"
                step="0.000000001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount in SUI (e.g., 0.001)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
              />
              <input
                type="text"
                value={paymentMemo}
                onChange={(e) => setPaymentMemo(e.target.value)}
                placeholder="Memo (optional)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
              />
              <button 
                onClick={handleSendPayment} 
                disabled={loading || !paymentRecipient || !paymentAmount}
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 w-full">
                <svg
                  className="inline-block mr-2 w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {loading ? 'Sending...' : 'Send Payment'}
              </button>
            </Card>

            {/* Batch Payment */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Batch Payment</CardTitle>
              <button 
                onClick={() => setShowBatchPayment(true)}
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/30 border-amber-500 w-full">
                Create Batch Payment
              </button>
              <div className="text-sm text-gray-300">
                Send multiple payments at once to save time and gas fees
              </div>
            </Card>

            {/* Split Payments */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Create Split Payment</CardTitle>
              
              {/* Split Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <div className="text-sm font-medium text-white/90 mb-2">Split Type:</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSplitType('equal')}
                    className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${splitType === 'equal' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-cyan-500 hover:text-white'}`}
                    style={{ flex: 1 }}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    className={`px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 ${splitType === 'custom' ? 'bg-cyan-500 text-white' : 'bg-white/10 text-gray-300 hover:bg-cyan-500 hover:text-white'}`}
                    style={{ flex: 1 }}
                  >
                    Custom Split
                  </button>
                </div>
              </div>

              <input
                type="text"
                value={splitTitle}
                onChange={(e) => setSplitTitle(e.target.value)}
                placeholder="Split title (e.g., Dinner bill)"
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
              />

              {splitType === 'equal' ? (
                <input
                  type="number"
                  step="0.000000001"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="Total amount in SUI"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                />
              ) : (
                <input
                  type="text"
                  value={customSplitAmounts}
                  onChange={(e) => setCustomSplitAmounts(e.target.value)}
                  placeholder="Amounts in SUI (comma-separated, e.g., 0.1,0.2,0.3)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                />
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={splitParticipants}
                  onChange={(e) => setSplitParticipants(e.target.value)}
                  placeholder="Participants (comma-separated usernames)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button 
                  onClick={() => openFriendSelector('split')}
                  className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500"
                  style={{ width: 'auto' }}
                  disabled={friends.length === 0}
                >
                  <svg
                    className="inline-block mr-2 w-5 h-5"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  Select
                </button>
              </div>

              <button 
                onClick={handleCreateSplitPayment}
                disabled={loading || !splitTitle || 
                  (splitType === 'equal' && (!splitAmount || !splitParticipants)) ||
                  (splitType === 'custom' && (!customSplitAmounts || !splitParticipants))
                }
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 w-full">
                <svg
                  className="inline-block mr-2 w-5 h-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2v20M2 12h20" />
                  <path d="M12 2l10 10M12 2L2 12" />
                </svg>
                {loading ? 'Creating...' : `Create ${splitType === 'equal' ? 'Equal' : 'Custom'} Split`}
              </button>
            </Card>
          </div>
        );

      case 'splits':
        return (
          <div>
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Your Split Payments ({splitPayments.length})</CardTitle>
              {splitPayments.length > 0 ? (
                splitPayments.map((split, index) => {
                  const userParticipant = split.participants.find(p => p.address === account?.address);
                  const isCreator = split.creator === account?.address;
                  
                  return (
                    <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
                          {split.title}
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Total:</strong> {formatMistToSui(split.total_amount)}
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Creator:</strong> {split.creatorUsername} {isCreator && '(You)'}
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Status:</strong> {split.is_completed ? 'Completed' : 'Pending'}
                        </div>

                        {/* Participants */}
                        <div className="text-sm text-gray-300 mt-2">
                          Participants:
                        </div>
                        <div className="space-y-2">
                          {split.participants.map((participant, pIndex) => (
                            <div key={pIndex} className="flex justify-between items-center">
                              <span>
                                {participant.username}: {formatMistToSui(participant.amount_owed)}
                                {participant.address === account?.address && ' (You)'}
                              </span>
                              <span style={{ 
                                fontSize: '12px',
                                color: participant.has_paid ? '#4CAF50' : '#FF9800'
                              }}>
                                {participant.has_paid ? 'Paid' : 'Pending'}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Action buttons */}
                        {userParticipant && !userParticipant.has_paid && !split.is_completed && (
                          <button 
                            onClick={() => handlePaySplitAmount(split.id, userParticipant.amount_owed)}
                            className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 mt-4">
                            {loading ? 'Paying...' : `Pay ${formatMistToSui(userParticipant.amount_owed)}`}
                          </button>
                        )}
                        
                        {userParticipant && userParticipant.has_paid && (
                          <div className="text-sm text-gray-300 mt-2">
                            You have paid your share
                          </div>
                        )}
                        
                        {isCreator && (
                          <div className="text-sm text-gray-300 mt-2">
                            You created this split
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-300">No split payments found</div>
              )}
            </Card>
          </div>
        );

      case 'history':
        return (
          <div>
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Transaction History ({paymentHistory.length})</CardTitle>
              {paymentHistory.length > 0 ? (
                paymentHistory.map((record, index) => {
                  const isOutgoing = record.from === account?.address;
                  const paymentTypeText = record.payment_type === 0 ? 'Direct Payment' : 
                                        record.payment_type === 1 ? 'Split Payment' : 'Group Payment';
                  const statusText = record.status === 0 ? 'Pending' : 
                                   record.status === 1 ? 'Completed' : 'Failed';
                  
                  return (
                    <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                      <div style={{ 
                        fontWeight: '600', 
                        color: '#fff', 
                        marginBottom: '5px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}>
                        {isOutgoing ? 'Sent' : 'Received'} - {paymentTypeText}
                      </div>
                      <div className="text-sm text-gray-300">
                        {isOutgoing ? `To: ${record.toUsername}` : `From: ${record.fromUsername}`}
                      </div>
                      <div className="text-sm text-gray-300">
                        Amount: {formatMistToSui(record.amount)}
                      </div>
                      {record.memo && (
                        <div className="text-sm text-gray-300">
                          Memo: {record.memo}
                        </div>
                      )}
                      <div className="text-sm text-gray-300">
                        {new Date(record.timestamp).toLocaleDateString()} - {statusText}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-300">No transaction history</div>
              )}
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  // Add dialog content
  const renderPaymentDialog = () => {
    if (!selectedFriend || !paymentDialogOpen) return null;
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg max-w-md w-full mx-4">
          <CardTitle className="text-xl font-bold text-white mb-4">Send Payment to {selectedFriend.name}</CardTitle>
          <input
            type="number"
            step="0.000000001"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Amount in SUI"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
          />
          <input
            type="text"
            value={paymentMemo}
            onChange={(e) => setPaymentMemo(e.target.value)}
            placeholder="Memo (optional)"
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
          />
          <div className="flex gap-3">
            <button
              onClick={handleSendPayment}
              disabled={loading || !paymentAmount}
              className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 flex-1">
              {loading ? 'Sending...' : 'Send Payment'}
            </button>
            <button
              onClick={handleClosePaymentDialog}
              className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-500/30 border-rose-500 flex-1">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderHistoryDialog = () => {
    if (!selectedFriend || !historyDialogOpen) return null;
    
    const friendHistory = friendTransactionHistory[selectedFriend.addr] || [];
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <CardTitle className="text-xl font-bold text-white mb-4">Transaction History with {selectedFriend.name}</CardTitle>
          {friendHistory.length > 0 ? (
            friendHistory.map((record, index) => {
              const isOutgoing = record.from === account?.address;
              return (
                <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-3">
                  <div className="font-medium text-white mb-1">
                    {isOutgoing ? 'Sent' : 'Received'} - {formatMistToSui(record.amount)}
                  </div>
                  <div className="text-sm text-gray-300">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </div>
                  {record.memo && (
                    <div className="text-sm text-gray-300 mt-1">
                      Memo: {record.memo}
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="text-white/70 text-center py-4">No transactions found</div>
          )}
          <button
            onClick={handleCloseHistoryDialog}
            className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 w-full mt-4">
            Close
          </button>
        </div>
      </div>
    );
  };

  // The main component structure
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
      {/* Background components */}
      <UnderwaterOverlay />
      <CoralReef />

      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-32 w-80 h-80 bg-gradient-to-r from-purple-400/15 to-pink-600/15 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-50">
        {/* Use the new SuiConnUI component, passing only the defined props */}
        <SuiConnUI
          userProfile={userProfile}
          username={username}
          loading={loading}
          onRegister={handleRegister}
          onUsernameChange={setUsername}
          onDisconnect={disconnect}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          renderTabContent={renderTabContent}
        />

        {/* Status Messages */}
        {error && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-500/90 backdrop-blur-lg text-white px-6 py-3 rounded-2xl shadow-lg border border-red-400/30 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-300 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium">Error</div>
                <div className="text-sm opacity-90">{error}</div>
              </div>
            </div>
          </div>
        )}
        
        {success && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-500/90 backdrop-blur-lg text-white px-6 py-3 rounded-2xl shadow-lg border border-green-400/30 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
              <div>
                <div className="font-medium">Success</div>
                <div className="text-sm opacity-90">{success}</div>
              </div>
            </div>
          </div>
        )}
        
        {loading && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500/90 backdrop-blur-lg text-white px-6 py-3 rounded-2xl shadow-lg border border-blue-400/30 animate-fade-in-up">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-300/30 border-t-blue-300 rounded-full animate-spin"></div>
              <div>
                <div className="font-medium">Processing</div>
                <div className="text-sm opacity-90">Transaction in progress...</div>
              </div>
            </div>
          </div>
        )}

        {/* Add dialogs */}
        {renderPaymentDialog()}
        {renderHistoryDialog()}
      </div>

      {/* Friend selector component (rendered outside the main UI) */}
      {showFriendSelector && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg max-w-md w-full mx-4">
            <CardTitle className="text-xl font-bold text-white mb-4">Select Friends</CardTitle>
            <div className="max-h-64 overflow-y-auto space-y-2 mb-4">
              {friends.length > 0 ? (
                friends.map((friend) => (
                  <div
                    key={friend.addr}
                    onClick={() => toggleFriendSelection(friend.name)}
                    className={`p-3 rounded-xl cursor-pointer transition-colors duration-150 ${
                      selectedFriends.includes(friend.name) ? 'bg-cyan-500/30 border border-cyan-400/50' : 'bg-white/5 border border-white/10'
                    }`}
                  >
                    {friend.name}
                  </div>
                ))
              ) : (
                <div className="text-white/70 text-center">No friends available.</div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={confirmFriendSelection} className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 flex-1">
                Confirm Selection
              </button>
              <button onClick={closeFriendSelector} className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-500/30 border-rose-500 flex-1">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Update the styles at the bottom of the file to add glowing/bright effects
const styles = `
  @keyframes fade-in-up {
    from {
      opacity: 0;
      transform: translate(-50%, 1rem);
    }
    to {
      opacity: 1;
      transform: translate(-50%, 0);
    }
  }

  .animate-fade-in-up {
    animation: fade-in-up 0.3s ease-out;
  }

  .suiconn-input {
    @apply w-full px-4 py-3 bg-white/15 border border-indigo-300/60 rounded-xl text-white placeholder-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-300/80 focus:border-transparent transition-all duration-200;
  }

  .suiconn-button {
    @apply px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border;
  }

  .suiconn-button.primary {
    @apply bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/50 border-cyan-500;
  }

  .suiconn-button.success {
    @apply bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-400 hover:to-teal-500 shadow-lg shadow-emerald-500/50 border-emerald-500;
  }

  .suiconn-button.warning {
    @apply bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:from-amber-400 hover:to-orange-500 shadow-lg shadow-amber-500/50 border-amber-500;
  }

  .suiconn-button.danger {
    @apply bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-400 hover:to-pink-500 shadow-lg shadow-rose-500/50 border-rose-500;
  }

  .suiconn-button.small {
    @apply px-3 py-2 text-sm;
  }

  .suiconn-glass-card {
    @apply backdrop-blur-xl bg-white/10 border border-indigo-400/30 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 shadow-indigo-500/20;
  }

  .suiconn-card-title {
    @apply text-xl font-bold text-white mb-4;
  }

  .suiconn-card-subtitle {
    @apply text-sm font-medium text-white/90 mb-2;
  }

  .suiconn-card-text {
    @apply text-sm text-white/80;
  }

  .suiconn-stat-grid {
    @apply grid grid-cols-2 sm:grid-cols-4 gap-4;
  }

  .suiconn-stat-card {
    @apply backdrop-blur-xl bg-white/15 border border-indigo-400/40 rounded-xl p-4 text-center hover:bg-white/20 transition-all duration-200 shadow-indigo-500/20;
  }

  .suiconn-notification {
    @apply fixed bottom-4 left-1/2 transform -translate-x-1/2 backdrop-blur-lg text-white px-6 py-3 rounded-2xl shadow-lg border transition-all duration-200;
  }

  .suiconn-notification.error {
    @apply bg-rose-500/90 border-rose-400/30 shadow-rose-500/40;
  }

  .suiconn-notification.success {
    @apply bg-emerald-500/90 border-emerald-400/30 shadow-emerald-500/40;
  }

  .suiconn-notification.loading {
    @apply bg-indigo-500/90 border-indigo-400/30 shadow-indigo-500/40;
  }

  /* Dialog styles */
  .suiconn-dialog {
    @apply fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50;
  }

  .suiconn-dialog-content {
    @apply suiconn-glass-card max-w-md w-full mx-4;
  }

  /* Friend selector styles */
  .suiconn-friend-selector {
    @apply p-3 rounded-xl cursor-pointer transition-colors duration-150;
  }

  .suiconn-friend-selector.selected {
    @apply bg-indigo-500/50 border border-indigo-400/70 shadow-indigo-500/30;
  }

  .suiconn-friend-selector:not(.selected) {
    @apply bg-white/15 border border-white/25;
  }

  /* Tab styles */
  .suiconn-tab {
    @apply px-4 py-2 transition-colors duration-200;
  }

  .suiconn-tab.active {
    @apply text-cyan-300 border-b-2 border-cyan-300;
  }

  .suiconn-tab:not(.active) {
    @apply text-white/80 hover:text-cyan-300;
  }

  /* Transaction history styles */
  .suiconn-transaction {
    @apply suiconn-glass-card mb-3;
  }

  .suiconn-transaction.sent {
    @apply bg-amber-500/20 border-amber-500/40 shadow-amber-500/20;
  }

  .suiconn-transaction.received {
    @apply bg-emerald-500/20 border-emerald-500/40 shadow-emerald-500/20;
  }
`;