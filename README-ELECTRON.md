# Library Attendance System - Electron Desktop App

This app is now configured to run as a desktop application using Electron, providing true offline-first functionality.

## Development Setup

1. **Export to GitHub**: Click the "Export to GitHub" button in Lovable
2. **Clone the repository** to your local machine
3. **Install dependencies**:
   ```bash
   npm install
   ```
4. **Install Electron dependencies**:
   ```bash
   npm install electron electron-builder concurrently wait-on --save-dev
   ```

## Running the App

### Development Mode
```bash
# Start the web dev server and Electron together
npm run electron-dev
```

### Production Build
```bash
# Build the web app and create Electron executable
npm run electron-build
```

## Building Distributables

### For Current Platform
```bash
npm run electron-dist
```

### For Specific Platforms
```bash
# Windows
npx electron-builder --win

# macOS  
npx electron-builder --mac

# Linux
npx electron-builder --linux
```

## Features

✅ **True Offline First**: Works without internet from first launch
✅ **Local Data Storage**: All data stored locally with IndexedDB/localStorage
✅ **Cross Platform**: Windows, macOS, Linux support
✅ **Auto Updater Ready**: Can be configured for automatic updates
✅ **Native Menus**: Platform-specific application menus
✅ **Security**: Contextual isolation and security best practices

## File Structure
```
electron/
├── main.js          # Main Electron process
├── preload.js       # Preload script for security
├── package.json     # Electron-specific package.json
└── README.md        # This file

electron-builder.json  # Build configuration
```

## Offline Data Management

The app includes:
- Local student database
- Offline attendance tracking  
- Data sync capabilities (when online)
- Export/import functionality

## Next Steps for Production

1. **Code Signing**: Set up code signing certificates for distribution
2. **Auto Updates**: Configure electron-updater for automatic updates
3. **Icons**: Add proper application icons for each platform
4. **Installer Customization**: Customize the installer/DMG appearance
5. **App Store**: Configure for Mac App Store or Microsoft Store if needed

## Security Notes

- Context isolation enabled
- Node integration disabled in renderer
- Remote module disabled
- Web security enabled
- External links open in default browser