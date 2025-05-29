import { Dispatch, SetStateAction } from "react";
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
import type { UserProfile } from '../../types';
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
}: SuiConnUIProps) {
  const { account, connected } = useWallet();

  return (
    <div className="w-full h-full">
      <Card className="mb-8 backdrop-blur-xl bg-white/15 border border-white/10 shadow-2xl hover:shadow-3xl transition-all duration-500">
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
                  className="border-white/20 bg-white/5 text-white hover:bg-white/10 transition-all duration-300"
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
                      className="flex-1 px-4 py-2 rounded-xl border border-white/20 bg-white/15 text-white placeholder-gray-400 backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-300"
                    />
                    <Button
                      onClick={onRegister}
                      disabled={loading || !username}
                      className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl shadow-lg hover:shadow-cyan-500/25 transition-all duration-300"
                    >
                      {loading ? 'Registering...' : 'Register'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-2 mb-4 justify-center border-b border-blue-700/50">
                    <button
                      onClick={() => onTabChange('profile')}
                      className={`px-2 py-1 sm:px-4 sm:py-2 text-sm rounded-lg font-medium ${
                        activeTab === 'profile'
                          ? 'text-cyan-300 border-b-2 border-cyan-300'
                          : 'text-white/70 hover:text-cyan-300'
                      }`}
                    >
                      <svg
                        className="inline-block w-5 h-5 mr-0 sm:mr-2"
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
                      <span className="hidden sm:inline">Profile</span>
                    </button>
                    <button
                      onClick={() => onTabChange('friends')}
                      className={`px-2 py-1 sm:px-4 sm:py-2 text-sm rounded-lg font-medium ${
                        activeTab === 'friends'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <svg
                        className="inline-block w-5 h-5 mr-0 sm:mr-2"
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
                      <span className="hidden sm:inline">Friends</span>
                    </button>
                    <button
                      onClick={() => onTabChange('payments')}
                      className={`px-2 py-1 sm:px-4 sm:py-2 text-sm rounded-lg font-medium ${
                        activeTab === 'payments'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <svg
                        className="inline-block w-5 h-5 mr-0 sm:mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                        <line x1="1" y1="10" x2="23" y2="10" />
                      </svg>
                      <span className="hidden sm:inline">Payments</span>
                    </button>
                    <button
                      onClick={() => onTabChange('splits')}
                      className={`px-2 py-1 sm:px-4 sm:py-2 text-sm rounded-lg font-medium ${
                        activeTab === 'splits'
                          ? 'text-blue-400 border-b-2 border-blue-400'
                          : 'text-blue-200 hover:text-blue-400'
                      }`}
                    >
                      <svg
                        className="inline-block w-5 h-5 mr-0 sm:mr-2"
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
                      <span className="hidden sm:inline">Splits</span>
                    </button>
                    <button
                      onClick={() => onTabChange('history')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
                        activeTab === 'history'
                          ? 'bg-white/20 text-white'
                          : 'text-gray-300 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <svg
                        className="w-5 h-5"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="hidden sm:inline">History</span>
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