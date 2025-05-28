import { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import { ArrowBack, ArrowForward, BookmarkBorder } from "@mui/icons-material";
import { Button } from "../components/ui/button";
import './BookStyles.css'; // We'll create this CSS file

const sections = [
  {
    title: "suiconn",
    subtitle: "A Decentralized Social Payment Platform",
    content: (
      <>
        <div className="book-ornament">❦</div>
        <p className="book-intro">
          In the realm of decentralized finance, where blockchain technology meets social connectivity, 
          <strong> suiconn</strong> emerges as a revolutionary application built upon the Sui blockchain. 
          This elegant solution bridges the gap between friendship and finance, enabling users to manage 
          their social circles while facilitating seamless cryptocurrency transactions.
        </p>
        <p className="book-text">
          Combining the robust security of Move smart contracts with the intuitive design of modern 
          React interfaces, suiconn represents the next evolution in peer-to-peer payment systems.
        </p>
      </>
    ),
  },
  {
    title: "Chapter I",
    subtitle: "Features & Capabilities",
    content: (
      <>
        <div className="book-ornament">✦</div>
        <div className="feature-list">
          <div className="feature-item">
            <h4>Friend Management</h4>
            <p>Curate your personal network with precision, adding and organizing trusted contacts within your decentralized ecosystem.</p>
          </div>
          <div className="feature-item">
            <h4>Payment System</h4>
            <p>Execute seamless SUI token transfers to individual friends or orchestrate batch payments across multiple recipients.</p>
          </div>
          <div className="feature-item">
            <h4>Transaction History</h4>
            <p>Maintain comprehensive records of all financial interactions, complete with timestamps and personalized memos.</p>
          </div>
          <div className="feature-item">
            <h4>Real-Time Updates</h4>
            <p>Experience instantaneous synchronization with the blockchain, ensuring your data remains current and accurate.</p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter II",
    subtitle: "Technical Architecture",
    content: (
      <>
        <div className="book-ornament">⚜</div>
        <div className="architecture-section">
          <h3>The Move Smart Contract Foundation</h3>
          <p className="book-text">
            At the heart of suiconn lies a sophisticated Move smart contract, meticulously crafted to ensure 
            security, efficiency, and scalability. The contract architecture comprises several key components:
          </p>
          <div className="code-block">
            <h4>Core Structures</h4>
            <ul>
              <li><code>FriendListRegistry</code> - The central repository tracking all user friend lists</li>
              <li><code>FriendList</code> - Individual user collections with integrated payment history</li>
              <li><code>Friend</code> - Contact entities containing addresses, names, and timestamps</li>
              <li><code>PaymentRecord</code> - Immutable transaction records with detailed metadata</li>
            </ul>
          </div>
          <div className="limits-section">
            <h4>System Constraints</h4>
            <p>To maintain optimal performance and prevent abuse, the system implements several carefully considered limitations:</p>
            <ul>
              <li>Maximum 100 friends per individual list</li>
              <li>Friend names limited to 50 characters</li>
              <li>Payment memos capped at 200 characters</li>
              <li>Batch payments restricted to 20 recipients</li>
            </ul>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter III",
    subtitle: "Prerequisites & Setup",
    content: (
      <>
        <div className="book-ornament">⚡</div>
        <div className="prerequisites-section">
          <h3>Essential Requirements</h3>
          <p className="book-text">
            Before embarking on your suiconn journey, ensure your development environment 
            is properly configured with the following essential components:
          </p>
          <div className="requirement-grid">
            <div className="requirement-item">
              <h4>Node.js Runtime</h4>
              <p>Version 16 or higher required for optimal compatibility</p>
            </div>
            <div className="requirement-item">
              <h4>Package Manager</h4>
              <p>Either npm or yarn for dependency management</p>
            </div>
            <div className="requirement-item">
              <h4>Sui CLI Tools</h4>
              <p>Essential for smart contract compilation and deployment</p>
            </div>
            <div className="requirement-item">
              <h4>Suiet Wallet</h4>
              <p>Browser extension for secure transaction signing</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter IV",
    subtitle: "Installation Guide",
    content: (
      <>
        <div className="book-ornament">⚙</div>
        <div className="installation-section">
          <h3>Setting Up Your Environment</h3>
          <p className="book-text">
            Follow these carefully crafted steps to establish your suiconn development environment:
          </p>
          <div className="step-container">
            <div className="step-item">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Repository Acquisition</h4>
                <div className="code-snippet">
                  <pre>git clone https://github.com/butterpaneermasala/suiconn.git</pre>
                  <pre>cd suiconn</pre>
                </div>
              </div>
            </div>
            <div className="step-item">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Dependency Installation</h4>
                <div className="code-snippet">
                  <pre>npm install</pre>
                  <pre className="alternative">yarn install</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter V",
    subtitle: "Deployment Procedures",
    content: (
      <>
        <div className="book-ornament">🚀</div>
        <div className="deployment-section">
          <h3>Smart Contract Deployment</h3>
          <p className="book-text">
            The deployment process requires careful attention to detail and proper configuration 
            of your blockchain environment.
          </p>
          <div className="deployment-steps">
            <div className="deployment-step">
              <h4>Compilation Phase</h4>
              <div className="code-snippet">
                <pre>sui move build</pre>
              </div>
              <p>This command compiles your Move contracts and verifies their integrity.</p>
            </div>
            <div className="deployment-step">
              <h4>Network Deployment</h4>
              <div className="code-snippet">
                <pre>sui client publish --gas-budget 100000000</pre>
              </div>
              <p>Deploy to the Sui devnet with sufficient gas allocation for contract publication.</p>
            </div>
          </div>
          <div className="important-note">
            <h4>Critical Information</h4>
            <p>
              Upon successful deployment, preserve the <code>PACKAGE_ID</code> and 
              <code>REGISTRY_OBJECT_ID</code> values for frontend integration.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Chapter VI",
    subtitle: "User Guide",
    content: (
      <>
        <div className="book-ornament">👥</div>
        <div className="usage-section">
          <h3>Navigating the Interface</h3>
          <p className="book-text">
            suiconn's intuitive interface guides users through a seamless experience, 
            from initial wallet connection to advanced payment operations.
          </p>
          <div className="usage-flow">
            <div className="flow-step">
              <div className="flow-icon">🔗</div>
              <h4>Wallet Connection</h4>
              <p>Establish secure communication with your Suiet wallet through our integrated connection protocol.</p>
            </div>
            <div className="flow-step">
              <div className="flow-icon">📋</div>
              <h4>Friend List Creation</h4>
              <p>Initialize your personal friend registry, creating the foundation for your social payment network.</p>
            </div>
            <div className="flow-step">
              <div className="flow-icon">➕</div>
              <h4>Contact Management</h4>
              <p>Add trusted contacts by providing their Sui addresses and memorable display names.</p>
            </div>
            <div className="flow-step">
              <div className="flow-icon">💸</div>
              <h4>Payment Execution</h4>
              <p>Send SUI tokens to individual friends or execute batch payments across multiple recipients.</p>
            </div>
          </div>
        </div>
      </>
    ),
  },
  {
    title: "Appendix A",
    subtitle: "Error Reference",
    content: (
      <>
        <div className="book-ornament">⚠</div>
        <div className="error-reference">
          <h3>System Error Codes</h3>
          <p className="book-text">
            Understanding error codes is essential for troubleshooting and maintaining 
            optimal system performance.
          </p>
          <div className="error-table">
            <div className="error-row header">
              <div className="error-code">Code</div>
              <div className="error-description">Description</div>
            </div>
            <div className="error-row">
              <div className="error-code">0</div>
              <div className="error-description">Friend list already exists for this user</div>
            </div>
            <div className="error-row">
              <div className="error-code">1</div>
              <div className="error-description">Unauthorized access - not the owner</div>
            </div>
            <div className="error-row">
              <div className="error-code">2</div>
              <div className="error-description">Duplicate friend entry detected</div>
            </div>
            <div className="error-row">
              <div className="error-code">3</div>
              <div className="error-description">Specified friend not found in list</div>
            </div>
            <div className="error-row">
              <div className="error-code">4</div>
              <div className="error-description">Maximum friend limit exceeded</div>
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
            As we stand at the threshold of a new era in decentralized finance, 
            suiconn represents more than just a payment application—it embodies 
            the vision of a connected, trustworthy, and efficient financial ecosystem.
          </p>
          <p className="book-text">
            The journey of suiconn continues to evolve, with planned enhancements 
            including advanced social features, mobile applications, and integration 
            with emerging DeFi protocols.
          </p>
          <div className="closing-ornament">
            <div className="ornament-line"></div>
            <div className="ornament-center">❦</div>
            <div className="ornament-line"></div>
          </div>
          <p className="book-signature">
            <em>suiconn - Connecting Friends, Enabling Finance</em>
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
