# Secure Screen Sharing App with AI Assistant

A real-time screen sharing application that allows secure sharing of laptop screens to mobile devices with an integrated AI assistant for contextual Q&A.

## Features

- 🔒 **Secure Connection**: 6-digit encrypted pairing codes
- 📱 **Cross-Device**: Laptop screen sharing to mobile devices
- 🤖 **AI Assistant**: Real-time contextual help based on screen content
- 🌐 **WebRTC**: Direct peer-to-peer screen sharing
- 💬 **Live Chat**: Real-time messaging with AI responses
- 🔍 **Transparent UI**: Minimal laptop interface, full mobile experience

## Quick Start

### Local Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser:
   - Laptop view: `http://localhost:5000/laptop`
   - Mobile view: `http://localhost:5000/pairing`

### Deployment

This app is designed to run on platforms that support WebSocket connections:

- **Railway**: `railway deploy`
- **Render**: Connect GitHub repo and deploy
- **Replit**: Use deployment feature
- **Heroku**: `git push heroku main`

## How It Works

1. **Laptop**: Navigate to `/laptop` and click "Start Sharing"
2. **Mobile**: Enter the 6-digit code shown on laptop at `/pairing`
3. **Connect**: Devices pair automatically via encrypted WebSocket connection
4. **Share**: Laptop screen appears on mobile with AI chat interface
5. **Chat**: Ask questions about what's visible on screen

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket
- **Real-time**: WebRTC for screen sharing, WebSockets for signaling
- **UI Components**: Shadcn/ui, Lucide React icons
- **Security**: End-to-end encryption, secure pairing codes

## API Endpoints

- `GET /` - Pairing interface
- `GET /laptop` - Laptop screen sharing view
- `GET /mobile` - Mobile viewing interface
- `WS /ws` - WebSocket connection for real-time communication

## Environment Variables

No external API keys required for basic functionality. The app uses:
- In-memory storage for sessions
- WebRTC for direct peer connections
- Mock AI responses (easily replaceable with real AI services)

## Browser Requirements

- **Laptop**: Modern browser with screen capture API support
- **Mobile**: Any modern mobile browser
- **Both**: WebRTC and WebSocket support

## Security Features

- Encrypted connection codes
- Session-based authentication
- Local data processing
- No data persistence beyond session
- User-authorized screen capture only

## License

MIT License - Feel free to use and modify