# SUICONN

A decentralized application (DApp) built on the Sui blockchain that allows users to manage their friend lists and send payments to friends. The application consists of a Move smart contract for on-chain logic and a React frontend for user interaction.

## Features

- **Friend Management**: Add and remove friends from your personal list
- **Payment System**: Send SUI tokens to individual friends or multiple friends at once
- **Payment History**: Track all payments sent to friends with memos and timestamps
- **Batch Payments**: Send payments to multiple friends in a single transaction
- **Real-time Updates**: Automatic refresh of friend lists and payment status

## Architecture

### Smart Contract (`friend_list.move`)

The smart contract is written in Move and deployed on the Sui blockchain. It includes:

#### Main Structures
- `FriendListRegistry`: Shared object that tracks all user friend lists
- `FriendList`: Individual user's friend list with payment history
- `Friend`: Friend information (address, name, timestamp)  
- `PaymentRecord`: Payment transaction details

#### Key Functions
- `create()`: Create a new friend list for a user
- `add_friend()`: Add a friend to the list
- `remove_friend()`: Remove a friend from the list
- `pay_friend()`: Send payment to a single friend
- `batch_pay_friends_simple()`: Send payments to multiple friends
- View functions for querying friend and payment data

#### Constants & Limits
- Maximum 100 friends per list
- Maximum 50 characters for friend names
- Maximum 200 characters for payment memos
- Maximum 20 recipients per batch payment

### Frontend (`FriendList.tsx`)

Built with React and TypeScript, featuring:

- Wallet connection using Suiet wallet kit
- Friend list management interface
- Real-time blockchain data fetching
- Transaction signing and execution
- Error handling and loading states

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Sui CLI (for contract deployment)
- Suiet wallet browser extension

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd friend-list-dapp
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Required Dependencies

For the frontend, ensure you have these key dependencies:

```json
{
  "@mysten/sui": "latest",
  "@suiet/wallet-kit": "latest",
  "react": "^18.0.0",
  "typescript": "latest"
}
```

## Deployment

### Smart Contract Deployment

1. **Compile the contract:**
```bash
sui move build
```

2. **Deploy to devnet:**
```bash
sui client publish --gas-budget 100000000
```

3. **Note the Package ID and Registry Object ID** from the deployment output

### Frontend Configuration

Update the constants in your React component:

```typescript
const PACKAGE_ID = 'YOUR_DEPLOYED_PACKAGE_ID';
const REGISTRY_OBJECT_ID = 'YOUR_REGISTRY_OBJECT_ID';
```

## Usage

### Getting Started

1. **Connect Wallet**: Click "Connect" and approve the Suiet wallet connection
2. **Create Friend List**: If you don't have a friend list, click "Create Friend List"
3. **Add Friends**: Enter friend's address and name, then click "Add Friend"

### Managing Friends

- **Add Friend**: Provide Sui address (0x...) and display name
- **Remove Friend**: Click "Remove" next to any friend in your list
- **View Friends**: Your friends list updates automatically

### Making Payments

The smart contract supports payments, but the current frontend focuses on friend management. Payment functionality can be added by:

1. Adding payment input fields (amount, memo)
2. Implementing the `pay_friend` transaction call
3. Adding batch payment interface for multiple recipients

### Error Handling

The app includes comprehensive error handling for:
- Wallet connection issues
- Transaction failures
- Invalid addresses or data
- Network connectivity problems

## Smart Contract Details

### Error Codes

- `EALREADY_EXISTS (0)`: Friend list already exists for user
- `ENOT_OWNER (1)`: User is not the owner of the friend list
- `EFRIEND_ALREADY_ADDED (2)`: Friend already exists in the list
- `EFRIEND_NOT_FOUND (3)`: Friend not found in the list
- `EMAX_FRIENDS_EXCEEDED (4)`: Maximum friend limit reached
- `ENAME_TOO_LONG (5)`: Name exceeds character limit
- `EINSUFFICIENT_BALANCE (6)`: Not enough SUI for payment
- `EINVALID_AMOUNT (7)`: Payment amount must be greater than 0
- `EVECTOR_LENGTH_MISMATCH (8)`: Batch payment arrays don't match
- `EEMPTY_BATCH (9)`: Batch payment cannot be empty
- `EMAX_BATCH_SIZE_EXCEEDED (10)`: Too many recipients in batch

### Events

The contract emits events for all major actions:
- `FriendListCreated`: When a new friend list is created
- `FriendAdded`: When a friend is added
- `FriendRemoved`: When a friend is removed
- `PaymentSent`: When a payment is sent
- `BatchPaymentSent`: When batch payments are sent

## Development

### Running Locally

```bash
npm start
# or
yarn start
```

### Building for Production

```bash
npm run build
# or
yarn build
```

### Testing

To test the smart contract:

```bash
sui move test
```

## Network Configuration

The app is currently configured for Sui Devnet:
- RPC URL: `https://fullnode.devnet.sui.io:443`
- For Mainnet, update the RPC URL accordingly

## Security Considerations

- Always verify friend addresses before adding them
- Double-check payment amounts and recipients
- The smart contract includes ownership checks for all operations
- Friend lists are private to each user
- Payment records are permanently stored on-chain

## Limitations

- Maximum 100 friends per list
- Friend names limited to 50 characters
- Payment memos limited to 200 characters
- Batch payments limited to 20 recipients
- No friend list sharing between users
- No friend request/approval system

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Check the error messages in the browser console
- Ensure your wallet has sufficient SUI for gas fees
- Verify contract addresses are correct for your network

## Roadmap

Future enhancements may include:
- Payment interface in the frontend
- Friend request/approval system
- Group payment functionality
- Payment scheduling
- Social features (friend recommendations)
- Mobile app version
- Integration with other Sui DeFi protocols
