import { useState, useEffect } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useWallet, useSuiClient } from '@suiet/wallet-kit';

const PACKAGE_ID = '0x659c4ac6fb276403dcf84070bac4b95169135fed57ef4e06e0fe638daee48f3f';
const FRIEND_LIST_OBJECT_ID = '0x3c5bc2228191f240e530d568a137f4c29138311358d43a9691589a32203ec649';

interface Friend {
  addr: string;
  name: string;
}

export default function FriendList() {
  const { signAndExecuteTransaction } = useWallet();
  const suiClient = useSuiClient();
  const [friendAddress, setFriendAddress] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);

  // Fetch friends from on-chain object
  const fetchFriends = async () => {
    try {
      const resp = await suiClient.getObject({
        id: FRIEND_LIST_OBJECT_ID,
        options: { showContent: true }
      });
      // Adjust this path if your Move struct is different
      const friendList = resp.data?.content?.fields?.friends as any[];
      if (Array.isArray(friendList)) {
        setFriends(friendList.map(f => ({
          addr: f.fields.addr,
          name: f.fields.name
        })));
      }
    } catch (e) {
      setFriends([]);
    }
  };

  useEffect(() => {
    fetchFriends();
    // Optionally, refresh on interval or after a friend is added
  }, []);

  const handleAddFriend = async () => {
    if (!friendAddress || !friendName) {
      alert('Please fill both fields');
      return;
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${PACKAGE_ID}::friend_list::add_friend`,
      arguments: [
        tx.object(FRIEND_LIST_OBJECT_ID),
        tx.pure.address(friendAddress),
        tx.pure.address(friendName),
      ],
    });

    try {
      await signAndExecuteTransaction({ transaction: tx });
      setFriendAddress('');
      setFriendName('');
      fetchFriends(); // Refresh list after adding
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  return (
    <div style={{
      maxWidth: '400px',
      margin: '0 auto',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '8px'
    }}>
      <h3>Add Friend</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <input
          value={friendAddress}
          onChange={(e) => setFriendAddress(e.target.value)}
          placeholder="Friend's address"
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <input
          value={friendName}
          onChange={(e) => setFriendName(e.target.value)}
          placeholder="Friend's name"
          style={{ padding: '8px', borderRadius: '4px' }}
        />
        <button
          onClick={handleAddFriend}
          disabled={!friendAddress || !friendName}
          style={{
            padding: '10px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Add Friend
        </button>
      </div>
      <h3 style={{ marginTop: '30px' }}>Your Friends</h3>
      <ul>
        {friends.map((f, idx) => (
          <li key={idx}>
            {f.name} ({f.addr.slice(0, 6)}...{f.addr.slice(-4)})
          </li>
        ))}
      </ul>
    </div>
  );
}
