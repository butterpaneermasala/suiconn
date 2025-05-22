import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { WalletProvider } from '@suiet/wallet-kit';
import '@suiet/wallet-kit/style.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { getFullnodeUrl } from '@mysten/sui/client';
import '@mysten/dapp-kit/dist/index.css';

const queryClient = new QueryClient();
// const networks = {
//   testnet: { url: getFullnodeUrl('testnet') },
//   mainnet: { url: getFullnodeUrl('mainnet') },
//   devnet: { url: getFullnodeUrl('devnet') },
// };

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <App />
        </WalletProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
