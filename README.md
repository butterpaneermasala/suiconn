text
# suiconn

**suiconn** is a decentralized application (DApp) built on the Sui blockchain that enables users to manage friend lists and send payments to friends. It combines a Move smart contract for secure on-chain logic with a modern React frontend for a seamless user experience.

---

## 🚀 Features

- **Friend Management:** Add, view, and remove friends from your personal list.
- **Payment System:** Send SUI tokens to individual friends or multiple friends at once.
- **Payment History:** Track all payments sent to friends, with memos and timestamps.
- **Batch Payments:** Send payments to multiple friends in a single transaction.
- **Real-Time Updates:** Automatic refresh of friend lists and payment status.

---

## 🏗️ Architecture

### Move Smart Contract (`friend_list.move`)

- **FriendListRegistry:** Tracks all user friend lists.
- **FriendList:** Each user's friend list with payment history.
- **Friend:** Friend's address, name, and timestamp.
- **PaymentRecord:** Payment details (amount, memo, timestamp).

#### Key Functions

- `create()`: Create a new friend list.
- `add_friend()`: Add a friend.
- `remove_friend()`: Remove a friend.
- `pay_friend()`: Send payment to a friend.
- `batch_pay_friends_simple()`: Batch payments.
- **View functions** for querying friend/payment data.

#### Limits

- Max 100 friends per list.
- Max 50 characters for friend names.
- Max 200 characters for payment memos.
- Max 20 recipients per batch payment.

### Frontend (`FriendList.tsx`)

- Built with React + TypeScript.
- Wallet connection via Suiet Wallet Kit.
- Real-time blockchain data fetching.
- Transaction signing and execution.
- Error handling and loading states.

---

## ⚙️ Prerequisites

- [Node.js](https://nodejs.org/) (v16+)
- npm or yarn
- [Sui CLI](https://docs.sui.io/build/install) (for contract deployment)
- [sui Wallet](any) any sui wallet browser extension

---

## 🛠️ Installation

### 1. Clone the Repository

git clone https://github.com/butterpaneermasala/suiconn.git
cd suiconn

text

### 2. Install Dependencies

npm install

or
yarn install

text

---

## 🚀 Deployment

### Smart Contract

**Compile:**
sui move build

text

**Deploy to Devnet:**
sui client publish --gas-budget 100000000

text

> **Note:** Save the `PACKAGE_ID` and `REGISTRY_OBJECT_ID` from the deployment output.

### Frontend

Update these constants in your frontend code:
const PACKAGE_ID = 'YOUR_DEPLOYED_PACKAGE_ID';
const REGISTRY_OBJECT_ID = 'YOUR_REGISTRY_OBJECT_ID';

text

---

## 🧑‍💻 Usage

### Getting Started

1. **Connect Wallet:** Click "Connect" and approve any sui Wallet.
2. **Create Friend List:** If new, click "Create Friend List."
3. **Add Friends:** Enter friend's Sui address and name, then "Add Friend."

### Managing Friends

- **Add:** Provide Sui address and display name.
- **Remove:** Click "Remove" next to a friend.
- **View:** Friend list updates automatically.

### Sending Payments

- Payment logic is supported by the contract.
- To enable payments in the frontend, add fields for amount/memo and call `pay_friend` or `batch_pay_friends_simple`.

---

## 🛡️ Error Codes

| Code | Meaning |
|------|---------|
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

---

## 📡 Network Configuration

- Default: Sui Devnet (`https://fullnode.devnet.sui.io:443`)
- To use Mainnet, update the RPC URL in your frontend.

---

## 🔒 Security

- Always verify friend addresses before adding.
- Double-check payment amounts and recipients.
- Friend lists are private and require ownership checks.
- Payment records are permanently on-chain.

---

## 🚧 Limitations

- Max 100 friends per list.
- Name: 50 chars; Memo: 200 chars.
- Batch payments: max 20 recipients.
- No friend list sharing or friend request system (yet).

---

## 🤝 Contributing

1. Fork the repository.
2. Create a feature branch.
3. Make your changes (+ tests if possible).
4. Submit a pull request.

---

## 🛠️ Development

### Run Locally

npm run dev

or
yarn dev

text

### Build for Production

npm run build

or
yarn build

text

### Test Smart Contract

sui move test

text

---

## 🗺️ Roadmap

- Frontend payment interface.
- Friend request/approval system.
- Group and scheduled payments.
- Social features (recommendations).
- Mobile version.
- DeFi protocol integrations.

---

## 🆘 Support

- Check browser console for errors.
- Ensure your wallet has SUI for gas.
- Verify contract addresses and network.
- For issues, open a GitHub issue or PR.

---

**suiconn** is open source and welcomes your contributions and feedback!
