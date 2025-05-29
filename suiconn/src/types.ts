export interface UserProfile {
  username: string;
  address: string;
  friends: string[];
  created_at: number;
  last_payment_time: number;
  daily_payment_count: number;
  last_friend_request_time: number;
  total_payments_sent: number;
  total_payments_received: number;
  is_active: boolean;
}

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: number;
  updated_at: number;
  fromUsername?: string;
  toUsername?: string;
}

export interface Friend {
  address: string;
  username: string;
  added_at: number;
}

export interface SplitPayment {
  id: string;
  creator: string;
  title: string;
  total_amount: number;
  participants: SplitParticipant[];
  status: 'pending' | 'completed';
  created_at: number;
  completed_at: number | null;
  is_completed: boolean;
  payment_deadline: number | null;
  collected_amount: number;
  recipient_address: string;
  creatorUsername?: string;
}

export interface SplitParticipant {
  address: string;
  amount_owed: number;
  amount_paid: number;
  has_paid: boolean;
  paid_at: number | null;
  username?: string;
}

export interface PaymentRecord {
  id: string;
  from: string;
  to: string;
  amount: number;
  memo: string;
  payment_type: 'direct' | 'split' | 'batch';
  related_id: string | null;
  timestamp: number;
  status: 'completed' | 'failed';
  fromUsername?: string;
  toUsername?: string;
}

export interface BatchPayment {
  id: string;
  creator: string;
  payments: BatchPaymentItem[];
  status: 'pending' | 'completed';
  created_at: number;
  completed_at: number | null;
  is_completed: boolean;
  creatorUsername?: string;
}

export interface BatchPaymentItem {
  recipient: string;
  amount: number;
  memo: string;
  status: 'pending' | 'completed' | 'failed';
  recipientUsername?: string;
} 