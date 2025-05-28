import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = '0xb0d759fa0e301c27bee0b451b80cb9479171fe9674251eaf1d96b8a1d9693a6b';
const REGISTRY_OBJECT_ID = '0x4432099e7bdf4b607f09a28f3e7f0feaa9ee396dba779baf12b5814e23cfda11';
const USER_PROFILES_TABLE_ID = '0x6d4114ff53d3fb8352d0a40638aaccbf58b3833b06f981ceb8a544ed9dfa56f3';
const FRIEND_REQUESTS_TABLE_ID = '0xcfe84647c1b2c4a23dad88e77846552b995c417c7b0b5d8ef36fb7f112ad8610';
const SPLIT_PAYMENTS_TABLE_ID = '0x2e43a39d74678a277ec75e5557c0290b585c8cad25677f4e239b1c61c30ecc4d';
const USERNAME_REGISTRY_TABLE_ID = '0xcf30d3fdd6fb90502f3e4e06f10505485c1459d3f69ca2eeab8703fa4efd7d80';
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

interface UserProfile {
  username: string;
  address: string;
  friends: string[];
  groups: string[];
  created_at: number;
  is_active: boolean;
  last_payment_time: number;
  daily_payment_count: number;
  last_friend_request_time: number;
  total_payments_sent: number;
  total_payments_received: number;
}

interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: number;
  created_at: number;
  updated_at: number;
  fromUsername?: string;
}

interface Friend {
  address: string;
  username: string;
}

interface SplitPayment {
  id: string;
  creator: string;
  title: string;
  total_amount: number;
  participants: SplitParticipant[];
  created_at: number;
  is_completed: boolean;
  creatorUsername?: string;
}

interface SplitParticipant {
  address: string;
  amount_owed: number;
  amount_paid: number;
  has_paid: boolean;
  username?: string;
}

interface Group {
  id: string;
  name: string;
  description: string | null;
  admin: string;
  members: any[];
  created_at: number;
  total_spent: number;
  is_active: boolean;
  member_count: number;
}

export default function SuiConnApp() {
  const { signAndExecuteTransaction, account, connected } = useWallet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeTab, setActiveTab] = useState('profile');

  // Form states
  const [username, setUsername] = useState('');
  const [friendToAdd, setFriendToAdd] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [memberToAdd, setMemberToAdd] = useState('');
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [splitTitle, setSplitTitle] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitParticipants, setSplitParticipants] = useState('');
  const [splitId, setSplitId] = useState('');
  const [requestId, setRequestId] = useState('');
  const [groupId, setGroupId] = useState('');
  const [customSplitAmounts, setCustomSplitAmounts] = useState('');
  const [newAdminUsername, setNewAdminUsername] = useState('');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSelectorFor, setFriendSelectorFor] = useState('');

  // Mobile styles
  const mobileStyles = {
    container: {
      padding: '10px',
      fontFamily: 'Arial, sans-serif',
      maxWidth: '100%',
      margin: '0 auto',
      backgroundColor: '#f8f9fa',
      minHeight: '100vh'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '20px',
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      flexWrap: 'wrap' as const
    },
    title: {
      fontSize: window.innerWidth < 768 ? '18px' : '24px',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0
    },
    card: {
      backgroundColor: '#fff',
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '15px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: 'none'
    },
    input: {
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #ddd',
      fontSize: '16px',
      width: '100%',
      marginBottom: '10px',
      boxSizing: 'border-box' as const
    },
    button: {
      padding: '12px 20px',
      borderRadius: '8px',
      border: 'none',
      fontSize: '16px',
      fontWeight: 'bold',
      cursor: 'pointer',
      width: '100%',
      marginBottom: '10px',
      transition: 'all 0.3s ease'
    },
    primaryButton: {
      backgroundColor: '#007bff',
      color: 'white'
    },
    successButton: {
      backgroundColor: '#28a745',
      color: 'white'
    },
    dangerButton: {
      backgroundColor: '#dc3545',
      color: 'white'
    },
    warningButton: {
      backgroundColor: '#ffc107',
      color: '#212529'
    },
    tabContainer: {
      display: 'flex',
      backgroundColor: '#fff',
      borderRadius: '12px',
      marginBottom: '20px',
      overflow: 'hidden',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    },
    tab: {
      flex: 1,
      padding: '15px 10px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: 'bold',
      transition: 'all 0.3s ease'
    },
    activeTab: {
      backgroundColor: '#007bff',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: '#f8f9fa',
      color: '#6c757d'
    },
    friendCard: {
      backgroundColor: '#f8f9fa',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid #e9ecef',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap' as const
    },
    requestCard: {
      backgroundColor: '#fff3cd',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid #ffeaa7'
    },
    splitCard: {
      backgroundColor: '#e7f3ff',
      padding: '15px',
      borderRadius: '8px',
      marginBottom: '10px',
      border: '1px solid #b3d9ff'
    },
    buttonGroup: {
      display: 'flex',
      gap: '10px',
      marginTop: '10px'
    },
    smallButton: {
      padding: '8px 12px',
      fontSize: '14px',
      borderRadius: '6px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: 'bold'
    },
    friendSelector: {
      position: 'fixed' as const,
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    friendSelectorContent: {
      backgroundColor: '#fff',
      borderRadius: '12px',
      padding: '20px',
      maxWidth: '400px',
      width: '100%',
      maxHeight: '80vh',
      overflow: 'auto'
    },
    checkboxItem: {
      display: 'flex',
      alignItems: 'center',
      padding: '10px',
      borderRadius: '8px',
      marginBottom: '5px',
      cursor: 'pointer',
      backgroundColor: '#f8f9fa'
    }
  };

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
      console.error('❌ Failed to load profile:', err);
      setUserProfile(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch split payments
  const fetchSplitPayments = async () => {
    if (!account?.address) return;
    try {
      // Get all split payments from the table
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

            // Check if user is creator or participant
            const isCreator = splitPayment.creator === account.address;
            const isParticipant = splitPayment.participants.some((p: any) => 
              p.fields.address === account.address
            );

            if (isCreator || isParticipant) {
              // Add usernames to participants
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
      console.error('❌ Failed to load split payments:', err);
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

  // Fetch friends list with usernames
  const fetchFriendsList = async () => {
    if (!userProfile?.friends || userProfile.friends.length === 0) {
      setFriendsList([]);
      return;
    }
    
    try {
      const friendsWithUsernames = await Promise.all(
        userProfile.friends.map(async (friendAddress: string) => ({
          address: friendAddress,
          username: await getUsernameFromAddress(friendAddress)
        }))
      );
      
      setFriendsList(friendsWithUsernames);
    } catch (err) {
      setFriendsList([]);
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
        } else {
          setUserProfile(null);
        }
      });
    } else {
      setUserProfile(null);
      setFriendRequests([]);
      setFriendsList([]);
      setSplitPayments([]);
    }
  }, [connected, account?.address]);

  // Fetch friends list when user profile changes
  useEffect(() => {
    if (userProfile?.friends && userProfile.friends.length > 0) {
      fetchFriendsList();
    } else {
      setFriendsList([]);
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
      
      // Refresh data after successful transaction
      setTimeout(() => {
        fetchUserProfile();
        fetchFriendRequestsWithUsernames();
        fetchSplitPayments();
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
    }
    closeFriendSelector();
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

  const handleCreateSplitPayment = () => {
    const participants = splitParticipants.split(',').map(p => p.trim()).filter(p => p);
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
    }, 'Split payment created!');
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
          <div>
            {/* User Profile Display */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>👤 Your Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth < 768 ? '1fr' : '1fr 1fr', gap: '10px' }}>
                <p style={{ margin: '5px 0' }}><strong>Username:</strong> {userProfile?.username}</p>
                <p style={{ margin: '5px 0' }}><strong>Address:</strong> {userProfile?.address.slice(0, 6)}...{userProfile?.address.slice(-4)}</p>
                <p style={{ margin: '5px 0' }}><strong>Friends:</strong> {friendsList.length}</p>
                <p style={{ margin: '5px 0' }}><strong>Groups:</strong> {userProfile?.groups.length}</p>
                <p style={{ margin: '5px 0' }}><strong>Payments Sent:</strong> {userProfile?.total_payments_sent}</p>
                <p style={{ margin: '5px 0' }}><strong>Payments Received:</strong> {userProfile?.total_payments_received}</p>
                <p style={{ margin: '5px 0' }}><strong>Status:</strong> {userProfile?.is_active ? '✅ Active' : '❌ Inactive'}</p>
                <p style={{ margin: '5px 0' }}><strong>Pending Requests:</strong> {friendRequests.length}</p>
              </div>
            </div>

            {/* Split Payments Overview */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔄 Split Payments ({splitPayments.length})</h3>
              {splitPayments.length > 0 ? (
                splitPayments.slice(0, 3).map((split, index) => (
                  <div key={index} style={mobileStyles.splitCard}>
                    <p style={{ margin: '0 0 5px 0', fontWeight: 'bold' }}>
                      {split.title}
                    </p>
                    <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                      Total: {formatMistToSui(split.total_amount)} | 
                      Creator: {split.creatorUsername} | 
                      Status: {split.is_completed ? '✅ Completed' : '⏳ Pending'}
                    </p>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No split payments</p>
              )}
              {splitPayments.length > 3 && (
                <button 
                  onClick={() => setActiveTab('splits')}
                  style={{...mobileStyles.smallButton, ...mobileStyles.primaryButton, width: '100%'}}
                >
                  View All Split Payments
                </button>
              )}
            </div>
          </div>
        );

      case 'friends':
        return (
          <div>
            {/* Send Friend Request */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>➕ Add Friend</h3>
              <input
                type="text"
                value={friendToAdd}
                onChange={(e) => setFriendToAdd(e.target.value)}
                placeholder="Enter friend's username"
                style={mobileStyles.input}
              />
              <button 
                onClick={handleSendFriendRequest} 
                disabled={loading || !friendToAdd}
                style={{...mobileStyles.button, ...mobileStyles.primaryButton}}
              >
                {loading ? '⏳ Sending...' : '📤 Send Friend Request'}
              </button>
            </div>

            {/* Pending Friend Requests */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>📬 Pending Requests ({friendRequests.length})</h3>
              {friendRequests.length > 0 ? (
                friendRequests.map((req, index) => (
                  <div key={index} style={mobileStyles.requestCard}>
                    <div style={{ marginBottom: '10px' }}>
                      <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                        👤 {req.fromUsername}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        From: {req.from.slice(0, 8)}...{req.from.slice(-6)}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        📅 {new Date(req.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div style={mobileStyles.buttonGroup}>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, true)}
                        style={{...mobileStyles.smallButton, ...mobileStyles.successButton}}
                        disabled={loading}
                      >
                        ✅ Accept
                      </button>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, false)}
                        style={{...mobileStyles.smallButton, ...mobileStyles.dangerButton}}
                        disabled={loading}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No pending friend requests</p>
              )}
            </div>

            {/* Friends List */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>👥 Your Friends ({friendsList.length})</h3>
              {friendsList.length > 0 ? (
                friendsList.map((friend, index) => (
                  <div key={index} style={mobileStyles.friendCard}>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: '0 0 5px 0', fontWeight: 'bold', fontSize: '16px' }}>
                        👤 {friend.username}
                      </p>
                      <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                        {friend.address.slice(0, 8)}...{friend.address.slice(-6)}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setPaymentRecipient(friend.username);
                        setActiveTab('payments');
                      }}
                      style={{...mobileStyles.smallButton, ...mobileStyles.primaryButton}}
                    >
                      💸 Pay
                    </button>
                  </div>
                ))
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No friends yet. Send some friend requests!</p>
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
          <div>
            {/* Send Payment */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>💸 Send Payment</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={paymentRecipient}
                  onChange={(e) => setPaymentRecipient(e.target.value)}
                  placeholder="Recipient username"
                  style={{...mobileStyles.input, marginBottom: 0, flex: 1}}
                />
                <button 
                  onClick={() => openFriendSelector('payment')}
                  style={{...mobileStyles.smallButton, ...mobileStyles.primaryButton, minWidth: '80px'}}
                  disabled={friendsList.length === 0}
                >
                  👥 Select
                </button>
              </div>
              <input
                type="number"
                step="0.000000001"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="Amount in SUI (e.g., 0.001)"
                style={mobileStyles.input}
              />
              <input
                type="text"
                value={paymentMemo}
                onChange={(e) => setPaymentMemo(e.target.value)}
                placeholder="Memo (optional)"
                style={mobileStyles.input}
              />
              <button 
                onClick={handleSendPayment} 
                disabled={loading || !paymentRecipient || !paymentAmount}
                style={{...mobileStyles.button, ...mobileStyles.successButton}}
              >
                {loading ? '⏳ Sending...' : '💸 Send Payment'}
              </button>
            </div>

            {/* Split Payments */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔄 Create Split Payment</h3>
              <input
                type="text"
                value={splitTitle}
                onChange={(e) => setSplitTitle(e.target.value)}
                placeholder="Split title (e.g., Dinner bill)"
                style={mobileStyles.input}
              />
              <input
                type="number"
                step="0.000000001"
                value={splitAmount}
                onChange={(e) => setSplitAmount(e.target.value)}
                placeholder="Total amount in SUI"
                style={mobileStyles.input}
              />
              <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                <input
                  type="text"
                  value={splitParticipants}
                  onChange={(e) => setSplitParticipants(e.target.value)}
                  placeholder="Participants (comma-separated usernames)"
                  style={{...mobileStyles.input, marginBottom: 0, flex: 1}}
                />
                <button 
                  onClick={() => openFriendSelector('split')}
                  style={{...mobileStyles.smallButton, ...mobileStyles.primaryButton, minWidth: '80px'}}
                  disabled={friendsList.length === 0}
                >
                  👥 Select
                </button>
              </div>
              <button 
                onClick={handleCreateSplitPayment} 
                disabled={loading || !splitTitle || !splitAmount || !splitParticipants}
                style={{...mobileStyles.button, ...mobileStyles.primaryButton}}
              >
                {loading ? '⏳ Creating...' : '🔄 Create Split Payment'}
              </button>
            </div>
          </div>
        );

      case 'splits':
        return (
          <div>
            {/* Split Payments Management */}
            <div style={mobileStyles.card}>
              <h3 style={{ margin: '0 0 15px 0', color: '#2c3e50' }}>🔄 Your Split Payments ({splitPayments.length})</h3>
              {splitPayments.length > 0 ? (
                splitPayments.map((split, index) => {
                  const userParticipant = split.participants.find(p => p.address === account?.address);
                  const isCreator = split.creator === account?.address;
                  
                  return (
                    <div key={index} style={mobileStyles.splitCard}>
                      <div style={{ marginBottom: '10px' }}>
                        <p style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                          {split.title}
                        </p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                          <strong>Total:</strong> {formatMistToSui(split.total_amount)}
                        </p>
                        <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>
                          <strong>Creator:</strong> {split.creatorUsername} {isCreator && '(You)'}
                        </p>
                        <p style={{ margin: '0 0 10px 0', fontSize: '14px' }}>
                          <strong>Status:</strong> {split.is_completed ? '✅ Completed' : '⏳ Pending'}
                        </p>
                        
                        {/* Participants */}
                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '6px', marginBottom: '10px' }}>
                          <p style={{ margin: '0 0 5px 0', fontSize: '12px', fontWeight: 'bold' }}>Participants:</p>
                          {split.participants.map((participant, pIndex) => (
                            <div key={pIndex} style={{ fontSize: '12px', marginBottom: '3px' }}>
                              {participant.username}: {formatMistToSui(participant.amount_owed)} 
                              {participant.has_paid ? ' ✅ Paid' : ' ⏳ Pending'}
                              {participant.address === account?.address && ' (You)'}
                            </div>
                          ))}
                        </div>
                        
                        {/* Action buttons */}
                        {userParticipant && !userParticipant.has_paid && !split.is_completed && (
                          <button 
                            onClick={() => handlePaySplitAmount(split.id, userParticipant.amount_owed)}
                            style={{...mobileStyles.button, ...mobileStyles.successButton}}
                            disabled={loading}
                          >
                            {loading ? '⏳ Paying...' : `💰 Pay ${formatMistToSui(userParticipant.amount_owed)}`}
                          </button>
                        )}
                        
                        {userParticipant && userParticipant.has_paid && (
                          <div style={{ 
                            backgroundColor: '#d4edda', 
                            color: '#155724', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            fontSize: '14px',
                            textAlign: 'center'
                          }}>
                            ✅ You have paid your share
                          </div>
                        )}
                        
                        {isCreator && (
                          <div style={{ 
                            backgroundColor: '#cce5ff', 
                            color: '#004085', 
                            padding: '8px', 
                            borderRadius: '4px', 
                            fontSize: '14px',
                            textAlign: 'center',
                            marginTop: '5px'
                          }}>
                            👑 You created this split
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p style={{ color: '#666', fontStyle: 'italic', textAlign: 'center' }}>No split payments found</p>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={mobileStyles.container}>
      {/* Header */}
      <div style={mobileStyles.header}>
        <h1 style={mobileStyles.title}>🌊 SuiConn</h1>
        <ConnectButton />
      </div>

      {!connected ? (
        <div style={{...mobileStyles.card, textAlign: 'center', padding: '40px 20px'}}>
          <h2 style={{ color: '#2c3e50', marginBottom: '15px' }}>👋 Welcome to SuiConn</h2>
          <p style={{ color: '#666', marginBottom: '20px' }}>Connect your wallet to start using the social payment platform</p>
        </div>
      ) : !userProfile ? (
        <div style={mobileStyles.card}>
          <h2 style={{ margin: '0 0 20px 0', color: '#2c3e50' }}>📝 Register</h2>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a unique username"
            style={mobileStyles.input}
            maxLength={20}
          />
          <button 
            onClick={handleRegister} 
            disabled={loading || !username}
            style={{...mobileStyles.button, ...mobileStyles.primaryButton}}
          >
            {loading ? '⏳ Registering...' : '📝 Register'}
          </button>
          <p style={{ fontSize: '12px', color: '#666', margin: '10px 0 0 0' }}>
            Username must be unique and contain only letters, numbers, and underscores
          </p>
        </div>
      ) : (
        <div>
          {/* Mobile Tab Navigation */}
          <div style={mobileStyles.tabContainer}>
            {[
              { key: 'profile', label: '👤', title: 'Profile' },
              { key: 'friends', label: '👥', title: 'Friends' },
              { key: 'payments', label: '💸', title: 'Pay' },
              { key: 'splits', label: '🔄', title: 'Splits' }
            ].map(tab => (
              <div
                key={tab.key}
                style={{
                  ...mobileStyles.tab,
                  ...(activeTab === tab.key ? mobileStyles.activeTab : mobileStyles.inactiveTab)
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                <div style={{ fontSize: '18px', marginBottom: '2px' }}>{tab.label}</div>
                <div style={{ fontSize: '12px' }}>{tab.title}</div>
              </div>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      )}

      {/* Friend Selector Modal */}
      {showFriendSelector && (
        <div style={mobileStyles.friendSelector}>
          <div style={mobileStyles.friendSelectorContent}>
            <h3 style={{ margin: '0 0 15px 0' }}>
              {friendSelectorFor === 'split' ? '🔄 Select Friends for Split' : '💸 Select Friend to Pay'}
            </h3>
            
            {friendsList.length > 0 ? (
              <div>
                {friendsList.map((friend, index) => (
                  <div 
                    key={index} 
                    style={{
                      ...mobileStyles.checkboxItem,
                      backgroundColor: selectedFriends.includes(friend.username) ? '#e3f2fd' : '#f8f9fa'
                    }}
                    onClick={() => {
                      if (friendSelectorFor === 'payment') {
                        setSelectedFriends([friend.username]);
                      } else {
                        toggleFriendSelection(friend.username);
                      }
                    }}
                  >
                    <input
                      type={friendSelectorFor === 'payment' ? 'radio' : 'checkbox'}
                      checked={selectedFriends.includes(friend.username)}
                      onChange={() => {}}
                      style={{ marginRight: '10px' }}
                    />
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{friend.username}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {friend.address.slice(0, 8)}...{friend.address.slice(-6)}
                      </div>
                    </div>
                  </div>
                ))}
                
                <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={confirmFriendSelection}
                    style={{...mobileStyles.button, ...mobileStyles.successButton, marginBottom: 0}}
                    disabled={selectedFriends.length === 0}
                  >
                    ✅ Confirm ({selectedFriends.length})
                  </button>
                  <button 
                    onClick={closeFriendSelector}
                    style={{...mobileStyles.button, ...mobileStyles.dangerButton, marginBottom: 0}}
                  >
                    ❌ Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p>No friends available</p>
                <button 
                  onClick={closeFriendSelector}
                  style={{...mobileStyles.button, ...mobileStyles.primaryButton}}
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '10px',
          right: '10px',
          backgroundColor: '#dc3545',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <strong>❌ Error:</strong> {error}
        </div>
      )}
      
      {success && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '10px',
          right: '10px',
          backgroundColor: '#28a745',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <strong>✅ Success:</strong> {success}
        </div>
      )}
      
      {loading && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          left: '10px',
          right: '10px',
          backgroundColor: '#007bff',
          color: 'white',
          padding: '15px',
          borderRadius: '8px',
          zIndex: 1000,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
          <strong>⏳ Processing:</strong> Transaction in progress...
        </div>
      )}
    </div>
  );
}
