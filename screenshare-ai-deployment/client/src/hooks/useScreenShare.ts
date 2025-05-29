import { useEffect, useRef, useState, useCallback } from 'react';

export function useScreenShare() {
  const [isSharing, setIsSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const createPeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ],
    };

    const pc = new RTCPeerConnection(config);
    
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        // Send ice candidate through WebSocket
        window.dispatchEvent(new CustomEvent('send-webrtc-signal', {
          detail: { type: 'ice-candidate', candidate: event.candidate }
        }));
      }
    };

    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'failed') {
        setError('Connection failed');
      }
    };

    return pc;
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      setError(null);
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: false,
      });

      localStreamRef.current = stream;
      setIsSharing(true);

      // Create peer connection
      const pc = createPeerConnection();
      peerConnectionRef.current = pc;

      // Add stream to peer connection
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle stream end
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      // Create and send offer
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      window.dispatchEvent(new CustomEvent('send-webrtc-signal', {
        detail: { type: 'offer', offer }
      }));

    } catch (err: any) {
      console.error('Error starting screen share:', err);
      setError(err.message || 'Failed to start screen sharing');
      setIsSharing(false);
    }
  }, [createPeerConnection]);

  const stopScreenShare = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    setIsSharing(false);
    setRemoteStream(null);
  }, []);

  const handleWebRTCSignal = useCallback(async (signal: any) => {
    if (!peerConnectionRef.current) {
      peerConnectionRef.current = createPeerConnection();
    }

    const pc = peerConnectionRef.current;

    try {
      switch (signal.type) {
        case 'offer':
          await pc.setRemoteDescription(signal.offer);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          
          window.dispatchEvent(new CustomEvent('send-webrtc-signal', {
            detail: { type: 'answer', answer }
          }));
          break;

        case 'answer':
          await pc.setRemoteDescription(signal.answer);
          break;

        case 'ice-candidate':
          if (signal.candidate) {
            await pc.addIceCandidate(signal.candidate);
          }
          break;
      }
    } catch (err) {
      console.error('Error handling WebRTC signal:', err);
      setError('Failed to establish connection');
    }
  }, [createPeerConnection]);

  useEffect(() => {
    const handleSignal = (event: CustomEvent) => {
      handleWebRTCSignal(event.detail);
    };

    window.addEventListener('webrtc-signal', handleSignal as EventListener);
    
    return () => {
      window.removeEventListener('webrtc-signal', handleSignal as EventListener);
      stopScreenShare();
    };
  }, [handleWebRTCSignal, stopScreenShare]);

  return {
    isSharing,
    error,
    remoteStream,
    startScreenShare,
    stopScreenShare,
    handleWebRTCSignal,
  };
}
