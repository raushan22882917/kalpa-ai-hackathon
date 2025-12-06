# Simple Setup - Run Commands in Your Terminal

## What You Need to Know

When you use the AI chat to generate a project, **the commands actually run in your terminal** through the backend server.

## How It Works

```
Your Chat Request
      ↓
AI generates commands
      ↓
Backend server receives commands
      ↓
Commands execute in YOUR TERMINAL
      ↓
Results show in chat
```

## Setup (2 Steps)

### Step 1: Start Backend Server

Open a terminal and run:
```bash
npm run server
```

**Keep this terminal open!** This is where commands will execute.

### Step 2: Use the Chat

1. Open chat (click chat icon or `Ctrl+Shift+A`)
2. Type: `Create a weather app`
3. Watch the commands run in your backend terminal!

## What You'll See

### In Your Backend Terminal:
```bash
$ npm run server

> kalpa-ai-editor@0.1.0 server
> tsx watch server/index.ts

AI Backend server running on port 3001
Terminal WebSocket available at ws://localhost:3001/terminal

# When you generate a project, you'll see:
Executing: npx create-react-app weather-app
Creating a new React app...
Installing packages...
Success! Created weather-app
```

### In the Chat:
```
🤖 Analyzing your project requirements...
✨ Generated app name: weather-app
📦 Selected tech stack: React + Node.js + Supabase
⚙️ Running: npx create-react-app weather-app
✅ Command completed successfully
```

## The Commands ARE Running!

Yes, the commands are **actually executing** in your terminal. You can verify by:

1. **Check the backend terminal** - You'll see command output there
2. **Check your folder** - Files are actually created
3. **Run `ls`** - You'll see the new project folder

## Example

### You Type in Chat:
```
Create a todo app with React
```

### Backend Terminal Shows:
```bash
Executing: npx create-react-app todo-app
Creating a new React app in /your/folder/todo-app...

Installing packages. This might take a couple of minutes.
Installing react, react-dom, and react-scripts with cra-template...

added 1234 packages in 45s

Success! Created todo-app at /your/folder/todo-app
```

### Your Folder Now Has:
```bash
$ ls
todo-app/
todo-app-backend/
```

## Verify It's Working

### Test 1: Simple Command
In chat, type:
```
test terminal
```

Check your backend terminal - you'll see:
```bash
Executing: echo "Hello from terminal!"
Hello from terminal!
```

### Test 2: Check Files
After generating a project:
```bash
$ ls -la
drwxr-xr-x  weather-app/
drwxr-xr-x  weather-app-backend/

$ cd weather-app
$ ls
node_modules/
package.json
public/
src/
```

The files are REAL! They were created by commands running in your terminal.

## Summary

✅ Commands run in your backend terminal  
✅ Files are actually created  
✅ You can see output in backend terminal  
✅ Chat shows progress and results  

**The system is working - commands are executing in your terminal through the backend!**

## Still Not Working?

Make sure:
1. Backend server is running (`npm run server`)
2. You see "Terminal WebSocket available" message
3. Connection indicator in chat is green (🟢)
4. You have a folder open in the editor

The commands WILL run in your terminal - you just need the backend server running to proxy them!
