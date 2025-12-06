#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const projectPath = path.join(process.env.HOME, 'Desktop', 'fitness-tracker');

console.log('🏋️  Creating Fitness Tracker Project...\n');
console.log(`📍 Location: ${projectPath}\n`);

// Create directories
const dirs = [
  'frontend-web/src/components/Auth',
  'frontend-web/src/components/Dashboard',
  'frontend-web/src/components/Workouts',
  'frontend-web/src/services',
  'frontend-web/src/hooks',
  'frontend-web/src/context',
  'frontend-web/src/types',
  'frontend-web/src/utils',
  'frontend-web/src/styles',
  'frontend-web/public',
  'backend/src/controllers',
  'backend/src/models',
  'backend/src/routes',
  'backend/src/middleware',
  'backend/src/config'
];

console.log('📁 Creating directories...');
dirs.forEach(dir => {
  const fullPath = path.join(projectPath, dir);
  fs.mkdirSync(fullPath, { recursive: true });
});
console.log('✅ Directories created\n');

console.log('📝 Generating files...');

// Frontend App.tsx
fs.writeFileSync(path.join(projectPath, 'frontend-web/src/App.tsx'), `import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from './components/Dashboard/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
`);

// Dashboard
fs.writeFileSync(path.join(projectPath, 'frontend-web/src/components/Dashboard/Dashboard.tsx'), `import React from 'react';

const Dashboard = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>FitTrack Pro Dashboard</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginTop: '20px' }}>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Total Workouts</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>24</p>
        </div>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>This Week</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>5</p>
        </div>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Calories</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>3,450</p>
        </div>
        <div style={{ padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
          <h3>Active Days</h3>
          <p style={{ fontSize: '24px', fontWeight: 'bold' }}>18</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
`);

// package.json
fs.writeFileSync(path.join(projectPath, 'frontend-web/package.json'), JSON.stringify({
  name: "fitness-tracker-web",
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc && vite build"
  },
  dependencies: {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.20.0"
  },
  devDependencies: {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.2.0",
    typescript: "^5.3.0",
    vite: "^5.0.0"
  }
}, null, 2));

// Backend
fs.writeFileSync(path.join(projectPath, 'backend/src/index.ts'), `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`);

fs.writeFileSync(path.join(projectPath, 'backend/package.json'), JSON.stringify({
  name: "fitness-tracker-backend",
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "tsx watch src/index.ts"
  },
  dependencies: {
    express: "^4.18.0",
    cors: "^2.8.5"
  },
  devDependencies: {
    "@types/express": "^4.17.0",
    "@types/cors": "^2.8.0",
    typescript: "^5.3.0",
    tsx: "^4.0.0"
  }
}, null, 2));

// README
fs.writeFileSync(path.join(projectPath, 'README.md'), `# FitTrack Pro - Fitness Tracker

Complete fitness tracking application.

## Setup

### Frontend
\`\`\`bash
cd frontend-web
npm install
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

## Features
- Dashboard with statistics
- Workout tracking
- Nutrition logging
- Progress tracking
`);

console.log('✅ Files generated\n');
console.log('🎉 Project created successfully!\n');
console.log('📋 Next steps:');
console.log(`   cd ${projectPath}/frontend-web`);
console.log('   npm install');
console.log('   npm run dev\n');
