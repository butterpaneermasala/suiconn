import { Routes, Route } from 'react-router-dom';
import CursorFollower from './components/CursorFollower';
import FriendListApp from './pages/suiconn';
import Landing from './pages/Landing';
import LearnMore from './pages/LearnMore';

const SuiConnApp = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      <CursorFollower />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/app" element={<FriendListApp />} />
        <Route path="/learn-more" element={<LearnMore />} />
      </Routes>
    </div>
  );
};

export default SuiConnApp;
