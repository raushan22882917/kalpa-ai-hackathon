#!/usr/bin/env node

/**
 * AI-Driven Project Generator
 * Uses AI to design and generate complete projects
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const API_URL = 'http://localhost:3001/api/ai';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function callAI(prompt, context = '') {
  try {
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: prompt,
        language: 'text',
        context: context
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.explanation || data.result || '';
  } catch (error) {
    console.error('❌ AI Error:', error.message);
    return null;
  }
}

async function main() {
  console.log('🤖 AI-Driven Project Generator');
  console.log('================================\n');
  
  // Get project description from user
  const projectDescription = await question('📝 Describe your project (e.g., "fitness tracker with workouts and nutrition"): ');
  
  if (!projectDescription.trim()) {
    console.log('❌ Project description required');
    rl.close();
    return;
  }

  const projectName = await question('📦 Project name (e.g., fitness-tracker): ') || 'my-project';
  const defaultPath = path.join(process.env.HOME || process.env.USERPROFILE, 'Desktop', projectName);
  const projectPath = await question(`📁 Project location (default: ${defaultPath}): `) || defaultPath;

  console.log('\n🤖 AI is analyzing your project requirements...\n');

  // Step 1: AI designs the architecture
  const architecturePrompt = `Design a complete full-stack application architecture for: "${projectDescription}"

Requirements:
- Provide a detailed folder structure
- List all necessary files with their purposes
- Suggest appropriate tech stack
- Include frontend, backend, and database components
- Consider best practices and scalability

Return a JSON structure with:
{
  "projectName": "name",
  "description": "description",
  "techStack": {
    "frontend": "technology",
    "backend": "technology",
    "database": "technology"
  },
  "structure": {
    "frontend": {
      "folders": ["folder1", "folder2"],
      "files": [{"path": "file.tsx", "purpose": "description"}]
    },
    "backend": {
      "folders": ["folder1", "folder2"],
      "files": [{"path": "file.ts", "purpose": "description"}]
    }
  },
  "features": ["feature1", "feature2"]
}`;

  const architecture = await callAI(architecturePrompt, 'Project architecture design');
  
  if (!architecture) {
    console.log('❌ Failed to get AI response. Make sure backend is running.');
    rl.close();
    return;
  }

  console.log('✅ Architecture designed by AI\n');
  console.log('📋 AI Recommendations:');
  console.log(architecture.substring(0, 500) + '...\n');

  const confirm = await question('Continue with AI-generated architecture? (y/n): ');
  if (confirm.toLowerCase() !== 'y') {
    console.log('❌ Cancelled');
    rl.close();
    return;
  }

  console.log('\n🏗️  Creating project structure...\n');

  // Step 2: Parse AI response and create structure
  let projectConfig;
  try {
    // Try to extract JSON from AI response
    const jsonMatch = architecture.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      projectConfig = JSON.parse(jsonMatch[0]);
    } else {
      // Fallback to intelligent defaults
      projectConfig = createDefaultConfig(projectDescription, projectName);
    }
  } catch (error) {
    console.log('⚠️  Using intelligent defaults...');
    projectConfig = createDefaultConfig(projectDescription, projectName);
  }

  // Create directories
  createProjectStructure(projectPath, projectConfig);

  console.log('\n📝 Generating code with AI...\n');

  // Step 3: Generate code for each file using AI
  await generateProjectFiles(projectPath, projectConfig, projectDescription);

  console.log('\n✅ Project generated successfully!\n');
  console.log('📂 Opening project in editor...\n');

  // Step 4: Open in VS Code or default editor
  try {
    execSync(`code "${projectPath}"`, { stdio: 'inherit' });
    console.log('✅ Project opened in VS Code');
  } catch (error) {
    console.log('⚠️  Could not open in VS Code. Opening folder...');
    try {
      const openCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
      execSync(`${openCmd} "${projectPath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.log(`📁 Project created at: ${projectPath}`);
    }
  }

  console.log('\n🎉 Done! Your AI-generated project is ready.\n');
  console.log('📋 Next steps:');
  console.log(`   cd ${projectPath}/frontend`);
  console.log('   npm install');
  console.log('   npm run dev\n');

  rl.close();
}

function createDefaultConfig(description, name) {
  const isFullStack = description.toLowerCase().includes('backend') || 
                      description.toLowerCase().includes('api') ||
                      description.toLowerCase().includes('database');
  
  return {
    projectName: name,
    description: description,
    techStack: {
      frontend: 'React + TypeScript + Vite',
      backend: isFullStack ? 'Node.js + Express + TypeScript' : 'None',
      database: isFullStack ? 'MongoDB' : 'None'
    },
    structure: {
      frontend: {
        folders: ['src/components', 'src/services', 'src/hooks', 'src/types', 'src/utils', 'public'],
        files: [
          { path: 'src/App.tsx', purpose: 'Main application component' },
          { path: 'src/main.tsx', purpose: 'Application entry point' },
          { path: 'package.json', purpose: 'Dependencies' }
        ]
      },
      backend: isFullStack ? {
        folders: ['src/controllers', 'src/models', 'src/routes', 'src/middleware', 'src/config'],
        files: [
          { path: 'src/index.ts', purpose: 'Server entry point' },
          { path: 'package.json', purpose: 'Dependencies' }
        ]
      } : null
    },
    features: extractFeatures(description)
  };
}

function extractFeatures(description) {
  const features = [];
  const keywords = {
    'auth': 'Authentication',
    'login': 'User Login',
    'workout': 'Workout Tracking',
    'nutrition': 'Nutrition Logging',
    'dashboard': 'Dashboard',
    'profile': 'User Profile',
    'social': 'Social Features',
    'chat': 'Chat/Messaging',
    'payment': 'Payment Integration',
    'notification': 'Notifications'
  };

  Object.entries(keywords).forEach(([key, feature]) => {
    if (description.toLowerCase().includes(key)) {
      features.push(feature);
    }
  });

  return features.length > 0 ? features : ['Core Functionality'];
}

function createProjectStructure(basePath, config) {
  // Create main directory
  fs.mkdirSync(basePath, { recursive: true });
  console.log(`✅ Created: ${basePath}`);

  // Create frontend structure
  if (config.structure.frontend) {
    const frontendPath = path.join(basePath, 'frontend');
    fs.mkdirSync(frontendPath, { recursive: true });
    
    config.structure.frontend.folders.forEach(folder => {
      const folderPath = path.join(frontendPath, folder);
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`   ✓ ${folder}`);
    });
  }

  // Create backend structure
  if (config.structure.backend) {
    const backendPath = path.join(basePath, 'backend');
    fs.mkdirSync(backendPath, { recursive: true });
    
    config.structure.backend.folders.forEach(folder => {
      const folderPath = path.join(backendPath, folder);
      fs.mkdirSync(folderPath, { recursive: true });
      console.log(`   ✓ ${folder}`);
    });
  }

  // Create README
  const readme = `# ${config.projectName}

${config.description}

## Tech Stack

- Frontend: ${config.techStack.frontend}
- Backend: ${config.techStack.backend}
- Database: ${config.techStack.database}

## Features

${config.features.map(f => `- ${f}`).join('\n')}

## Getting Started

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

${config.structure.backend ? `### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`
` : ''}

## Generated by AI

This project was automatically generated using AI-driven architecture design.
`;

  fs.writeFileSync(path.join(basePath, 'README.md'), readme);
  console.log('   ✓ README.md');
}

async function generateProjectFiles(basePath, config, description) {
  // Generate frontend files
  if (config.structure.frontend && config.structure.frontend.files) {
    for (const file of config.structure.frontend.files) {
      await generateFile(
        path.join(basePath, 'frontend', file.path),
        file.purpose,
        description,
        config
      );
    }
  }

  // Generate backend files
  if (config.structure.backend && config.structure.backend.files) {
    for (const file of config.structure.backend.files) {
      await generateFile(
        path.join(basePath, 'backend', file.path),
        file.purpose,
        description,
        config
      );
    }
  }
}

async function generateFile(filePath, purpose, projectDescription, config) {
  const fileName = path.basename(filePath);
  const ext = path.extname(fileName);

  console.log(`   Generating ${fileName}...`);

  let code;

  if (fileName === 'package.json') {
    code = generatePackageJson(filePath, config);
  } else {
    // Use AI to generate code
    const prompt = `Generate complete, production-ready code for a file in a ${projectDescription} project.

File: ${fileName}
Purpose: ${purpose}
Tech Stack: ${JSON.stringify(config.techStack)}
Features: ${config.features.join(', ')}

Requirements:
- Write complete, working code
- Include all necessary imports
- Add proper TypeScript types
- Include error handling
- Add comments for clarity
- Follow best practices

Generate ONLY the code, no explanations.`;

    code = await callAI(prompt, `Code generation for ${fileName}`);

    if (!code) {
      code = generateFallbackCode(fileName, ext, purpose);
    }
  }

  fs.writeFileSync(filePath, code);
  console.log(`   ✅ ${fileName}`);
}

function generatePackageJson(filePath, config) {
  const isFrontend = filePath.includes('frontend');
  const isBackend = filePath.includes('backend');

  if (isFrontend) {
    return JSON.stringify({
      name: `${config.projectName}-frontend`,
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

  if (isBackend) {
    return JSON.stringify({
      name: `${config.projectName}-backend`,
      version: "1.0.0",
      type: "module",
      scripts: {
        dev: "tsx watch src/index.ts",
        build: "tsc",
        start: "node dist/index.js"
      },
      dependencies: {
        express: "^4.18.0",
        cors: "^2.8.5",
        dotenv: "^16.0.0"
      },
      devDependencies: {
        "@types/express": "^4.17.0",
        "@types/cors": "^2.8.0",
        typescript: "^5.3.0",
        tsx: "^4.0.0"
      }
    }, null, 2);
  }

  return '{}';
}

function generateFallbackCode(fileName, ext, purpose) {
  if (ext === '.tsx' || ext === '.jsx') {
    const componentName = fileName.replace(/\.(tsx|jsx)$/, '');
    return `import React from 'react';

interface ${componentName}Props {
  // Add props here
}

const ${componentName}: React.FC<${componentName}Props> = (props) => {
  return (
    <div className="${componentName.toLowerCase()}">
      <h2>${componentName}</h2>
      <p>${purpose}</p>
    </div>
  );
};

export default ${componentName};
`;
  }

  if (ext === '.ts' && fileName.includes('index')) {
    return `import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '${purpose}' });
});

app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;
  }

  return `// ${fileName}\n// ${purpose}\n\nexport {};\n`;
}

// Run the generator
main().catch(console.error);
