# DD20-VTT Project Guide

## Project Overview
DD20-VTT (Tablero Virtual Digitald20) is a virtual tabletop application for Dungeons & Dragons 20 game sessions. It provides a collaborative platform for game masters and players to conduct online tabletop RPG campaigns.

## Tech Stack
- **Runtime**: Node.js (>=18.0.0)
- **Framework**: Feathers.js 5.x (real-time API framework)
- **Web Server**: Express.js (via @feathersjs/express)
- **Real-time Communication**: Socket.IO (via @feathersjs/socketio)
- **CSS Framework**: Bulma 1.x
- **Database**: LevelDB (via level)
- **Asset Management**: ImageKit
- **Utilities**: body-parser, serve-index

## Project Structure
```
dd20-vtt/
├── index.js              # Main application entry point
├── app.js                # Express app configuration
├── package.json          # Project dependencies and scripts
├── public/               # Static assets (HTML, CSS, JavaScript, images)
├── LICENSE.md            # GPL-3.0-or-later license
├── Procfile              # Deployment configuration
├── README.md             # Basic project information
└── SSL.txt               # SSL certificate configuration
```

## Key Files

### Entry Points
- **index.js**: Main server entry point. Initializes and starts the Feathers.js application
- **app.js**: Feathers.js application configuration including middleware, services, and Socket.IO setup

### Frontend
- **public/**: Contains all static assets served to clients (HTML pages, client-side JavaScript, CSS, images)

## Development Setup

### Prerequisites
- Node.js 18.0.0 or higher
- npm (comes with Node.js)

### Installation
```bash
npm install
```

### Running the Application
```bash
npm start
```
This runs `node index.js` and starts the server.

## Scripts
- `npm start` - Start the application server
- `npm test` - Run tests (currently not implemented)

## Architecture Notes

### Real-time Communication
The application uses Socket.IO for real-time bidirectional communication between clients and the server, enabling live collaboration during game sessions.

### Database
LevelDB is used for persistent data storage, providing a lightweight key-value store suitable for this type of application.

### API Structure
Feathers.js provides a service-oriented architecture with built-in support for CRUD operations and real-time events.

## Common Development Tasks

### Starting the Server
```bash
npm start
```

### Debugging
For development debugging, you can run:
```bash
node --inspect index.js
```
Then connect Chrome DevTools at `chrome://inspect`

### Asset Management
Static assets in the `public/` directory are automatically served by the Express server configured in `app.js`.

## Deployment
- Uses Procfile for deployment configuration (e.g., Heroku)
- SSL configuration available via SSL.txt
- Ensure Node.js version matches engine requirement (>=18.0.0)

## License
GPL-3.0-or-later - See LICENSE.md for details

## Notes for Claude
- This is a real-time collaborative application, so focus on Socket.IO and service architecture when making changes
- Data persistence uses LevelDB, so consider data structures and key patterns
- The public/ directory contains frontend code that communicates with the backend via Socket.IO events
- Always run `npm install` after modifying package.json
- Test changes locally with `npm start` before committing
