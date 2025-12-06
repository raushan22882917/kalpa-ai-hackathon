# AI File Manager Chat - User Guide

## Overview

The AI File Manager Chat is an intelligent interface that allows you to create, manage, and organize files and folders using natural language commands. Instead of manually creating files through menus or commands, simply tell the AI what you want, and it will handle the rest.

## Features

### 🎯 Core Capabilities

1. **Create Files** - Generate files with intelligent starter code
2. **Create Folders** - Organize your project structure
3. **Delete Files/Folders** - Remove unwanted items
4. **Rename Files/Folders** - Change names easily
5. **Generate Project Structures** - Scaffold complete project templates
6. **Smart Code Generation** - AI-generated code based on file type

### 🚀 Quick Start

#### Accessing the AI File Manager

1. Click the **Chat icon** (💬) in the Activity Bar (left sidebar)
2. The AI File Manager Chat panel will open
3. Start typing your commands in natural language

## @ Mention Feature

### How to Use @ Mentions

The @ mention feature allows you to reference specific files in your workspace for targeted operations:

1. **Type @** in the chat input
2. **See suggestions** - A dropdown appears with all files and folders
3. **Filter by typing** - Continue typing to filter the list
4. **Click to select** - Click on a file to insert it into your message
5. **Send command** - Complete your instruction and send

### @ Mention Examples

#### Updating Files
```
"Update @src/App.tsx to add a new header component"
"Add authentication to @src/services/api.ts"
"Refactor @components/Button.tsx to use hooks"
"Fix the bug in @utils/helpers.ts"
```

#### Reading File Context
```
"What does @src/config.ts contain?"
"Explain the code in @components/UserProfile.tsx"
"Review @src/services/database.ts for improvements"
```

#### Multiple File Operations
```
"Update @src/App.tsx and @src/index.css to match the new theme"
"Merge functionality from @utils/old.ts into @utils/new.ts"
```

### Benefits of @ Mentions

- **Precise targeting** - No ambiguity about which file to modify
- **Autocomplete** - See all available files as you type
- **Context awareness** - AI knows exactly which file you're referring to
- **Faster workflow** - No need to type full paths manually

## Usage Examples

### Creating Files

#### Basic File Creation
```
"Create a file called index.html"
"Make a file named app.js"
"Add a new file called styles.css"
```

The AI will:
- Create the file in your current workspace
- Generate appropriate starter code based on file extension
- Confirm successful creation

#### Creating React Components
```
"Create a React component called Button"
"Make a component named UserProfile"
"Generate a React component called NavBar"
```

The AI will:
- Create a `.tsx` file with proper React component structure
- Include TypeScript interfaces
- Add CSS import
- Generate basic component boilerplate

#### Creating Specific File Types
```
"Create a TypeScript file called utils"
"Make a JSON config file"
"Add a markdown README file"
```

### Creating Folders

```
"Create a folder called components"
"Make a directory named utils"
"Add a new folder called assets"
```

### Deleting Files/Folders

```
"Delete old-file.txt"
"Remove the temp folder"
"Delete unused-component.tsx"
```

⚠️ **Note:** Folders must be empty before deletion

### Renaming Files/Folders

```
"Rename config.js to config.ts"
"Move old-name.txt to new-name.txt"
"Rename utils folder to helpers"
```

### Generating Project Structures

#### Express API Structure
```
"Generate an Express API structure"
"Create a Node.js API project"
"Setup an Express backend"
```

Creates:
```
/src
  /routes
  /controllers
  /models
  /middleware
  index.ts
/package.json
```

#### React Project Structure
```
"Generate a React project structure"
"Create a React app structure"
"Setup a React project"
```

Creates:
```
/src
  /components
  /services
  /types
  App.tsx
  main.tsx
/public
```

## Smart Code Generation

The AI automatically generates appropriate starter code based on file type:

### HTML Files
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Document</title>
</head>
<body>
  <h1>Hello World</h1>
</body>
</html>
```

### React Components (.tsx)
```typescript
import React from 'react';
import './ComponentName.css';

interface ComponentNameProps {
  // Add props here
}

const ComponentName: React.FC<ComponentNameProps> = (props) => {
  return (
    <div className="componentname">
      <h2>ComponentName</h2>
      {/* Add content here */}
    </div>
  );
};

export default ComponentName;
```

### CSS Files
```css
/* Styles for filename.css */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: Arial, sans-serif;
  line-height: 1.6;
}
```

### JavaScript/TypeScript Files
```typescript
// filename.ts

export const main = () => {
  console.log('Hello from filename.ts');
};

main();
```

### JSON Files
```json
{
  "name": "project",
  "version": "1.0.0"
}
```

### Markdown Files
```markdown
# Filename

Description goes here.

## Features

- Feature 1
- Feature 2

## Usage

\`\`\`bash
npm install
\`\`\`
```

## Quick Action Buttons

The chat interface includes quick action buttons for common tasks:

- **📄 Create File** - Pre-fills "Create a file called index.html"
- **📁 Create Folder** - Pre-fills "Create a folder called components"
- **🚀 Generate Project** - Pre-fills "Generate a React project structure"
- **⚛️ React Component** - Pre-fills "Create a React component called Button"

## Tips & Best Practices

### 1. Be Specific
✅ Good: "Create a React component called UserProfile"
❌ Vague: "Make a component"

### 2. Use Natural Language
You don't need to use exact syntax. The AI understands variations:
- "Create a file called..."
- "Make a new file named..."
- "Add a file..."
- "Generate a file..."

### 3. File Extensions Matter
Include file extensions for better code generation:
- `Button.tsx` → React TypeScript component
- `Button.jsx` → React JavaScript component
- `utils.ts` → TypeScript utility file
- `config.json` → JSON configuration

### 4. Check Action Results
After each command, the AI shows:
- ✅ Success status
- ❌ Error messages (if any)
- 📄 List of created files/folders

### 5. Current Path
The chat header shows your current workspace path. All files/folders are created relative to this path.

### 6. Use @ Mentions for Updates
When updating existing files, always use @ mentions:
- ✅ "Update @src/App.tsx to add routing"
- ❌ "Update App.tsx to add routing" (might not find the file)

## Advanced Usage

### Batch Operations
You can request multiple operations in one message:
```
"Create a components folder and add a Button component inside it"
```

### Project Templates
Request complete project setups:
```
"Generate a complete Express API with authentication"
"Create a full-stack React + Node.js project structure"
```

### Context-Aware Generation
The AI considers your project context:
- Existing files and folders
- Project type (React, Node.js, etc.)
- File naming conventions

### File Updates with @ Mentions
Use @ to reference files for updates:
```
"Update @src/components/Header.tsx to include a logo"
"Add error handling to @src/services/api.ts"
"Refactor @utils/validation.ts to use TypeScript"
```

The AI will:
1. Read the current file content
2. Understand your update request
3. Generate the updated code
4. Apply changes to the file

## Troubleshooting

### File Already Exists
**Error:** "File already exists: filename.txt"
**Solution:** Choose a different name or delete the existing file first

### Parent Directory Not Found
**Error:** "Parent directory not found: /path/to/folder"
**Solution:** Create parent folders first, or use absolute paths

### Invalid File Name
**Error:** "Name contains invalid characters"
**Solution:** Avoid special characters like `<>:"|?*`

### Folder Not Empty
**Error:** "Directory not empty: foldername"
**Solution:** Delete all files inside the folder first

## Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in message
- **Esc** - Clear input (when focused)

## AI Model Selection

You can select different AI models from the dropdown in the chat header:
- **Gemini 2.0 Flash** (Default) - Fast and efficient
- **GPT-4** - Advanced reasoning
- **Claude 3** - Detailed responses

## Integration with File Explorer

Files and folders created through the AI Chat are immediately visible in:
- File Explorer panel
- Recent Files panel
- Search results

## Privacy & Security

- All file operations are performed locally
- No file contents are sent to external servers
- AI model selection affects only the chat interface, not file operations

## Future Enhancements

Coming soon:
- File content editing through chat
- Bulk file operations
- Template customization
- Project scaffolding from GitHub templates
- Code refactoring suggestions

## Support

For issues or feature requests:
1. Check the error message in the chat
2. Review this guide for common solutions
3. Contact support with specific error details

---

**Happy coding with AI File Manager! 🚀**
