import React from 'react';
import { Home, ListTodo, TrendingUp, Vault, Users, Wallet, LogOut, Menu, X } from 'lucide-react';
import { GlassCard } from './GlassCard';
import { ReputationBadge } from './ReputationBadge';
import { type User } from '../lib/mockData';
import { mockTasks, mockPredictionMarkets } from '../lib/mockData';
import { TaskCard } from './TaskCard';
import { PredictionCard } from './PredictionCard';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface DashboardProps {
  user: User;
  onDisconnect: () => void;
  onNavigate: (page: string) => void;
}

export function Dashboard({ user, onDisconnect, onNavigate }: DashboardProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const myTasks = mockTasks.filter(t => t.status === 'joined');
  const myPredictions = mockPredictionMarkets.slice(0, 2);

  const mockWinRateData = [
    { month: 'Jan', rate: 60 },
    { month: 'Feb', rate: 65 },
    { month: 'Mar', rate: 62 },
    { month: 'Apr', rate: 68 },
    { month: 'May', rate: 70 },
    { month: 'Jun', rate: 68.5 }
  ];

  const tokenData = [
    { name: 'DHC', value: user.dhcBalance, color: '#00D1FF' },
    { name: 'Emotion', value: user.emotionBalance, color: '#7C3AED' },
    { name: 'Intellectual', value: user.intellectualBalance, color: '#00FF9D' }
  ];

  const NavItem = ({ icon: Icon, label, page }: { icon: any; label: string; page?: string }) => (
    <button
      onClick={() => page && onNavigate(page)}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-white/5 transition-colors text-left"
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`${mobile ? 'fixed inset-0 z-50 bg-black/80 backdrop-blur-sm' : ''}`}>
      <div className={`
        ${mobile ? 'fixed top-0 left-0 h-full w-64 glass' : 'w-64'}
        flex flex-col p-6 space-y-6
      `}>
        {mobile && (
          <button
            onClick={() => setSidebarOpen(false)}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center text-2xl">
            {user.avatar}
          </div>
          <div>
            <div>{user.name}</div>
            <div className="text-xs text-muted-foreground">{user.address.slice(0, 6)}...{user.address.slice(-4)}</div>
          </div>
        </div>

        <ReputationBadge score={user.reputation} size="lg" />

        <nav className="flex-1 space-y-1">
          <NavItem icon={Home} label="Dashboard" page="dashboard" />
          <NavItem icon={ListTodo} label="Tasks" page="tasks" />
          <NavItem icon={TrendingUp} label="Predictions" page="predictions" />
          <NavItem icon={Vault} label="Vault" page="vault" />
          <NavItem icon={Users} label="Community" page="community" />
          <NavItem icon={Wallet} label="Wallet" page="dashboard" />
        </nav>

        <button
          onClick={onDisconnect}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-500/10 text-red-500 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span>Disconnect</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block glass border-r border-white/10">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && <Sidebar mobile />}

      {/* Main Content */}
      <main className="flex-1">
        {/* Mobile Header */}
        <div className="lg:hidden glass border-b border-white/10 p-4 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="w-6 h-6" />
          </button>
          <h2>Dashboard</h2>
          <div className="w-6" />
        </div>

        <div className="p-6 max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl mb-2">Welcome back, {user.name}!</h1>
            <p className="text-muted-foreground">Here's your activity overview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <GlassCard>
              <div className="text-sm text-muted-foreground mb-2">DHC Balance</div>
              <div className="text-2xl text-[#00D1FF]">{user.dhcBalance.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground mt-1">+12.5% this month</div>
            </GlassCard>
            <GlassCard>
              <div className="text-sm text-muted-foreground mb-2">Tasks Completed</div>
              <div className="text-2xl">{user.tasksCompleted}</div>
              <div className="text-xs text-[#00FF9D] mt-1">+5 this week</div>
            </GlassCard>
            <GlassCard>
              <div className="text-sm text-muted-foreground mb-2">Win Rate</div>
              <div className="text-2xl">{user.predictionWinRate}%</div>
              <div className="text-xs text-[#00FF9D] mt-1">+2.3% improvement</div>
            </GlassCard>
            <GlassCard>
              <div className="text-sm text-muted-foreground mb-2">Reputation Score</div>
              <div className="text-2xl">{user.reputation}</div>
              <ReputationBadge score={user.reputation} size="sm" />
            </GlassCard>
          </div>

          {/* Charts Row */}
          <div className="grid lg:grid-cols-2 gap-6 mb-8">
            <GlassCard>
              <h3 className="mb-4">Prediction Win Rate Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockWinRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="month" stroke="#8b92a8" />
                  <YAxis stroke="#8b92a8" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                  <Line type="monotone" dataKey="rate" stroke="#00D1FF" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </GlassCard>

            <GlassCard>
              <h3 className="mb-4">Token Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={tokenData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {tokenData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 mt-4">
                {tokenData.map((token) => (
                  <div key={token.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: token.color }}></div>
                    <span className="text-sm">{token.name}: {token.value}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

          {/* Active Tasks */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl">My Active Tasks</h2>
              <button
                onClick={() => onNavigate('tasks')}
                className="text-[#00D1FF] hover:text-[#00B8E6] transition-colors"
              >
                View All →
              </button>
            </div>
            {myTasks.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myTasks.map(task => (
                  <TaskCard key={task.id} task={task} onClick={() => onNavigate('tasks')} />
                ))}
              </div>
            ) : (
              <GlassCard>
                <div className="text-center py-8 text-muted-foreground">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No active tasks yet. Start by joining a task!</p>
                  <button
                    onClick={() => onNavigate('tasks')}
                    className="mt-4 text-[#00D1FF] hover:text-[#00B8E6]"
                  >
                    Browse Tasks
                  </button>
                </div>
              </GlassCard>
            )}
          </div>

          {/* My Predictions */}
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl">My Predictions</h2>
              <button
                onClick={() => onNavigate('predictions')}
                className="text-[#00D1FF] hover:text-[#00B8E6] transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {myPredictions.map(market => (
                <PredictionCard key={market.id} market={market} onClick={() => onNavigate('predictions')} />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}