#!/usr/bin/env node

/**
 * Complete Fitness Tracker Project Generator
 * Generates full-stack application with detailed code
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🏋️  Fitness Tracker Project Generator');
  console.log('======================================\n');
  
  const defaultPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop', 'fitness-tracker');
  const projectPath = await question(`📁 Enter project location (default: ${defaultPath}): `) || defaultPath;
  
  console.log(`\n📍 Project will be created at: ${projectPath}\n`);
  
  const confirm = await question('Continue? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }
  
  console.log('\n🚀 Creating project...\n');
  
  // Create project structure
  createProjectStructure(projectPath);
  
  // Generate frontend files
  await generateFrontendFiles(projectPath);
  
  // Generate backend files
  await generateBackendFiles(projectPath);
  
  // Generate mobile files
  await generateMobileFiles(projectPath);
  
  // Generate config files
  generateConfigFiles(projectPath);
  
  console.log('\n✅ Project created successfully!\n');
  console.log('📋 Next steps:');
  console.log(`   cd ${projectPath}/frontend-web`);
  console.log('   npm install');
  console.log('   npm run dev\n');
  
  rl.close();
}

function createProjectStructure(basePath) {
  const dirs = [
    'frontend-web/src/components/Auth',
    'frontend-web/src/components/Dashboard',
    'frontend-web/src/components/Workouts',
    'frontend-web/src/components/Nutrition',
    'frontend-web/src/components/Goals',
    'frontend-web/src/components/Profile',
    'frontend-web/src/components/Common',
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
    'backend/src/services',
    'backend/src/utils',
    'backend/src/config',
    'backend/src/types',
    'mobile-app/src/screens',
    'mobile-app/src/components',
    'mobile-app/src/navigation',
    'mobile-app/src/services',
    'mobile-app/src/hooks',
    'mobile-app/src/types'
  ];
  
  dirs.forEach(dir => {
    const fullPath = path.join(basePath, dir);
    fs.mkdirSync(fullPath, { recursive: true });
  });
  
  console.log('✅ Project structure created');
}


async function generateFrontendFiles(basePath) {
  console.log('📝 Generating frontend files...');
  
  const frontendPath = path.join(basePath, 'frontend-web');
  
  // Generate App.tsx
  writeFile(path.join(frontendPath, 'src/App.tsx'), getAppTsx());
  
  // Generate main.tsx
  writeFile(path.join(frontendPath, 'src/main.tsx'), getMainTsx());
  
  // Generate Auth components
  writeFile(path.join(frontendPath, 'src/components/Auth/Login.tsx'), getLoginComponent());
  writeFile(path.join(frontendPath, 'src/components/Auth/Register.tsx'), getRegisterComponent());
  
  // Generate Dashboard
  writeFile(path.join(frontendPath, 'src/components/Dashboard/Dashboard.tsx'), getDashboardComponent());
  writeFile(path.join(frontendPath, 'src/components/Dashboard/StatsCard.tsx'), getStatsCardComponent());
  
  // Generate Workout components
  writeFile(path.join(frontendPath, 'src/components/Workouts/WorkoutList.tsx'), getWorkoutListComponent());
  writeFile(path.join(frontendPath, 'src/components/Workouts/WorkoutForm.tsx'), getWorkoutFormComponent());
  
  // Generate services
  writeFile(path.join(frontendPath, 'src/services/api.ts'), getApiService());
  writeFile(path.join(frontendPath, 'src/services/auth.ts'), getAuthService());
  writeFile(path.join(frontendPath, 'src/services/workouts.ts'), getWorkoutsService());
  
  // Generate hooks
  writeFile(path.join(frontendPath, 'src/hooks/useAuth.ts'), getUseAuthHook());
  writeFile(path.join(frontendPath, 'src/hooks/useWorkouts.ts'), getUseWorkoutsHook());
  
  // Generate context
  writeFile(path.join(frontendPath, 'src/context/AuthContext.tsx'), getAuthContext());
  
  // Generate types
  writeFile(path.join(frontendPath, 'src/types/user.ts'), getUserTypes());
  writeFile(path.join(frontendPath, 'src/types/workout.ts'), getWorkoutTypes());
  
  // Generate utils
  writeFile(path.join(frontendPath, 'src/utils/validation.ts'), getValidationUtils());
  writeFile(path.join(frontendPath, 'src/utils/formatting.ts'), getFormattingUtils());
  
  // Generate styles
  writeFile(path.join(frontendPath, 'src/styles/global.css'), getGlobalStyles());
  
  // Generate package.json
  writeFile(path.join(frontendPath, 'package.json'), getFrontendPackageJson());
  
  // Generate tsconfig.json
  writeFile(path.join(frontendPath, 'tsconfig.json'), getTsConfig());
  
  // Generate vite.config.ts
  writeFile(path.join(frontendPath, 'vite.config.ts'), getViteConfig());
  
  // Generate index.html
  writeFile(path.join(frontendPath, 'public/index.html'), getIndexHtml());
  
  console.log('✅ Frontend files generated');
}

async function generateBackendFiles(basePath) {
  console.log('📝 Generating backend files...');
  
  const backendPath = path.join(basePath, 'backend');
  
  // Generate index.ts
  writeFile(path.join(backendPath, 'src/index.ts'), getBackendIndex());
  
  // Generate controllers
  writeFile(path.join(backendPath, 'src/controllers/authController.ts'), getAuthController());
  writeFile(path.join(backendPath, 'src/controllers/workoutController.ts'), getWorkoutController());
  
  // Generate models
  writeFile(path.join(backendPath, 'src/models/User.ts'), getUserModel());
  writeFile(path.join(backendPath, 'src/models/Workout.ts'), getWorkoutModel());
  
  // Generate routes
  writeFile(path.join(backendPath, 'src/routes/auth.ts'), getAuthRoutes());
  writeFile(path.join(backendPath, 'src/routes/workouts.ts'), getWorkoutRoutes());
  
  // Generate middleware
  writeFile(path.join(backendPath, 'src/middleware/auth.ts'), getAuthMiddleware());
  writeFile(path.join(backendPath, 'src/middleware/errorHandler.ts'), getErrorHandler());
  
  // Generate config
  writeFile(path.join(backendPath, 'src/config/database.ts'), getDatabaseConfig());
  writeFile(path.join(backendPath, 'src/config/environment.ts'), getEnvironmentConfig());
  
  // Generate package.json
  writeFile(path.join(backendPath, 'package.json'), getBackendPackageJson());
  
  // Generate .env.example
  writeFile(path.join(backendPath, '.env.example'), getEnvExample());
  
  console.log('✅ Backend files generated');
}

async function generateMobileFiles(basePath) {
  console.log('📝 Generating mobile app files...');
  
  const mobilePath = path.join(basePath, 'mobile-app');
  
  // Generate App.tsx
  writeFile(path.join(mobilePath, 'src/App.tsx'), getMobileApp());
  
  // Generate screens
  writeFile(path.join(mobilePath, 'src/screens/HomeScreen.tsx'), getHomeScreen());
  writeFile(path.join(mobilePath, 'src/screens/WorkoutScreen.tsx'), getWorkoutScreen());
  
  // Generate package.json
  writeFile(path.join(mobilePath, 'package.json'), getMobilePackageJson());
  
  console.log('✅ Mobile files generated');
}

function generateConfigFiles(basePath) {
  // Generate README
  writeFile(path.join(basePath, 'README.md'), getReadme());
  
  // Generate .gitignore
  writeFile(path.join(basePath, '.gitignore'), getGitignore());
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`   ✓ ${path.basename(filePath)}`);
}

// Code generation functions
function getAppTsx() {
  return `import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import WorkoutList from './components/Workouts/WorkoutList';
import './styles/global.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/workouts" element={<WorkoutList />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
`;
}

function getMainTsx() {
  return `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;
}


function getLoginComponent() {
  return `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>FitTrack Pro</h1>
        <h2>Login to Your Account</h2>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="register-link">
          Don't have an account? <a href="/register">Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
`;
}

function getRegisterComponent() {
  return `import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="register-container">
      <h2>Create Account</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Full Name"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
          required
        />
        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
          required
        />
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;
`;
}

function getDashboardComponent() {
  return `import React, { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatsCard from './StatsCard';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    currentWeight: 0,
    goalsCompleted: 0
  });

  useEffect(() => {
    // Fetch user stats
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // API call to get stats
    setStats({
      totalWorkouts: 45,
      totalCalories: 2500,
      currentWeight: 75,
      goalsCompleted: 8
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Welcome back, {user?.name}!</h1>
        <p>Here's your fitness overview</p>
      </header>

      <div className="stats-grid">
        <StatsCard
          title="Total Workouts"
          value={stats.totalWorkouts}
          icon="💪"
          trend="+12%"
        />
        <StatsCard
          title="Calories Burned"
          value={stats.totalCalories}
          icon="🔥"
          trend="+8%"
        />
        <StatsCard
          title="Current Weight"
          value={\`\${stats.currentWeight} kg\`}
          icon="⚖️"
          trend="-2kg"
        />
        <StatsCard
          title="Goals Completed"
          value={stats.goalsCompleted}
          icon="🎯"
          trend="+3"
        />
      </div>

      <div className="recent-activity">
        <h2>Recent Activity</h2>
        {/* Activity feed */}
      </div>
    </div>
  );
};

export default Dashboard;
`;
}

function getStatsCardComponent() {
  return `import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon, trend }) => {
  return (
    <div className="stats-card">
      <div className="stats-icon">{icon}</div>
      <div className="stats-content">
        <h3>{title}</h3>
        <p className="stats-value">{value}</p>
        {trend && <span className="stats-trend">{trend}</span>}
      </div>
    </div>
  );
};

export default StatsCard;
`;
}

function getWorkoutListComponent() {
  return `import React, { useEffect, useState } from 'react';
import { useWorkouts } from '../../hooks/useWorkouts';
import { Workout } from '../../types/workout';

const WorkoutList: React.FC = () => {
  const { workouts, loading, fetchWorkouts } = useWorkouts();

  useEffect(() => {
    fetchWorkouts();
  }, []);

  if (loading) return <div>Loading workouts...</div>;

  return (
    <div className="workout-list">
      <h2>My Workouts</h2>
      <div className="workouts-grid">
        {workouts.map((workout: Workout) => (
          <div key={workout.id} className="workout-card">
            <h3>{workout.name}</h3>
            <p>{workout.exercises.length} exercises</p>
            <p>{workout.duration} minutes</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WorkoutList;
`;
}

function getWorkoutFormComponent() {
  return `import React, { useState } from 'react';

const WorkoutForm: React.FC = () => {
  const [workout, setWorkout] = useState({
    name: '',
    exercises: [],
    duration: 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save workout
  };

  return (
    <form onSubmit={handleSubmit} className="workout-form">
      <input
        type="text"
        placeholder="Workout Name"
        value={workout.name}
        onChange={(e) => setWorkout({...workout, name: e.target.value})}
      />
      <button type="submit">Save Workout</button>
    </form>
  );
};

export default WorkoutForm;
`;
}

// Run the generator
main().catch(console.error);
`;
}

Now let me add the service and configuration generators:

<function_calls>
<invoke name="fsAppend">
<parameter name="path">scripts/generate-fitness-tracker.jsnction getApiService() {
  return `const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const api = {
  async get(endpoint: string) {
    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      headers: {
        'Authorization': \`Bearer \${localStorage.getItem('token')}\`
      }
    });
    return response.json();
  },

  async post(endpoint: string, data: any) {
    const response = await fetch(\`\${API_URL}\${endpoint}\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${localStorage.getItem('token')}\`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};
`;
}

function getAuthService() {
  return `import { api } from './api';

export const authService = {
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  async register(name: string, email: string, password: string) {
    const response = await api.post('/auth/register', { name, email, password });
    if (response.token) {
      localStorage.setItem('token', response.token);
    }
    return response;
  },

  logout() {
    localStorage.removeItem('token');
  }
};
`;
}

function getWorkoutsService() {
  return `import { api } from './api';

export const workoutsService = {
  async getAll() {
    return api.get('/workouts');
  },

  async create(workout: any) {
    return api.post('/workouts', workout);
  }
};
`;
}

function getUseAuthHook() {
  return `import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
`;
}

function getUseWorkoutsHook() {
  return `import { useState, useCallback } from 'react';
import { workoutsService } from '../services/workouts';

export const useWorkouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await workoutsService.getAll();
      setWorkouts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { workouts, loading, fetchWorkouts };
};
`;
}

function getAuthContext() {
  return `import React, { createContext, useState, useEffect } from 'react';
import { authService } from '../services/auth';

interface AuthContextType {
  user: any;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState(null);

  const login = async (email: string, password: string) => {
    const response = await authService.login(email, password);
    setUser(response.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authService.register(name, email, password);
    setUser(response.user);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
`;
}

function getUserTypes() {
  return `export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}
`;
}

function getWorkoutTypes() {
  return `export interface Workout {
  id: string;
  name: string;
  exercises: Exercise[];
  duration: number;
  createdAt: Date;
}

export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight?: number;
}
`;
}

function getValidationUtils() {
  return `export const validateEmail = (email: string): boolean => {
  return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
};

export const validatePassword = (password: string): boolean => {
  return password.length >= 8;
};
`;
}

function getFormattingUtils() {
  return `export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US').format(date);
};

export const formatNumber = (num: number): string => {
  return num.toLocaleString();
};
`;
}

function getGlobalStyles() {
  return `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: #f5f5f5;
  color: #333;
}

.app {
  min-height: 100vh;
}

button {
  cursor: pointer;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: #007bff;
  color: white;
  font-size: 1rem;
  transition: background 0.3s;
}

button:hover {
  background: #0056b3;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

input {
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.error-message {
  background: #fee;
  color: #c00;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}
`;
}

function getFrontendPackageJson() {
  return JSON.stringify({
    name: "fitness-tracker-web",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview"
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
  }, null, 2);
}

function getTsConfig() {
  return JSON.stringify({
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }]
  }, null, 2);
}

function getViteConfig() {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  }
});
`;
}

function getIndexHtml() {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>FitTrack Pro - Fitness Tracker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
}

function getReadme() {
  return `# FitTrack Pro - Fitness Tracker

Complete full-stack fitness tracking application.

## Features

- User Authentication
- Workout Tracking
- Nutrition Logging
- Progress Tracking
- Goal Setting
- Social Features

## Getting Started

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

### Mobile
\`\`\`bash
cd mobile-app
npm install
npm start
\`\`\`

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Node.js + Express + MongoDB
- Mobile: React Native + Expo

## License

MIT
`;
}

function getGitignore() {
  return `node_modules
dist
.env
.DS_Store
*.log
`;
}

// Backend generators (simplified)
function getBackendIndex() {
  return `import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import workoutRoutes from './routes/workouts';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/workouts', workoutRoutes);

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
}

function getAuthController() {
  return `import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await User.create({ name, email, password: hashedPassword });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET!);
    
    res.status(201).json({ token, user: { id: user._id, name, email } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
`;
}

function getWorkoutController() {
  return `import { Request, Response } from 'express';
import Workout from '../models/Workout';

export const getWorkouts = async (req: Request, res: Response) => {
  try {
    const workouts = await Workout.find({ userId: req.user.id });
    res.json(workouts);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

export const createWorkout = async (req: Request, res: Response) => {
  try {
    const workout = await Workout.create({
      ...req.body,
      userId: req.user.id
    });
    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
`;
}

function getUserModel() {
  return `import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('User', userSchema);
`;
}

function getWorkoutModel() {
  return `import mongoose from 'mongoose';

const workoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  exercises: [{
    name: String,
    sets: Number,
    reps: Number,
    weight: Number
  }],
  duration: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Workout', workoutSchema);
`;
}

function getAuthRoutes() {
  return `import express from 'express';
import { login, register } from '../controllers/authController';

const router = express.Router();

router.post('/login', login);
router.post('/register', register);

export default router;
`;
}

function getWorkoutRoutes() {
  return `import express from 'express';
import { getWorkouts, createWorkout } from '../controllers/workoutController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.get('/', authMiddleware, getWorkouts);
router.post('/', authMiddleware, createWorkout);

export default router;
`;
}

function getAuthMiddleware() {
  return `import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};
`;
}

function getErrorHandler() {
  return `import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
};
`;
}

function getDatabaseConfig() {
  return `import mongoose from 'mongoose';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('Database connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};
`;
}

function getEnvironmentConfig() {
  return `import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  mongodbUri: process.env.MONGODB_URI!,
  jwtSecret: process.env.JWT_SECRET!
};
`;
}

function getBackendPackageJson() {
  return JSON.stringify({
    name: "fitness-tracker-backend",
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "tsx watch src/index.ts",
      build: "tsc",
      start: "node dist/index.js"
    },
    dependencies: {
      express: "^4.18.0",
      mongoose: "^8.0.0",
      bcryptjs: "^2.4.3",
      jsonwebtoken: "^9.0.0",
      cors: "^2.8.5",
      dotenv: "^16.0.0"
    },
    devDependencies: {
      "@types/express": "^4.17.0",
      "@types/bcryptjs": "^2.4.0",
      "@types/jsonwebtoken": "^9.0.0",
      "@types/cors": "^2.8.0",
      typescript: "^5.3.0",
      tsx: "^4.0.0"
    }
  }, null, 2);
}

function getEnvExample() {
  return `PORT=3001
MONGODB_URI=mongodb://localhost:27017/fitness-tracker
JWT_SECRET=your-secret-key-here
`;
}

function getMobileApp() {
  return `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/HomeScreen';
import WorkoutScreen from './screens/WorkoutScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Workout" component={WorkoutScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`;
}

function getHomeScreen() {
  return `import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

const HomeScreen = ({ navigation }: any) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>FitTrack Pro</Text>
      <Button
        title="View Workouts"
        onPress={() => navigation.navigate('Workout')}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20
  }
});

export default HomeScreen;
`;
}

function getWorkoutScreen() {
  return `import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const WorkoutScreen = () => {
  const workouts = [
    { id: '1', name: 'Morning Workout', exercises: 5 },
    { id: '2', name: 'Evening Cardio', exercises: 3 }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Workouts</Text>
      <FlatList
        data={workouts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.workoutCard}>
            <Text style={styles.workoutName}>{item.name}</Text>
            <Text>{item.exercises} exercises</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15
  },
  workoutCard: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 10
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '600'
  }
});

export default WorkoutScreen;
`;
}

function getMobilePackageJson() {
  return JSON.stringify({
    name: "fitness-tracker-mobile",
    version: "1.0.0",
    main: "src/App.tsx",
    scripts: {
      start: "expo start",
      android: "expo start --android",
      ios: "expo start --ios"
    },
    dependencies: {
      react: "^18.2.0",
      "react-native": "^0.72.0",
      "@react-navigation/native": "^6.1.0",
      "@react-navigation/native-stack": "^6.9.0",
      expo: "^49.0.0"
    }
  }, null, 2);
}
`;
}
</invoke>

funct
ion getLoginComponent() {
  return `import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to FitTrack Pro</h2>
        {error && <div className="error-message">{error}</div>}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
        <p>Don't have an account? <a href="/register">Register</a></p>
      </form>
    </div>
  );
};

export default Login;
`;
}

function getRegisterComponent() {
  return `import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Register for FitTrack Pro</h2>
        <input
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Register</button>
        <p>Already have an account? <a href="/login">Login</a></p>
      </form>
    </div>
  );
};

export default Register;
`;
}

function getDashboardComponent() {
  return `import React from 'react';
import StatsCard from './StatsCard';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <StatsCard title="Total Workouts" value="24" />
        <StatsCard title="This Week" value="5" />
        <StatsCard title="Calories Burned" value="3,450" />
        <StatsCard title="Active Days" value="18" />
      </div>
    </div>
  );
};

export default Dashboard;
`;
}

function getStatsCardComponent() {
  return `import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value }) => {
  return (
    <div className="stats-card">
      <h3>{title}</h3>
      <p className="stats-value">{value}</p>
    </div>
  );
};

export default StatsCard;
`;
}

function getWorkoutListComponent() {
  return `import React, { useEffect } from 'react';
import { useWorkouts } from '../../hooks/useWorkouts';

const WorkoutList: React.FC = () => {
  const { workouts, loading, fetchWorkouts } = useWorkouts();

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="workout-list">
      <h2>My Workouts</h2>
      {workouts.map((workout: any) => (
        <div key={workout.id} className="workout-card">
          <h3>{workout.name}</h3>
          <p>{workout.exercises.length} exercises</p>
        </div>
      ))}
    </div>
  );
};

export default WorkoutList;
`;
}

function getWorkoutFormComponent() {
  return `import React, { useState } from 'react';
import { workoutsService } from '../../services/workouts';

const WorkoutForm: React.FC = () => {
  const [name, setName] = useState('');
  const [exercises, setExercises] = useState<any[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await workoutsService.create({ name, exercises });
    setName('');
    setExercises([]);
  };

  return (
    <form onSubmit={handleSubmit} className="workout-form">
      <h2>Create Workout</h2>
      <input
        type="text"
        placeholder="Workout Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <button type="submit">Create Workout</button>
    </form>
  );
};

export default WorkoutForm;
`;
}

// Run the main function
main().catch(console.error);
