# SuiConn - Decentralized Payment Application on Sui

SuiConn is a decentralized payment application built on the Sui blockchain. It allows users to register, add friends, send direct payments, create and participate in split payments, and send batch payments.

## Smart Contract (Move)

The smart contract is written in the Move programming language and deployed on the Sui testnet.

**Contract Object IDs (Testnet):**

*   **Package ID:** `0x7f9abdd86213586f0eba4337f37e5073276340e8e60556ef44df70710b6d8a5d`
*   **Platform Registry Object ID:** `0x3253ee9cce59c10d5f9baebeac6421d9bb352ec646eea0c6d3ecb67fbeb52d7d`
*   **Split Payment Access Control ID:** `0x632fc800de54d66d0acba91781dd8c6ce6c3a5493d731c4ab5493c964b2b791e`

_Note: These IDs are for the testnet deployment and may change if the contract is redeployed._

## Frontend Application (React + TypeScript)

The frontend is a single-page application built with React and TypeScript using Vite. It interacts with the Sui blockchain via the smart contract to provide a user-friendly interface for the payment functionalities.

**Key Features:**

*   **User Registration:** Allows new users to create a unique username linked to their Sui address on the blockchain.
*   **Friend Request System (Send & Respond):** Users can send friend requests to others by username and accept or reject incoming requests.
*   **Direct Payments to Friends:** Enables users to send SUI tokens directly to their friends' linked Sui addresses with an optional memo.
*   **Split Payments:** Users can create split payments for a group of participants, specifying a total amount to be divided equally or custom amounts for each person. The creator can also be included as a participant. Participants can then pay their share individually.
*   **Batch Payments to Multiple Friends:** Provides a convenient way to send direct payments to multiple friends in a single transaction.
*   **Transaction History View:** Users can view a history of their sent and received payments, including details like sender, recipient, amount, memo, and payment type.
*   **Multi-Currency Support:** Users can view and send payments in multiple currencies (USD, EUR, INR, GBP, JPY, CAD, AUD, SGD, ZAR, BRL) with real-time conversion rates from CoinGecko.
*   **Integration with Suiet Wallet Kit:** Seamlessly connects with Suiet Wallet for handling user authentication and transaction signing.
*   **Modern UI with Tailwind CSS:** Features a responsive and visually appealing user interface built using Tailwind CSS.

## Getting Started

This project was set up using React + TypeScript + Vite.

### Prerequisites

*   Node.js (v18 or higher recommended)
*   npm, yarn, or pnpm
*   A Sui Wallet extension (e.g., Suiet) with funds on the Sui Testnet.

### Installation

1.  Clone the repository:
    ```bash
    git clone <repository_url>
    cd suiconn/suiconn
    ```
2.  Install dependencies:
    ```bash
    npm install # or yarn install or pnpm install
    ```

### Running the Application

```bash
npm run dev # or yarn dev or pnpm dev
```

This will start the development server. Open your browser to the address shown in the terminal (usually `http://localhost:5173`).

## Project Structure

*   `src/pages/suiconn.tsx`: The main application component handling wallet connection, state management, contract interactions, and UI rendering.
*   `src/components/`: Contains reusable UI components.
*   `sui/sources/suiconn.move`: The Move smart contract source code.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
