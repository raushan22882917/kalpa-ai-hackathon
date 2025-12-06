# AI-Powered Project Generation

The AI File Manager Chat now includes intelligent project generation capabilities that automatically:
- Generate appropriate app names using AI
- Select the best tech stack based on your description
- Execute all setup commands in the terminal
- Create a fully functional project structure

## How It Works

### 1. Describe Your Project
Simply tell the AI what you want to build in natural language:

```
"Create a todo app with React and Node.js"
"Build a blog platform with Next.js"
"Generate a mobile app for tracking fitness"
"Create an e-commerce site with Django backend"
```

### 2. AI Determines Everything
The AI will:
- **Generate App Name**: Creates a kebab-case name based on your description
- **Select Tech Stack**: Chooses from 6 predefined stacks:
  - React + Node.js + Supabase
  - React + Django REST + Supabase
  - React + FastAPI + Supabase
  - Next.js + Node.js + Supabase
  - Next.js + FastAPI + Supabase
  - React Native + Expo + Supabase

### 3. Automatic Setup
The system will:
- Execute all necessary terminal commands
- Install dependencies
- Set up project structure
- Configure both frontend and backend (if applicable)

## Example Workflow

### Input:
```
"Create a task management app with React and FastAPI"
```

### AI Process:
1. **Analyzes description** → Detects React + FastAPI stack
2. **Generates name** → `task-manager-app`
3. **Selects stack** → React + FastAPI + Supabase
4. **Executes commands**:
   ```bash
   npx create-react-app task-manager-app
   cd task-manager-app
   npm install @supabase/supabase-js
   
   mkdir task-manager-app-backend
   cd task-manager-app-backend
   python -m venv venv
   source venv/bin/activate
   pip install fastapi uvicorn
   ```

### Output:
```
🎉 Project "task-manager-app" created successfully!

Next steps:
• Navigate to your project: cd task-manager-app
• Install dependencies: npm install
• Start development: npm run dev

Your React + FastAPI + Supabase project is ready to go!
```

## Supported Keywords

### Tech Stack Detection
- **React Native/Mobile/Expo** → React Native + Expo + Supabase
- **Next.js** → Next.js + Node.js + Supabase
- **Next.js + Python/FastAPI** → Next.js + FastAPI + Supabase
- **Django** → React + Django REST + Supabase
- **FastAPI/Python** → React + FastAPI + Supabase
- **Default** → React + Node.js + Supabase

### Project Types
- `create`, `build`, `generate`, `setup`, `scaffold`
- `app`, `application`, `project`, `website`, `api`, `backend`, `frontend`

## Requirements

### Backend Server
The terminal command execution requires the backend server to be running:

```bash
npm run server
```

### Environment
- Node.js installed
- Python installed (for Python-based stacks)
- npm/pip available in PATH

## Features

### ✅ Automatic App Naming
- AI generates meaningful, kebab-case names
- Based on project description
- Fallback to timestamp if AI fails

### ✅ Smart Stack Selection
- Analyzes project requirements
- Matches keywords to appropriate stacks
- Considers frontend, backend, and database needs

### ✅ Terminal Integration
- Executes commands in proper sequence
- Shows real-time progress
- Handles errors gracefully

### ✅ Multi-Language Support
- JavaScript/TypeScript (React, Next.js, Node.js)
- Python (Django, FastAPI)
- Mobile (React Native, Expo)

## Troubleshooting

### "Terminal server not available"
**Solution:** Start the backend server:
```bash
npm run server
```

### "Command failed"
**Possible causes:**
- Missing dependencies (Node.js, Python, npm, pip)
- Network issues during package installation
- Insufficient permissions

**Solution:** Check that all required tools are installed and accessible in your PATH.

### "Could not determine appropriate tech stack"
**Solution:** Be more specific in your description. Include keywords like:
- "React", "Next.js", "React Native"
- "Node.js", "Django", "FastAPI"
- "mobile", "web", "api", "backend"

## Examples

### Web Application
```
"Create a social media dashboard with React and Node.js"
```
→ Generates React + Node.js + Supabase project

### Mobile App
```
"Build a fitness tracking mobile app"
```
→ Generates React Native + Expo + Supabase project

### Full-Stack with Python
```
"Create a data analytics platform with Next.js and FastAPI"
```
→ Generates Next.js + FastAPI + Supabase project

### E-commerce
```
"Build an online store with Django backend"
```
→ Generates React + Django REST + Supabase project

## Advanced Usage

### Custom Commands
After project generation, you can continue using the chat for:
- Creating additional files
- Updating existing code
- Managing project structure
- Running custom terminal commands

### File Management
Use @ mentions to reference files:
```
"Update @src/App.tsx to add routing"
"Add authentication to @backend/api.py"
```

## Tech Stack Details

For detailed information about each tech stack, including:
- Setup commands
- Benefits
- Use cases
- Package requirements

See: [TECH_STACKS.md](./TECH_STACKS.md)

## API Integration

The AI project generation uses:
- **Backend AI Service** (`/api/ai/process`) for app name generation
- **Terminal Service** (WebSocket) for command execution
- **Predefined Stacks** (`src/data/predefinedStacks.ts`) for configuration

## Future Enhancements

Planned features:
- [ ] Custom tech stack configuration
- [ ] Project templates
- [ ] Git initialization
- [ ] Environment variable setup
- [ ] Database schema generation
- [ ] API endpoint scaffolding
- [ ] Testing setup
- [ ] Deployment configuration

## Support

For issues or questions:
1. Check that backend server is running
2. Verify all dependencies are installed
3. Review terminal output for specific errors
4. Consult [TECH_STACKS.md](./TECH_STACKS.md) for stack-specific help
