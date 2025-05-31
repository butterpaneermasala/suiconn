import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ArrowBack, ArrowForward, BookmarkBorder } from "@mui/icons-material";
import { Button } from "../components/ui/button";
import './BookStyles.css'; // We'll create this CSS file

const sections = [
  {
    title: "SuiConn",
    subtitle: "A Decentralized Social Payment Platform",
    content: (
      <>
        <div className="book-ornament">❦</div>
        <p className="book-intro">
          Welcome to <strong>SuiConn</strong>, a decentralized payment application built on the Sui blockchain. It seamlessly integrates social interactions with financial transactions, allowing you to manage your friends and send payments directly within the app.
        </p>
        <p className="book-text">
          Built using Move smart contracts for security and a modern React frontend for usability, SuiConn simplifies peer-to-peer payments, offering features like direct transfers, split payments, and batch transactions.
        </p>
      </>
    ),
  },
  {
    title: "Chapter I",
    subtitle: "Key Features",
    content: (
      <>
        <div className="book-ornament">✦</div>
        <div className="feature-list">
          <div className="feature-item">
            <h4>User Registration</h4>
            <p>Securely register your unique username on the Sui blockchain, permanently linked to your Sui address.</p>
          </div>
          <div className="feature-item">
            <h4>Friend Request System</h4>
            <p>Easily connect with other SuiConn users by sending and managing friend requests using usernames.</p>
          </div>
          <div className="feature-item">
            <h4>Direct Payments</h4>
            <p>Send SUI tokens instantly to your friends with the option to include a personal memo.</p>
          </div>
          <div className="feature-item">
            <h4>Split Payments</h4>
            <p>Create and manage payments to be split among friends, either equally or with custom amounts. You can even include yourself in the split!</p>
          </div>
          <div className="feature-item">
            <h4>Batch Payments</h4>
            <p>Save time by sending payments to multiple friends simultaneously in a single transaction.</p>
          </div>
          <div className="feature-item">
            <h4>Transaction History</h4>
            <p>Keep track of all your financial activity within SuiConn with a detailed history of every transaction.</p>
          </div>
          <div className="feature-item">
            <h4>Multi-Currency Support</h4>
            <p>View and send payments in multiple currencies (USD, EUR, INR, GBP, JPY, CAD, AUD, SGD, ZAR, BRL) with real-time conversion rates from CoinGecko.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter II",
    subtitle: "How to Use SuiConn",
    content: (
      <>
        <div className="book-ornament">👥</div>
        <div className="usage-section">
          <h3>Getting Started</h3>
          <p className="book-text">
            If you haven't already, connect your Suiet wallet and register a username to begin using SuiConn. Once registered, you'll land on the Profile tab.
          </p>
          <div className="usage-flow">
            <div className="flow-step">
              <div className="flow-icon">🏠</div> {/* Using a house emoji for Profile */}
              <h4>Profile Tab</h4>
              <p>View your profile details, connected wallet address, friend count, payment statistics, and recent split payments.</p>
            </div>
            <div className="flow-step">
              <div className="flow-icon">🧑‍🤝‍🧑</div> {/* Using a friends emoji for Friends */}
              <h4>Friends Tab</h4>
              <p>Go here to add new friends by their SuiConn username or manage incoming friend requests. Your existing friends list is also displayed, allowing you to initiate payments or view transaction history with a specific friend.</p>
            </div>
            <div className="flow-step">
              <div className="flow-icon"> оплата </div> {/* Using coin emoji for Payments - Using Russian 'oplata' for payment emoji */}
              <h4>Payments Tab</h4>
              <p>This is where you can initiate different types of payments: Send Direct Payment to a single friend, Create Split Payment for a group (with equal or custom amounts), or send a Batch Payment to multiple friends at once.</p>
            </div>
             <div className="flow-step">
              <div className="flow-icon">⑁</div> {/* Using a split emoji for Splits */}
              <h4>Splits Tab</h4>
              <p>Access this tab to see all the split payments you are a part of, either as the creator or a participant. You can view the details and pay your outstanding share for pending splits.</p>
            </div>
             <div className="flow-step">
              <div className="flow-icon">📜</div> {/* Using scroll emoji for History */}
              <h4>History Tab</h4>
              <p>Find a complete record of all your transactions, including direct payments, split payment contributions, and batch payments, ordered chronologically.</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter III",
    subtitle: "Technical Architecture (Move Contract)",
    content: (
      <>
        <div className="book-ornament">⚜</div>
        <div className="architecture-section">
          <h3>The Move Smart Contract Foundation</h3>
          <p className="book-text">
            SuiConn's core logic is secured by a Move smart contract on the Sui blockchain. It manages all essential data and operations like user profiles, friend relationships, and payment processing. Key data structures within the contract include:
          </p>
          <div className="code-block">
            <h4>Core Structures</h4>
            <ul>
              <li><code>PlatformRegistry</code>: The main shared object that holds references to all other data tables.</li>
              <li><code>UserProfile</code>: Stores individual user information like username, address, and their list of friends.</li>
              <li><code>FriendRequest</code>: Tracks friend requests between users.</li>
              <li><code>SplitPayment</code>: Contains all the details for a split payment, such as the total amount, participants, and payment status.</li>
              <li><code>SplitParticipant</code>: Records the status and amount paid by each person in a split payment.</li>
              <li><code>PaymentRecord</code>: An immutable record of any completed payment transaction on the platform.</li>
              <li><code>BatchPayment</code>: Holds the details for a group of direct payments sent together.</li>
              <li><code>BatchPaymentItem</code>: Represents a single payment within a batch.</li>
               <li><code>SplitPaymentAccess</code> and <code>SplitPaymentAccessTable</code>: Structures used for managing who can view details of a split payment.</li>
            </ul>
          </div>
          <div className="limits-section">
            <h4>System Constraints</h4>
            <p>Limits are enforced by the smart contract to ensure efficient and secure operation:</p>
            <ul>
              <li>Maximum 500 friends per user.</li>
              <li>Usernames must be between 3 and 30 characters.</li>
              <li>Payment memos are limited to 200 characters.</li>
              <li>Batch and split payments are limited to 50 participants/recipients.</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Appendix A",
    subtitle: "Common Error Messages",
    content: (
      <>
        <div className="book-ornament">⚠</div>
        <div className="error-reference">
          <h3>Understanding Error Codes</h3>
          <p className="book-text">
            If a transaction fails, you might see an error message containing a code. These codes indicate the reason for the failure, as defined in the Move smart contract. Some common ones include:
          </p>
          <div className="error-table">
            <div className="error-row header">
              <div className="error-code">Code</div>
              <div className="error-description">Description</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>0</code></div>
              <div className="error-description">`EALREADY_EXISTS`: You might encounter this if trying to register a username that's already taken.</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>2</code></div>
              <div className="error-description">`EFRIEND_ALREADY_ADDED`: You tried to add a friend who is already in your list.</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>3</code></div>
              <div className="error-description">`EFRIEND_NOT_FOUND`: The username for a friend or recipient was not found on the platform.</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>4</code></div>
              <div className="error-description">`EMAX_FRIENDS_EXCEEDED`: You have reached the maximum number of friends you can add.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>6</code></div>
              <div className="error-description">`EINSUFFICIENT_BALANCE`: Your wallet does not have enough SUI to cover the payment amount and gas fees.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>7</code></div>
              <div className="error-description">`EINVALID_AMOUNT`: The payment amount specified is invalid (e.g., zero or too large).</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>8</code></div>
              <div className="error-description">`EVECTOR_LENGTH_MISMATCH`: For batch or custom split payments, the number of recipients/participants does not match the number of amounts/memos provided.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>10</code></div>
              <div className="error-description">`EMAX_BATCH_SIZE_EXCEEDED`: You have exceeded the maximum number of recipients for a batch or split payment.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>11</code></div>
              <div className="error-description">`EUSERNAME_TAKEN`: The username you are trying to register is already in use by another user.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>12</code></div>
              <div className="error-description">`EUSER_NOT_FOUND`: The specified user for a transaction or request could not be found on the platform.</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>13</code></div>
              <div className="error-description">`EREQUEST_ALREADY_EXISTS`: A pending friend request to this user already exists.</div>
            </div>
            <div className="error-row">
              <div className="error-code"><code>14</code></div>
              <div className="error-description">`EREQUEST_NOT_FOUND`: The friend request you are trying to respond to was not found.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>20</code></div>
              <div className="error-description">`ESPLIT_PAYMENT_NOT_FOUND`: The split payment you are trying to interact with was not found.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>21</code></div>
              <div className="error-description">`EALREADY_PAID`: You have already paid your share for this split payment.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>25</code></div>
              <div className="error-description">`ENOT_FRIENDS`: You are trying to perform an action (like sending a direct payment) with a user who is not in your friends list.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>26</code></div>
              <div className="error-description">`ESELF_FRIEND_REQUEST`: You cannot send a friend request to yourself.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>29</code></div>
              <div className="error-description">`EZERO_PARTICIPANTS`: A split payment was attempted without any participants selected.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>33</code></div>
              <div className="error-description">`EINVALID_USERNAME_CHARS`: The username you entered contains characters that are not allowed.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>34</code></div>
              <div className="error-description">`EUSERNAME_TOO_SHORT`: The username you entered is shorter than the minimum required length.</div>
            </div>
             <div className="error-row">
              <div className="error-code"><code>35</code></div>
              <div className="error-description">`EINVALID_MEMO_CHARS`: The memo you entered contains characters that are not allowed.</div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Epilogue",
    subtitle: "The Future of Social Finance",
    content: (
      <>
        <div className="book-ornament">🌟</div>
        <div className="epilogue-section">
          <p className="book-text large">
            SuiConn is built on the principles of decentralization and user control, offering a secure and transparent way to manage your social payments on the Sui blockchain.
          </p>
          <p className="book-text">
            We are continuously working to enhance SuiConn with new features and improvements to make your decentralized payment experience even better.
          </p>
          <div className="closing-ornament">
            <div className="ornament-line"></div>
            <div className="ornament-center">❦</div>
            <div className="ornament-line"></div>
          </div>
          <p className="book-signature">
            <em>SuiConn - Connecting Friends, Enabling Finance</em>
          </p>
        </div>
      </>
    ),
  },
];

const BookComponent = () => {
  const [currentPage, setCurrentPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [bookmarkPage, setBookmarkPage] = useState<number | null>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const rect = document.querySelector('.book-container')?.getBoundingClientRect();
      if (rect) {
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  const goToPage = (newPage: number) => {
    if (isFlipping) return;
    setIsFlipping(true);
    setDirection(newPage > currentPage ? 1 : -1);
    setCurrentPage(newPage);
    setTimeout(() => setIsFlipping(false), 800);
  };

  const toggleBookmark = () => {
    setBookmarkPage(bookmarkPage === currentPage ? null : currentPage);
  };

  const pageVariants = {
    initial: (direction: number) => ({
      rotateY: direction > 0 ? -180 : 180,
      opacity: 0,
      scale: 0.8,
    }),
    animate: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.8,
      },
    },
    exit: (direction: number) => ({
      rotateY: direction > 0 ? 180 : -180,
      opacity: 0,
      scale: 0.8,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
        duration: 0.8,
      },
    }),
  };

  return (
    <div className="library-scene">
      <div className="library-background">
        <div className="bookshelf"></div>
        <div className="ambient-light"></div>
      </div>
      
      <div className="book-desk">
        <motion.div 
          className="book-container"
          style={{
            rotateX,
            rotateY,
          }}
        >
          {/* Book Cover/Spine */}
          <div className="book-spine">
            <div className="spine-text">suiconn</div>
            <div className="spine-author">Documentation</div>
          </div>

          {/* Bookmark */}
          {bookmarkPage !== null && (
            <motion.div 
              className="bookmark"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              style={{
                backgroundColor: bookmarkPage === currentPage ? '#ff6b6b' : '#4ecdc4'
              }}
            />
          )}

          {/* Page Content */}
          <div className="book-pages">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPage}
                className="book-page"
                custom={direction}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <div className="page-content">
                  <div className="page-header">
                    <h1 className="page-title">{sections[currentPage].title}</h1>
                    <h2 className="page-subtitle">{sections[currentPage].subtitle}</h2>
                  </div>
                  
                  <div className="page-body">
                    {sections[currentPage].content}
                  </div>
                  
                  <div className="page-footer">
                    <div className="page-number">{currentPage + 1}</div>
                    <Button
                      onClick={toggleBookmark}
                      className="bookmark-btn"
                      variant="ghost"
                    >
                      <BookmarkBorder />
                    </Button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Book Shadow */}
          <div className="book-shadow"></div>
        </motion.div>

        {/* Reading Lamp */}
        <div className="reading-lamp">
          <div className="lamp-base"></div>
          <div className="lamp-arm"></div>
          <div className="lamp-shade"></div>
          <div className="lamp-light"></div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="book-controls">
        <motion.div 
          className="control-panel"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={() => goToPage(Math.max(0, currentPage - 1))}
            disabled={currentPage === 0 || isFlipping}
            className="nav-btn prev-btn"
          >
            <ArrowBack /> Previous
          </Button>

          <div className="page-indicators">
            {sections.map((_, index) => (
              <motion.button
                key={index}
                className={`page-dot ${index === currentPage ? 'active' : ''} ${bookmarkPage === index ? 'bookmarked' : ''}`}
                onClick={() => goToPage(index)}
                disabled={isFlipping}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
              />
            ))}
          </div>

          <Button
            onClick={() => goToPage(Math.min(sections.length - 1, currentPage + 1))}
            disabled={currentPage === sections.length - 1 || isFlipping}
            className="nav-btn next-btn"
          >
            Next <ArrowForward />
          </Button>
        </motion.div>

        <div className="reading-progress">
          <div 
            className="progress-bar"
            style={{ width: `${((currentPage + 1) / sections.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default BookComponent;
