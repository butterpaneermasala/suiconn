import { useState, useEffect, useRef } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

const PACKAGE_ID = '0xb0d759fa0e301c27bee0b451b80cb9479171fe9674251eaf1d96b8a1d9693a6b';
const REGISTRY_OBJECT_ID = '0x4432099e7bdf4b607f09a28f3e7f0feaa9ee396dba779baf12b5814e23cfda11';
const USER_PROFILES_TABLE_ID = '0x6d4114ff53d3fb8352d0a40638aaccbf58b3833b06f981ceb8a544ed9dfa56f3';
const FRIEND_REQUESTS_TABLE_ID = '0xcfe84647c1b2c4a23dad88e77846552b995c417c7b0b5d8ef36fb7f112ad8610';
const SPLIT_PAYMENTS_TABLE_ID = '0x2e43a39d74678a277ec75e5557c0290b585c8cad25677f4e239b1c61c30ecc4d';
const PAYMENT_HISTORY_TABLE_ID = '0x4eb7d1fa28011028dfa5337d708dee756a6a0d84b7408e552806f0fa778e1499';
const USERNAME_REGISTRY_TABLE_ID = '0xcf30d3fdd6fb90502f3e4e06f10505485c1459d3f69ca2eeab8703fa4efd7d80';
const suiClient = new SuiClient({ url: getFullnodeUrl('devnet') });

// Interfaces remain the same
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

interface PaymentRecord {
  id: string;
  from: string;
  to: string;
  amount: number;
  memo: string;
  payment_type: number;
  related_id: string | null;
  timestamp: number;
  status: number;
  fromUsername?: string;
  toUsername?: string;
}

interface BatchPayment {
  recipients: string[];
  amounts: string[];
  memos: string[];
}

// SVG Icons Components
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const FriendsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 11C11.2091 11 13 9.20914 13 7C13 4.79086 11.2091 3 9 3C6.79086 3 5 4.79086 5 7C5 9.20914 6.79086 11 9 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const PaymentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1V23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M17 5H9.5C8.57174 5 7.6815 5.36875 7.02513 6.02513C6.36875 6.6815 6 7.57174 6 8.5C6 9.42826 6.36875 10.3185 7.02513 10.9749C7.6815 11.6312 8.57174 12 9.5 12H14.5C15.4283 12 16.3185 12.3687 16.9749 13.0251C17.6312 13.6815 18 14.5717 18 15.5C18 16.4283 17.6312 17.3185 16.9749 17.9749C16.3185 18.6312 15.4283 19 14.5 19H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SplitIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 9H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 13H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M10 17L12 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const HistoryIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12Z" stroke="currentColor" strokeWidth="2"/>
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export default function SuiConnApp() {
  const { signAndExecuteTransaction, account, connected } = useWallet();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friendsList, setFriendsList] = useState<Friend[]>([]);
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<PaymentRecord[]>([]);
  const [friendTransactionHistory, setFriendTransactionHistory] = useState<{[key: string]: PaymentRecord[]}>({});
  const [activeTab, setActiveTab] = useState('profile');
  const [selectedFriendForHistory, setSelectedFriendForHistory] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [friendToAdd, setFriendToAdd] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [paymentRecipient, setPaymentRecipient] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMemo, setPaymentMemo] = useState('');
  const [splitTitle, setSplitTitle] = useState('');
  const [splitAmount, setSplitAmount] = useState('');
  const [splitParticipants, setSplitParticipants] = useState('');
  const [customSplitAmounts, setCustomSplitAmounts] = useState('');
  const [showFriendSelector, setShowFriendSelector] = useState(false);
  const [friendSelectorFor, setFriendSelectorFor] = useState('');
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  
  // Batch payment states
  const [batchPayments, setBatchPayments] = useState<BatchPayment[]>([{ recipients: [''], amounts: [''], memos: [''] }]);
  const [showBatchPayment, setShowBatchPayment] = useState(false);

  // Enhanced glassmorphism styles
  const glassStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      padding: '20px',
      position: 'relative' as const,
      overflow: 'hidden'
    },
    backgroundEffect: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `
        radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 60%, rgba(119, 198, 255, 0.3) 0%, transparent 50%)
      `,
      animation: 'float 6s ease-in-out infinite'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '20px',
      marginBottom: '30px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      zIndex: 10,
      gap: '20px',
    },
    logo: {
      fontSize: '28px',
      fontWeight: '700',
      color: '#fff',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
      letterSpacing: '-0.5px'
    },
    glassCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '25px',
      marginBottom: '20px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      zIndex: 10
    },
    tabContainer: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '8px',
      display: 'flex',
      marginBottom: '30px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      position: 'relative' as const,
      zIndex: 10
    },
    tab: {
      flex: 1,
      padding: '12px 8px',
      textAlign: 'center' as const,
      cursor: 'pointer',
      borderRadius: '12px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.3s ease',
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      gap: '4px'
    },
    activeTab: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: '#fff',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
    },
    inactiveTab: {
      color: 'rgba(255, 255, 255, 0.7)',
      background: 'transparent'
    },
    input: {
      width: '100%',
      padding: '15px 20px',
      fontSize: '16px',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '12px',
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      color: '#fff',
      marginBottom: '15px',
      outline: 'none',
      transition: 'all 0.3s ease',
      '::placeholder': {
        color: 'rgba(255, 255, 255, 0.6)'
      }
    },
    button: {
      width: '100%',
      padding: '15px 25px',
      fontSize: '16px',
      fontWeight: '600',
      border: 'none',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      position: 'relative' as const,
      overflow: 'hidden',
      marginBottom: '10px'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: '#fff',
      boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
    },
    successButton: {
      background: 'linear-gradient(135deg, #56ccf2 0%, #2f80ed 100%)',
      color: '#fff',
      boxShadow: '0 8px 20px rgba(86, 204, 242, 0.4)'
    },
    dangerButton: {
      background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%)',
      color: '#fff',
      boxShadow: '0 8px 20px rgba(255, 107, 107, 0.4)'
    },
    warningButton: {
      background: 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)',
      color: '#fff',
      boxShadow: '0 8px 20px rgba(254, 202, 87, 0.4)'
    },
    smallButton: {
      padding: '8px 16px',
      fontSize: '14px',
      borderRadius: '8px',
      minWidth: 'auto',
      width: 'auto'
    },
    cardTitle: {
      fontSize: '22px',
      fontWeight: '700',
      color: '#fff',
      marginBottom: '20px',
      textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
    },
    cardSubtitle: {
      fontSize: '16px',
      color: 'rgba(255, 255, 255, 0.8)',
      marginBottom: '15px'
    },
    cardText: {
      fontSize: '14px',
      color: 'rgba(255, 255, 255, 0.9)',
      lineHeight: '1.5'
    },
    statGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
      gap: '15px',
      marginTop: '20px'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '15px',
      textAlign: 'center' as const
    },
    modal: {
      position: 'fixed' as const,
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      backdropFilter: 'blur(10px)',
      WebkitBackdropFilter: 'blur(10px)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    },
    modalContent: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(30px)',
      WebkitBackdropFilter: 'blur(30px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      borderRadius: '20px',
      padding: '30px',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflow: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)'
    },
    notification: {
      position: 'fixed' as const,
      bottom: '20px',
      right: '20px',
      left: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      padding: '15px 20px',
      borderRadius: '12px',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
      zIndex: 1000,
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500'
    },
    successNotification: {
      background: 'rgba(86, 204, 242, 0.2)'
    },
    errorNotification: {
      background: 'rgba(255, 107, 107, 0.2)'
    },
    loadingNotification: {
      background: 'rgba(102, 126, 234, 0.2)'
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
        setTransactionHistory(historyWithUsernames);
        
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
      setTransactionHistory([]);
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
          fetchTransactionHistory();
        } else {
          setUserProfile(null);
        }
      });
    } else {
      setUserProfile(null);
      setFriendRequests([]);
      setFriendsList([]);
      setSplitPayments([]);
      setTransactionHistory([]);
      setFriendTransactionHistory({});
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
    } else {
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
          <div>
            {/* User Profile Display */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Your Profile</h3>
              <div style={glassStyles.statGrid}>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.username}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Username
                  </div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {friendsList.length}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Friends
                  </div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_sent}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Payments Sent
                  </div>
                </div>
                <div style={glassStyles.statCard}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#fff' }}>
                    {userProfile?.total_payments_received}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    Payments Received
                  </div>
                </div>
              </div>
              <div style={{ marginTop: '20px', padding: '15px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px' }}>
                <div style={glassStyles.cardText}>
                  <strong>Address:</strong> {userProfile?.address.slice(0, 10)}...{userProfile?.address.slice(-8)}
                </div>
                <div style={glassStyles.cardText}>
                  <strong>Status:</strong> {userProfile?.is_active ? 'Active' : 'Inactive'}
                </div>
                <div style={glassStyles.cardText}>
                  <strong>Pending Requests:</strong> {friendRequests.length}
                </div>
              </div>
        </div>

            {/* Split Payments Overview */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Recent Split Payments</h3>
              {splitPayments.length > 0 ? (
                splitPayments.slice(0, 3).map((split, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                      {split.title}
                    </div>
                    <div style={glassStyles.cardText}>
                      Total: {formatMistToSui(split.total_amount)} | 
                      Creator: {split.creatorUsername} | 
                      Status: {split.is_completed ? 'Completed' : 'Pending'}
                    </div>
                  </div>
                ))
              ) : (
                <div style={glassStyles.cardText}>No split payments</div>
              )}
              {splitPayments.length > 3 && (
                <button 
                  onClick={() => setActiveTab('splits')}
                  style={{...glassStyles.button, ...glassStyles.primaryButton, ...glassStyles.smallButton}}
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
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Add Friend</h3>
              <input
                type="text"
                value={friendToAdd}
                onChange={(e) => setFriendToAdd(e.target.value)}
                placeholder="Enter friend's username"
                style={glassStyles.input}
              />
              <button 
                onClick={handleSendFriendRequest} 
                disabled={loading || !friendToAdd}
                style={{...glassStyles.button, ...glassStyles.primaryButton}}
              >
                <SendIcon />
                {loading ? 'Sending...' : 'Send Friend Request'}
              </button>
            </div>

            {/* Pending Friend Requests */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Pending Requests ({friendRequests.length})</h3>
              {friendRequests.length > 0 ? (
                friendRequests.map((req, index) => (
                  <div key={index} style={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '15px',
                    borderRadius: '12px',
                    marginBottom: '15px',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}>
                    <div style={{ marginBottom: '10px' }}>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                        {req.fromUsername}
                      </div>
                      <div style={glassStyles.cardText}>
                        From: {req.from.slice(0, 8)}...{req.from.slice(-6)}
                      </div>
                      <div style={glassStyles.cardText}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, true)}
                        style={{...glassStyles.button, ...glassStyles.successButton, ...glassStyles.smallButton}}
                        disabled={loading}
                      >
                        <CheckIcon />
                        Accept
                      </button>
                      <button 
                        onClick={() => handleRespondToRequest(req.id, false)}
                        style={{...glassStyles.button, ...glassStyles.dangerButton, ...glassStyles.smallButton}}
                        disabled={loading}
                      >
                        <CloseIcon />
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={glassStyles.cardText}>No pending friend requests</div>
              )}
            </div>

            {/* Friends List */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Your Friends ({friendsList.length})</h3>
              {friendsList.length > 0 ? (
                friendsList.map((friend, index) => {
                  const friendHistory = friendTransactionHistory[friend.address] || [];
                  const totalSent = friendHistory
                    .filter(tx => tx.from === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  const totalReceived = friendHistory
                    .filter(tx => tx.to === account?.address)
                    .reduce((sum, tx) => sum + tx.amount, 0);
                  
                  return (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '15px',
                      borderRadius: '12px',
                      marginBottom: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                          {friend.username}
                        </div>
                        <div style={glassStyles.cardText}>
                          {friend.address.slice(0, 8)}...{friend.address.slice(-6)}
                        </div>
                        <div style={glassStyles.cardText}>
                          Sent: {formatMistToSui(totalSent)} | Received: {formatMistToSui(totalReceived)}
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        <button 
                          onClick={() => {
                            setPaymentRecipient(friend.username);
                            setActiveTab('payments');
                          }}
                          style={{...glassStyles.button, ...glassStyles.primaryButton, ...glassStyles.smallButton}}
                        >
                          Pay
                        </button>
                        <button 
                          onClick={() => setSelectedFriendForHistory(friend.address)}
                          style={{...glassStyles.button, ...glassStyles.warningButton, ...glassStyles.smallButton}}
                        >
                          History
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={glassStyles.cardText}>No friends yet. Send some friend requests!</div>
              )}
            </div>
          </div>
        );

      case 'payments':
        return (
                        <div>
            {/* Send Payment */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Send Payment</h3>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <input
                            type="text"
                  value={paymentRecipient}
                  onChange={(e) => setPaymentRecipient(e.target.value)}
                  placeholder="Recipient username"
                  style={{...glassStyles.input, marginBottom: 0, flex: 1}}
                />
                <button 
                  onClick={() => openFriendSelector('payment')}
                  style={{...glassStyles.button, ...glassStyles.primaryButton, ...glassStyles.smallButton, width: 'auto'}}
                  disabled={friendsList.length === 0}
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
                style={glassStyles.input}
              />
                          <input
                            type="text"
                value={paymentMemo}
                onChange={(e) => setPaymentMemo(e.target.value)}
                placeholder="Memo (optional)"
                style={glassStyles.input}
              />
              <button 
                onClick={handleSendPayment} 
                disabled={loading || !paymentRecipient || !paymentAmount}
                style={{...glassStyles.button, ...glassStyles.successButton}}
              >
                <SendIcon />
                {loading ? 'Sending...' : 'Send Payment'}
              </button>
                        </div>

            {/* Batch Payment */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Batch Payment</h3>
              <button 
                onClick={() => setShowBatchPayment(true)}
                style={{...glassStyles.button, ...glassStyles.warningButton}}
              >
                Create Batch Payment
              </button>
              <div style={glassStyles.cardText}>
                Send multiple payments at once to save time and gas fees
                      </div>
            </div>

            {/* Split Payments */}
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Create Split Payment</h3>
              
              {/* Split Type Selector */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ ...glassStyles.cardSubtitle, marginBottom: '10px' }}>Split Type:</div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setSplitType('equal')}
                    style={{
                      ...glassStyles.button,
                      ...(splitType === 'equal' ? glassStyles.primaryButton : { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)' }),
                      flex: 1
                    }}
                  >
                    Equal Split
                  </button>
                  <button
                    onClick={() => setSplitType('custom')}
                    style={{
                      ...glassStyles.button,
                      ...(splitType === 'custom' ? glassStyles.primaryButton : { background: 'rgba(255, 255, 255, 0.1)', color: 'rgba(255, 255, 255, 0.7)' }),
                      flex: 1
                    }}
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
                style={glassStyles.input}
              />

              {splitType === 'equal' ? (
                <input
                  type="number"
                  step="0.000000001"
                  value={splitAmount}
                  onChange={(e) => setSplitAmount(e.target.value)}
                  placeholder="Total amount in SUI"
                  style={glassStyles.input}
                />
              ) : (
                          <input
                            type="text"
                  value={customSplitAmounts}
                  onChange={(e) => setCustomSplitAmounts(e.target.value)}
                  placeholder="Amounts in SUI (comma-separated, e.g., 0.1,0.2,0.3)"
                  style={glassStyles.input}
                />
              )}

              <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                          <input
                            type="text"
                  value={splitParticipants}
                  onChange={(e) => setSplitParticipants(e.target.value)}
                  placeholder="Participants (comma-separated usernames)"
                  style={{...glassStyles.input, marginBottom: 0, flex: 1}}
                />
                <button 
                  onClick={() => openFriendSelector('split')}
                  style={{...glassStyles.button, ...glassStyles.primaryButton, ...glassStyles.smallButton, width: 'auto'}}
                  disabled={friendsList.length === 0}
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
                style={{...glassStyles.button, ...glassStyles.primaryButton}}
              >
                <SplitIcon />
                {loading ? 'Creating...' : `Create ${splitType === 'equal' ? 'Equal' : 'Custom'} Split`}
              </button>
                      </div>
          </div>
        );
                      
      case 'splits':
        return (
                      <div>
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Your Split Payments ({splitPayments.length})</h3>
              {splitPayments.length > 0 ? (
                splitPayments.map((split, index) => {
                  const userParticipant = split.participants.find(p => p.address === account?.address);
                  const isCreator = split.creator === account?.address;
                  
                  return (
                    <div key={index} style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '20px',
                      borderRadius: '12px',
                      marginBottom: '15px',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}>
                      <div style={{ marginBottom: '15px' }}>
                        <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', marginBottom: '10px' }}>
                          {split.title}
                                </div>
                        <div style={glassStyles.cardText}>
                          <strong>Total:</strong> {formatMistToSui(split.total_amount)}
                              </div>
                        <div style={glassStyles.cardText}>
                          <strong>Creator:</strong> {split.creatorUsername} {isCreator && '(You)'}
                          </div>
                        <div style={glassStyles.cardText}>
                          <strong>Status:</strong> {split.is_completed ? 'Completed' : 'Pending'}
                      </div>

                        {/* Participants */}
                        <div style={{ 
                          background: 'rgba(255, 255, 255, 0.05)', 
                          padding: '15px', 
                          borderRadius: '8px', 
                          marginTop: '15px' 
                        }}>
                          <div style={{ ...glassStyles.cardSubtitle, marginBottom: '10px' }}>Participants:</div>
                          {split.participants.map((participant, pIndex) => (
                            <div key={pIndex} style={{ 
                              ...glassStyles.cardText, 
                              marginBottom: '5px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}>
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
                            style={{...glassStyles.button, ...glassStyles.successButton}}
                            disabled={loading}
                          >
                            {loading ? 'Paying...' : `Pay ${formatMistToSui(userParticipant.amount_owed)}`}
                          </button>
                        )}
                        
                        {userParticipant && userParticipant.has_paid && (
                          <div style={{ 
                            background: 'rgba(76, 175, 80, 0.2)', 
                            color: '#4CAF50', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            textAlign: 'center',
                            marginTop: '10px'
                          }}>
                            You have paid your share
                      </div>
                        )}
                        
                        {isCreator && (
                          <div style={{ 
                            background: 'rgba(102, 126, 234, 0.2)', 
                            color: '#667eea', 
                            padding: '10px', 
                            borderRadius: '8px', 
                            textAlign: 'center',
                            marginTop: '10px'
                          }}>
                            You created this split
                        </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={glassStyles.cardText}>No split payments found</div>
              )}
                                  </div>
                                </div>
        );

      case 'history':
        return (
          <div>
            <div style={glassStyles.glassCard}>
              <h3 style={glassStyles.cardTitle}>Transaction History ({transactionHistory.length})</h3>
              {transactionHistory.length > 0 ? (
                transactionHistory.map((record, index) => {
                  const isOutgoing = record.from === account?.address;
                  const paymentTypeText = record.payment_type === 0 ? 'Direct Payment' : 
                                        record.payment_type === 1 ? 'Split Payment' : 'Group Payment';
                  const statusText = record.status === 0 ? 'Pending' : 
                                   record.status === 1 ? 'Completed' : 'Failed';
                  
                  return (
                    <div key={index} style={{
                      background: isOutgoing ? 'rgba(255, 193, 7, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                      padding: '15px',
                      borderRadius: '12px',
                      marginBottom: '15px',
                      border: `1px solid ${isOutgoing ? 'rgba(255, 193, 7, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
                    }}>
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
                      <div style={glassStyles.cardText}>
                        {isOutgoing ? `To: ${record.toUsername}` : `From: ${record.fromUsername}`}
                                  </div>
                      <div style={glassStyles.cardText}>
                        Amount: {formatMistToSui(record.amount)}
                                </div>
                      {record.memo && (
                        <div style={glassStyles.cardText}>
                          Memo: {record.memo}
                          </div>
                        )}
                      <div style={glassStyles.cardText}>
                        {new Date(record.timestamp).toLocaleDateString()} - {statusText}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={glassStyles.cardText}>No transaction history</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={glassStyles.container}>
      {/* Background Effect */}
      <div style={glassStyles.backgroundEffect}></div>
      
      {/* CSS Animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(5px, -5px) rotate(1deg); }
            50% { transform: translate(-3px, 3px) rotate(-1deg); }
            75% { transform: translate(-5px, -3px) rotate(1deg); }
          }
          
          input::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
          }
          
          input:focus {
            border-color: rgba(255, 255, 255, 0.4) !important;
            box-shadow: 0 0 20px rgba(255, 255, 255, 0.1) !important;
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(0, 0, 0, 0.2) !important;
          }
          
          button:active {
            transform: translateY(0);
          }
        `}
      </style>

      {/* Header */}
      <div style={glassStyles.header}>
        <h1 style={glassStyles.logo}>SuiConn</h1>
        <ConnectButton />
      </div>

      {!connected ? (
        <div style={{...glassStyles.glassCard, textAlign: 'center', padding: '60px 30px'}}>
          <h2 style={glassStyles.cardTitle}>Welcome to SuiConn</h2>
          <div style={glassStyles.cardSubtitle}>Connect your wallet to start using the social payment platform</div>
        </div>
      ) : !userProfile ? (
        <div style={glassStyles.glassCard}>
          <h2 style={glassStyles.cardTitle}>Register</h2>
                          <input
                            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a unique username"
            style={glassStyles.input}
            maxLength={20}
          />
          <button 
            onClick={handleRegister} 
            disabled={loading || !username}
            style={{...glassStyles.button, ...glassStyles.primaryButton}}
          >
            <UserIcon />
            {loading ? 'Registering...' : 'Register'}
          </button>
          <div style={glassStyles.cardText}>
            Username must be unique and contain only letters, numbers, and underscores
                        </div>
                      </div>
      ) : (
                      <div>
          {/* Tab Navigation */}
          <div style={glassStyles.tabContainer}>
            {[
              { key: 'profile', icon: <UserIcon />, label: 'Profile' },
              { key: 'friends', icon: <FriendsIcon />, label: 'Friends' },
              { key: 'payments', icon: <PaymentIcon />, label: 'Pay' },
              { key: 'splits', icon: <SplitIcon />, label: 'Splits' },
              { key: 'history', icon: <HistoryIcon />, label: 'History' }
            ].map(tab => (
              <div
                key={tab.key}
                style={{
                  ...glassStyles.tab,
                  ...(activeTab === tab.key ? glassStyles.activeTab : glassStyles.inactiveTab)
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </div>
            ))}
          </div>

          {/* Tab Content */}
          {renderTabContent()}
        </div>
      )}

      {/* Batch Payment Modal */}
      {showBatchPayment && (
        <div style={glassStyles.modal}>
          <div style={glassStyles.modalContent}>
            <h3 style={glassStyles.cardTitle}>Create Batch Payment</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <button 
                onClick={() => openFriendSelector('batch')}
                style={{...glassStyles.button, ...glassStyles.warningButton}}
                disabled={friendsList.length === 0}
              >
                <FriendsIcon />
                Select Friends for Batch
              </button>
            </div>

            {batchPayments.map((payment, index) => (
              <div key={index} style={{
                background: 'rgba(255, 255, 255, 0.05)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '15px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                  <h4 style={{ margin: 0, color: '#fff' }}>Payment #{index + 1}</h4>
                  {batchPayments.length > 1 && (
                    <button 
                      onClick={() => removeBatchPaymentRow(index)}
                      style={{...glassStyles.button, ...glassStyles.dangerButton, ...glassStyles.smallButton}}
                    >
                      <CloseIcon />
                      Remove
                    </button>
                  )}
                </div>
                
                          <input
                            type="text"
                  value={payment.recipients[0]}
                  onChange={(e) => updateBatchPayment(index, 'recipients', [e.target.value])}
                  placeholder="Recipient username"
                  style={glassStyles.input}
                />
                
                          <input
                            type="number"
                  step="0.000000001"
                  value={payment.amounts[0]}
                  onChange={(e) => updateBatchPayment(index, 'amounts', [e.target.value])}
                  placeholder="Amount in SUI"
                  style={glassStyles.input}
                />
                
                                <input
                                  type="text"
                  value={payment.memos[0]}
                  onChange={(e) => updateBatchPayment(index, 'memos', [e.target.value])}
                  placeholder="Memo (optional)"
                  style={glassStyles.input}
                />
                              </div>
                            ))}

            <div style={{ display: 'flex', gap: '10px', marginTop: '30px' }}>
              <button 
                onClick={addBatchPaymentRow}
                style={{...glassStyles.button, ...glassStyles.warningButton, marginBottom: 0}}
              >
                Add Payment
              </button>
              <button 
                onClick={handleBatchPayment}
                style={{...glassStyles.button, ...glassStyles.successButton, marginBottom: 0}}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Batch'}
              </button>
              <button 
                onClick={() => setShowBatchPayment(false)}
                style={{...glassStyles.button, ...glassStyles.dangerButton, marginBottom: 0}}
              >
                Cancel
              </button>
                          </div>
          </div>
        </div>
      )}

      {/* Friend Transaction History Modal */}
      {selectedFriendForHistory && (
        <div style={glassStyles.modal}>
          <div style={glassStyles.modalContent}>
            <h3 style={glassStyles.cardTitle}>
              Transaction History with {friendsList.find(f => f.address === selectedFriendForHistory)?.username}
            </h3>
            
            {friendTransactionHistory[selectedFriendForHistory]?.length > 0 ? (
              friendTransactionHistory[selectedFriendForHistory].map((record, index) => {
                const isOutgoing = record.from === account?.address;
                const paymentTypeText = record.payment_type === 0 ? 'Direct' : 
                                      record.payment_type === 1 ? 'Split' : 'Group';
                
                return (
                  <div key={index} style={{
                    background: isOutgoing ? 'rgba(255, 193, 7, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                    padding: '15px',
                    borderRadius: '12px',
                    marginBottom: '10px',
                    border: `1px solid ${isOutgoing ? 'rgba(255, 193, 7, 0.3)' : 'rgba(76, 175, 80, 0.3)'}`
                  }}>
                    <div style={{ fontWeight: '600', color: '#fff', marginBottom: '5px' }}>
                      {isOutgoing ? 'Sent' : 'Received'} - {paymentTypeText}
                    </div>
                    <div style={glassStyles.cardText}>
                      Amount: {formatMistToSui(record.amount)}
                    </div>
                    {record.memo && (
                      <div style={glassStyles.cardText}>
                        Memo: {record.memo}
                      </div>
                    )}
                    <div style={glassStyles.cardText}>
                      {new Date(record.timestamp).toLocaleDateString()} at {new Date(record.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={glassStyles.cardText}>
                No transaction history with this friend
              </div>
            )}
            
            <button 
              onClick={() => setSelectedFriendForHistory(null)}
              style={{...glassStyles.button, ...glassStyles.primaryButton, marginTop: '20px'}}
            >
              <CheckIcon />
              Close
            </button>
                        </div>
                      </div>
      )}

      {/* Friend Selector Modal */}
      {showFriendSelector && (
        <div style={glassStyles.modal}>
          <div style={glassStyles.modalContent}>
            <h3 style={glassStyles.cardTitle}>
              {friendSelectorFor === 'split' ? 'Select Friends for Split' : 
               friendSelectorFor === 'payment' ? 'Select Friend to Pay' :
               friendSelectorFor === 'batch' ? 'Select Friends for Batch Payment' : 'Select Friends'}
            </h3>
            
            {friendsList.length > 0 ? (
                      <div>
                {friendsList.map((friend, index) => (
                  <div 
                    key={index} 
                    style={{
                      background: selectedFriends.includes(friend.username) ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
                      padding: '15px',
                      borderRadius: '12px',
                      marginBottom: '10px',
                      cursor: 'pointer',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '15px'
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
                      style={{ accentColor: '#667eea' }}
                    />
                    <div>
                      <div style={{ fontWeight: '600', color: '#fff' }}>{friend.username}</div>
                      <div style={glassStyles.cardText}>
                        {friend.address.slice(0, 8)}...{friend.address.slice(-6)}
                                </div>
                                </div>
                              </div>
                            ))}
                
                <div style={{ marginTop: '30px', display: 'flex', gap: '10px' }}>
                  <button 
                    onClick={confirmFriendSelection}
                    style={{...glassStyles.button, ...glassStyles.successButton, marginBottom: 0}}
                    disabled={selectedFriends.length === 0}
                  >
                    <CheckIcon />
                    Confirm ({selectedFriends.length})
                  </button>
                  <button 
                    onClick={closeFriendSelector}
                    style={{...glassStyles.button, ...glassStyles.dangerButton, marginBottom: 0}}
                  >
                    <CloseIcon />
                    Cancel
                  </button>
                          </div>
                      </div>
            ) : (
              <div style={{ textAlign: 'center' }}>
                <div style={glassStyles.cardText}>No friends available</div>
                <button 
                  onClick={closeFriendSelector}
                  style={{...glassStyles.button, ...glassStyles.primaryButton}}
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
        <div style={{...glassStyles.notification, ...glassStyles.errorNotification}}>
          <CloseIcon />
          <strong>Error:</strong> {error}
          </div>
        )}
      
        {success && (
        <div style={{...glassStyles.notification, ...glassStyles.successNotification}}>
          <CheckIcon />
          <strong>Success:</strong> {success}
          </div>
        )}
      
      {loading && (
        <div style={{...glassStyles.notification, ...glassStyles.loadingNotification}}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            borderTop: '2px solid #fff',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
          <strong>Processing:</strong> Transaction in progress...
      </div>
      )}
    </div>
  );
}
