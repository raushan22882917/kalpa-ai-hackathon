# Test AI Project Generator

## Before Integrating into Chat - Test First!

This is the smart approach: test the AI generator standalone before adding it to the chat interface.

## Step 1: Start Backend Server

Open a terminal and run:
```bash
npm run server
```

Wait for:
```
AI Backend server running on port 3001
Terminal WebSocket available at ws://localhost:3001/terminal
```

## Step 2: Run the Test Script

In another terminal:
```bash
node scripts/test-ai-generator.js
```

## What the Test Does

### 1. Tests AI Connection
```
✅ AI backend is working!
```

### 2. Generates Project Name
```
✅ Generated project name: calculator-app
```

### 3. AI Analyzes Requirements
```
✅ AI generated project plan!
```

### 4. Parses AI Response
```
✅ Successfully parsed JSON plan!
```

### 5. Shows Execution Plan
```
📋 EXECUTION PLAN
Project Name: calculator-app
Project Type: web app
Tech Stack: React
Features:
  • Basic calculator operations
  • Clean UI
  • Responsive design
Setup Commands:
  1. npx create-react-app calculator-app
  2. cd calculator-app
  3. npm install
Files to Create: 3 files
  • src/Calculator.tsx
  • src/Calculator.css
  • src/App.tsx
```

## Expected Output

```
🧪 Testing AI Project Generator

==================================================
Test Query: "Create a simple calculator app"
==================================================

Starting test...

Step 1: Testing AI backend connection...
✅ AI backend is working!
   Response: Hello! How can I help you today?...

Step 2: Generating project name...
✅ Generated project name: calculator-app

Step 3: AI analyzing project requirements...
✅ AI generated project plan!

AI Response:
--------------------------------------------------
{
  "projectType": "web app",
  "techStack": "React",
  "features": [
    "Basic arithmetic operations",
    "Clean user interface",
    "Responsive design"
  ],
  "setupCommands": [
    "npx create-react-app PROJECT_NAME",
    "cd PROJECT_NAME",
    "npm install"
  ],
  "filesToCreate": [
    {
      "path": "src/Calculator.tsx",
      "content": "import React, { useState } from 'react';\n..."
    }
  ]
}
--------------------------------------------------

Step 4: Parsing AI response...
✅ Successfully parsed JSON plan!

==================================================
📋 EXECUTION PLAN
==================================================

Project Name: calculator-app
Project Type: web app
Tech Stack: React

Features:
  • Basic arithmetic operations
  • Clean user interface
  • Responsive design

Setup Commands:
  1. npx create-react-app calculator-app
  2. cd calculator-app
  3. npm install

Files to Create: 3 files
  • src/Calculator.tsx (1234 characters)
  • src/Calculator.css (567 characters)
  • src/App.tsx (890 characters)

==================================================
✅ TEST SUCCESSFUL!
==================================================

The AI project generator is working correctly!
You can now integrate it into the chat interface.
```

## If Test Fails

### Error: "AI backend not responding"
```bash
# Start the backend server
npm run server
```

### Error: "fetch is not defined"
```bash
# Install node-fetch if needed
npm install node-fetch
```

### Error: "AI service unavailable"
- Check `.env` file has `GEMINI_API_KEY`
- Verify API key is valid
- Check internet connection

## After Successful Test

Once the test passes:
1. ✅ AI connection works
2. ✅ Project name generation works
3. ✅ AI planning works
4. ✅ JSON parsing works
5. ✅ Ready to integrate into chat!

## Next Steps

After test is successful:
1. The `simpleAIProjectGenerator.ts` service is ready
2. Can be integrated into `AIFileManagerChat.tsx`
3. Will work the same way in the chat interface

## Test Different Queries

Edit `scripts/test-ai-generator.js` and change:
```javascript
const TEST_QUERY = 'Create a simple calculator app';
```

Try:
```javascript
const TEST_QUERY = 'Create a weather website';
const TEST_QUERY = 'Build a todo app with authentication';
const TEST_QUERY = 'Make a blog platform';
```

Run the test again to see how AI handles different requests!

## Summary

✅ Test first before integrating  
✅ Verify AI works correctly  
✅ See what AI generates  
✅ Then add to chat interface  

This is the smart way to develop!
