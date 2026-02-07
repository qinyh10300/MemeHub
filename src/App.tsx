import React, { useState } from 'react';
import { Home, ListTodo, TrendingUp, Vault, Users, Wallet } from 'lucide-react';
import { LandingPage } from './components/LandingPage';
import { WalletConnectModal } from './components/WalletConnectModal';
import { Dashboard } from './components/Dashboard';
import { TaskFeedPage } from './components/TaskFeedPage';
import { TaskCreationPage } from './components/TaskCreationPage';
import { TaskDetailPage } from './components/TaskDetailPage';
import { PredictionMarketsPage } from './components/PredictionMarketsPage';
import { PredictionDetailPage } from './components/PredictionDetailPage';
import { VaultPage } from './components/VaultPage';
import { CommunityPage } from './components/CommunityPage';
import { useWallet } from './lib/useWallet';
import { toast, Toaster } from 'sonner@2.0.3';

type Page = 
  | 'landing'
  | 'dashboard'
  | 'tasks'
  | 'task-create'
  | 'task-detail'
  | 'predictions'
  | 'prediction-detail'
  | 'vault'
  | 'community';

export default function App() {
  const { isConnected, user, isLoading, connect, disconnect } = useWallet();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedMarketId, setSelectedMarketId] = useState<string>('');

  const handleConnect = () => {
    if (isConnected) {
      setCurrentPage('dashboard');
    } else {
      setShowConnectModal(true);
    }
  };

  const handleWalletConnect = async (method: 'metamask' | 'email' | 'walletconnect') => {
    await connect(method);
    setShowConnectModal(false);
    setCurrentPage('dashboard');
    toast.success(`Connected with ${method}!`, {
      description: 'Welcome to Black Horse Guild',
    });
  };

  const handleDisconnect = () => {
    disconnect();
    setCurrentPage('landing');
    toast.info('Disconnected from wallet');
  };

  const handleNavigate = (page: string) => {
    switch (page) {
      case 'tasks':
        setCurrentPage('tasks');
        break;
      case 'predictions':
        setCurrentPage('predictions');
        break;
      case 'vault':
        setCurrentPage('vault');
        break;
      case 'community':
        setCurrentPage('community');
        break;
      case 'dashboard':
        setCurrentPage('dashboard');
        break;
      default:
        setCurrentPage('landing');
    }
  };

  const handleTaskClick = (taskId: string) => {
    setSelectedTaskId(taskId);
    setCurrentPage('task-detail');
  };

  const handleMarketClick = (marketId: string) => {
    setSelectedMarketId(marketId);
    setCurrentPage('prediction-detail');
  };

  const handleCreateTask = () => {
    setCurrentPage('task-create');
  };

  const handleTaskSubmit = (taskData: any) => {
    console.log('Task submitted:', taskData);
    toast.success('Task created successfully!', {
      description: 'Your task is now live and visible to the community',
    });
    setCurrentPage('tasks');
  };

  const renderContent = () => {
    if (!isConnected && currentPage !== 'landing' && currentPage !== 'tasks' && currentPage !== 'predictions') {
      return (
        <LandingPage
          onConnect={handleConnect}
          onNavigate={handleNavigate}
        />
      );
    }

    switch (currentPage) {
      case 'landing':
        return (
          <LandingPage
            onConnect={handleConnect}
            onNavigate={handleNavigate}
          />
        );
      case 'dashboard':
        if (!isConnected || !user) return null;
        return (
          <Dashboard
            user={user}
            onDisconnect={handleDisconnect}
            onNavigate={handleNavigate}
          />
        );
      case 'tasks':
        return (
          <TaskFeedPage
            onCreateTask={handleCreateTask}
            onTaskClick={handleTaskClick}
          />
        );
      case 'task-create':
        return (
          <TaskCreationPage
            onBack={() => setCurrentPage('tasks')}
            onSubmit={handleTaskSubmit}
          />
        );
      case 'task-detail':
        return (
          <TaskDetailPage
            taskId={selectedTaskId}
            onBack={() => setCurrentPage('tasks')}
          />
        );
      case 'predictions':
        return (
          <PredictionMarketsPage
            onMarketClick={handleMarketClick}
          />
        );
      case 'prediction-detail':
        return (
          <PredictionDetailPage
            marketId={selectedMarketId}
            onBack={() => setCurrentPage('predictions')}
          />
        );
      case 'vault':
        return <VaultPage />;
      case 'community':
        return <CommunityPage />;
      default:
        return (
          <LandingPage
            onConnect={handleConnect}
            onNavigate={handleNavigate}
          />
        );
    }
  };

  const showBottomNav = isConnected && currentPage !== 'landing';

  return (
    <div className="dark min-h-screen bg-background text-foreground">
      {/* Main Content */}
      <main className={showBottomNav ? 'pb-20 lg:pb-0' : ''}>
        {renderContent()}
      </main>

      {/* Mobile Bottom Navigation */}
      {showBottomNav && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 glass border-t border-white/10 z-40">
          <div className="grid grid-cols-5 gap-1 px-2 py-3">
            <button
              onClick={() => handleNavigate('dashboard')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                currentPage === 'dashboard'
                  ? 'text-[#00D1FF] bg-[#00D1FF]/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Home className="w-5 h-5" />
              <span className="text-xs">Home</span>
            </button>
            <button
              onClick={() => handleNavigate('tasks')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                currentPage === 'tasks' || currentPage === 'task-detail' || currentPage === 'task-create'
                  ? 'text-[#00D1FF] bg-[#00D1FF]/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <ListTodo className="w-5 h-5" />
              <span className="text-xs">Tasks</span>
            </button>
            <button
              onClick={() => handleNavigate('predictions')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                currentPage === 'predictions' || currentPage === 'prediction-detail'
                  ? 'text-[#00D1FF] bg-[#00D1FF]/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              <span className="text-xs">Markets</span>
            </button>
            <button
              onClick={() => handleNavigate('vault')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                currentPage === 'vault'
                  ? 'text-[#00D1FF] bg-[#00D1FF]/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Vault className="w-5 h-5" />
              <span className="text-xs">Vault</span>
            </button>
            <button
              onClick={() => handleNavigate('community')}
              className={`flex flex-col items-center gap-1 py-2 rounded-lg transition-colors ${
                currentPage === 'community'
                  ? 'text-[#00D1FF] bg-[#00D1FF]/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="text-xs">Social</span>
            </button>
          </div>
        </nav>
      )}

      {/* Wallet Connect Modal */}
      <WalletConnectModal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        onConnect={handleWalletConnect}
        isLoading={isLoading}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1f2e',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
        }}
      />
    </div>
  );
}
