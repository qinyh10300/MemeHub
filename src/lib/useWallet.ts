import { useState, useEffect } from 'react';
import { mockUser, type User } from './mockData';

export function useWallet() {
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user was previously connected (localStorage simulation)
    const wasConnected = localStorage.getItem('wallet_connected');
    if (wasConnected === 'true') {
      setIsConnected(true);
      setUser(mockUser);
    }
  }, []);

  const connect = async (method: 'metamask' | 'email' | 'walletconnect') => {
    setIsLoading(true);
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsConnected(true);
    setUser(mockUser);
    localStorage.setItem('wallet_connected', 'true');
    setIsLoading(false);
  };

  const disconnect = () => {
    setIsConnected(false);
    setUser(null);
    localStorage.removeItem('wallet_connected');
  };

  const updateBalance = (type: 'dhc' | 'emotion' | 'intellectual', amount: number) => {
    if (!user) return;
    
    const updatedUser = { ...user };
    if (type === 'dhc') {
      updatedUser.dhcBalance += amount;
    } else if (type === 'emotion') {
      updatedUser.emotionBalance += amount;
    } else {
      updatedUser.intellectualBalance += amount;
    }
    setUser(updatedUser);
  };

  return {
    isConnected,
    user,
    isLoading,
    connect,
    disconnect,
    updateBalance
  };
}