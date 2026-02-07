import React, { useState } from 'react';
import { X, DollarSign, Shield, Zap } from 'lucide-react';
import { NeonButton } from './NeonButton';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  amount: number;
  currency: 'USDC' | 'USDT' | 'DHC';
  purpose: string;
}

export function PaymentModal({ isOpen, onClose, onConfirm, amount, currency, purpose }: PaymentModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-md glass rounded-2xl p-8 animate-in fade-in zoom-in duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          disabled={isProcessing}
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#00D1FF] to-[#7C3AED] rounded-full flex items-center justify-center">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl mb-2">Payment Required</h2>
          <p className="text-muted-foreground">
            {purpose}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="glass p-6 rounded-xl">
            <div className="flex justify-between items-center mb-4">
              <span className="text-muted-foreground">Amount</span>
              <span className="text-3xl">{amount} {currency}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Network Fee</span>
              <span className="text-[#00FF9D]">0 CFX (Gasless)</span>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-[#00D1FF]/10 border border-[#00D1FF]/30 rounded-lg">
            <Zap className="w-5 h-5 text-[#00D1FF] mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <div className="text-[#00D1FF] mb-1">Powered by x402 Micro-Payments</div>
              <div className="text-muted-foreground">Instant, secure, gasless transactions on Conflux eSpace</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4" />
            <span>Secured by smart contract escrow</span>
          </div>
        </div>

        <div className="flex gap-3">
          <NeonButton
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Processing...
              </span>
            ) : (
              `Pay ${amount} ${currency}`
            )}
          </NeonButton>
          <NeonButton
            variant="outline"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </NeonButton>
        </div>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          By confirming, you authorize this transaction
        </p>
      </div>
    </div>
  );
}