# Chat Interface Project Generation Guide

## How It Works

The AI File Manager Chat can generate complete projects by:
1. **Analyzing your description** using AI
2. **Generating an app name** automatically
3. **Selecting the best tech stack**
4. **Executing terminal commands** in real-time

## Prerequisites

### ⚠️ IMPORTANT: Backend Server Must Be Running

The chat interface executes commands through a WebSocket connection to the backend server.

**Start the backend server:**
```bash
npm run server
```

You should see:
```
AI Backend server running on port 3001
WebSocket server available at ws://localhost:3001/device-bridge
Terminal WebSocket available at ws://localhost:3001/terminal
```

## Usage

### 1. Open the Chat Interface
- Click the chat icon in the activity bar (left sidebar)
- Or use keyboard shortcut: `Ctrl+Shift+A`

### 2. Describe Your Project
Type a natural language description:

```
"Create a weather website with React and Node.js"
```

### 3. Watch the Magic Happen
The AI will:
- ✨ Generate app name: `weather-website`
- 📦 Select stack: React + Node.js + Supabase
- ⚙️ Execute commands:
  ```bash
  npx create-react-app weather-website
  cd weather-website
  npm install @supabase/supabase-js
  
  mkdir weather-website-backend
  cd weather-website-backend
  npm init -y
  npm install express cors dotenv
  ```

### 4. Commands Execute in Real Terminal
- Commands run in your actual terminal (via WebSocket)
- You'll see real-time output in the chat
- Files are created in your workspace
- Dependencies are installed automatically

## Example: Weather Website

### Input:
```
"design full website for weather"
```

### What Happens:

1. **AI Analysis**
   ```
   🤖 Analyzing your project requirements...
   ```

2. **App Name Generation**
   ```
   ✨ Generated app name: weather-website
   ```

3. **Stack Selection**
   ```
   📦 Selected tech stack: React + Node.js + Supabase
   
   Frontend: React
   Backend: Node.js + Express
   Database: Supabase
   
   Starting project setup...
   ```

4. **Frontend Setup**
   ```
   📦 Setting up frontend...
   ⚙️ Running: npx create-react-app weather-website
   ✅ Creating a new React app in /path/to/weather-website...
   
   ⚙️ Running: cd weather-website
   ✅ Changed directory
   
   ⚙️ Running: npm install @supabase/supabase-js
   ✅ added 1 package...
   ```

5. **Backend Setup**
   ```
   🔧 Setting up backend...
   ⚙️ Running: mkdir weather-website-backend
   ✅ Directory created
   
   ⚙️ Running: cd weather-website-backend
   ✅ Changed directory
   
   ⚙️ Running: npm init -y
   ✅ Wrote to package.json
   
   ⚙️ Running: npm install express cors dotenv
   ✅ added 50 packages...
   ```

6. **Completion**
   ```
   🎉 Project "weather-website" created successfully!
   
   Next steps:
   • Navigate to your project: cd weather-website
   • Install dependencies: npm install
   • Start development: npm run dev
   
   Your React + Node.js + Supabase project is ready to go!
   ```

## Troubleshooting

### "Terminal server not available"

**Problem:** Backend server is not running

**Solution:**
```bash
# In a separate terminal
npm run server
```

### "Command failed"

**Possible Causes:**
1. Missing dependencies (Node.js, npm, Python, pip)
2. Network issues during package installation
3. Insufficient permissions
4. Wrong working directory

**Solutions:**
- Ensure Node.js is installed: `node --version`
- Ensure npm is installed: `npm --version`
- Check your internet connection
- Verify workspace path is correct

### "Connection timeout"

**Problem:** WebSocket connection failed

**Solutions:**
1. Check backend server is running on port 3001
2. Check firewall settings
3. Restart backend server
4. Check browser console for errors

### Commands Don't Execute

**Checklist:**
- [ ] Backend server running (`npm run server`)
- [ ] WebSocket endpoint available (`ws://localhost:3001/terminal`)
- [ ] Workspace folder is open
- [ ] Terminal has proper permissions
- [ ] Required tools installed (Node.js, npm, Python, pip)

## How Commands Are Executed

### Architecture

```
Chat Interface
    ↓
terminalCommandService
    ↓
WebSocket (ws://localhost:3001/terminal)
    ↓
Backend Terminal Proxy
    ↓
System Terminal (bash/zsh/cmd)
    ↓
Actual Commands Execute
```

### Flow

1. **User types**: "Create a weather app"
2. **AI generates**: App name and selects stack
3. **Chat sends**: Commands to `terminalCommandService`
4. **Service connects**: WebSocket to backend
5. **Backend executes**: Commands in real terminal
6. **Output streams**: Back to chat interface
7. **User sees**: Real-time progress

## Advanced Features

### Custom Commands
After project generation, you can run custom commands:

```
"Run npm install in the frontend folder"
"Execute python manage.py migrate"
"Start the development server"
```

### File Operations
Mix project generation with file operations:

```
"Create a weather app, then add a config file"
"Generate a blog, then update @src/App.tsx"
```

### Multiple Projects
Generate multiple projects in sequence:

```
"Create a frontend with React"
(wait for completion)
"Now create a backend with FastAPI"
```

## Tech Stack Options

The AI automatically selects from:

1. **React + Node.js + Supabase** - Default for web apps
2. **React + Django + Supabase** - Python backend
3. **React + FastAPI + Supabase** - Modern Python, AI/ML
4. **Next.js + Node.js + Supabase** - SSR, SEO
5. **Next.js + FastAPI + Supabase** - Full-stack with Python
6. **React Native + Expo + Supabase** - Mobile apps

## Keywords for Stack Detection

- **Mobile**: "mobile app", "react native", "expo"
- **Next.js**: "nextjs", "next.js", "ssr", "seo"
- **Python**: "python", "django", "fastapi"
- **AI/ML**: "ai", "machine learning", "data science" → FastAPI
- **Default**: React + Node.js

## Best Practices

### 1. Be Specific
❌ "Create an app"
✅ "Create a weather dashboard with React and Node.js"

### 2. One Project at a Time
Wait for completion before starting another project

### 3. Check Output
Monitor the chat for errors or warnings

### 4. Verify Installation
After generation, check that files were created:
```bash
ls -la weather-website/
```

### 5. Manual Cleanup
If generation fails, clean up manually:
```bash
rm -rf weather-website/
```

## Real vs. Mock Execution

### Real Execution (Current Implementation)
- ✅ Commands execute in actual terminal
- ✅ Files are created on disk
- ✅ Dependencies are installed
- ✅ Real-time output
- ⚠️ Requires backend server

### What You See in Chat
- Progress messages
- Command output
- Success/error indicators
- Next steps guidance

## Example Session

```
You: "design full website for weather"

AI: 🤖 Analyzing your project requirements...

AI: ✨ Generated app name: weather-website

AI: 📦 Selected tech stack: React + Node.js + Supabase
    Frontend: React
    Backend: Node.js + Express
    Database: Supabase
    Starting project setup...

AI: 📦 Setting up frontend...

AI: ⚙️ Running: `npx create-react-app weather-website`

AI: ✅ Creating a new React app in /Users/you/projects/weather-website...
    Installing packages. This might take a couple of minutes...

AI: ⚙️ Running: `cd weather-website`

AI: ✅ Changed directory

AI: ⚙️ Running: `npm install @supabase/supabase-js`

AI: ✅ added 1 package, and audited 1500 packages in 3s...

AI: 🔧 Setting up backend...

AI: ⚙️ Running: `mkdir weather-website-backend`

AI: ✅ Directory created

AI: ⚙️ Running: `cd weather-website-backend`

AI: ✅ Changed directory

AI: ⚙️ Running: `npm init -y`

AI: ✅ Wrote to /Users/you/projects/weather-website-backend/package.json

AI: ⚙️ Running: `npm install express cors dotenv`

AI: ✅ added 50 packages, and audited 51 packages in 2s...

AI: 🎉 Project "weather-website" created successfully!
    
    Next steps:
    • Navigate to your project: cd weather-website
    • Install dependencies: npm install
    • Start development: npm run dev
    
    Your React + Node.js + Supabase project is ready to go!
```

## Verification

After generation, verify the project was created:

```bash
# Check frontend
ls -la weather-website/
cat weather-website/package.json

# Check backend
ls -la weather-website-backend/
cat weather-website-backend/package.json
```

## Summary

The chat interface **actually executes commands** - it's not just showing messages. The commands run through:

1. WebSocket connection to backend
2. Backend terminal proxy
3. Real system terminal
4. Files created on disk
5. Dependencies installed

**Key Requirement:** Backend server must be running (`npm run server`)

For more details, see:
- [AI_PROJECT_GENERATION.md](./AI_PROJECT_GENERATION.md)
- [TECH_STACKS.md](./TECH_STACKS.md)
