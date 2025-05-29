import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useLocation } from 'wouter';
import { Smartphone, Monitor, Loader2 } from 'lucide-react';
import { validateConnectionCode } from '@/lib/crypto';

export default function PairingView() {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { joinSession, session, error: wsError } = useWebSocket();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Focus first input on mount
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    // Redirect to mobile view when successfully connected
    if (session?.isActive) {
      setLocation('/mobile');
    }
  }, [session, setLocation]);

  useEffect(() => {
    if (wsError) {
      setError(wsError);
      setIsConnecting(false);
    }
  }, [wsError]);

  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single character
    
    const newCode = [...code];
    newCode[index] = value.toUpperCase();
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    
    if (e.key === 'Enter') {
      handleConnect();
    }
  };

  const handleConnect = () => {
    const connectionCode = code.join('');
    
    if (connectionCode.length !== 6) {
      setError('Please enter a 6-digit code');
      return;
    }

    if (!validateConnectionCode(connectionCode)) {
      setError('Invalid code format');
      return;
    }

    setIsConnecting(true);
    setError(null);
    joinSession(connectionCode);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().slice(0, 6);
    
    if (validateConnectionCode(pastedText)) {
      const newCode = pastedText.split('').concat(['', '', '', '', '', '']).slice(0, 6);
      setCode(newCode);
      setError(null);
      
      // Focus last filled input
      const lastIndex = Math.min(pastedText.length, 5);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <Monitor className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gray-300"></div>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Smartphone className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Pair Devices</h1>
            <p className="text-gray-600">
              Enter the 6-digit code from your laptop screen
            </p>
          </div>

          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-3">
                <p className="text-red-800 text-sm text-center">{error}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-6">
            {/* Code Input */}
            <div className="flex gap-2 justify-center" onPaste={handlePaste}>
              {code.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleInputChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-bold border-2 focus:border-primary"
                  disabled={isConnecting}
                />
              ))}
            </div>

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              disabled={code.join('').length !== 6 || isConnecting}
              className="w-full h-12 text-base font-medium"
            >
              {isConnecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect Devices'
              )}
            </Button>

            {/* Instructions */}
            <div className="text-center text-sm text-gray-500 space-y-2">
              <p>Make sure both devices are connected to the internet</p>
              <p>The code expires after 5 minutes</p>
            </div>

            {/* Alternative Actions */}
            <div className="pt-4 border-t">
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setLocation('/laptop')}
              >
                I'm using a laptop
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
