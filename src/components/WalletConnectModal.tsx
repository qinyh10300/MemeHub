import React from 'react';
import { X, Wallet, Mail, Link2 } from 'lucide-react';
import { NeonButton } from './NeonButton';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (method: 'metamask' | 'email' | 'walletconnect') => void;
  isLoading: boolean;
}

export function WalletConnectModal({ isOpen, onClose, onConnect, isLoading }: WalletConnectModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl mb-2">Welcome to Black Horse Guild</h2>
          <p className="text-muted-foreground">
            Connect your wallet to start earning DHC tokens
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => onConnect('metamask')}
            disabled={isLoading}
            className="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-left flex-1">
              <div>MetaMask</div>
              <div className="text-sm text-muted-foreground">Connect with MetaMask wallet</div>
            </div>
          </button>

          <button
            onClick={() => onConnect('email')}
            disabled={isLoading}
            className="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-[#00D1FF]/20 rounded-lg flex items-center justify-center">
              <Mail className="w-6 h-6 text-[#00D1FF]" />
            </div>
            <div className="text-left flex-1">
              <div>Email / WeChat</div>
              <div className="text-sm text-muted-foreground">Gasless login (EIP-7702)</div>
            </div>
          </button>

          <button
            onClick={() => onConnect('walletconnect')}
            disabled={isLoading}
            className="w-full glass hover:bg-[rgba(26,31,46,0.8)] p-4 rounded-xl flex items-center gap-4 transition-all hover:scale-[1.02]"
          >
            <div className="w-12 h-12 bg-[#7C3AED]/20 rounded-lg flex items-center justify-center">
              <Link2 className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <div className="text-left flex-1">
              <div>WalletConnect</div>
              <div className="text-sm text-muted-foreground">Connect with any wallet</div>
            </div>
          </button>
        </div>

        {isLoading && (
          <div className="mt-6 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#00D1FF] border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 text-sm text-muted-foreground">Connecting...</p>
          </div>
        )}

        <p className="mt-6 text-xs text-center text-muted-foreground">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}