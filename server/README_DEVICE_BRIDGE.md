# Device Bridge Infrastructure

This document describes the device bridge infrastructure for connecting physical mobile devices to the web-based code editor.

## Components Implemented

### 1. Device Types (`server/types/device.ts`)
- `Device`: Core device interface with id, name, platform, OS version, model, connection type, and status
- `DeviceInfo`: Extended device information including manufacturer, serial number, and properties
- `CommandResult`: Structure for command execution results

### 2. ADB Bridge (`server/services/adbBridge.ts`)
Android device communication layer providing:
- Device discovery and listing
- Device information retrieval
- Shell command execution
- App installation (APK)
- Screen capture
- Port forwarding
- Device properties access

### 3. iOS Bridge (`server/services/iosBridge.ts`)
iOS device communication layer providing:
- Device discovery and listing
- Device information retrieval
- Shell command execution
- App installation (IPA)
- Screen capture
- Screen streaming

### 4. Device Manager (`server/services/deviceManager.ts`)
Coordinates device discovery and management across both platforms:
- Unified device discovery (Android + iOS)
- Device information retrieval
- Connected device tracking
- Platform-specific bridge access

### 5. WebSocket Server (`server/services/websocketServer.ts`)
Real-time communication layer:
- WebSocket server at `/device-bridge` endpoint
- Message routing for device operations
- Support for discovery, commands, files, permissions, screen, and logs
- Client connection management
- Broadcast capabilities

### 6. Device Routes (`server/routes/devices.ts`)
REST API endpoints:
- `GET /api/devices` - Discover and list all available devices
- `GET /api/devices/:deviceId` - Get detailed device information
- `GET /api/devices/status/connected` - Get currently connected devices

### 7. Server Integration (`server/index.ts`)
- HTTP server with WebSocket support
- Device routes mounted at `/api/devices`
- WebSocket server initialized with device manager
- CORS and security middleware configured

## Testing

### Property-Based Test (`server/tests/deviceDiscovery.property.test.ts`)
**Feature: device-terminal-integration, Property 1: Device discovery completeness**
**Validates: Requirements 1.1**

Tests that verify:
- Device discovery returns all available devices
- All returned devices have valid structure
- Device IDs are unique
- Consecutive discoveries are consistent
- Both Android and iOS platforms are supported
- Empty device lists are handled correctly
- Connected devices map is updated after discovery

Runs 100 iterations per property using fast-check.

## Dependencies Added

- `@devicefarmer/adbkit`: ^3.2.6 - Android Debug Bridge client
- `ws`: ^8.16.0 - WebSocket server implementation
- `@types/ws`: ^8.5.10 - TypeScript definitions for ws

## Usage

### Starting the Server
```bash
npm run server
```

The server will start on port 3001 (or PORT environment variable) with:
- REST API at `http://localhost:3001/api/devices`
- WebSocket at `ws://localhost:3001/device-bridge`

### Discovering Devices
```bash
curl http://localhost:3001/api/devices
```

### WebSocket Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/device-bridge');

ws.onopen = () => {
  // Send device discovery request
  ws.send(JSON.stringify({
    type: 'discovery',
    requestId: 'discover-1',
    payload: {}
  }));
};

ws.onmessage = (event) => {
  const response = JSON.parse(event.data);
  console.log('Devices:', response.data.devices);
};
```

## Next Steps

The infrastructure is now ready for:
- Device connection management (Task 2)
- Terminal functionality (Task 3)
- Screen mirroring (Task 4)
- Permission management (Task 6)
- File system access (Task 8)
- And other device features

## Notes

- Current implementation includes mock/placeholder logic for actual device communication
- Real ADB and iOS device integration will be completed in subsequent tasks
- The architecture supports both USB and wireless device connections
- Security middleware is configured with CORS support
