# SuiConn - Decentralized Payment Application on Sui

SuiConn is a decentralized social payment platform on the Sui blockchain that makes managing shared expenses with friends effortless. It combines the security of blockchain technology with user-friendly features like split payments, batch transfers, and real-time currency conversion. Whether you're splitting a dinner bill or sending multiple payments, SuiConn streamlines the process while maintaining transparency and security.

The platform offers a comprehensive suite of payment features, including direct transfers, equal or custom split payments with deadlines, and efficient batch payments to multiple recipients. With support for multiple currencies and real-time exchange rates, users can easily track and send payments in their preferred currency. The built-in friend management system and transaction history make it simple to maintain your payment network and track all your financial interactions.

SuiConn's modern interface and seamless wallet integration ensure a smooth user experience, while its decentralized architecture guarantees the security and immutability of all transactions. Perfect for both personal and group financial management, SuiConn brings the power of blockchain payments to everyday social interactions.

## 🚀 Features

### Core Features
- **User Management:**
  - Unique username registration linked to Sui address
  - Profile management with transaction statistics
  - Friend request system with accept/reject functionality
  - Maximum 500 friends per user

### Payment Features
- **Direct Payments:**
  - Send SUI tokens to friends with optional memos
  - Real-time transaction status updates
  - Comprehensive payment history tracking

- **Split Payments:**
  - Create equal or custom split payments
  - Set payment deadlines
  - Track individual contributions
  - Automatic completion when all payments are received
  - Support for up to 50 participants per split

- **Batch Payments:**
  - Send multiple payments in a single transaction
  - Custom amounts and memos for each recipient
  - Efficient gas usage through batch processing
  - Support for up to 50 recipients per batch

### Currency Features
- **Multi-Currency Support:**
  - Real-time conversion between SUI and major currencies
  - Supported currencies: USD, EUR, INR, GBP, JPY, CAD, AUD, SGD, ZAR, BRL
  - Live exchange rates from CoinGecko
  - Display and send payments in preferred currency

### Security & Privacy
- **Decentralized Architecture:**
  - On-chain transaction processing
  - Immutable payment records
  - Secure friend list management
  - Private payment history

### User Interface
- **Modern Design:**
  - Responsive layout with Tailwind CSS
  - Intuitive payment flows
  - Real-time balance updates
  - Transaction status notifications
  - Friend management interface
  - Payment history visualization

## 🏗️ Architecture

### Smart Contract (`suiconn.move`)
- **Core Structures:**
  - `PlatformRegistry`: Main platform state management
  - `UserProfile`: User information and statistics
  - `FriendRequest`: Friend request management
  - `SplitPayment`: Split payment details and tracking
  - `PaymentRecord`: Transaction history records
  - `BatchPayment`: Batch payment management

### Frontend (`React + TypeScript`)
- **Key Components:**
  - Wallet integration via Suiet Wallet Kit
  - Real-time blockchain data fetching
  - Currency conversion and formatting
  - Transaction signing and execution
  - Error handling and loading states
  - Responsive UI components

## ⚙️ Prerequisites

- Node.js (v18 or higher recommended)
- npm, yarn, or pnpm
- Sui Wallet extension (e.g., Suiet) with testnet funds
- Sui CLI (for contract deployment)

## 🛠️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/butterpaneermasala/suiconn.git
   cd suiconn/suiconn
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 🚀 Deployment

### Smart Contract
```bash
# Compile
sui move build

# Deploy to Testnet
sui client publish --gas-budget 100000000
```

### Frontend
1. Update contract addresses in `src/pages/suiconn.tsx`:
   ```typescript
   const PACKAGE_ID = 'YOUR_DEPLOYED_PACKAGE_ID';
   const REGISTRY_OBJECT_ID = 'YOUR_REGISTRY_OBJECT_ID';
   const ACCESS_CONTROL_ID = 'YOUR_ACCESS_CONTROL_ID';
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

## 🧑‍💻 Usage

### Getting Started
1. Connect your Sui wallet
2. Register with a unique username
3. Add friends using their usernames
4. Start sending payments or creating split payments

### Key Operations
- **Direct Payments:** Select a friend, enter amount and optional memo
- **Split Payments:** Create with title, total amount, and participants
- **Batch Payments:** Add multiple recipients with individual amounts
- **Currency Conversion:** Select preferred currency for viewing and sending

## 🛡️ Error Codes

| Code | Description |
|------|-------------|
| 0 | Friend list already exists |
| 1 | Not the owner of friend list |
| 2 | Friend already added |
| 3 | Friend not found |
| 4 | Max friends exceeded |
| 5 | Name too long |
| 6 | Insufficient SUI balance |
| 7 | Invalid payment amount |
| 8 | Batch array mismatch |
| 9 | Empty batch |
| 10 | Max batch size exceeded |
| 11 | Username taken |
| 12 | User not found |
| 13 | Request already exists |
| 14 | Request not found |
| 15 | Invalid request status |
| 20 | Split payment not found |
| 21 | Already paid |
| 22 | Invalid split amount |
| 25 | Not friends |
| 26 | Self friend request |
| 29 | Zero participants |
| 30 | Overpayment |
| 33 | Invalid username characters |
| 34 | Username too short |
| 35 | Invalid memo characters |

## 🔒 Security

- All transactions are processed on-chain
- Friend lists are private and require ownership checks
- Payment records are permanently stored on the blockchain
- Username and address validation
- Rate limiting on friend requests
- Payment deadline enforcement

## 🚧 Limitations

- Max 500 friends per user
- Username: 3-30 characters
- Memo: 200 characters max
- Batch/Split payments: max 50 participants
- Payment amounts must be positive

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 🗺️ Roadmap

- Enhanced social features
- Mobile application
- DeFi protocol integrations
- Advanced group payment management
- Payment analytics and insights
- Cross-chain compatibility

## 🆘 Support

- Check browser console for errors
- Ensure wallet has sufficient SUI for gas
- Verify contract addresses and network
- For issues, open a GitHub issue

---

**SuiConn** is open source and welcomes your contributions and feedback!
