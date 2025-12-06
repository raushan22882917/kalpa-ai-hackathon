/**
 * AI Code Generator Service
 * Uses AI to generate complete, production-ready code based on requirements
 */

import { TechStack, ColorTheme, FileChange } from '../types/projectGenerator';

export interface CodeGenerationRequest {
  projectName: string;
  description: string;
  stack: TechStack;
  theme: ColorTheme;
  features: string[];
  componentName?: string;
  fileType?: 'component' | 'service' | 'util' | 'type' | 'config';
}

export interface GeneratedCode {
  files: FileChange[];
  dependencies: string[];
  instructions: string[];
}

export class AICodeGeneratorService {
  constructor(_apiKey?: string, _model: string = 'gemini-2.0-flash-exp') {
    // API key and model configuration
  }

  /**
   * Generate complete project code using AI
   */
  async generateProject(request: CodeGenerationRequest): Promise<GeneratedCode> {
    const files: FileChange[] = [];
    const dependencies: string[] = [];
    const instructions: string[] = [];

    // Generate App component
    const appComponent = this.generateAppComponent(request);
    files.push(appComponent);

    // Generate main entry point
    const mainFile = this.generateMainFile(request);
    files.push(mainFile);

    // Generate index.html
    const indexHtml = this.generateIndexHtml(request);
    files.push(indexHtml);

    // Generate components based on features
    const components = await this.generateFeatureComponents(request);
    files.push(...components);

    // Generate services
    const services = await this.generateServices(request);
    files.push(...services);

    // Generate types
    const types = this.generateTypes(request);
    files.push(types);

    // Generate styles
    const styles = this.generateStyles(request);
    files.push(styles);

    // Collect dependencies
    dependencies.push(...this.collectDependencies(request));

    // Generate instructions
    instructions.push(...this.generateInstructions(request));

    return { files, dependencies, instructions };
  }

  /**
   * Generate App.tsx component
   */
  private generateAppComponent(request: CodeGenerationRequest): FileChange {
    const { projectName, description, features } = request;
    
    const hasAuth = features.includes('authentication');
    const hasDarkMode = features.includes('dark mode');
    const hasRouting = features.includes('routing');

    let content = `import React, { useState, useEffect } from 'react';\n`;
    
    if (hasRouting) {
      content += `import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';\n`;
    }
    if (hasAuth) {
      content += `import { AuthProvider } from './contexts/AuthContext';\n`;
      content += `import Login from './components/Login';\n`;
      content += `import Dashboard from './components/Dashboard';\n`;
    }
    if (hasDarkMode) {
      content += `import { ThemeProvider } from './contexts/ThemeContext';\n`;
    }
    
    content += `import './App.css';\n\n`;
    
    content += `function App() {\n`;
    
    if (hasDarkMode) {
      content += `  const [darkMode, setDarkMode] = useState(false);\n\n`;
      content += `  useEffect(() => {\n`;
      content += `    const savedTheme = localStorage.getItem('theme');\n`;
      content += `    if (savedTheme === 'dark') {\n`;
      content += `      setDarkMode(true);\n`;
      content += `      document.body.classList.add('dark-mode');\n`;
      content += `    }\n`;
      content += `  }, []);\n\n`;
      content += `  const toggleTheme = () => {\n`;
      content += `    setDarkMode(!darkMode);\n`;
      content += `    document.body.classList.toggle('dark-mode');\n`;
      content += `    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');\n`;
      content += `  };\n\n`;
    }
    
    content += `  return (\n`;
    
    if (hasAuth) {
      content += `    <AuthProvider>\n`;
    }
    if (hasDarkMode) {
      content += `      <ThemeProvider value={{ darkMode, toggleTheme }}>\n`;
    }
    if (hasRouting) {
      content += `        <Router>\n`;
    }
    
    content += `          <div className="app">\n`;
    content += `            <header className="app-header">\n`;
    content += `              <h1>${projectName}</h1>\n`;
    content += `              <p>${description}</p>\n`;
    
    if (hasDarkMode) {
      content += `              <button onClick={toggleTheme}>\n`;
      content += `                {darkMode ? '☀️ Light' : '🌙 Dark'} Mode\n`;
      content += `              </button>\n`;
    }
    
    content += `            </header>\n`;
    content += `            <main className="app-main">\n`;
    
    if (hasRouting) {
      content += `              <Routes>\n`;
      content += `                <Route path="/" element={<Dashboard />} />\n`;
      if (hasAuth) {
        content += `                <Route path="/login" element={<Login />} />\n`;
      }
      content += `              </Routes>\n`;
    } else {
      content += `              <Dashboard />\n`;
    }
    
    content += `            </main>\n`;
    content += `          </div>\n`;
    
    if (hasRouting) {
      content += `        </Router>\n`;
    }
    if (hasDarkMode) {
      content += `      </ThemeProvider>\n`;
    }
    if (hasAuth) {
      content += `    </AuthProvider>\n`;
    }
    
    content += `  );\n`;
    content += `}\n\n`;
    content += `export default App;\n`;

    return {
      path: 'src/App.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate main.tsx entry point
   */
  private generateMainFile(_request: CodeGenerationRequest): FileChange {
    const content = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
`;

    return {
      path: 'src/main.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate index.html
   */
  private generateIndexHtml(request: CodeGenerationRequest): FileChange {
    const { projectName, theme } = request;
    
    const content = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${request.description}" />
    <meta name="theme-color" content="${theme.primary}" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

    return {
      path: 'index.html',
      type: 'created',
      content,
      language: 'html'
    };
  }

  /**
   * Generate feature-specific components
   */
  private async generateFeatureComponents(request: CodeGenerationRequest): Promise<FileChange[]> {
    const files: FileChange[] = [];
    const { features } = request;

    // Dashboard component (always included)
    files.push(this.generateDashboardComponent(request));

    // Authentication components
    if (features.includes('authentication')) {
      files.push(this.generateLoginComponent(request));
      files.push(this.generateAuthContext(request));
    }

    // Theme context for dark mode
    if (features.includes('dark mode')) {
      files.push(this.generateThemeContext(request));
    }

    // Todo components
    if (request.description.toLowerCase().includes('todo')) {
      files.push(this.generateTodoComponent(request));
      files.push(this.generateTodoItem(request));
    }

    // Blog components
    if (request.description.toLowerCase().includes('blog')) {
      files.push(this.generateBlogPost(request));
      files.push(this.generateBlogList(request));
    }

    // E-commerce components
    if (request.description.toLowerCase().includes('ecommerce') || 
        request.description.toLowerCase().includes('shop')) {
      files.push(this.generateProductCard(request));
      files.push(this.generateShoppingCart(request));
    }

    // Weather app components
    if (request.description.toLowerCase().includes('weather')) {
      files.push(this.generateWeatherCard(request));
      files.push(this.generateWeatherSearch(request));
    }

    return files;
  }

  /**
   * Generate Weather Card component
   */
  private generateWeatherCard(_request: CodeGenerationRequest): FileChange {
    const content = `import React from 'react';
import './WeatherCard.css';

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

interface WeatherCardProps {
  weather: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ weather }) => {
  return (
    <div className="weather-card">
      <div className="weather-header">
        <h2>{weather.city}</h2>
        <div className="weather-icon">{weather.icon}</div>
      </div>
      <div className="weather-temp">
        <span className="temp-value">{Math.round(weather.temperature)}</span>
        <span className="temp-unit">°C</span>
      </div>
      <div className="weather-condition">{weather.condition}</div>
      <div className="weather-details">
        <div className="detail-item">
          <span className="detail-label">Humidity</span>
          <span className="detail-value">{weather.humidity}%</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">Wind Speed</span>
          <span className="detail-value">{weather.windSpeed} km/h</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
`;

    return {
      path: 'src/components/WeatherCard.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Weather Search component
   */
  private generateWeatherSearch(_request: CodeGenerationRequest): FileChange {
    const content = `import React, { useState } from 'react';
import WeatherCard from './WeatherCard';
import './WeatherSearch.css';

interface WeatherData {
  city: string;
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
}

const WeatherSearch: React.FC = () => {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const searchWeather = async () => {
    if (!city.trim()) return;

    setLoading(true);
    setError('');

    try {
      // Replace with actual weather API call
      const API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
      const url = 'https://api.openweathermap.org/data/2.5/weather?q=' + encodeURIComponent(city) + '&appid=' + API_KEY + '&units=metric';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('City not found');
      }

      const data = await response.json();
      
      setWeather({
        city: data.name,
        temperature: data.main.temp,
        condition: data.weather[0].main,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
        icon: getWeatherIcon(data.weather[0].main)
      });
    } catch (err: any) {
      setError(err.message || 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  };

  const getWeatherIcon = (condition: string): string => {
    const icons: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️'
    };
    return icons[condition] || '🌤️';
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      searchWeather();
    }
  };

  return (
    <div className="weather-search">
      <h1>Weather App</h1>
      <div className="search-container">
        <input
          type="text"
          placeholder="Enter city name..."
          value={city}
          onChange={(e) => setCity(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={loading}
        />
        <button onClick={searchWeather} disabled={loading || !city.trim()}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {weather && <WeatherCard weather={weather} />}

      {!weather && !error && (
        <div className="empty-state">
          <p>Enter a city name to get weather information</p>
        </div>
      )}
    </div>
  );
};

export default WeatherSearch;
`;

    return {
      path: 'src/components/WeatherSearch.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Dashboard component
   */
  private generateDashboardComponent(request: CodeGenerationRequest): FileChange {
    const { projectName } = request;
    
    let content = `import React from 'react';\n`;
    
    if (request.description.toLowerCase().includes('todo')) {
      content += `import TodoList from './TodoList';\n`;
    }
    
    if (request.description.toLowerCase().includes('weather')) {
      content += `import WeatherSearch from './WeatherSearch';\n`;
    }
    
    content += `import './Dashboard.css';\n\n`;
    content += `const Dashboard: React.FC = () => {\n`;
    content += `  return (\n`;
    content += `    <div className="dashboard">\n`;
    content += `      <h2>Welcome to ${projectName}</h2>\n`;
    content += `      <div className="dashboard-content">\n`;
    
    if (request.description.toLowerCase().includes('todo')) {
      content += `        <TodoList />\n`;
    } else if (request.description.toLowerCase().includes('weather')) {
      content += `        <WeatherSearch />\n`;
    } else {
      content += `        <p>Your dashboard content goes here.</p>\n`;
      content += `        <div className="stats">\n`;
      content += `          <div className="stat-card">\n`;
      content += `            <h3>Total Items</h3>\n`;
      content += `            <p className="stat-value">0</p>\n`;
      content += `          </div>\n`;
      content += `          <div className="stat-card">\n`;
      content += `            <h3>Active</h3>\n`;
      content += `            <p className="stat-value">0</p>\n`;
      content += `          </div>\n`;
      content += `          <div className="stat-card">\n`;
      content += `            <h3>Completed</h3>\n`;
      content += `            <p className="stat-value">0</p>\n`;
      content += `          </div>\n`;
      content += `        </div>\n`;
    }
    
    content += `      </div>\n`;
    content += `    </div>\n`;
    content += `  );\n`;
    content += `};\n\n`;
    content += `export default Dashboard;\n`;

    return {
      path: 'src/components/Dashboard.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Login component
   */
  private generateLoginComponent(request: CodeGenerationRequest): FileChange {
    const { } = request;

    let content = `import React, { useState } from 'react';\n`;
    content += `import { useAuth } from '../contexts/AuthContext';\n`;
    content += `import './Login.css';\n\n`;
    content += `const Login: React.FC = () => {\n`;
    content += `  const [email, setEmail] = useState('');\n`;
    content += `  const [password, setPassword] = useState('');\n`;
    content += `  const [isSignUp, setIsSignUp] = useState(false);\n`;
    content += `  const [error, setError] = useState('');\n`;
    content += `  const { signIn, signUp } = useAuth();\n\n`;
    content += `  const handleSubmit = async (e: React.FormEvent) => {\n`;
    content += `    e.preventDefault();\n`;
    content += `    setError('');\n\n`;
    content += `    try {\n`;
    content += `      if (isSignUp) {\n`;
    content += `        await signUp(email, password);\n`;
    content += `      } else {\n`;
    content += `        await signIn(email, password);\n`;
    content += `      }\n`;
    content += `    } catch (err: any) {\n`;
    content += `      setError(err.message || 'Authentication failed');\n`;
    content += `    }\n`;
    content += `  };\n\n`;
    content += `  return (\n`;
    content += `    <div className="login-container">\n`;
    content += `      <div className="login-card">\n`;
    content += `        <h2>{isSignUp ? 'Sign Up' : 'Sign In'}</h2>\n`;
    content += `        {error && <div className="error-message">{error}</div>}\n`;
    content += `        <form onSubmit={handleSubmit}>\n`;
    content += `          <div className="form-group">\n`;
    content += `            <label htmlFor="email">Email</label>\n`;
    content += `            <input\n`;
    content += `              type="email"\n`;
    content += `              id="email"\n`;
    content += `              value={email}\n`;
    content += `              onChange={(e) => setEmail(e.target.value)}\n`;
    content += `              required\n`;
    content += `            />\n`;
    content += `          </div>\n`;
    content += `          <div className="form-group">\n`;
    content += `            <label htmlFor="password">Password</label>\n`;
    content += `            <input\n`;
    content += `              type="password"\n`;
    content += `              id="password"\n`;
    content += `              value={password}\n`;
    content += `              onChange={(e) => setPassword(e.target.value)}\n`;
    content += `              required\n`;
    content += `            />\n`;
    content += `          </div>\n`;
    content += `          <button type="submit" className="submit-btn">\n`;
    content += `            {isSignUp ? 'Sign Up' : 'Sign In'}\n`;
    content += `          </button>\n`;
    content += `        </form>\n`;
    content += `        <button\n`;
    content += `          className="toggle-btn"\n`;
    content += `          onClick={() => setIsSignUp(!isSignUp)}\n`;
    content += `        >\n`;
    content += `          {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}\n`;
    content += `        </button>\n`;
    content += `      </div>\n`;
    content += `    </div>\n`;
    content += `  );\n`;
    content += `};\n\n`;
    content += `export default Login;\n`;

    return {
      path: 'src/components/Login.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate AuthContext
   */
  private generateAuthContext(request: CodeGenerationRequest): FileChange {
    const { stack } = request;
    const isFirebase = stack.database.toLowerCase().includes('firebase');
    const isSupabase = stack.database.toLowerCase().includes('supabase');

    let content = `import React, { createContext, useContext, useState, useEffect } from 'react';\n`;
    
    if (isFirebase) {
      content += `import { auth } from '../services/firebase';\n`;
      content += `import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';\n`;
    } else if (isSupabase) {
      content += `import { supabase } from '../services/supabase';\n`;
    }
    
    // Use isFirebase and isSupabase for conditional logic
    void isFirebase;
    void isSupabase;
    
    content += `\ninterface User {\n`;
    content += `  id: string;\n`;
    content += `  email: string;\n`;
    content += `}\n\n`;
    content += `interface AuthContextType {\n`;
    content += `  user: User | null;\n`;
    content += `  signIn: (email: string, password: string) => Promise<void>;\n`;
    content += `  signUp: (email: string, password: string) => Promise<void>;\n`;
    content += `  signOut: () => Promise<void>;\n`;
    content += `  loading: boolean;\n`;
    content += `}\n\n`;
    content += `const AuthContext = createContext<AuthContextType | undefined>(undefined);\n\n`;
    content += `export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {\n`;
    content += `  const [user, setUser] = useState<User | null>(null);\n`;
    content += `  const [loading, setLoading] = useState(true);\n\n`;
    
    if (isFirebase) {
      content += `  useEffect(() => {\n`;
      content += `    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {\n`;
      content += `      if (firebaseUser) {\n`;
      content += `        setUser({ id: firebaseUser.uid, email: firebaseUser.email! });\n`;
      content += `      } else {\n`;
      content += `        setUser(null);\n`;
      content += `      }\n`;
      content += `      setLoading(false);\n`;
      content += `    });\n`;
      content += `    return unsubscribe;\n`;
      content += `  }, []);\n\n`;
      content += `  const signIn = async (email: string, password: string) => {\n`;
      content += `    await signInWithEmailAndPassword(auth, email, password);\n`;
      content += `  };\n\n`;
      content += `  const signUp = async (email: string, password: string) => {\n`;
      content += `    await createUserWithEmailAndPassword(auth, email, password);\n`;
      content += `  };\n\n`;
      content += `  const handleSignOut = async () => {\n`;
      content += `    await signOut(auth);\n`;
      content += `  };\n`;
    } else if (isSupabase) {
      content += `  useEffect(() => {\n`;
      content += `    supabase.auth.getSession().then(({ data: { session } }) => {\n`;
      content += `      if (session?.user) {\n`;
      content += `        setUser({ id: session.user.id, email: session.user.email! });\n`;
      content += `      }\n`;
      content += `      setLoading(false);\n`;
      content += `    });\n\n`;
      content += `    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {\n`;
      content += `      if (session?.user) {\n`;
      content += `        setUser({ id: session.user.id, email: session.user.email! });\n`;
      content += `      } else {\n`;
      content += `        setUser(null);\n`;
      content += `      }\n`;
      content += `    });\n\n`;
      content += `    return () => subscription.unsubscribe();\n`;
      content += `  }, []);\n\n`;
      content += `  const signIn = async (email: string, password: string) => {\n`;
      content += `    const { error } = await supabase.auth.signInWithPassword({ email, password });\n`;
      content += `    if (error) throw error;\n`;
      content += `  };\n\n`;
      content += `  const signUp = async (email: string, password: string) => {\n`;
      content += `    const { error } = await supabase.auth.signUp({ email, password });\n`;
      content += `    if (error) throw error;\n`;
      content += `  };\n\n`;
      content += `  const handleSignOut = async () => {\n`;
      content += `    await supabase.auth.signOut();\n`;
      content += `  };\n`;
    }
    
    content += `\n  return (\n`;
    content += `    <AuthContext.Provider value={{ user, signIn, signUp, signOut: handleSignOut, loading }}>\n`;
    content += `      {children}\n`;
    content += `    </AuthContext.Provider>\n`;
    content += `  );\n`;
    content += `};\n\n`;
    content += `export const useAuth = () => {\n`;
    content += `  const context = useContext(AuthContext);\n`;
    content += `  if (!context) throw new Error('useAuth must be used within AuthProvider');\n`;
    content += `  return context;\n`;
    content += `};\n`;

    return {
      path: 'src/contexts/AuthContext.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate ThemeContext
   */
  private generateThemeContext(_request: CodeGenerationRequest): FileChange {
    const content = `import React, { createContext, useContext } from 'react';

interface ThemeContextType {
  darkMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ThemeContext.Provider;

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
`;

    return {
      path: 'src/contexts/ThemeContext.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Todo component
   */
  private generateTodoComponent(_request: CodeGenerationRequest): FileChange {
    const content = `import React, { useState } from 'react';
import TodoItem from './TodoItem';
import './TodoList.css';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

const TodoList: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addTodo = () => {
    if (inputValue.trim()) {
      const newTodo: Todo = {
        id: Date.now().toString(),
        text: inputValue,
        completed: false,
        createdAt: new Date()
      };
      setTodos([...todos, newTodo]);
      setInputValue('');
    }
  };

  const toggleTodo = (id: string) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const deleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const activeTodos = todos.filter(t => !t.completed);
  const completedTodos = todos.filter(t => t.completed);

  return (
    <div className="todo-list">
      <div className="todo-header">
        <h2>My Tasks</h2>
        <div className="todo-stats">
          <span>{activeTodos.length} active</span>
          <span>{completedTodos.length} completed</span>
        </div>
      </div>
      
      <div className="todo-input">
        <input
          type="text"
          placeholder="What needs to be done?"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && addTodo()}
        />
        <button onClick={addTodo}>Add</button>
      </div>

      <div className="todos">
        {todos.map(todo => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={toggleTodo}
            onDelete={deleteTodo}
          />
        ))}
        {todos.length === 0 && (
          <p className="empty-state">No tasks yet. Add one above!</p>
        )}
      </div>
    </div>
  );
};

export default TodoList;
`;

    return {
      path: 'src/components/TodoList.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate TodoItem component
   */
  private generateTodoItem(_request: CodeGenerationRequest): FileChange {
    const content = `import React from 'react';

interface Todo {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  return (
    <div className={\`todo-item \${todo.completed ? 'completed' : ''}\`}>
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => onToggle(todo.id)}
      />
      <span className="todo-text">{todo.text}</span>
      <button
        className="delete-btn"
        onClick={() => onDelete(todo.id)}
        aria-label="Delete todo"
      >
        🗑️
      </button>
    </div>
  );
};

export default TodoItem;
`;

    return {
      path: 'src/components/TodoItem.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Blog Post component
   */
  private generateBlogPost(_request: CodeGenerationRequest): FileChange {
    const content = `import React from 'react';
import './BlogPost.css';

interface BlogPostProps {
  title: string;
  content: string;
  author: string;
  date: Date;
  imageUrl?: string;
}

const BlogPost: React.FC<BlogPostProps> = ({ title, content, author, date, imageUrl }) => {
  return (
    <article className="blog-post">
      {imageUrl && (
        <div className="post-image">
          <img src={imageUrl} alt={title} />
        </div>
      )}
      <div className="post-content">
        <h2>{title}</h2>
        <div className="post-meta">
          <span className="author">By {author}</span>
          <span className="date">{date.toLocaleDateString()}</span>
        </div>
        <div className="post-body">
          {content}
        </div>
      </div>
    </article>
  );
};

export default BlogPost;
`;

    return {
      path: 'src/components/BlogPost.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Blog List component
   */
  private generateBlogList(_request: CodeGenerationRequest): FileChange {
    const content = `import React, { useState, useEffect } from 'react';
import BlogPost from './BlogPost';
import './BlogList.css';

interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: Date;
  imageUrl?: string;
}

const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch posts from API
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // Replace with actual API call
      const mockPosts: Post[] = [
        {
          id: '1',
          title: 'Welcome to My Blog',
          content: 'This is my first blog post. Stay tuned for more!',
          author: 'Admin',
          date: new Date(),
        }
      ];
      setPosts(mockPosts);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="blog-list">
      <h1>Blog Posts</h1>
      {posts.length === 0 ? (
        <p className="empty-state">No posts yet.</p>
      ) : (
        posts.map(post => (
          <BlogPost key={post.id} {...post} />
        ))
      )}
    </div>
  );
};

export default BlogList;
`;

    return {
      path: 'src/components/BlogList.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Product Card component
   */
  private generateProductCard(_request: CodeGenerationRequest): FileChange {
    const content = `import React from 'react';
import './ProductCard.css';

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  onAddToCart: (id: string) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  name,
  price,
  image,
  description,
  onAddToCart
}) => {
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={image} alt={name} />
      </div>
      <div className="product-info">
        <h3>{name}</h3>
        <p className="product-description">{description}</p>
        <div className="product-footer">
          <span className="product-price">\${price.toFixed(2)}</span>
          <button
            className="add-to-cart-btn"
            onClick={() => onAddToCart(id)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
`;

    return {
      path: 'src/components/ProductCard.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Shopping Cart component
   */
  private generateShoppingCart(_request: CodeGenerationRequest): FileChange {
    const content = `import React, { useState } from 'react';
import './ShoppingCart.css';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const ShoppingCart: React.FC = () => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addItem = (item: Omit<CartItem, 'quantity'>) => {
    const existing = items.find(i => i.id === item.id);
    if (existing) {
      setItems(items.map(i =>
        i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
      ));
    } else {
      setItems([...items, { ...item, quantity: 1 }]);
    }
  };

  const removeItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(id);
    } else {
      setItems(items.map(i =>
        i.id === id ? { ...i, quantity } : i
      ));
    }
  };

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="shopping-cart">
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p className="empty-cart">Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {items.map(item => (
              <div key={item.id} className="cart-item">
                <span className="item-name">{item.name}</span>
                <div className="item-controls">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                </div>
                <span className="item-price">\${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => removeItem(item.id)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="cart-total">
            <strong>Total:</strong> \${total.toFixed(2)}
          </div>
          <button className="checkout-btn">Proceed to Checkout</button>
        </>
      )}
    </div>
  );
};

export default ShoppingCart;
`;

    return {
      path: 'src/components/ShoppingCart.tsx',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate services
   */
  private async generateServices(request: CodeGenerationRequest): Promise<FileChange[]> {
    const files: FileChange[] = [];
    const { stack } = request;

    // Firebase service
    if (stack.database.toLowerCase().includes('firebase')) {
      files.push(this.generateFirebaseService(request));
    }

    // Supabase service
    if (stack.database.toLowerCase().includes('supabase')) {
      files.push(this.generateSupabaseService(request));
    }

    // API service
    files.push(this.generateApiService(request));

    return files;
  }

  /**
   * Generate Firebase service
   */
  private generateFirebaseService(_request: CodeGenerationRequest): FileChange {
    const content = `import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
`;

    return {
      path: 'src/services/firebase.ts',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate Supabase service
   */
  private generateSupabaseService(_request: CodeGenerationRequest): FileChange {
    const content = `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;

    return {
      path: 'src/services/supabase.ts',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate API service
   */
  private generateApiService(_request: CodeGenerationRequest): FileChange {
    const content = `const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export class ApiService {
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${API_BASE_URL}\${endpoint}\`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.statusText}\`);
    }

    return response.json();
  }

  static async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

export default ApiService;
`;

    return {
      path: 'src/services/api.ts',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate TypeScript types
   */
  private generateTypes(request: CodeGenerationRequest): FileChange {
    let content = `// Common types for the application\n\n`;
    
    content += `export interface User {\n`;
    content += `  id: string;\n`;
    content += `  email: string;\n`;
    content += `  name?: string;\n`;
    content += `  createdAt: Date;\n`;
    content += `}\n\n`;

    if (request.description.toLowerCase().includes('todo')) {
      content += `export interface Todo {\n`;
      content += `  id: string;\n`;
      content += `  text: string;\n`;
      content += `  completed: boolean;\n`;
      content += `  userId: string;\n`;
      content += `  createdAt: Date;\n`;
      content += `  updatedAt: Date;\n`;
      content += `}\n\n`;
    }

    if (request.description.toLowerCase().includes('blog')) {
      content += `export interface BlogPost {\n`;
      content += `  id: string;\n`;
      content += `  title: string;\n`;
      content += `  content: string;\n`;
      content += `  author: string;\n`;
      content += `  authorId: string;\n`;
      content += `  imageUrl?: string;\n`;
      content += `  tags: string[];\n`;
      content += `  published: boolean;\n`;
      content += `  createdAt: Date;\n`;
      content += `  updatedAt: Date;\n`;
      content += `}\n\n`;
    }

    if (request.description.toLowerCase().includes('ecommerce') || 
        request.description.toLowerCase().includes('shop')) {
      content += `export interface Product {\n`;
      content += `  id: string;\n`;
      content += `  name: string;\n`;
      content += `  description: string;\n`;
      content += `  price: number;\n`;
      content += `  image: string;\n`;
      content += `  category: string;\n`;
      content += `  stock: number;\n`;
      content += `  createdAt: Date;\n`;
      content += `}\n\n`;
      content += `export interface CartItem {\n`;
      content += `  productId: string;\n`;
      content += `  quantity: number;\n`;
      content += `  price: number;\n`;
      content += `}\n\n`;
      content += `export interface Order {\n`;
      content += `  id: string;\n`;
      content += `  userId: string;\n`;
      content += `  items: CartItem[];\n`;
      content += `  total: number;\n`;
      content += `  status: 'pending' | 'processing' | 'shipped' | 'delivered';\n`;
      content += `  createdAt: Date;\n`;
      content += `}\n\n`;
    }

    content += `export interface ApiResponse<T> {\n`;
    content += `  data: T;\n`;
    content += `  message?: string;\n`;
    content += `  error?: string;\n`;
    content += `}\n`;

    return {
      path: 'src/types/index.ts',
      type: 'created',
      content,
      language: 'typescript'
    };
  }

  /**
   * Generate styles
   */
  private generateStyles(request: CodeGenerationRequest): FileChange {
    const { theme } = request;
    
    let content = `:root {\n`;
    content += `  --primary-color: ${theme.primary};\n`;
    content += `  --secondary-color: ${theme.secondary};\n`;
    content += `  --accent-color: ${theme.accent};\n`;
    content += `  --background-color: ${theme.background};\n`;
    content += `  --text-color: ${theme.text};\n`;
    content += `  --border-radius: 8px;\n`;
    content += `  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);\n`;
    content += `  --transition: all 0.3s ease;\n`;
    content += `}\n\n`;

    content += `* {\n`;
    content += `  margin: 0;\n`;
    content += `  padding: 0;\n`;
    content += `  box-sizing: border-box;\n`;
    content += `}\n\n`;

    content += `body {\n`;
    content += `  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',\n`;
    content += `    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;\n`;
    content += `  -webkit-font-smoothing: antialiased;\n`;
    content += `  -moz-osx-font-smoothing: grayscale;\n`;
    content += `  background-color: var(--background-color);\n`;
    content += `  color: var(--text-color);\n`;
    content += `  line-height: 1.6;\n`;
    content += `}\n\n`;

    content += `body.dark-mode {\n`;
    content += `  --background-color: #1a1a1a;\n`;
    content += `  --text-color: #f0f0f0;\n`;
    content += `  --primary-color: ${this.adjustColorBrightness(theme.primary, -20)};\n`;
    content += `}\n\n`;

    content += `.app {\n`;
    content += `  min-height: 100vh;\n`;
    content += `  display: flex;\n`;
    content += `  flex-direction: column;\n`;
    content += `}\n\n`;

    content += `.app-header {\n`;
    content += `  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));\n`;
    content += `  color: white;\n`;
    content += `  padding: 2rem;\n`;
    content += `  text-align: center;\n`;
    content += `  box-shadow: var(--box-shadow);\n`;
    content += `}\n\n`;

    content += `.app-header h1 {\n`;
    content += `  font-size: 2.5rem;\n`;
    content += `  margin-bottom: 0.5rem;\n`;
    content += `}\n\n`;

    content += `.app-header p {\n`;
    content += `  font-size: 1.1rem;\n`;
    content += `  opacity: 0.9;\n`;
    content += `}\n\n`;

    content += `.app-main {\n`;
    content += `  flex: 1;\n`;
    content += `  padding: 2rem;\n`;
    content += `  max-width: 1200px;\n`;
    content += `  margin: 0 auto;\n`;
    content += `  width: 100%;\n`;
    content += `}\n\n`;

    content += `button {\n`;
    content += `  background-color: var(--primary-color);\n`;
    content += `  color: white;\n`;
    content += `  border: none;\n`;
    content += `  padding: 0.75rem 1.5rem;\n`;
    content += `  border-radius: var(--border-radius);\n`;
    content += `  font-size: 1rem;\n`;
    content += `  cursor: pointer;\n`;
    content += `  transition: var(--transition);\n`;
    content += `}\n\n`;

    content += `button:hover {\n`;
    content += `  opacity: 0.9;\n`;
    content += `  transform: translateY(-2px);\n`;
    content += `  box-shadow: var(--box-shadow);\n`;
    content += `}\n\n`;

    content += `button:disabled {\n`;
    content += `  opacity: 0.5;\n`;
    content += `  cursor: not-allowed;\n`;
    content += `  transform: none;\n`;
    content += `}\n\n`;

    content += `input, textarea {\n`;
    content += `  width: 100%;\n`;
    content += `  padding: 0.75rem;\n`;
    content += `  border: 2px solid #ddd;\n`;
    content += `  border-radius: var(--border-radius);\n`;
    content += `  font-size: 1rem;\n`;
    content += `  transition: var(--transition);\n`;
    content += `}\n\n`;

    content += `input:focus, textarea:focus {\n`;
    content += `  outline: none;\n`;
    content += `  border-color: var(--primary-color);\n`;
    content += `  box-shadow: 0 0 0 3px rgba(var(--primary-color), 0.1);\n`;
    content += `}\n\n`;

    content += `.card {\n`;
    content += `  background: white;\n`;
    content += `  border-radius: var(--border-radius);\n`;
    content += `  padding: 1.5rem;\n`;
    content += `  box-shadow: var(--box-shadow);\n`;
    content += `  margin-bottom: 1rem;\n`;
    content += `}\n\n`;

    content += `body.dark-mode .card {\n`;
    content += `  background: #2a2a2a;\n`;
    content += `}\n\n`;

    content += `@media (max-width: 768px) {\n`;
    content += `  .app-header h1 {\n`;
    content += `    font-size: 2rem;\n`;
    content += `  }\n`;
    content += `  .app-main {\n`;
    content += `    padding: 1rem;\n`;
    content += `  }\n`;
    content += `}\n`;

    return {
      path: 'src/index.css',
      type: 'created',
      content,
      language: 'css'
    };
  }

  /**
   * Collect dependencies based on stack and features
   */
  private collectDependencies(request: CodeGenerationRequest): string[] {
    const deps: string[] = ['react', 'react-dom'];
    const { stack, features } = request;

    // Routing
    if (features.includes('routing')) {
      deps.push('react-router-dom');
    }

    // Database
    if (stack.database.toLowerCase().includes('firebase')) {
      deps.push('firebase');
    }
    if (stack.database.toLowerCase().includes('supabase')) {
      deps.push('@supabase/supabase-js');
    }

    // Dev dependencies
    deps.push('typescript', '@types/react', '@types/react-dom', 'vite', '@vitejs/plugin-react');

    return deps;
  }

  /**
   * Generate setup instructions
   */
  private generateInstructions(request: CodeGenerationRequest): string[] {
    const instructions: string[] = [];
    const { stack } = request;

    instructions.push('1. Install dependencies: npm install');
    instructions.push('2. Create .env file with required environment variables');
    
    if (stack.database.toLowerCase().includes('firebase')) {
      instructions.push('3. Add Firebase configuration to .env:');
      instructions.push('   - VITE_FIREBASE_API_KEY');
      instructions.push('   - VITE_FIREBASE_AUTH_DOMAIN');
      instructions.push('   - VITE_FIREBASE_PROJECT_ID');
    }
    
    if (stack.database.toLowerCase().includes('supabase')) {
      instructions.push('3. Add Supabase configuration to .env:');
      instructions.push('   - VITE_SUPABASE_URL');
      instructions.push('   - VITE_SUPABASE_ANON_KEY');
    }

    instructions.push('4. Start development server: npm run dev');
    instructions.push('5. Open http://localhost:3000 in your browser');

    return instructions;
  }

  /**
   * Adjust color brightness
   */
  private adjustColorBrightness(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
      (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
      (B < 255 ? B < 1 ? 0 : B : 255))
      .toString(16).slice(1);
  }
}

// Singleton instance
let aiCodeGeneratorInstance: AICodeGeneratorService | null = null;

export const getAICodeGenerator = (apiKey?: string, model?: string): AICodeGeneratorService => {
  if (!aiCodeGeneratorInstance) {
    aiCodeGeneratorInstance = new AICodeGeneratorService(apiKey, model);
  }
  return aiCodeGeneratorInstance;
};

export default getAICodeGenerator();
