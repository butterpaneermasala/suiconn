import React from 'react';
import ReactDOM from 'react-dom/client';
import { WalletProvider } from '@suiet/wallet-kit';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import FriendListApp from './pages/suiconn';
import Landing from './pages/Landing';
import LearnMore from './pages/LearnMore';
import '@suiet/wallet-kit/style.css';
import '@mysten/dapp-kit/dist/index.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/app" element={<FriendListApp />} />
          <Route path="/learn-more" element={<LearnMore />} />
        </Routes>
      </WalletProvider>
    </Router>
  </React.StrictMode>
);
