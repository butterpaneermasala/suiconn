import { Button } from "../components/ui/button";
import {
  Users,
  Wallet,
  Zap,
  Shield,
  ArrowRight,
  Star,
  Sparkles,
  Globe,
  // Lock,
  TrendingUp,
  Layers
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../components/ui/card";
import { ConnectButton } from "@suiet/wallet-kit";
import { useState, useEffect } from "react";
import { SuiClient, getFullnodeUrl } from "@mysten/sui/client";

// const PACKAGE_ID = '0x615781f0b6e16cbd4b290b20527851be8b23323b0547653c2e9962e8bdce3ff0';
const REGISTRY_OBJECT_ID = '0x06d916bf05ce5a9c850d5303423c07348a3db5435464c8ab1370de63b7c4bab1';
const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

// Bubble animation component
const BubbleAnimation = () => {
  useEffect(() => {
    const gradients = [
      'radial-gradient(circle at 30% 30%, #ff9a9e 0%, #fecfef 100%)',
      'radial-gradient(circle at 70% 30%, #a8edea 0%, #fed6e3 100%)',
      'radial-gradient(circle at 30% 70%, #ffecd2 0%, #fcb69f 100%)',
      'radial-gradient(circle at 70% 70%, #89f7fe 0%, #66a6ff 100%)',
      'radial-gradient(circle at 50% 50%, #fdbb2d 0%, #22c1c3 100%)',
      'radial-gradient(circle at 30% 30%, #ff758c 0%, #ff7eb3 100%)',
      'radial-gradient(circle at 70% 30%, #c471f5 0%, #fa71cd 100%)',
      'radial-gradient(circle at 30% 70%, #4facfe 0%, #00f2fe 100%)',
      'radial-gradient(circle at 70% 70%, #fa709a 0%, #fee140 100%)',
      'radial-gradient(circle at 50% 50%, #a8ff78 0%, #78ffd6 100%)',
      'radial-gradient(circle at 30% 30%, #667eea 0%, #764ba2 100%)',
      'radial-gradient(circle at 70% 30%, #f093fb 0%, #f5576c 100%)'
    ];

    function createBubble() {
      const bubble = document.createElement('div');
      bubble.className = 'bubble';

      const minSize = Math.max(20, window.innerWidth * 0.03);
      const maxSize = Math.max(60, window.innerWidth * 0.12);
      const size = Math.random() * (maxSize - minSize) + minSize;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;

      const left = Math.random() * (window.innerWidth - size);
      bubble.style.left = `${left}px`;
      bubble.style.bottom = '0';

      bubble.style.setProperty('--x', '0px');
      const drift = (Math.random() - 0.5) * 80;
      bubble.style.setProperty('--drift', `${drift}px`);
      const scale = 0.8 + Math.random() * 0.7;
      bubble.style.setProperty('--scale', scale.toString());

      const duration = (3 + Math.random() * 4) + (size / 100);
      bubble.style.animation = `floatUp ${duration.toString()}s linear`;
      bubble.style.animationDelay = `${Math.random()}s`;

      bubble.style.background = gradients[Math.floor(Math.random() * gradients.length)];

      const highlight = document.createElement('div');
      highlight.className = 'bubble-highlight';
      bubble.appendChild(highlight);

      document.body.appendChild(bubble);
      bubble.addEventListener('animationend', () => bubble.remove());
    }

    // Initial burst of bubbles
    for (let i = 0; i < 15; i++) {
      setTimeout(createBubble, i * 100);
    }

    // Continuous bubble creation with longer interval
    const interval = setInterval(createBubble, 500);

    return () => {
      clearInterval(interval);
      // Clean up any remaining bubbles
      document.querySelectorAll('.bubble').forEach(bubble => bubble.remove());
    };
  }, []);

  return (
    <style>
      {`
        .bubble {
          position: fixed;
          border-radius: 50%;
          opacity: 0.7;
          will-change: transform, opacity;
          pointer-events: none;
          box-shadow:
            0 8px 30px rgba(0,0,0,0.15),
            inset 0 0 30px rgba(255,255,255,0.3);
          overflow: visible;
          transform-origin: center;
          aspect-ratio: 1;
          z-index: 10;
          bottom: 0;
        }
        .bubble-highlight {
          position: absolute;
          top: 18%;
          left: 22%;
          width: 40%;
          height: 35%;
          background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.1) 100%);
          border-radius: 50%;
          filter: blur(2px);
          pointer-events: none;
          z-index: 1;
        }
        @keyframes floatUp {
          0% {
            transform: translate3d(var(--x, 0px), 100vh, 0) scale(var(--scale, 1));
            opacity: 0;
          }
          10% {
            opacity: 0.7;
          }
          90% {
            opacity: 0.7;
          }
          100% {
            transform: translate3d(calc(var(--x, 0px) + var(--drift, 40px)), -100vh, 0) scale(var(--scale, 1));
            opacity: 0;
          }
        }
      `}
    </style>
  );
};

// Underwater overlay component
const UnderwaterOverlay = () => (
  <div className="fixed inset-0 pointer-events-none z-40">
    <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-blue-950/30 mix-blend-overlay"></div>
    <div className="absolute inset-0" style={{
      backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'0.05\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")',
      opacity: 0.3,
    }}></div>
  </div>
);

// Add scroll animation component
const ScrollAnimation = () => {
  useEffect(() => {
    const handleScroll = () => {
      const elements = document.querySelectorAll('.animate-on-scroll');
      elements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;
        const elementBottom = element.getBoundingClientRect().bottom;
        const isVisible = (elementTop < window.innerHeight) && (elementBottom >= 0);
        
        if (isVisible) {
          element.classList.add('animate-fade-in');
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <style>
      {`
        .animate-on-scroll {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease-out, transform 0.6s ease-out;
        }
        .animate-fade-in {
          opacity: 1;
          transform: translateY(0);
        }
      `}
    </style>
  );
};

const Landing = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalVolume: 0,
    totalTransactions: 0
  });
  // const navigate = useNavigate();

  const fetchStats = async () => {
    try {
      const registryObj = await suiClient.getObject({
        id: REGISTRY_OBJECT_ID,
        options: { showContent: true }
      });

      if (registryObj.data?.content?.dataType === 'moveObject') {
        const fields = registryObj.data.content.fields as any;
        if (fields.lists?.fields?.id?.id) {
          const tableId = fields.lists.fields.id.id;
          const { data: dynamicFields } = await suiClient.getDynamicFields({
            parentId: tableId
          });

          let totalVolume = 0;
          let totalTransactions = 0;

          // Fetch payment history for each user
          for (const field of dynamicFields) {
            if (field.name.type === 'address') {
              const fieldObj = await suiClient.getObject({
                id: field.objectId,
                options: { showContent: true }
              });

              if (fieldObj.data?.content?.dataType === 'moveObject') {
                const valueId = (fieldObj.data.content.fields as any).value;
                if (typeof valueId === "string") {
                  const friendListObj = await suiClient.getObject({
                    id: valueId,
                    options: { showContent: true }
                  });

                  if (friendListObj.data?.content?.dataType === 'moveObject') {
                    const fields = friendListObj.data.content.fields as any;
                    if (fields.payments) {
                      const { data: paymentFields } = await suiClient.getDynamicFields({
                        parentId: fields.payments.fields.id.id
                      });

                      for (const paymentField of paymentFields) {
                        const paymentObj = await suiClient.getObject({
                          id: paymentField.objectId,
                          options: { showContent: true }
                        });

                        if (paymentObj.data?.content?.dataType === 'moveObject') {
                          const paymentFields = paymentObj.data.content.fields as any;
                          const history = paymentFields.value || [];
                          totalTransactions += history.length;
                          totalVolume += history.reduce((sum: number, item: any) => 
                            sum + Number(item.fields.amount) / 1e9, 0);
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          setStats({
            totalUsers: dynamicFields.length,
            totalVolume,
            totalTransactions
          });
        }
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      <BubbleAnimation />
      <ScrollAnimation />
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 relative overflow-hidden">
        {/* Underwater Effect */}
        <UnderwaterOverlay />
        
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-60 right-32 w-80 h-80 bg-gradient-to-r from-purple-400/15 to-pink-600/15 rounded-full blur-3xl animate-bounce" style={{ animationDuration: '8s' }}></div>
          <div className="absolute bottom-40 left-1/3 w-64 h-64 bg-gradient-to-r from-emerald-400/10 to-teal-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 relative z-50">
          {/* Header Section */}
          <Card className="mb-8 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl animate-on-scroll">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-3xl font-bold text-white">SuiConn</CardTitle>
                  <CardDescription className="text-gray-300">
                    Decentralized Friend Management & Payments on Sui
                  </CardDescription>
                </div>
                <div className="flex gap-4">
                  <ConnectButton />
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Hero Section */}
          <div className="text-center mb-24 max-w-6xl mx-auto animate-on-scroll">
            <div className="mb-12 flex justify-center">
              <div className="relative group">
                <div className="absolute -inset-8 bg-gradient-to-r from-cyan-400/20 to-purple-600/20 rounded-full blur-2xl group-hover:blur-3xl transition-all duration-500"></div>
                <div className="text-8xl font-black text-white relative z-10">SuiConn</div>
              </div>
            </div>

            <div className="space-y-8">
              <h1 className="text-7xl md:text-8xl font-black bg-gradient-to-r from-white via-cyan-200 to-purple-200 bg-clip-text text-transparent leading-tight">
                The Future of
                <br />
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Blockchain
                </span>
                <br />
                Social Payments
              </h1>

              <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed font-light">
                Experience seamless peer-to-peer transactions on Sui blockchain with revolutionary
                social features. Connect, transact, and thrive in the decentralized economy.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mt-12">
                <Link to="/app" className="group">
                  <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:from-cyan-400 hover:via-blue-500 hover:to-purple-500 text-white rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500 font-semibold">
                    <Sparkles className="mr-3 w-6 h-6" />
                    Launch App
                    <ArrowRight className="ml-3 w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                  </Button>
                </Link>

                <Button variant="outline" size="lg" className="text-xl px-12 py-6 border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 rounded-2xl shadow-xl hover:shadow-white/10 transform hover:scale-105 transition-all duration-500 font-semibold">
                  <Globe className="mr-3 w-6 h-6" />
                  View Demo
                </Button>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div id="features" className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-24">
            {[
              {
                icon: Users,
                title: "Social Network",
                description: "Build meaningful connections in the Web3 ecosystem with advanced friend management",
                gradient: "from-cyan-500 to-blue-600",
                bgGradient: "from-cyan-500/10 to-blue-600/10"
              },
              {
                icon: Wallet,
                title: "Instant Payments",
                description: "Lightning-fast SUI transfers with ultra-low fees and military-grade security",
                gradient: "from-purple-500 to-pink-600",
                bgGradient: "from-purple-500/10 to-pink-600/10"
              },
              {
                icon: Zap,
                title: "Batch Processing",
                description: "Execute multiple transactions simultaneously with our advanced batch system",
                gradient: "from-emerald-500 to-teal-600",
                bgGradient: "from-emerald-500/10 to-teal-600/10"
              },
              {
                icon: Shield,
                title: "Fort Knox Security",
                description: "Powered by Sui's cutting-edge blockchain technology for maximum protection",
                gradient: "from-orange-500 to-red-600",
                bgGradient: "from-orange-500/10 to-red-600/10"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="group relative backdrop-blur-xl bg-white/5 rounded-3xl border border-white/10 p-8 shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-105 hover:bg-white/10 animate-on-scroll"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.bgGradient} rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

                <div className="relative z-10">
                  <div className={`w-20 h-20 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} rounded-2xl shadow-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-10 h-10 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-cyan-300 transition-colors duration-300">
                    {feature.title}
                  </h3>

                  <p className="text-gray-300 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl animate-on-scroll">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Active Users</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.totalUsers}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 flex items-center justify-center">
                    <Users className="text-cyan-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl animate-on-scroll">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Transactions</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.totalTransactions}</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 flex items-center justify-center">
                    <Wallet className="text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="backdrop-blur-xl bg-white/5 border border-white/10 shadow-xl animate-on-scroll">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Volume</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{stats.totalVolume.toFixed(2)} SUI</h3>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                    <Shield className="text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* CTA Section */}
          <div className="text-center backdrop-blur-xl bg-gradient-to-r from-white/5 to-white/10 rounded-3xl border border-white/20 p-16 shadow-2xl animate-on-scroll">
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-center mb-8">
                <div className="flex items-center space-x-2">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-8 h-8 text-yellow-400 fill-current" />
                  ))}
                  <span className="text-gray-300 ml-4 text-lg font-medium">Trusted by thousands</span>
                </div>
              </div>

              <h2 className="text-5xl md:text-6xl font-bold text-white mb-6">
                Ready to revolutionize
                <br />
                your <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">crypto experience</span>?
              </h2>

              <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
                Join the future of decentralized social payments. Connect your wallet and start
                building meaningful blockchain relationships today.
              </p>

              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <Link to="/app">
                  <Button size="lg" className="text-xl px-12 py-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-2xl shadow-2xl hover:shadow-cyan-500/25 transform hover:scale-105 transition-all duration-500 font-semibold">
                    <TrendingUp className="mr-3 w-6 h-6" />
                    Get Started Now
                    <ArrowRight className="ml-3 w-6 h-6" />
                  </Button>
                </Link>

                <Button variant="outline" size="lg" className="text-xl px-12 py-6 border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 rounded-2xl shadow-xl font-semibold">
                  <Layers className="mr-3 w-6 h-6" />
                  Learn More
                </Button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="mt-24 pt-12 border-t border-white/10 animate-on-scroll">
            <div className="text-center text-gray-400">
              <p className="text-lg">© 2024 SuiConn. Revolutionizing blockchain social payments.</p>
              <div className="flex justify-center space-x-8 mt-6">
                <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Privacy</a>
                <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Terms</a>
                <a href="#" className="hover:text-cyan-400 transition-colors duration-300">Support</a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Landing; 