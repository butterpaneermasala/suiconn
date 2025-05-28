import { useState, Dispatch, SetStateAction } from "react";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { formatAddress } from "@mysten/sui/utils";
import { Button } from "./button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./card";
import { UserIcon, FriendsIcon, PaymentIcon, SplitIcon, HistoryIcon, SendIcon, CheckIcon, CloseIcon } from "../icons";
import type {
  UserProfile,
  FriendRequest,
  Friend,
  SplitPayment,
  PaymentRecord,
  BatchPayment
} from '../../types';
import type { ReactNode } from 'react';

interface SuiConnUIProps {
  userProfile: UserProfile | null;
  username: string;
  loading: boolean;
  onRegister: () => void;
  onUsernameChange: (username: string) => void;
  onDisconnect: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  renderTabContent: () => ReactNode;

  // Add all the props being passed from SuiConnApp
  friendRequests: FriendRequest[];
  friends: Friend[];
  splitPayments: SplitPayment[];
  paymentHistory: PaymentRecord[];
  friendTransactionHistory: Record<string, PaymentRecord[]>;
  friendToAdd: string;
  setFriendToAdd: Dispatch<SetStateAction<string>>;
  selectedFriends: string[];
  setSelectedFriends: Dispatch<SetStateAction<string[]>>;
  paymentRecipient: string;
  setPaymentRecipient: Dispatch<SetStateAction<string>>;
  paymentAmount: string;
  setPaymentAmount: Dispatch<SetStateAction<string>>;
  paymentMemo: string;
  setPaymentMemo: Dispatch<SetStateAction<string>>;
  splitTitle: string;
  setSplitTitle: Dispatch<SetStateAction<string>>;
  splitAmount: string;
  setSplitAmount: Dispatch<SetStateAction<string>>;
  splitParticipants: string;
  setSplitParticipants: Dispatch<SetStateAction<string>>;
  customSplitAmounts: string;
  setCustomSplitAmounts: Dispatch<SetStateAction<string>>;
  showFriendSelector: boolean;
  setShowFriendSelector: Dispatch<SetStateAction<boolean>>;
  friendSelectorFor: string;
  setFriendSelectorFor: Dispatch<SetStateAction<string>>;
  splitType: 'equal' | 'custom';
  setSplitType: Dispatch<SetStateAction<'equal' | 'custom'>>;
  batchPayments: BatchPayment[];
  setBatchPayments: Dispatch<SetStateAction<BatchPayment[]>>;
  showBatchPayment: boolean;
  setShowBatchPayment: Dispatch<SetStateAction<boolean>>;
  selectedFriendForHistory: string | null;
  setSelectedFriendForHistory: Dispatch<SetStateAction<string | null>>;

  // Handlers
  handleSendFriendRequest: () => void;
  handleRespondToRequest: (requestId: string, accept: boolean) => void;
  handleSendPayment: () => void;
  handleBatchPayment: () => void;
  handleCreateSplitPayment: () => void;
  handlePaySplitAmount: (splitPaymentId: string, amountOwed: number) => void;
  openFriendSelector: (purpose: string) => void;
  closeFriendSelector: () => void;
  toggleFriendSelection: (friendUsername: string) => void;
  confirmFriendSelection: () => void;
  addBatchPaymentRow: () => void;
  removeBatchPaymentRow: (index: number) => void;
  updateBatchPayment: (index: number, field: keyof BatchPayment, value: string[]) => void;

  // Helper
  formatMistToSui: (mistAmount: number) => string;

  // Icons (passed as props for now)
  UserIcon: () => JSX.Element;
  FriendsIcon: () => JSX.Element;
  PaymentIcon: () => JSX.Element;
  SplitIcon: () => JSX.Element;
  HistoryIcon: () => JSX.Element;
  SendIcon: () => JSX.Element;
  CheckIcon: () => JSX.Element;
  CloseIcon: () => JSX.Element;
}

export function SuiConnUI({
  userProfile,
  username,
  loading,
  onRegister,
  onUsernameChange,
  onDisconnect,
  activeTab,
  onTabChange,
  renderTabContent,
  // Destructure all the new props
  friendRequests,
  friends,
  splitPayments,
  paymentHistory,
  friendTransactionHistory,
  friendToAdd,
  setFriendToAdd,
  selectedFriends,
  setSelectedFriends,
  paymentRecipient,
  setPaymentRecipient,
  paymentAmount,
  setPaymentAmount,
  paymentMemo,
  setPaymentMemo,
  splitTitle,
  setSplitTitle,
  splitAmount,
  setSplitAmount,
  splitParticipants,
  setSplitParticipants,
  customSplitAmounts,
  setCustomSplitAmounts,
  showFriendSelector,
  setShowFriendSelector,
  friendSelectorFor,
  setFriendSelectorFor,
  splitType,
  setSplitType,
  batchPayments,
  setBatchPayments,
  showBatchPayment,
  setShowBatchPayment,
  selectedFriendForHistory,
  setSelectedFriendForHistory,

  // Destructure handlers
  handleSendFriendRequest,
  handleRespondToRequest,
  handleSendPayment,
  handleBatchPayment,
  handleCreateSplitPayment,
  handlePaySplitAmount,
  openFriendSelector,
  closeFriendSelector,
  toggleFriendSelection,
  confirmFriendSelection,
  addBatchPaymentRow,
  removeBatchPaymentRow,
  updateBatchPayment,

  // Destructure helper
  formatMistToSui,

  // Destructure Icons
  UserIcon,
  FriendsIcon,
  PaymentIcon,
  SplitIcon,
  HistoryIcon,
  SendIcon,
  CheckIcon,
  CloseIcon,
}: SuiConnUIProps) {
  const { account, connected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-blue-900/50 backdrop-blur-lg border-blue-700/50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-white">SuiConn</CardTitle>
          <CardDescription className="text-blue-200">
            Connect your wallet to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!connected ? (
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-200">Connected as</p>
                  <p className="font-mono text-white">{formatAddress(account?.address || '')}</p>
                </div>
                <Button
                  variant="outline"
                  onClick={onDisconnect}
                  className="border-blue-700 text-blue-200 hover:bg-blue-800"
                >
                  Disconnect
                </Button>
              </div>
              {!userProfile ? (
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => onUsernameChange(e.target.value)}
                      placeholder="Enter username"
                      className="flex-1 px-4 py-2 bg-blue-800/50 border border-blue-700 rounded-lg text-white placeholder-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <Button
                      onClick={onRegister}
                      disabled={loading || !username}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex space-x-4 border-b border-blue-700/50">
                    <button
                      onClick={() => onTabChange('profile')}
                      className={`px-4 py-2 ${
                        activeTab === 'profile'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <UserIcon className="inline-block mr-2" />
                      Profile
                    </button>
                    <button
                      onClick={() => onTabChange('friends')}
                      className={`px-4 py-2 ${
                        activeTab === 'friends'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <FriendsIcon className="inline-block mr-2" />
                      Friends
                    </button>
                    <button
                      onClick={() => onTabChange('payments')}
                      className={`px-4 py-2 ${
                        activeTab === 'payments'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <PaymentIcon className="inline-block mr-2" />
                      Payments
                    </button>
                    <button
                      onClick={() => onTabChange('splits')}
                      className={`px-4 py-2 ${
                        activeTab === 'splits'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <SplitIcon className="inline-block mr-2" />
                      Splits
                    </button>
                    <button
                      onClick={() => onTabChange('history')}
                      className={`px-4 py-2 ${
                        activeTab === 'history'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <HistoryIcon className="inline-block mr-2" />
                      History
                    </button>
                  </div>
                  {renderTabContent()}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 