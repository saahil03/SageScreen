import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useScreenShare } from '@/hooks/useScreenShare';
import { Monitor, Smartphone, Wifi, WifiOff, MonitorX } from 'lucide-react';

export default function LaptopView() {
  const { isConnected, session, createSession, sendWebRTCSignal } = useWebSocket();
  const { isSharing, error: shareError, startScreenShare, stopScreenShare } = useScreenShare();
  const [showPairing, setShowPairing] = useState(false);

  useEffect(() => {
    // Listen for WebRTC signaling events
    const handleSendSignal = (event: CustomEvent) => {
      sendWebRTCSignal(event.detail);
    };

    window.addEventListener('send-webrtc-signal', handleSendSignal as EventListener);
    
    return () => {
      window.removeEventListener('send-webrtc-signal', handleSendSignal as EventListener);
    };
  }, [sendWebRTCSignal]);

  const handleStartSharing = async () => {
    if (!session) {
      createSession();
      setShowPairing(true);
    } else if (session.isActive) {
      await startScreenShare();
    }
  };

  const handleStopSharing = () => {
    stopScreenShare();
    setShowPairing(false);
  };

  // Auto-start screen sharing when phone connects
  useEffect(() => {
    if (session?.isActive && !isSharing && showPairing) {
      startScreenShare();
      setShowPairing(false);
    }
  }, [session?.isActive, isSharing, showPairing, startScreenShare]);

  return (
    <div className="min-h-screen relative">
      {/* Transparent overlay indicators */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Connection Status */}
        <div className="absolute top-4 left-4 pointer-events-auto">
          <Card className="bg-black/20 backdrop-blur-sm border-none">
            <CardContent className="p-3 flex items-center gap-2 text-white">
              <div className={`w-2 h-2 rounded-full animate-pulse ${
                session?.isActive ? 'bg-green-400' : isConnected ? 'bg-yellow-400' : 'bg-red-400'
              }`} />
              <span className="text-sm">
                {session?.isActive ? 'Connected to Mobile' : 
                 isConnected ? 'Waiting for connection' : 'Disconnected'}
              </span>
            </CardContent>
          </Card>
        </div>

        {/* MonitorX Sharing Indicator */}
        {isSharing && (
          <div className="absolute top-4 right-4 pointer-events-auto">
            <Card className="bg-red-500/90 backdrop-blur-sm border-none">
              <CardContent className="p-2 flex items-center gap-2 text-white">
                <MonitorX className="h-4 w-4" />
                <span className="text-xs font-medium">Sharing MonitorX</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pairing Overlay */}
        {showPairing && session && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center pointer-events-auto">
            <Card className="max-w-md mx-4 shadow-2xl">
              <CardContent className="p-8 text-center">
                <Smartphone className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connect Your Phone</h3>
                <p className="text-gray-600 mb-6">
                  Enter this code on your mobile device:
                </p>
                
                <Card className="bg-gray-50 mb-6">
                  <CardContent className="p-4">
                    <div className="text-3xl font-mono font-bold text-primary tracking-wider">
                      {session.connectionCode}
                    </div>
                  </CardContent>
                </Card>
                
                <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span>Waiting for connection...</span>
                </div>

                <Button 
                  variant="outline" 
                  onClick={() => setShowPairing(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">ScreenShare AI Assistant</h1>
            <div className="flex items-center gap-4">
              <Badge variant={isConnected ? "default" : "destructive"} className="flex items-center gap-1">
                {isConnected ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
                {isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              
              {!isSharing ? (
                <Button onClick={handleStartSharing} className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Start Sharing
                </Button>
              ) : (
                <Button onClick={handleStopSharing} variant="destructive" className="flex items-center gap-2">
                  <MonitorX className="h-4 w-4" />
                  Stop Sharing
                </Button>
              )}
            </div>
          </div>

          {shareError && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-800 text-sm">{shareError}</p>
              </CardContent>
            </Card>
          )}

          {/* Sample Content */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Dashboard Overview
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Users</span>
                    <span className="font-semibold">1,234</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue</span>
                    <span className="font-semibold">$45,678</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-semibold">3.2%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Sessions</span>
                    <span className="font-semibold">89</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    User registration increased by 15%
                  </div>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    New feature deployed successfully
                  </div>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    System performance optimized
                  </div>
                  <div className="text-sm text-gray-600 p-2 bg-gray-50 rounded">
                    Database backup completed
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">98.5%</div>
                    <div className="text-sm text-gray-600">Uptime</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">1.2s</div>
                    <div className="text-sm text-gray-600">Load Time</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">45</div>
                    <div className="text-sm text-gray-600">API Calls/min</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">99.9%</div>
                    <div className="text-sm text-gray-600">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
