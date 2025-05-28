export interface UserProfile {
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

export interface FriendRequest {
  id: string;
  from: string;
  to: string;
  status: number;
  created_at: number;
  updated_at: number;
  fromUsername?: string;
}

export interface Friend {
  addr: string;
  name: string;
}

export interface SplitPayment {
  id: string;
  creator: string;
  title: string;
  total_amount: number;
  participants: SplitParticipant[];
  created_at: number;
  is_completed: boolean;
  creatorUsername?: string;
}

export interface SplitParticipant {
  address: string;
  amount_owed: number;
  amount_paid: number;
  has_paid: boolean;
  username?: string;
}

export interface PaymentRecord {
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

export interface BatchPayment {
  recipients: string[];
  amounts: string[];
  memos: string[];
} 