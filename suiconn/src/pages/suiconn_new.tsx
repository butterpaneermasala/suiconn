import { useState, useEffect, useRef } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import type { SuiParsedData } from '@mysten/sui/client';
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
import { UserIcon, FriendsIcon, PaymentIcon, SplitIcon, HistoryIcon, SendIcon, CheckIcon, CloseIcon } from '../components/icons';
import '../styles/suiconn.css';

const PACKAGE_ID = '0xb0d759fa0e301c27bee0b451b80cb9479171fe9674251eaf1d96b8a1d9693a6b';
const REGISTRY_OBJECT_ID = '0x4432099e7bdf4b607f09a28f3e7f0feaa9ee396dba779baf12b5814e23cfda11';
const USER_PROFILES_TABLE_ID = '0x6d4114ff53d3fb8352d0a40638aaccbf58b3833b06f981ceb8a544ed9dfa56f3';
const FRIEND_REQUESTS_TABLE_ID = '0xcfe84647c1b2c4a23dad88e77846552b995c417c7b0b5d8ef36fb7f112ad8610';
const SPLIT_PAYMENTS_TABLE_ID = '0x2e43a39d74678a277ec75e5557c0290b585c8cad25677f4e239b1c61c30ecc4d';
const PAYMENT_HISTORY_TABLE_ID = '0x4eb7d1fa28011028dfa5337d708dee756a6a0d84b7408e552806f0fa778e1499';
const USERNAME_REGISTRY_TABLE_ID = '0xcf30d3fdd6fb90502f3e4e06f10505485c1459d3f69ca2eeab8703fa4efd7d80';
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

export default function SuiConnApp() {
  const { signAndExecuteTransaction, account, connected, disconnect } = useWallet();
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendListId, setFriendListId] = useState<string | null>(null);
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
  
  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);

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

  // Render tab content - Now uses CSS classes
  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* User Profile Display */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Your Profile</h3>
              <div className="suiconn-stat-grid">
                <div className="suiconn-stat-card">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.username}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Username
                  </div>
                </div>
                <div className="suiconn-stat-card">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {friends.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Friends
                  </div>
                </div>
                <div className="suiconn-stat-card">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_sent}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Payments Sent
                  </div>
                </div>
                <div className="suiconn-stat-card">
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_received}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Payments Received
                  </div>
                </div>
              </div>
              <div className="suiconn-glass-card" style={{ marginTop: '20px' }}>
                <div className="suiconn-card-text">
                  <strong>Address:</strong> {formatAddress(account?.address || '')}
                </div>
                <div className="suiconn-card-text">
                  <strong>Status:</strong> {userProfile?.is_active ? 'Active' : 'Inactive'}
                </div>
                <div className="suiconn-card-text">
                  <strong>Pending Requests:</strong> {friendRequests.length}
                </div>
              </div>
            </div>

            {/* Split Payments Overview */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Recent Split Payments</h3>
              {splitPayments.length > 0 ? (
                splitPayments.slice(0, 3).map((split, index) => (
                  <div key={index} className="suiconn-glass-card" style={{ marginBottom: '10px' }}>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                      {split.title}
                    </div>
                    <div className="suiconn-card-text">
                      Total: {formatMistToSui(split.total_amount)} | 
                      Creator: {split.creatorUsername} | 
                      Status: {split.is_completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="suiconn-card-text">No split payments</div>
              )}
              {splitPayments.length > 3 && (
                <button 
                  onClick={() => setActiveTab('splits')}
                  className="suiconn-button primary small">
                  View All Split Payments
                </button>
              )}
            </div>
          </div>
        );

      case 'friends':
        return (
          <div className="space-y-6">
            {/* Send Friend Request */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Add Friend</h3>
              <input
                type="text"
                value={friendToAdd}
                onChange={(e) => setFriendToAdd(e.target.value)}
                placeholder="Enter friend's username"
                className="suiconn-input" />
              <button 
                onClick={handleSendFriendRequest} 
                disabled={loading || !friendToAdd}
                className="suiconn-button primary">
                <UserIcon />
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </div>
            
            {/* Pending Friend Requests */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Pending Requests ({friendRequests.length})</h3>
              {friendRequests.length > 0 ? (
                friendRequests.map((req, index) => (
                  <div key={index} className="suiconn-glass-card" style={{ marginBottom: '15px' }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                        {req.fromUsername}
                      </div>
                      <div className="suiconn-card-text">
                        From: {formatAddress(req.from)}
                      </div>
                      <div className="suiconn-card-text">
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, true)}
                        className="suiconn-button success small">
                        <CheckIcon />
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, false)}
                        className="suiconn-button danger small">
                        <CloseIcon />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="suiconn-card-text">No pending friend requests</div>
              )}
            </div>

            {/* Friends List (Corrected to use Friend interface properties)*/}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Your Friends ({friends.length})</h3>
              {friends.length > 0 ? (
                friends.map((friend, index) => {
                  const friendHistory = friendTransactionHistory[friend.addr] || []; // Use friend.addr
                  const totalSent = friendHistory
                    .filter(tx => tx.from === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  const totalReceived = friendHistory
                    .filter(tx => tx.to === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  
                  return (
                    <div key={index} className="suiconn-glass-card" style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                          {friend.name} {/* Use friend.name */}
                        </div>
                        <div className="suiconn-card-text">
                          {formatAddress(friend.addr)} {/* Use friend.addr */}
                        </div>
                        <div className="suiconn-card-text">
                          Sent: {formatMistToSui(totalSent)} | Received: {formatMistToSui(totalReceived)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button 
                          onClick={() => {
                            setPaymentRecipient(friend.name); // Use friend.name
                            setActiveTab('payments');
                          }}
                          className="suiconn-button primary small">
                          Pay
                        </button>
                        <button 
                          onClick={() => setSelectedFriendForHistory(friend.addr)} // Use friend.addr
                          className="suiconn-button warning small">
                          History
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="suiconn-card-text">No friends yet. Send some friend requests!</div>
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            {/* Send Payment */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Send Payment</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={paymentRecipient}
                  onChange={(e) => setPaymentRecipient(e.target.value)}
                  placeholder="Recipient username"
                  className="suiconn-input"
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button 
                  onClick={() => openFriendSelector('payment')}
                  className="suiconn-button primary small"
                  style={{ width: 'auto' }}
                  disabled={friends.length === 0}
                >
                  <FriendsIcon />
                  Select
                </button>
              </div>
              <input
                type="number"
                step="0.000000001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount in SUI (e.g., 0.001)"
                className="suiconn-input" />
              <input
                type="text"
                value={paymentMemo}
                onChange={(e) => setPaymentMemo(e.target.value)}
                placeholder="Memo (optional)"
                className="suiconn-input" />
              <button 
                onClick={handleSendPayment} 
                disabled={loading || !paymentRecipient || !paymentAmount}
                className="suiconn-button success">
                <SendIcon />
                {loading ? 'Sending...' : 'Send Payment'}
              </button>
            </div>

            {/* Batch Payment */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Batch Payment</h3>
              <button 
                onClick={() => setShowBatchPayment(true)}
                className="suiconn-button warning">
                {/* <BatchIcon /> */}
                Create Batch Payment
              </button>
              <div className="suiconn-card-text">
                Send multiple payments at once to save time and gas fees
              </div>
            </div>

            {/* Split Payments */}
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Create Split Payment</h3>
              
              {/* Split Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <div className="suiconn-card-subtitle" style={{ marginBottom: '10px' }}>Split Type:</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSplitType('equal')}
                    className={`suiconn-button ${splitType === 'equal' ? 'primary' : ''}`}
                    style={{ flex: 1 }}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    className={`suiconn-button ${splitType === 'custom' ? 'primary' : ''}`}
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
                className="suiconn-input" />

              {splitType === 'equal' ? (
                <input
                  type="number"
                  step="0.000000001"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="Total amount in SUI"
                  className="suiconn-input" />
              ) : (
                <input
                  type="text"
                  value={customSplitAmounts}
                  onChange={(e) => setCustomSplitAmounts(e.target.value)}
                  placeholder="Amounts in SUI (comma-separated, e.g., 0.1,0.2,0.3)"
                  className="suiconn-input" />
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input
                  type="text"
                  value={splitParticipants}
                  onChange={(e) => setSplitParticipants(e.target.value)}
                  placeholder="Participants (comma-separated usernames)"
                  className="suiconn-input"
                  style={{ marginBottom: 0, flex: 1 }}
                />
                <button 
                  onClick={() => openFriendSelector('split')}
                  className="suiconn-button primary small"
                  style={{ width: 'auto' }}
                  disabled={friends.length === 0}
                >
                  <FriendsIcon />
                  Select
                </button>
              </div>

              <button 
                onClick={handleCreateSplitPayment} 
                disabled={loading || !splitTitle || 
                  (splitType === 'equal' && (!splitAmount || !splitParticipants)) ||
                  (splitType === 'custom' && (!customSplitAmounts || !splitParticipants))
                }
                className="suiconn-button primary">
                <SplitIcon />
                {loading ? 'Creating...' : `Create ${splitType === 'equal' ? 'Equal' : 'Custom'} Split`}
              </button>
            </div>
          </div>
        );

      case 'splits':
        return (
          <div>
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Your Split Payments ({splitPayments.length})</h3>
              {splitPayments.length > 0 ? (
                splitPayments.map((split, index) => {
                  const userParticipant = split.participants.find(p => p.address === account?.address);
                  const isCreator = split.creator === account?.address;
                  
                  return (
                    <div key={index} className="suiconn-glass-card" style={{ marginBottom: '15px' }}>
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
                          {split.title}
                        </div>
                        <div className="suiconn-card-text">
                          <strong>Total:</strong> {formatMistToSui(split.total_amount)}
                        </div>
                        <div className="suiconn-card-text">
                          <strong>Creator:</strong> {split.creatorUsername} {isCreator && '(You)'}
                        </div>
                        <div className="suiconn-card-text">
                          <strong>Status:</strong> {split.is_completed ? 'Completed' : 'Pending'}
                        </div>

                        {/* Participants */}
                        <div className="suiconn-glass-card" style={{ marginTop: '15px' }}>
                          <div className="suiconn-card-subtitle" style={{ marginBottom: '10px' }}>Participants:</div>
                          <div className="space-y-2"> {/* Keep Tailwind class if available, otherwise move to CSS */}
                                  {split.participants.map((participant, pIndex) => (
                                    <div key={pIndex} className="flex justify-between items-center" style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.9)', lineHeight: '1.5' }}>
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
                        </div>
                        
                        {/* Action buttons */}
                        {userParticipant && !userParticipant.has_paid && !split.is_completed && (
                          <button 
                            onClick={() => handlePaySplitAmount(split.id, userParticipant.amount_owed)}
                            className="suiconn-button success">
                            {loading ? 'Paying...' : `Pay ${formatMistToSui(userParticipant.amount_owed)}`}
                          </button>
                        )}
                        
                        {userParticipant && userParticipant.has_paid && (
                          <div className="suiconn-glass-card" style={{ marginTop: '10px', background: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' }}>
                            You have paid your share
                          </div>
                        )}
                        
                        {isCreator && (
                          <div className="suiconn-glass-card" style={{ marginTop: '10px', background: 'rgba(102, 126, 234, 0.2)', color: '#667eea' }}>
                            You created this split
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="suiconn-card-text">No split payments found</div>
              )}
            </div>
          </div>
        );

      case 'history':
        return (
          <div>
            <div className="suiconn-glass-card">
              <h3 className="suiconn-card-title">Transaction History ({paymentHistory.length})</h3>
              {paymentHistory.length > 0 ? (
                paymentHistory.map((record, index) => {
                  const isOutgoing = record.from === account?.address;
                  const paymentTypeText = record.payment_type === 0 ? 'Direct Payment' : 
                                        record.payment_type === 1 ? 'Split Payment' : 'Group Payment';
                  const statusText = record.status === 0 ? 'Pending' : 
                                   record.status === 1 ? 'Completed' : 'Failed';
                  
                  return (
                    <div key={index} className="suiconn-glass-card" style={{ marginBottom: '15px', background: isOutgoing ? 'rgba(255, 193, 7, 0.1)' : 'rgba(76, 175, 80, 0.1)', border: `1px solid ${isOutgoing ? 'rgba(255, 193, 7, 0.3)' : 'rgba(76, 175, 80, 0.3)'}` }}>
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
                      <div className="suiconn-card-text">
                        {isOutgoing ? `To: ${record.toUsername}` : `From: ${record.fromUsername}`}
                      </div>
                      <div className="suiconn-card-text">
                        Amount: {formatMistToSui(record.amount)}
                      </div>
                      {record.memo && (
                        <div className="suiconn-card-text">
                          Memo: {record.memo}
                        </div>
                      )}
                      <div className="suiconn-card-text">
                        {new Date(record.timestamp).toLocaleDateString()} - {statusText}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="suiconn-card-text">No transaction history</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // The main component structure
  return (
    <div className="suiconn-container">
      {/* Background components */}
      <FloatingBubbles />
      <CoralReef />

      {/* Use the new SuiConnUI component, passing necessary props */}
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
        friendRequests={friendRequests}
        friends={friends}
        splitPayments={splitPayments}
        paymentHistory={paymentHistory}
        friendTransactionHistory={friendTransactionHistory}
        friendToAdd={friendToAdd}
        setFriendToAdd={setFriendToAdd}
        selectedFriends={selectedFriends}
        setSelectedFriends={setSelectedFriends}
        paymentRecipient={paymentRecipient}
        setPaymentRecipient={setPaymentRecipient}
        paymentAmount={paymentAmount}
        setPaymentAmount={setPaymentAmount}
        paymentMemo={paymentMemo}
        setPaymentMemo={setPaymentMemo}
        splitTitle={splitTitle}
        setSplitTitle={setSplitTitle}
        splitAmount={splitAmount}
        setSplitAmount={setSplitAmount}
        splitParticipants={splitParticipants}
        setSplitParticipants={setSplitParticipants}
        customSplitAmounts={customSplitAmounts}
        setCustomSplitAmounts={setCustomSplitAmounts}
        showFriendSelector={showFriendSelector}
        setShowFriendSelector={setShowFriendSelector}
        friendSelectorFor={friendSelectorFor}
        setFriendSelectorFor={setFriendSelectorFor}
        splitType={splitType}
        setSplitType={setSplitType}
        batchPayments={batchPayments}
        setBatchPayments={setBatchPayments}
        showBatchPayment={showBatchPayment}
        setShowBatchPayment={setShowBatchPayment}
        selectedFriendForHistory={selectedFriendForHistory}
        setSelectedFriendForHistory={setSelectedFriendForHistory}
        handleSendFriendRequest={handleSendFriendRequest}
        handleRespondToRequest={handleRespondToRequest}
        handleSendPayment={handleSendPayment}
        handleBatchPayment={handleBatchPayment}
        handleCreateSplitPayment={handleCreateSplitPayment}
        handlePaySplitAmount={handlePaySplitAmount}
        openFriendSelector={openFriendSelector}
        closeFriendSelector={closeFriendSelector}
        toggleFriendSelection={toggleFriendSelection}
        confirmFriendSelection={confirmFriendSelection}
        addBatchPaymentRow={addBatchPaymentRow}
        removeBatchPaymentRow={removeBatchPaymentRow}
        updateBatchPayment={updateBatchPayment}
        formatMistToSui={formatMistToSui}
        UserIcon={UserIcon}
        FriendsIcon={FriendsIcon}
        PaymentIcon={PaymentIcon}
        SplitIcon={SplitIcon}
        HistoryIcon={HistoryIcon}
        SendIcon={SendIcon}
        CheckIcon={CheckIcon}
        CloseIcon={CloseIcon}
      />

      {/* Status Messages */}
        {error && (
        <div className="suiconn-notification error">
            <div>
              <div style={{ fontWeight: 'medium' }}>Error</div>
              <div style={{ fontSize: 'sm' }}>{error}</div>
            </div>
          </div>
        )}
      
        {success && (
        <div className="suiconn-notification success">
            <div>
              <div style={{ fontWeight: 'medium' }}>Success</div>
              <div style={{ fontSize: 'sm' }}>{success}</div>
            </div>
          </div>
        )}
      
      {loading && (
        <div className="suiconn-notification loading">
            <div className="w-5 h-5 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin"></div>
            <div>
              <div style={{ fontWeight: 'medium' }}>Processing</div>
              <div style={{ fontSize: 'sm' }}>Transaction in progress...</div>
            </div>
          </div>
        )}
    </div>
  );
} 