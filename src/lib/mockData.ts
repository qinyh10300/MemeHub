// Mock data for the Black Horse Guild platform

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  entryFee: number;
  category: 'Interest' | 'Emotional' | 'Academic-Industry';
  participants: number;
  maxParticipants: number;
  deadline: Date;
  creator: {
    name: string;
    avatar: string;
    reputation: number;
  };
  status: 'active' | 'ended' | 'joined';
  proofRequired: boolean;
  isGameTask?: boolean;
  gameUrl?: string;
}

export interface PredictionMarket {
  id: string;
  title: string;
  description: string;
  yesPrice: number;
  noPrice: number;
  liquidity: number;
  volume: number;
  endTime: Date;
  category: string;
  resolved: boolean;
  outcome?: 'yes' | 'no';
}

export interface User {
  address: string;
  name: string;
  avatar: string;
  reputation: number;
  dhcBalance: number;
  emotionBalance: number;
  intellectualBalance: number;
  tasksCompleted: number;
  predictionWinRate: number;
}

export const mockUser: User = {
  address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
  name: 'BlackHorse_Alpha',
  avatar: '👤',
  reputation: 85,
  dhcBalance: 12450,
  emotionBalance: 320,
  intellectualBalance: 580,
  tasksCompleted: 47,
  predictionWinRate: 68.5
};

export const mockTasks: Task[] = [
  {
    id: 'game-1',
    title: '🎮 Web3 University Adventure Game',
    description: 'Play through an interactive Web3 learning adventure! Navigate the university campus, collect knowledge tokens, and master blockchain concepts. Complete all levels to earn DHC rewards!',
    reward: 750,
    entryFee: 0,
    category: 'Interest',
    participants: 35,
    maxParticipants: 100,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'GameMaster',
      avatar: '🎮',
      reputation: 94
    },
    status: 'active',
    proofRequired: false,
    isGameTask: true,
    gameUrl: 'https://www.figma.com/make/v7JczJIB1kxl69wHtX7zJO/Web3-University-Game-Concept?t=LN9oj4iEKpUXgfWB-1'
  },
  {
    id: '1',
    title: 'Complete Web3 Development Course',
    description: 'Finish the entire Solidity and Smart Contract course on Ethereum. Submit certificate as proof.',
    reward: 500,
    entryFee: 10,
    category: 'Academic-Industry',
    participants: 12,
    maxParticipants: 20,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'CryptoMentor',
      avatar: '🧙',
      reputation: 92
    },
    status: 'active',
    proofRequired: true
  },
  {
    id: '2',
    title: 'Daily Meditation Challenge - 30 Days',
    description: 'Meditate for at least 15 minutes daily for 30 consecutive days. Share daily logs.',
    reward: 300,
    entryFee: 5,
    category: 'Emotional',
    participants: 25,
    maxParticipants: 50,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'MindfulSoul',
      avatar: '🧘',
      reputation: 88
    },
    status: 'active',
    proofRequired: true
  },
  {
    id: '3',
    title: 'Build a DeFi Protocol',
    description: 'Create and deploy a working DeFi protocol with lending/borrowing features. Open source on GitHub.',
    reward: 2000,
    entryFee: 50,
    category: 'Academic-Industry',
    participants: 3,
    maxParticipants: 10,
    deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'DeFiBuilder',
      avatar: '💎',
      reputation: 95
    },
    status: 'active',
    proofRequired: true
  },
  {
    id: '4',
    title: 'Learn Piano - Moonlight Sonata',
    description: 'Learn to play the first movement of Beethovens Moonlight Sonata. Submit video performance.',
    reward: 400,
    entryFee: 15,
    category: 'Interest',
    participants: 8,
    maxParticipants: 15,
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'PianoMaster',
      avatar: '🎹',
      reputation: 78
    },
    status: 'active',
    proofRequired: true
  },
  {
    id: '5',
    title: 'Gratitude Journal - 21 Days',
    description: 'Write down 3 things youre grateful for each day for 21 days. Build a positive mindset habit.',
    reward: 200,
    entryFee: 5,
    category: 'Emotional',
    participants: 42,
    maxParticipants: 100,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'PositiveVibes',
      avatar: '🌟',
      reputation: 82
    },
    status: 'joined',
    proofRequired: true
  },
  {
    id: '6',
    title: 'NFT Art Collection Launch',
    description: 'Create and launch a complete NFT art collection (minimum 10 pieces) on OpenSea or Rarible.',
    reward: 1500,
    entryFee: 30,
    category: 'Interest',
    participants: 5,
    maxParticipants: 12,
    deadline: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    creator: {
      name: 'CryptoArtist',
      avatar: '🎨',
      reputation: 90
    },
    status: 'active',
    proofRequired: true
  }
];

export const mockPredictionMarkets: PredictionMarket[] = [
  {
    id: '1',
    title: 'Will Bitcoin reach $100k in 2026?',
    description: 'Bitcoin (BTC) will reach or exceed $100,000 USD before December 31, 2026.',
    yesPrice: 0.68,
    noPrice: 0.32,
    liquidity: 50000,
    volume: 125000,
    endTime: new Date('2026-12-31'),
    category: 'Crypto',
    resolved: false
  },
  {
    id: '2',
    title: 'Will "Web3 Dev Course" task reach 20 participants?',
    description: 'The Web3 Development Course task will reach its maximum 20 participants before deadline.',
    yesPrice: 0.55,
    noPrice: 0.45,
    liquidity: 5000,
    volume: 8500,
    endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    category: 'Tasks',
    resolved: false
  },
  {
    id: '3',
    title: 'Will Ethereum complete Shanghai upgrade on time?',
    description: 'Ethereum will successfully complete the Shanghai upgrade within the announced timeline.',
    yesPrice: 0.82,
    noPrice: 0.18,
    liquidity: 80000,
    volume: 200000,
    endTime: new Date('2026-06-30'),
    category: 'Crypto',
    resolved: false
  },
  {
    id: '4',
    title: 'Will BHG reach 10,000 active users this year?',
    description: 'Black Horse Guild will have 10,000 or more active users by end of 2026.',
    yesPrice: 0.45,
    noPrice: 0.55,
    liquidity: 15000,
    volume: 32000,
    endTime: new Date('2026-12-31'),
    category: 'Platform',
    resolved: false
  },
  {
    id: '5',
    title: 'Will NFT market volume exceed 2025 levels?',
    description: 'Total NFT market trading volume in 2026 will exceed 2025 annual volume.',
    yesPrice: 0.38,
    noPrice: 0.62,
    liquidity: 25000,
    volume: 45000,
    endTime: new Date('2026-12-31'),
    category: 'NFT',
    resolved: false
  }
];

export const mockCommunityPosts = [
  {
    id: '1',
    author: {
      name: 'CryptoMentor',
      avatar: '🧙',
      reputation: 92
    },
    content: 'Just launched a new task for aspiring Web3 developers! Join the Web3 Development Course challenge and earn 500 DHC 🚀',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    likes: 24,
    comments: 5
  },
  {
    id: '2',
    author: {
      name: 'BlackHorse_Beta',
      avatar: '🐴',
      reputation: 76
    },
    content: 'Predicted YES on Bitcoin $100k and already up 15%! The bull run is real 📈💎',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    likes: 18,
    comments: 8
  },
  {
    id: '3',
    author: {
      name: 'DeFiBuilder',
      avatar: '💎',
      reputation: 95
    },
    content: 'Completed my DeFi protocol! Check it out on GitHub. Thanks to the BHG community for the motivation 🙏',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    likes: 42,
    comments: 12
  }
];

export const mockVaultData = {
  totalDeposited: 25000,
  currentAPY: 8.2,
  claimableRewards: 145.50,
  assetComposition: [
    { name: 'USDC', value: 40, amount: 10000 },
    { name: 'USDT', value: 35, amount: 8750 },
    { name: 'DAI', value: 15, amount: 3750 },
    { name: 'RWA Tokens', value: 10, amount: 2500 }
  ],
  historicalAPY: [
    { date: 'Jan', apy: 7.2 },
    { date: 'Feb', apy: 7.5 },
    { date: 'Mar', apy: 7.8 },
    { date: 'Apr', apy: 8.1 },
    { date: 'May', apy: 8.4 },
    { date: 'Jun', apy: 8.2 }
  ]
};

export const communityStats = {
  totalUsers: 8547,
  tasksCompleted: 12340,
  dhcVolume: 2450000,
  activeMarkets: 127
};