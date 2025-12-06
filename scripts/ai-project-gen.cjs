#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const PROJECT_DESC = process.argv[2] || 'fitness tracker with workouts and nutrition';
const PROJECT_NAME = process.argv[3] || 'fittrack-ai';
const PROJECT_PATH = path.join(process.env.HOME, 'Desktop', PROJECT_NAME);
const API_URL = 'http://localhost:3001/api/ai';

console.log('🤖 AI-Driven Project Generator');
console.log('================================\n');
console.log(`📝 Project: ${PROJECT_DESC}`);
console.log(`📦 Name: ${PROJECT_NAME}`);
console.log(`📁 Location: ${PROJECT_PATH}\n`);

async function callAI(prompt) {
  try {
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: prompt,
        language: 'text',
        context: 'Project generation'
      })
    });

    const data = await response.json();
    return data.explanation || data.result || '';
  } catch (error) {
    console.error('⚠️  AI unavailable, using intelligent defaults');
    return null;
  }
}

async function main() {
  console.log('🤖 AI is designing your project architecture...\n');

  // AI designs the architecture
  const architecturePrompt = `Design a complete project structure for: "${PROJECT_DESC}"

Create a JSON response with this exact structure:
{
  "folders": {
    "frontend": ["src/components", "src/services", "src/hooks", "src/types", "public"],
    "backend": ["src/controllers", "src/models", "src/routes", "src/middleware"]
  },
  "files": {
    "frontend": [
      {"name": "src/App.tsx", "type": "component"},
      {"name": "src/main.tsx", "type": "entry"}
    ],
    "backend": [
      {"name": "src/index.ts", "type": "server"}
    ]
  }
}`;

  const aiResponse = await callAI(architecturePrompt);
  
  let config;
  if (aiResponse) {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      config = jsonMatch ? JSON.parse(jsonMatch[0]) : getDefaultConfig();
    } catch {
      config = getDefaultConfig();
    }
  } else {
    config = getDefaultConfig();
  }

  console.log('✅ Architecture designed\n');
  console.log('🏗️  Creating project structure...\n');

  // Create directories
  createStructure(PROJECT_PATH, config);

  console.log('\n📝 Generating code with AI...\n');

  // Generate files
  await generateFiles(PROJECT_PATH, config);

  console.log('\n✅ Project created successfully!\n');
  console.log('📂 Opening in editor...\n');

  // Open in VS Code
  try {
    execSync(`code "${PROJECT_PATH}"`, { stdio: 'inherit' });
    console.log('✅ Opened in VS Code\n');
  } catch {
    console.log(`📁 Project at: ${PROJECT_PATH}\n`);
  }

  console.log('🎉 Done!\n');
  console.log('Next steps:');
  console.log(`  cd ${PROJECT_PATH}/frontend`);
  console.log('  npm install && npm run dev\n');
}

function getDefaultConfig() {
  return {
    folders: {
      frontend: ['src/components/Dashboard', 'src/components/Workouts', 'src/components/Nutrition', 'src/services', 'src/hooks', 'src/types', 'src/utils', 'public'],
      backend: ['src/controllers', 'src/models', 'src/routes', 'src/middleware', 'src/config']
    },
    files: {
      frontend: [
        { name: 'src/App.tsx', type: 'component' },
        { name: 'src/main.tsx', type: 'entry' },
        { name: 'src/components/Dashboard/Dashboard.tsx', type: 'component' },
        { name: 'src/components/Workouts/WorkoutList.tsx', type: 'component' },
        { name: 'src/components/Nutrition/MealLog.tsx', type: 'component' },
        { name: 'src/services/api.ts', type: 'service' },
        { name: 'src/hooks/useWorkouts.ts', type: 'hook' },
        { name: 'package.json', type: 'config' },
        { name: 'vite.config.ts', type: 'config' },
        { name: 'tsconfig.json', type: 'config' }
      ],
      backend: [
        { name: 'src/index.ts', type: 'server' },
        { name: 'src/controllers/workoutController.ts', type: 'controller' },
        { name: 'src/models/Workout.ts', type: 'model' },
        { name: 'src/routes/workouts.ts', type: 'route' },
        { name: 'package.json', type: 'config' },
        { name: '.env.example', type: 'config' }
      ]
    }
  };
}

function createStructure(basePath, config) {
  fs.mkdirSync(basePath, { recursive: true });
  
  // Frontend
  const frontendPath = path.join(basePath, 'frontend');
  config.folders.frontend.forEach(folder => {
    const folderPath = path.join(frontendPath, folder);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`   ✓ frontend/${folder}`);
  });

  // Backend
  const backendPath = path.join(basePath, 'backend');
  config.folders.backend.forEach(folder => {
    const folderPath = path.join(backendPath, folder);
    fs.mkdirSync(folderPath, { recursive: true });
    console.log(`   ✓ backend/${folder}`);
  });

  // README
  fs.writeFileSync(path.join(basePath, 'README.md'), `# ${PROJECT_NAME}

${PROJECT_DESC}

## Setup

### Frontend
\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

### Backend
\`\`\`bash
cd backend
npm install
npm run dev
\`\`\`

Generated by AI
`);
}

async function generateFiles(basePath, config) {
  // Frontend files
  for (const file of config.files.frontend) {
    const filePath = path.join(basePath, 'frontend', file.name);
    const code = await generateCode(file.name, file.type, 'frontend');
    fs.writeFileSync(filePath, code);
    console.log(`   ✅ ${file.name}`);
  }

  // Backend files
  for (const file of config.files.backend) {
    const filePath = path.join(basePath, 'backend', file.name);
    const code = await generateCode(file.name, file.type, 'backend');
    fs.writeFileSync(filePath, code);
    console.log(`   ✅ ${file.name}`);
  }
}

async function generateCode(fileName, fileType, context) {
  if (fileName === 'package.json') {
    return context === 'frontend' ? getFrontendPackageJson() : getBackendPackageJson();
  }

  if (fileName === 'vite.config.ts') {
    return `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\n\nexport default defineConfig({\n  plugins: [react()],\n  server: { port: 3000 }\n});\n`;
  }

  if (fileName === 'tsconfig.json') {
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
        strict: true
      },
      include: ["src"]
    }, null, 2);
  }

  if (fileName === '.env.example') {
    return `PORT=3001\nMONGODB_URI=mongodb://localhost:27017/${PROJECT_NAME}\nJWT_SECRET=your-secret-key\n`;
  }

  // Use AI to generate code
  const prompt = `Generate complete production-ready code for ${fileName} in a ${PROJECT_DESC} application.

File type: ${fileType}
Context: ${context}

Requirements:
- Complete working code
- TypeScript with proper types
- All necessary imports
- Error handling
- Best practices

Return ONLY the code, no explanations.`;

  const aiCode = await callAI(prompt);
  
  if (aiCode && aiCode.length > 50) {
    return aiCode;
  }

  // Fallback templates
  return getTemplate(fileName, fileType);
}

function getTemplate(fileName, fileType) {
  const name = path.basename(fileName, path.extname(fileName));
  
  if (fileType === 'component') {
    return `import React from 'react';\n\nconst ${name} = () => {\n  return (\n    <div className="${name.toLowerCase()}">\n      <h2>${name}</h2>\n    </div>\n  );\n};\n\nexport default ${name};\n`;
  }

  if (fileType === 'server') {
    return `import express from 'express';\nimport cors from 'cors';\n\nconst app = express();\nconst PORT = 3001;\n\napp.use(cors());\napp.use(express.json());\n\napp.get('/api/health', (req, res) => {\n  res.json({ status: 'ok' });\n});\n\napp.listen(PORT, () => console.log(\`Server on port \${PORT}\`));\n`;
  }

  return `// ${fileName}\nexport {};\n`;
}

function getFrontendPackageJson() {
  return JSON.stringify({
    name: `${PROJECT_NAME}-frontend`,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build"
    },
    dependencies: {
      react: "^18.3.1",
      "react-dom": "^18.3.1"
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

function getBackendPackageJson() {
  return JSON.stringify({
    name: `${PROJECT_NAME}-backend`,
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
  }, null, 2);
}

main().catch(console.error);
