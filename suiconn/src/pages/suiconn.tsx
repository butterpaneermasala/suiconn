import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";
import { formatAddress } from "@mysten/sui/utils";
import { MIST_PER_SUI } from '@mysten/sui/utils';

import CoralReef from '../components/CoralReef';
import { SuiConnUI } from '../components/ui/suiconn-ui';
import type {
  UserProfile,
  FriendRequest,
  Friend,
  SplitPayment,
  PaymentRecord,
  BatchPaymentItem
} from '../types';
import { Card, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';

const PACKAGE_ID = '0x7f9abdd86213586f0eba4337f37e5073276340e8e60556ef44df70710b6d8a5d';
const REGISTRY_OBJECT_ID = '0x3253ee9cce59c10d5f9baebeac6421d9bb352ec646eea0c6d3ecb67fbeb52d7d';
const ACCESS_CONTROL_ID = '0x632fc800de54d66d0acba91781dd8c6ce6c3a5493d731c4ab5493c964b2b791e';
const USER_PROFILES_TABLE_ID = '0x1cd47e4cd1396e3e2e2ad1f0a78584eada28f9839765f91eef6f4bdc63127968';
const FRIEND_REQUESTS_TABLE_ID = '0x08d4b05af1a29ef4382b5bb39142ab8dc2d80b945c183981ecb8c29d01a8c528';
const PAYMENT_HISTORY_TABLE_ID = '0x1d4a0809c5cace89bee87188e4140deeca8f4571744537184afc187ab53e7038';
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

const UnderwaterOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-40">
    <div className="absolute inset-0 bg-gradient-to-b from-indigo-900/30 to-purple-950/40 mix-blend-overlay"></div>
    <div className="absolute inset-0" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
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

  const [friendTransactionHistory, setFriendTransactionHistory] = useState<Record<string, PaymentRecord[]>>({});
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSelectorFor, setFriendSelectorFor] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [batchPayments, setBatchPayments] = useState<BatchPaymentItem[]>([]);

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
  const [splitDeadline, setSplitDeadline] = useState('');

  // Dialog states
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);

  // New state for payment section view
  const [paymentAction, setPaymentAction] = useState<'none' | 'send' | 'split' | 'batch'>('none');

  // Add new state for split payment recipient
  const [splitRecipient, setSplitRecipient] = useState('');

  const [suiBalance, setSuiBalance] = useState(0);
  const [selectedCurrency, setSelectedCurrency] = useState('SUI');
  const [convertedBalance, setConvertedBalance] = useState(0);
  interface ExchangeRates {
    [key: string]: number;
  }

  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>({});
  const [currencies, setCurrencies] = useState(['SUI']);

  useEffect(() => {
    async function fetchRates() {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=sui&vs_currencies=usd,eur,inr,gbp,jpy,cad,aud,sgd,zar,brl'
      );
      const data = await response.json();
      setExchangeRates(data.sui);
      setCurrencies(['SUI', ...Object.keys(data.sui).map(c => c.toUpperCase())]);
    }
    fetchRates();
  }, []);

  const convertBalance = (sui: number, currency: string) => {
    if (currency === 'SUI') return sui;
    const rate = exchangeRates[currency.toLowerCase()];
    return rate ? sui * rate : sui;
  };

  useEffect(() => {
    setConvertedBalance(convertBalance(suiBalance, selectedCurrency));
  }, [selectedCurrency, suiBalance, exchangeRates]);

  useEffect(() => {
    async function fetchSuiBalance() {
      if (!account?.address) {
        setSuiBalance(0);
        return;
      }
      try {
        const response = await suiClient.getBalance({ owner: account.address });
        // Sui returns balance in MIST, so convert to SUI
        setSuiBalance(Number(response.totalBalance) / Number(MIST_PER_SUI));
      } catch (err) {
        setSuiBalance(0);
      }
    }
    fetchSuiBalance();
  }, [account?.address]);

  // Helper function to get username from address
  const getUsernameFromAddress = async (address: string): Promise<string> => {
    if (!address) return 'Unknown';

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
    } catch (err) {
      console.error('Error getting username for address:', address, err);
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
          historyArray.map(async (record: any) => {
            const fromUsername = await getUsernameFromAddress(record.fields.from);
            const toUsername = await getUsernameFromAddress(record.fields.to);

            // Ensure the values are treated as numbers for comparison
            const paymentType = parseInt(record.fields.payment_type);
            const status = parseInt(record.fields.status);

            return {
            id: record.fields.id,
            from: record.fields.from,
            to: record.fields.to,
            amount: parseInt(record.fields.amount),
            memo: record.fields.memo,
              payment_type: paymentType === 0 ? 'direct' :
                paymentType === 1 ? 'split' :
                  paymentType === 2 ? 'batch' : 'unknown',
            related_id: record.fields.related_id,
            timestamp: parseInt(record.fields.timestamp),
              status: status === 0 ? 'pending' :
                status === 1 ? 'completed' :
                  status === 2 ? 'failed' : 'unknown',
              fromUsername,
              toUsername
            };
          })
        );
        
        historyWithUsernames.sort((a, b) => b.timestamp - a.timestamp);
        setPaymentHistory(historyWithUsernames);
        
        // Group by friends for individual friend history
        const friendHistory: { [key: string]: PaymentRecord[] } = {};
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

  // Fetch split payments where the current user is a participant
  const fetchSplitPayments = async () => {
    if (!account?.address) {
      console.log('Account address not available, clearing split payments.');
      setSplitPayments([]);
      return;
    }

    try {
      console.log('Fetching split payments for address:', account.address);

      const { data: registryData } = await suiClient.getObject({
        id: REGISTRY_OBJECT_ID,
        options: { showContent: true }
      });

      if (!registryData?.content || registryData.content.dataType !== 'moveObject') {
        console.error('Failed to fetch registry object or invalid type:', registryData);
        setSplitPayments([]);
        return;
      }

      const registryFields = registryData.content.fields as any;
      console.log('Registry fields:', JSON.stringify(registryFields, null, 2));

      if (!registryFields.split_payments?.fields?.id?.id) {
        console.error('Invalid split payments table structure:', registryFields);
        setSplitPayments([]);
        return;
      }

      const splitPaymentsTableId = registryFields.split_payments.fields.id.id;
      console.log('Split payments table ID:', splitPaymentsTableId);

      // Get the table entries
      const { data: tableEntries } = await suiClient.getDynamicFields({
        parentId: splitPaymentsTableId,
      });

      if (!tableEntries || tableEntries.length === 0) {
        console.log('No split payments found');
        setSplitPayments([]);
        return;
      }
      // Example: 1 SUI = 3.701 USD (as of May 23, 2025)
      // const SUI_TO_USD = 3.701;

      // const convertBalance = (sui: number, currency: string) => {
      //   switch (currency) {
      //     case 'USD':
      //       return sui * SUI_TO_USD;
      //     case 'SUI':
      //     default:
      //       return sui;
      //   }
      // };



      console.log('Table entries:', JSON.stringify(tableEntries, null, 2));

      // Fetch each split payment object
      const splitPaymentPromises = tableEntries.map(async (entry) => {
        try {
          const { data: splitPaymentData } = await suiClient.getObject({
            id: entry.objectId,
            options: { showContent: true }
          });

          console.log('Split payment data:', JSON.stringify(splitPaymentData, null, 2));

          if (!splitPaymentData?.content || splitPaymentData.content.dataType !== 'moveObject') {
            console.error('Invalid split payment object:', splitPaymentData);
            return null;
          }

          const fields = splitPaymentData.content.fields as any;
          console.log('Split payment fields:', JSON.stringify(fields, null, 2));

          // The data is nested under the 'value' field
          const value = fields.value;
          if (!value || !value.fields) {
            console.error('Invalid value field in split payment:', fields);
            return null;
          }

          const splitFields = value.fields;
          if (!splitFields.participants) {
            console.error('No participants field in split payment:', splitFields);
            return null;
          }

          // Check if user is either creator or participant
          const isCreator = splitFields.creator === account.address;
          const isParticipant = splitFields.participants.some((p: any) => p.fields.address === account.address);

          // Skip if user is neither creator nor participant
          if (!isCreator && !isParticipant) {
            return null;
          }

          // Map participants with proper structure and await username fetching
          const participants = await Promise.all(splitFields.participants.map(async (p: any) => {
            console.log('Processing participant:', JSON.stringify(p, null, 2));
            const username = await getUsernameFromAddress(p.fields.address);
            return {
              address: p.fields.address,
              amount_owed: Number(p.fields.amount_owed),
              amount_paid: Number(p.fields.amount_paid),
              has_paid: Boolean(p.fields.has_paid),
              paid_at: p.fields.paid_at ? Number(p.fields.paid_at) : null,
              username
            };
          }));

          const splitPayment: SplitPayment = {
            id: splitFields.id,
            creator: splitFields.creator,
            title: splitFields.title,
            total_amount: Number(splitFields.total_amount),
            participants,
            created_at: Number(splitFields.created_at),
            completed_at: splitFields.completed_at ? Number(splitFields.completed_at) : null,
            is_completed: Boolean(splitFields.is_completed),
            payment_deadline: splitFields.payment_deadline ? Number(splitFields.payment_deadline) : null,
            collected_amount: Number(splitFields.collected_amount),
            recipient_address: splitFields.recipient_address,
            status: splitFields.is_completed ? 'completed' : 'pending'
          };

          return splitPayment;
        } catch (error) {
          console.error('Error fetching split payment:', error);
          return null;
        }
      });

      const splitPayments = (await Promise.all(splitPaymentPromises)).filter((p): p is SplitPayment => p !== null);
      console.log('Fetched split payments:', splitPayments);

      // Fetch creator usernames
      const splitPaymentsWithCreatorUsernames = await Promise.all(splitPayments.map(async (split) => {
        const creatorUsername = await getUsernameFromAddress(split.creator);
        return { ...split, creatorUsername };
      }));

      setSplitPayments(splitPaymentsWithCreatorUsernames);
    } catch (error) {
      console.error('Error fetching split payments:', error);
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
          address: friendAddress,
          username: await getUsernameFromAddress(friendAddress),
          added_at: Date.now() // Since we don't have this info from the backend
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
      
      await signAndExecuteTransaction({ transaction: tx });
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
      // Clear input fields after transaction attempt
      if (successMessage.includes('Payment sent') || successMessage.includes('Batch payment sent')) { // Direct or Batch Payment
        setPaymentRecipient('');
        setPaymentAmount('');
        setPaymentMemo('');
        setBatchPayments([]); // Clear batch items
        setPaymentAction('none'); // Return to payment options
      } else if (successMessage.includes('Split payment created')) { // Split Payment
        setSplitTitle('');
        setSplitAmount('');
        setSplitParticipants('');
        setCustomSplitAmounts('');
        setSplitRecipient('');
        setSplitDeadline('');
        setSplitType('equal'); // Reset split type
        setPaymentAction('none'); // Return to payment options
      } else if (successMessage.includes('Friend request sent')) { // Friend Request
        setFriendToAdd('');
      } else if (successMessage.includes('Split payment contribution made')) { // Split Payment Contribution
        // Input fields are within the dialog, which will close or update
      }
    }
  };

  // Friend selector functions
  const openFriendSelector = (purpose: string) => {
    setFriendSelectorFor(purpose);
    setShowFriendSelector(true);
    if (purpose === 'recipient') {
    setSelectedFriends([]);
    }
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
        recipient: friend,
        amount: 0,
        memo: '',
        status: 'pending' as const
      }));
      setBatchPayments(newBatch);
    } else if (friendSelectorFor === 'recipient') {
      if (selectedFriends.length === 1) {
        setSplitRecipient(selectedFriends[0]);
      }
    }
    closeFriendSelector();
  };

  // Dialog handlers
  const handleOpenPaymentDialog = (friend: Friend) => {
    setSelectedFriend(friend);
    setPaymentRecipient(friend.username);
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
    setBatchPayments([...batchPayments, {
      recipient: '',
      amount: 0,
      memo: '',
      status: 'pending'
    }]);
  };

  const removeBatchPaymentRow = (index: number) => {
    if (batchPayments.length > 1) {
      setBatchPayments(batchPayments.filter((_, i) => i !== index));
    }
  };

  const updateBatchPayment = (index: number, field: keyof BatchPaymentItem, value: string | number) => {
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

  // Add new helper function for currency conversion
  const convertToSui = (amount: number, fromCurrency: string): number => {
    if (fromCurrency === 'SUI') return amount;
    const rate = exchangeRates[fromCurrency.toLowerCase()];
    return rate ? amount / rate : amount;
  };

  // Add new helper function for currency display
  const formatCurrency = (amount: number, currency: string): string => {
    if (currency === 'SUI') return `${amount.toFixed(9)} SUI`;
    return `${amount.toFixed(2)} ${currency}`;
  };

  // Update the payment dialog content
  const renderPaymentDialog = () => {
    if (!selectedFriend || !paymentDialogOpen) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg max-w-md w-full mx-4">
          <CardTitle className="text-xl font-bold text-white mb-4">Send Payment to {selectedFriend.username}</CardTitle>
          <div className="mb-4">
            <div className="text-sm text-gray-300 mb-2">Amount in {selectedCurrency}</div>
            <input
              type="number"
              step="0.000000001"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder={`Amount in ${selectedCurrency}`}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
            />
            {selectedCurrency !== 'SUI' && (
              <div className="text-xs text-gray-400 mt-1">
                ≈ {formatCurrency(convertToSui(Number(paymentAmount), selectedCurrency), 'SUI')}
              </div>
            )}
          </div>
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

  // Update handleSendPayment to handle currency conversion
  const handleSendPayment = () => {
    executeTransaction((tx) => {
      const amountInSui = convertToSui(Number(paymentAmount), selectedCurrency);
      const amountInMist = convertSuiToMist(amountInSui.toString());
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
      payment.recipient && payment.amount > 0
    );

    if (validPayments.length === 0) {
      setError('Please add at least one valid payment');
      return;
    }

    executeTransaction((tx) => {
      validPayments.forEach(payment => {
        const amountInSui = convertToSui(payment.amount, selectedCurrency);
        const amountInMist = convertSuiToMist(amountInSui.toString());
        const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);
        tx.moveCall({
          target: `${PACKAGE_ID}::suiconn::send_payment`,
          arguments: [
            tx.object(REGISTRY_OBJECT_ID),
            tx.pure.string(payment.recipient),
            tx.pure.u64(amountInMist),
            tx.pure.string(payment.memo || 'Batch payment'),
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

    // Get recipient address - either from friends list or direct input
    let recipientAddress: string;
    const recipientFriend = friends.find(f => f.username === splitRecipient);

    if (recipientFriend) {
      recipientAddress = recipientFriend.address;
    } else {
      // Check if input is a valid address
      if (!splitRecipient.startsWith('0x') || splitRecipient.length !== 66) {
        setError('Please enter a valid recipient address or select from friends');
        return;
      }
      recipientAddress = splitRecipient;
    }

    // Convert participant usernames to addresses
    const participantAddresses = participants.map(username => {
      const friend = friends.find(f => f.username === username);
      if (!friend) {
        setError(`Friend ${username} not found in your friends list`);
        return null;
      }
      return friend.address;
    }).filter(Boolean);

    if (participantAddresses.length !== participants.length) {
      return;
    }

    console.log('Creating split payment with:', {
      title: splitTitle,
      participants: participantAddresses,
      recipientAddress,
      splitType
    });
    
    if (splitType === 'equal') {
      const amountInMist = convertSuiToMist(splitAmount);
      executeTransaction((tx) => {
      tx.moveCall({
        target: `${PACKAGE_ID}::suiconn::create_split_payment`,
        arguments: [
          tx.object(REGISTRY_OBJECT_ID),
            tx.object(ACCESS_CONTROL_ID),
          tx.pure.string(splitTitle),
            tx.pure.u64(amountInMist),
            tx.pure.vector('string', participants), // Send usernames as expected by contract
            tx.pure.address(recipientAddress),
          tx.object('0x6'),
        ],
      });
      }, 'Equal split payment created!');
    } else {
      const amounts = customSplitAmounts.split(',').map(a => convertSuiToMist(a.trim())).filter(a => a > 0);
      
      if (participants.length !== amounts.length) {
        setError('Number of participants must match number of amounts');
        return;
      }

      if (amounts.some(amount => amount <= 0)) {
        setError('Custom amounts must be positive');
        return;
      }

      let deadlineOption: any = { None: true };
      if (splitDeadline && splitDeadline.trim() !== '') {
        const ms = Date.parse(splitDeadline);
        if (!isNaN(ms)) {
          deadlineOption = { Some: [BigInt(ms)] };
        }
      }

      console.log('Creating custom split payment with:', {
        title: splitTitle,
        participants: participantAddresses,
        amounts,
        recipientAddress,
        deadlineOption
      });

      executeTransaction((tx) => {
        tx.moveCall({
          target: `${PACKAGE_ID}::suiconn::create_custom_split_payment`,
          arguments: [
            tx.object(REGISTRY_OBJECT_ID),
            tx.object(ACCESS_CONTROL_ID),
            tx.pure.string(splitTitle),
            tx.pure.vector('string', participants),
            tx.pure.vector('u64', amounts),
            tx.pure.address(recipientAddress),
            tx.pure(deadlineOption),
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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            {/* User Profile Display */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg mb-6">
              <CardTitle className="text-xl font-bold text-white mb-4">Wallet Balance</CardTitle>
              <div className="flex items-center gap-4">
                <div className="text-2xl font-mono text-white">
                  {convertedBalance.toFixed(4)} {selectedCurrency}
                </div>
                <select
                  value={selectedCurrency}
                  onChange={e => setSelectedCurrency(e.target.value)}
                  className="px-2 py-2 rounded-md bg-white/10 text-white font-bold"
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr} className="text-black">{curr}</option>
                  ))}
                </select>

              </div>
            </Card>

            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Your Profile</CardTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center shadow-md">
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.username}
                  </div>
                  <div className="text-xs text-gray-300">
                    Username
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center shadow-md">
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {friends.length}
                  </div>
                  <div className="text-xs text-gray-300">
                    Friends
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center shadow-md">
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_sent}
                  </div>
                  <div className="text-xs text-gray-300">
                    Payments Sent
                  </div>
                </Card>
                <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center shadow-md">
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_received}
                  </div>
                  <div className="text-xs text-gray-300">
                    Payments Received
                  </div>
                </Card>
              </div>
              <Card className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mt-6">
                <div className="text-sm text-gray-300 flex items-center gap-2">
                  <strong>Address:</strong> {formatAddress(account?.address || '')}
                  <CopyButton text={account?.address || ''} onCopy={setSuccess} />
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
                  <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 shadow-md mb-3">
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '4px', fontSize: '16px' }}>
                      {split.title}
                    </div>
                    <div className="text-xs text-gray-300" style={{ wordBreak: 'break-all' }}>
                      Total: {formatMistToSui(split.total_amount)}
                      {selectedCurrency !== 'SUI' && (
                        <span className="ml-2">
                          ({formatCurrency(convertBalance(Number(split.total_amount) / Number(MIST_PER_SUI), selectedCurrency), selectedCurrency)})
                        </span>
                      )} | 
                      Creator: {split.creatorUsername} | 
                      Status: {split.status === 'completed' ? 'Completed' : 'Pending'}
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
                  <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 shadow-md mb-3">
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
                friends.map((friend) => {
                  // const friendHistory = friendTransactionHistory[friend.address] || [];
                  
                  return (
                    <div key={friend.address} className="flex items-center justify-between p-3 bg-white rounded-lg shadow">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary">
                            {friend.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{friend.username}</p>
                          <div className="flex items-center gap-1 flex-wrap">
                            <p className="text-xs text-gray-500" style={{ wordBreak: 'break-all' }}>{formatAddress(friend.address)}</p>
                            <CopyButton 
                              text={friend.address} 
                              onCopy={setSuccess}
                              // Using a light blue color for the Copy button
                              className="px-2 py-1 text-xs rounded-md bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition-colors inline-flex items-center justify-center"
                            />
                        </div>
                        </div>
                      </div>
                      <div className="flex space-x-1 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenPaymentDialog(friend)}
                        >
                          Pay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenHistoryDialog(friend)}
                        >
                          History
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-white/70 text-center">No friends available.</div>
              )}
            </Card>
          </div>
        );

      case 'payments':
        return (
          <div className="space-y-6">
            {paymentAction === 'none' && (
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
                <CardTitle className="text-xl font-bold text-white mb-4">Choose Payment Type</CardTitle>
                <div className="grid grid-cols-1 gap-4">
                  <Button
                    onClick={() => setPaymentAction('send')}
                    className="px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-600 to-blue-700 text-white border border-cyan-500"
                  >
                    Send Direct Payment
                  </Button>
                  <Button
                    onClick={() => setPaymentAction('split')}
                    className="px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-emerald-600 to-teal-700 text-white border border-emerald-500"
                  >
                    Create Split Payment
                  </Button>
                  <Button
                    onClick={() => setPaymentAction('batch')}
                    className="px-4 py-3 rounded-xl font-medium bg-gradient-to-r from-purple-600 to-indigo-700 text-white border border-purple-500"
                  >
                    Batch Payment
                  </Button>
                </div>
              </Card>
            )}

            {paymentAction !== 'none' && (
              <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
                <button
                  onClick={() => setPaymentAction('none')}
                  className="mb-4 px-3 py-1 text-sm rounded-lg bg-white/10 text-white hover:bg-white/20"
                >
                  ← Back to Payment Options
                </button>

                {/* Send Payment Form */}
                {paymentAction === 'send' && (
                  <div className="space-y-4">
                    <CardTitle className="text-xl font-bold text-white mb-4">Send Direct Payment</CardTitle>
                    <div className="flex items-center gap-3 mb-4 flex-wrap"> {/* Added flex-wrap */}
                <input
                  type="text"
                  value={paymentRecipient}
                  onChange={(e) => setPaymentRecipient(e.target.value)}
                  placeholder="Recipient username"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                  style={{ marginBottom: 0 }}
                  disabled
                />
                <button 
                  onClick={() => openFriendSelector('payment')}
                  className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 flex-shrink-0"
                  disabled={friends.length === 0}
                >
                  Select
                </button>
              </div>
              <input
                type="number"
                step="0.000000001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                      placeholder={`Amount in ${selectedCurrency}`}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
              />
                    {selectedCurrency !== 'SUI' && (
                      <div className="text-xs text-gray-400 mt-1">
                        ≈ {formatCurrency(convertToSui(Number(paymentAmount), selectedCurrency), 'SUI')}
                      </div>
                    )}
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
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 w-full"
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
                  <line x1="22" y1="2" x2="11" y2="13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {loading ? 'Sending...' : 'Send Payment'}
                    </button>
                  </div>
                )}

                {/* Create Split Payment Form */}
                {paymentAction === 'split' && (
                  <div className="space-y-4">
              <CardTitle className="text-xl font-bold text-white mb-4">Create Split Payment</CardTitle>

              {/* Split Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <div className="text-sm font-medium text-white/90 mb-2">Split Type:</div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}> {/* Added flexWrap */}
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

                    {/* Add recipient selection */}
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}> {/* Added flexWrap */}
                      <input
                        type="text"
                        value={splitRecipient}
                        onChange={(e) => setSplitRecipient(e.target.value)}
                        placeholder="Recipient address or username"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                        style={{ marginBottom: 0, flex: 1 }}
                      />
                      <button
                        onClick={() => openFriendSelector('recipient')}
                        className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 flex-shrink-0"
                        style={{ width: 'auto' }}
                        disabled={friends.length === 0}
                      >
                        Select from Friends
                      </button>
                      <button
                        onClick={() => account?.address && setSplitRecipient(account.address)}
                        className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-purple-600 to-indigo-700 text-white hover:from-purple-500 hover:to-indigo-600 shadow-lg shadow-purple-500/30 border-purple-500 flex-shrink-0"
                        style={{ width: 'auto' }}
                        disabled={!account?.address}
                      >
                        Select Self
                      </button>
                    </div>

                    {/* Conditional Participant Selection based on Recipient */}
                    {splitRecipient ? (
                      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}> {/* Added flexWrap */}
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
                          className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 flex-shrink-0"
                          style={{ width: 'auto' }}
                          disabled={friends.length === 0}
                        >
                          Select Participants
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 mb-4">Please select a recipient first to choose participants.</div>
                    )}

              {splitType === 'equal' ? (
                <input
                  type="number"
                  step="0.000000001"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder={`Amount in ${selectedCurrency}`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                />
              ) : (
                <input
                  type="text"
                  value={customSplitAmounts}
                  onChange={(e) => setCustomSplitAmounts(e.target.value)}
                  placeholder={`Enter amounts in ${selectedCurrency} separated by commas`}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                />
              )}
              {selectedCurrency !== 'SUI' && (
                <div className="text-xs text-gray-400 mt-1">
                  ≈ {customSplitAmounts.split(',').map(amount => 
                    formatCurrency(convertToSui(Number(amount.trim()), selectedCurrency), 'SUI')
                  ).join(', ')}
                </div>
              )}

                    {/* Add deadline input */}
                    <input
                      type="datetime-local"
                      value={splitDeadline}
                      onChange={(e) => setSplitDeadline(e.target.value)}
                      placeholder="Payment deadline (optional)"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 mb-4"
                    />

                    <button
                      onClick={handleCreateSplitPayment}
                      disabled={loading || !splitTitle || !splitRecipient ||
                        (splitType === 'equal' && (!splitAmount || !splitParticipants)) ||
                        (splitType === 'custom' && (!customSplitAmounts || !splitParticipants))
                      }
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 w-full"
                    >
                      {loading ? 'Creating...' : `Create ${splitType === 'equal' ? 'Equal' : 'Custom'} Split`}
                    </button>
                  </div>
                )}

                {/* Batch Payment Form */}
                {paymentAction === 'batch' && (
                  <div className="space-y-4">
                    <CardTitle className="text-xl font-bold text-white mb-4">Batch Payment</CardTitle>
                    {/* Batch Payment Interface */}
                    {batchPayments.map((batch, index) => (
                      <div key={index} className="space-y-3 mb-4 p-4 bg-white/5 border border-white/10 rounded-xl">
                        <div className="flex items-center gap-3 flex-wrap"> {/* Added flex-wrap */}
                <input
                  type="text"
                            value={batch.recipient}
                            onChange={(e) => updateBatchPayment(index, 'recipient', e.target.value)}
                            placeholder="Recipient username"
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300 cursor-not-allowed"
                            disabled
                />
                <button 
                            onClick={() => openFriendSelector('batch')}
                  className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 flex-shrink-0"
                  disabled={friends.length === 0}
                >
                  Select
                </button>
              </div>
                        <div>
                          <div className="text-sm text-gray-300 mb-2">Amount in {selectedCurrency}</div>
                          <input
                            type="number"
                            step="0.000000001"
                            value={batch.amount}
                            onChange={(e) => updateBatchPayment(index, 'amount', parseFloat(e.target.value))}
                            placeholder={`Amount in ${selectedCurrency}`}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                          />
                          {selectedCurrency !== 'SUI' && (
                            <div className="text-xs text-gray-400 mt-1">
                              ≈ {formatCurrency(convertToSui(batch.amount, selectedCurrency), 'SUI')}
                            </div>
                          )}
                        </div>
                        <input
                          type="text"
                          value={batch.memo}
                          onChange={(e) => updateBatchPayment(index, 'memo', e.target.value)}
                          placeholder="Memo (optional)"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                        />
                        {batchPayments.length > 1 && (
              <button 
                            onClick={() => removeBatchPaymentRow(index)}
                            className="px-3 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-500/30 border-rose-500 w-full mt-2"
                          >
                            Remove Payment
              </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addBatchPaymentRow}
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-amber-600 to-orange-700 text-white hover:from-amber-500 hover:to-orange-600 shadow-lg shadow-amber-500/30 border-amber-500 w-full"
                    >
                      Add Another Payment
                    </button>
                    <button
                      onClick={handleBatchPayment}
                      disabled={loading || batchPayments.length === 0 || batchPayments.some(b => !b.recipient || b.amount <= 0)}
                      className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 w-full mt-4"
                    >
                      {loading ? 'Sending Batch...' : `Send Batch Payment (${batchPayments.length})`}
                    </button>
                  </div>
                )}
            </Card>
            )}
          </div>
        );

      case 'splits':
        return (
          <div className="space-y-6">
            {/* Split Payments Overview */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Your Split Payments</CardTitle>
              {splitPayments.length > 0 ? (
                splitPayments.map((split, index) => {
                  const currentUserParticipant = split.participants.find(p => p.address === account?.address);
                  const isCreator = split.creator === account?.address;

                  if (!currentUserParticipant && !isCreator) return null; // Only show splits user is involved in
                  
                  return (
                    <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4 shadow-md mb-4 space-y-3">
                      <div style={{ fontWeight: '600', color: '#fff', fontSize: '18px' }}>
                          {split.title}
                        </div>
                        <div className="text-sm text-gray-300">
                        Total Amount: {formatMistToSui(split.total_amount)}
                        {selectedCurrency !== 'SUI' && (
                          <span className="ml-2">
                            ({formatCurrency(convertBalance(Number(split.total_amount) / Number(MIST_PER_SUI), selectedCurrency), selectedCurrency)})
                          </span>
                        )}
                        </div>
                        <div className="text-sm text-gray-300">
                        Creator: {split.creatorUsername} ({formatAddress(split.creator)})
                        </div>

                      {isCreator && (
                        <div className="text-sm text-gray-300">
                          Status: {split.is_completed ? 'Completed' : 'Pending Collection'}
                          </div>
                        )}

                      {currentUserParticipant && !isCreator && (
                        <div className="text-sm text-gray-300 space-y-2">
                          <div>
                            Your Share: {formatMistToSui(currentUserParticipant.amount_owed)}
                        </div>
                          <div>
                            Status: {currentUserParticipant.has_paid ? 'Paid' : 'Outstanding'}
                        </div>
                        
                          {!currentUserParticipant.has_paid && !split.is_completed && (
                          <button 
                              onClick={() => handlePaySplitAmount(split.id, currentUserParticipant.amount_owed)}
                              disabled={loading}
                              className="px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 mt-2 w-full"
                            >
                              {loading ? 'Paying...' : 'Pay Your Share'}
                          </button>
                        )}
                          </div>
                        )}
                        
                          <div className="text-sm text-gray-300 mt-2">
                        Participants:
                        <ul className="list-disc list-inside ml-2">
                          {split.participants.map((p, pIndex) => (
                            <li key={pIndex} className="text-xs">
                              {p.username} ({formatAddress(p.address)}): {formatMistToSui(p.amount_owed)}
                              {selectedCurrency !== 'SUI' && (
                                <span className="ml-1">
                                  ({formatCurrency(convertBalance(Number(p.amount_owed) / Number(MIST_PER_SUI), selectedCurrency), selectedCurrency)})
                                </span>
                              )} - {p.has_paid ? 'Paid' : 'Outstanding'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-sm text-gray-300">No split payments found where you are a participant or creator.</div>
              )}
            </Card>
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            {/* Transaction History */}
            <Card className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg">
              <CardTitle className="text-xl font-bold text-white mb-4">Transaction History</CardTitle>
              {paymentHistory.length > 0 ? (
                paymentHistory.slice(0, 3).map((record, index) => (
                  <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 shadow-md mb-3">
                    <div className="font-medium text-white mb-1">
                      {record.fromUsername} - {formatMistToSui(record.amount)}
                      {selectedCurrency !== 'SUI' && (
                        <span className="text-sm text-gray-300 ml-2">
                          ({formatCurrency(convertBalance(Number(record.amount) / Number(MIST_PER_SUI), selectedCurrency), selectedCurrency)})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-300" style={{ wordBreak: 'break-all' }}>
                      From: {record.fromUsername} ({formatAddress(record.from)}) to {record.toUsername} ({formatAddress(record.to)})
                    </div>
                    {record.memo && (
                      <div className="text-xs text-gray-300 mt-1">
                        Memo: {record.memo}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-white/70 text-center py-4">No transactions found</div>
              )}
              {paymentHistory.length > 3 && (
                  <button
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 text-sm rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/30 border-cyan-500 mt-4">
                  View All Transactions
                  </button>
              )}
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderHistoryDialog = () => {
    if (!selectedFriend || !historyDialogOpen) return null;
    
    const friendHistory = friendTransactionHistory[selectedFriend.address] || [];
    
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-6 shadow-lg max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
          <CardTitle className="text-xl font-bold text-white mb-4">Transaction History with {selectedFriend.username}</CardTitle>
          {friendHistory.length > 0 ? (
            friendHistory.map((record, index) => {
              const isOutgoing = record.from === account?.address;
              return (
                <div key={index} className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 shadow-md mb-3">
                  <div className="font-medium text-white mb-1">
                    {isOutgoing ? 'Sent' : 'Received'} - {formatMistToSui(record.amount)}
                    {selectedCurrency !== 'SUI' && (
                      <span className="text-sm text-gray-300 ml-2">
                        ({formatCurrency(convertBalance(Number(record.amount) / Number(MIST_PER_SUI), selectedCurrency), selectedCurrency)})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-300" style={{ wordBreak: 'break-all' }}>
                    {isOutgoing
                      ? `To: ${record.toUsername} (${formatAddress(record.to)})`
                      : `From: ${record.fromUsername} (${formatAddress(record.from)})`}
                  </div>
                  {record.memo && (
                    <div className="text-xs text-gray-300 mt-1">
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
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden text-white">
      {/* Background components */}
      <UnderwaterOverlay />
      <CoralReef />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 hidden sm:block">
        <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-60 right-32 w-80 h-80 bg-gradient-to-r from-purple-400/15 to-pink-600/15 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-1 sm:px-4 py-2 sm:py-4 relative z-50 max-w-4xl">
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
          logo={<img src="/suiConn.svg" alt="SuiConn Logo" className="w-12 h-auto" />}
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
              {friends.map((friend) => (
                <div
                  key={friend.address}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors duration-150 ${selectedFriends.includes(friend.username)
                    ? 'bg-indigo-500/50 border border-indigo-400/70 shadow-indigo-500/30'
                    : 'bg-white/15 border border-white/25'
                    }`}
                  onClick={() => toggleFriendSelection(friend.username)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-indigo-300">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                  </div>
                    <div>
                      <div className="text-white font-medium">{friend.username}</div>
                      <div className="text-sm text-gray-400">{formatAddress(friend.address)}</div>
                    </div>
                  </div>
                  {selectedFriends.includes(friend.username) && (
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={confirmFriendSelection}
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:from-emerald-500 hover:to-teal-600 shadow-lg shadow-emerald-500/30 border-emerald-500 flex-1"
              >
                Confirm Selection
              </button>
              <button
                onClick={closeFriendSelector}
                className="px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 border bg-gradient-to-r from-rose-600 to-pink-700 text-white hover:from-rose-500 hover:to-pink-600 shadow-lg shadow-rose-500/30 border-rose-500 flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Add copy button component
const CopyButton = ({ text, onCopy, className }: { text: string, onCopy: (message: string) => void, className?: string }) => (
  <button
    onClick={() => {
      navigator.clipboard.writeText(text);
      onCopy('Address copied to clipboard!');
    }}
    className={`px-2 py-1 text-xs rounded-md bg-cyan-100 text-cyan-800 hover:bg-cyan-200 transition-colors inline-flex items-center justify-center ${className || ''}`}
  >
    Copy
  </button>
);