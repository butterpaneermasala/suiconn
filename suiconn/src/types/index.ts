export interface UserProfile {
  username: string;
  address: string;
  friends: string[];
  created_at: number;
  is_active: boolean;
  last_payment_time: number;
  daily_payment_count: number;
  last_friend_request_time: number;
  total_payments_sent: number;
  total_payments_received: number;
  enable_rate_limiting: boolean;
  enable_friend_verification: boolean;
  custom_daily_limit: number;
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