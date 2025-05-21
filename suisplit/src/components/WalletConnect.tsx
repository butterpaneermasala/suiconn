import { ConnectButton, useWallet } from '@suiet/wallet-kit';

export default function WalletConnect() {
  const { connected, address } = useWallet();

  return (
    <div style={{ textAlign: 'center', marginBottom: '40px' }}>
      {!connected ? (
        <>
          <h2>Welcome to SuiSplit</h2>
          <ConnectButton />
        </>
      ) : (
        <>
          <h2>Connected Wallet</h2>
          <p>{address?.slice(0, 6)}...{address?.slice(-4)}</p>
          <ConnectButton />
        </>
      )}
    </div>
  );
}
