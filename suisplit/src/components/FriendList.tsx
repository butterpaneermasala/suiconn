import { useState, useEffect } from "react";
import { Transaction } from "@mysten/sui/transactions";
import { useWallet, ConnectButton } from "@suiet/wallet-kit";
import { SuiClient } from "@mysten/sui/client";
import type { SuiParsedData } from '@mysten/sui/client';

const PACKAGE_ID = '0x689b3ab5e808c8d0b6b20f23211a45fb02a5e42b6e80e2b0304039b22330c279';
const REGISTRY_OBJECT_ID = '0x749a85ea65afc7e1ec0a43f9cccc226f969db27cf7378edaf575117733eb4c6e';
const SUI_RPC_URL = "https://fullnode.devnet.sui.io:443";
const suiClient = new SuiClient({ url: SUI_RPC_URL });

interface Friend {
  addr: string;
  name: string;
}

export default function FriendList() {
  const { signAndExecuteTransaction, account, connected, disconnect } = useWallet();
  const [friendAddress, setFriendAddress] = useState('');
  const [friendName, setFriendName] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendListId, setFriendListId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getTableIdFromRegistryContent(content: SuiParsedData | undefined): string | null {
    if (!content || content.dataType !== 'moveObject') return null;
    const fields = content.fields as any;
    if (fields.lists?.fields?.id?.id) return fields.lists.fields.id.id;
    if (fields.lists?.id?.id) return fields.lists.id.id;
    return null;
  }

  const fetchFriendListId = async () => {
    if (!account?.address) {
      setFriendListId(null);
      setFriends([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const registryObj = await suiClient.getObject({
        id: REGISTRY_OBJECT_ID,
        options: { showContent: true }
      });
      if (!registryObj.data?.content) {
        throw new Error('Registry object not found or invalid');
      }
      const tableId = getTableIdFromRegistryContent(registryObj.data?.content);
      if (!tableId) throw new Error('Could not find tableId in registry content');

      const { data: dynamicFields } = await suiClient.getDynamicFields({
        parentId: tableId
      });

      const normalizedUserAddress = account.address.toLowerCase().replace(/^0x/, '');
      const userEntry = dynamicFields.find((field: any) => {
        if (field.name.type === 'address' && typeof field.name.value === 'string') {
          const normalizedFieldAddress = field.name.value.toLowerCase().replace(/^0x/, '');
          return normalizedFieldAddress === normalizedUserAddress;
        }
        return false;
      });

      if (userEntry) {
        const fieldObj = await suiClient.getObject({
          id: userEntry.objectId,
          options: { showContent: true }
        });
        if (
          fieldObj.data?.content &&
          fieldObj.data.content.dataType === 'moveObject'
        ) {
          const valueId = (fieldObj.data.content.fields as any).value;
          if (typeof valueId === "string") {
            setFriendListId(valueId);
          } else {
            setFriendListId(null);
            setError("Could not extract FriendList object ID from dynamic field");
          }
        } else {
          setFriendListId(null);
          setError("Dynamic field object not found or invalid");
        }
      } else {
        setFriendListId(null);
      }
    } catch (err) {
      setError('Failed to load friend list: ' + (err instanceof Error ? err.message : String(err)));
      setFriendListId(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchFriends = async () => {
    if (!friendListId) {
      setFriends([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resp = await suiClient.getObject({
        id: friendListId,
        options: { showContent: true }
      });
      
      const content = resp.data?.content;
      if (!content || content.dataType !== 'moveObject') {
        throw new Error('Invalid friend list format');
      }

      console.log("Raw friend list object content:", JSON.stringify(content, null, 2));

      let friendsData: Friend[] = [];
      const fields = content.fields as any;
      
      if (fields.friends) {
        const { data: bagFields } = await suiClient.getDynamicFields({
          parentId: fields.friends.fields.id.id
        });

        for (const field of bagFields) {
          const friendObj = await suiClient.getObject({
            id: field.objectId,
            options: { showContent: true }
          });
          
          if (friendObj.data?.content?.dataType === 'moveObject') {
            const friendFields = friendObj.data.content.fields as any;
            const friendValue = friendFields.value?.fields || friendFields;
            
            if (friendValue.addr || field.name.value) {
              friendsData.push({
                addr: friendValue.addr || field.name.value,
                name: friendValue.name || 'Unknown'
              });
            }
          }
        }
      }
      
      setFriends(friendsData);
    } catch (err) {
      setError('Failed to load friends: ' + (err instanceof Error ? err.message : String(err)));
      setFriends([]);
    } finally {
      setLoading(false);
    }
  };

  const createFriendList = async () => {
    if (!account?.address || !signAndExecuteTransaction) return;
    setLoading(true);
    setError(null);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::create`,
        arguments: [tx.object(REGISTRY_OBJECT_ID)],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      alert("Friend list created successfully!");
      await fetchFriendListId();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
      alert("Error: " + (err instanceof Error ? err.message : 'Creation failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async () => {
    if (!friendListId || !friendAddress || !friendName || !signAndExecuteTransaction) return;
    setLoading(true);
    setError(null);
    try {
      const formattedAddress = friendAddress.startsWith('0x') ? friendAddress : `0x${friendAddress}`;
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::add_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(formattedAddress),
          tx.pure.string(friendName),
        ],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      alert(`Added ${friendName} to your friends list!`);
      setFriendAddress('');
      setFriendName('');
      await fetchFriends();
      setTimeout(fetchFriends, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add friend');
      alert("Error: " + (err instanceof Error ? err.message : 'Failed to add friend'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async (addr: string, name: string) => {
    if (!friendListId || !signAndExecuteTransaction || !addr) return;
    setLoading(true);
    setError(null);
    try {
      const formattedAddress = addr.startsWith('0x') ? addr : `0x${addr}`;
      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::friend_list::remove_friend`,
        arguments: [
          tx.object(friendListId),
          tx.pure.address(formattedAddress),
        ],
      });
      const response = await signAndExecuteTransaction({ transaction: tx });
      await suiClient.waitForTransaction({
        digest: response.digest,
        timeout: 15000,
        pollInterval: 1000,
      });
      alert(`Removed ${name} from your friends list!`);
      await fetchFriends();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove friend');
      alert("Error: " + (err instanceof Error ? err.message : 'Failed to remove friend'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (connected && account?.address) {
      fetchFriendListId();
    } else {
      setFriendListId(null);
      setFriends([]);
    }
  }, [account?.address, connected]);

  useEffect(() => {
    if (friendListId) {
      fetchFriends();
    } else {
      setFriends([]);
    }
  }, [friendListId]);

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>Friend Manager</h1>
        <ConnectButton />
        {connected && (
          <div style={{ marginTop: 10 }}>
            <div>
              Connected as: {account?.address
                ? `${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                : ""}
            </div>
            <button
              onClick={disconnect}
              style={{
                ...styles.button,
                backgroundColor: "#f44336",
                marginTop: 10,
              }}
            >
              Disconnect
            </button>
          </div>
        )}
        <p style={styles.subtitle}>
          {friendListId ? 'Manage your friends list' : 'Get started by creating your list'}
        </p>
      </div>

      {loading && (
        <div style={styles.loading}>
          ⏳ Processing...
        </div>
      )}

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {!connected ? (
        <div style={{textAlign: 'center', padding: '20px 0'}}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '15px'}}>
            Please connect your wallet
          </h3>
        </div>
      ) : !friendListId ? (
        <div style={{textAlign: 'center', padding: '20px 0'}}>
          <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '15px'}}>
            No Friend List Found
          </h3>
          <button 
            onClick={createFriendList}
            style={{...styles.button, ...styles.createButton, ...(loading ? styles.disabledButton : {})}}
            disabled={loading || !connected}
          >
            {loading ? 'Creating...' : 'Create Friend List'}
          </button>
        </div>
      ) : (
        <>
          <div style={styles.form}>
            <h3 style={{fontSize: '18px', fontWeight: 'bold', marginBottom: '10px'}}>Add New Friend</h3>
            <input
              value={friendAddress}
              onChange={(e) => setFriendAddress(e.target.value)}
              placeholder="Friend's address (0x...)"
              style={styles.input}
            />
            <input
              value={friendName}
              onChange={(e) => setFriendName(e.target.value)}
              placeholder="Friend's name"
              style={styles.input}
            />
            <button
              onClick={handleAddFriend}
              disabled={!friendAddress || !friendName || loading}
              style={{
                ...styles.button, 
                ...((!friendAddress || !friendName || loading) ? styles.disabledButton : {})
              }}
            >
              {loading ? 'Adding...' : 'Add Friend'}
            </button>
          </div>

          <div>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}}>
              <h3 style={{fontSize: '18px', fontWeight: 'bold'}}>Your Friends</h3>
              <button 
                onClick={fetchFriends}
                style={{color: '#0066cc', background: 'none', border: 'none', cursor: 'pointer'}}
                disabled={loading}
              >
                ↻ Refresh
              </button>
            </div>
            
            {friends.length === 0 ? (
              <p style={styles.noFriends}>No friends added yet</p>
            ) : (
              <ul style={styles.list}>
                {friends.map((f, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <div>
                      <span style={styles.friendName}>{f.name}</span>
                      <span style={styles.friendAddress}>
                        ({f.addr.slice(0, 6)}...{f.addr.slice(-4)})
                      </span>
                    </div>
                    <button
                      onClick={() => handleRemoveFriend(f.addr, f.name)}
                      style={{...styles.button, ...styles.removeButton}}
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    textAlign: 'center' as const,
    marginBottom: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '10px',
  },
  subtitle: {
    fontSize: '16px',
    color: '#666',
    marginBottom: '5px',
  },
  wallet: {
    fontSize: '14px',
    color: '#555',
    marginBottom: '20px',
  },
  warning: {
    padding: '10px',
    backgroundColor: '#fff3cd',
    border: '1px solid #ffeeba',
    color: '#856404',
    borderRadius: '5px',
    marginBottom: '15px',
  },
  form: {
    marginBottom: '20px',
  },
  input: {
    width: '100%',
    padding: '8px',
    marginBottom: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  button: {
    backgroundColor: '#4CAF50',
    border: 'none',
    color: 'white',
    padding: '10px 15px',
    textAlign: 'center' as const,
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    margin: '4px 2px',
    cursor: 'pointer',
    borderRadius: '4px',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
    cursor: 'not-allowed',
  },
  createButton: {
    backgroundColor: '#2196F3',
  },
  list: {
    listStyle: 'none',
    padding: 0,
  },
  listItem: {
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '4px',
    marginBottom: '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  friendName: {
    fontWeight: 'bold',
  },
  friendAddress: {
    fontSize: '14px',
    color: '#666',
    marginLeft: '5px',
  },
  removeButton: {
    backgroundColor: '#f44336',
    padding: '5px 10px',
    fontSize: '14px',
  },
  loading: {
    color: '#0056b3',
    marginBottom: '15px',
  },
  error: {
    color: '#dc3545',
    marginBottom: '15px',
  },
  noFriends: {
    textAlign: 'center' as const,
    color: '#666',
    padding: '20px 0',
  },
  fetchedData: {
    margin: '20px 0',
    padding: '10px',
    background: '#f4f4f4',
    borderRadius: '6px',
    fontFamily: 'monospace',
    fontSize: '13px',
    overflowX: 'auto' as const,
    wordBreak: 'break-word' as const,
  }
};