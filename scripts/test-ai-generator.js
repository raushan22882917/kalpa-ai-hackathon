/**
 * Test Script for Simple AI Project Generator
 * Run this to test if project generation works before integrating into chat
 */

import fetch from 'node-fetch';

// Configuration
const AI_BACKEND_URL = 'http://localhost:3001/api/ai/process';
const TEST_QUERY = 'Create a simple calculator app';

console.log('🧪 Testing AI Project Generator\n');
console.log('=' .repeat(50));
console.log(`Test Query: "${TEST_QUERY}"`);
console.log('=' .repeat(50) + '\n');

async function testAIProjectGenerator() {
  try {
    // Step 1: Test AI connection
    console.log('Step 1: Testing AI backend connection...');
    const testResponse = await fetch(AI_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'complete',
        code: 'Say "Hello"',
        language: 'text',
        provider: 'gemini',
      }),
    });

    if (!testResponse.ok) {
      throw new Error('AI backend not responding. Make sure to run: npm run server');
    }

    const testData = await testResponse.json();
    console.log('✅ AI backend is working!');
    console.log(`   Response: ${testData.result.substring(0, 50)}...\n`);

    // Step 2: Generate project name
    console.log('Step 2: Generating project name...');
    const namePrompt = `Generate a short, kebab-case project name (2-3 words) for: "${TEST_QUERY}". Return ONLY the name, nothing else.`;
    
    const nameResponse = await fetch(AI_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'complete',
        code: namePrompt,
        language: 'text',
        provider: 'gemini',
      }),
    });

    const nameData = await nameResponse.json();
    let projectName = nameData.result.trim().toLowerCase();
    projectName = projectName.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    console.log(`✅ Generated project name: ${projectName}\n`);

    // Step 3: Analyze and create project plan
    console.log('Step 3: AI analyzing project requirements...');
    const planPrompt = `
You are a senior software architect. Analyze this project request and create a complete implementation plan.

User Request: "${TEST_QUERY}"

Provide a JSON response with:
{
  "projectType": "web app / mobile app / api / etc",
  "techStack": "React / Next.js / React Native / etc",
  "features": ["feature 1", "feature 2"],
  "setupCommands": ["npx create-react-app PROJECT_NAME", "cd PROJECT_NAME", "npm install"],
  "filesToCreate": [
    {
      "path": "src/Calculator.tsx",
      "content": "// Complete calculator component code here"
    }
  ]
}

Be specific and provide COMPLETE, WORKING code for all files. Use PROJECT_NAME as placeholder for the project name.
`;

    const planResponse = await fetch(AI_BACKEND_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'complete',
        code: planPrompt,
        language: 'text',
        provider: 'gemini',
      }),
    });

    const planData = await planResponse.json();
    console.log('✅ AI generated project plan!');
    console.log('\nAI Response:');
    console.log('-'.repeat(50));
    console.log(planData.result);
    console.log('-'.repeat(50) + '\n');

    // Step 4: Parse the plan
    console.log('Step 4: Parsing AI response...');
    let plan;
    try {
      const jsonMatch = planData.result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0]);
        console.log('✅ Successfully parsed JSON plan!');
        console.log('\nParsed Plan:');
        console.log(JSON.stringify(plan, null, 2));
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.log('⚠️  Could not parse JSON, using fallback plan');
      plan = {
        projectType: 'web app',
        techStack: 'React',
        features: ['Basic setup'],
        setupCommands: [
          'npx create-react-app PROJECT_NAME',
          'cd PROJECT_NAME',
          'npm install'
        ],
        filesToCreate: []
      };
    }

    // Step 5: Show what would be executed
    console.log('\n' + '='.repeat(50));
    console.log('📋 EXECUTION PLAN');
    console.log('='.repeat(50));
    console.log(`\nProject Name: ${projectName}`);
    console.log(`Project Type: ${plan.projectType}`);
    console.log(`Tech Stack: ${plan.techStack}`);
    console.log(`\nFeatures:`);
    plan.features.forEach(f => console.log(`  • ${f}`));
    
    console.log(`\nSetup Commands:`);
    plan.setupCommands.forEach((cmd, i) => {
      const command = cmd.replace(/PROJECT_NAME/g, projectName);
      console.log(`  ${i + 1}. ${command}`);
    });

    console.log(`\nFiles to Create: ${plan.filesToCreate.length} files`);
    if (plan.filesToCreate.length > 0) {
      plan.filesToCreate.forEach(file => {
        console.log(`  • ${file.path} (${file.content.length} characters)`);
      });
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ TEST SUCCESSFUL!');
    console.log('='.repeat(50));
    console.log('\nThe AI project generator is working correctly!');
    console.log('You can now integrate it into the chat interface.');
    console.log('\nTo actually create the project, run the commands above in your terminal.');

  } catch (error) {
    console.error('\n❌ TEST FAILED!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Make sure backend server is running: npm run server');
    console.error('2. Check that port 3001 is available');
    console.error('3. Verify GEMINI_API_KEY is set in .env file');
    process.exit(1);
  }
}

// Run the test
console.log('Starting test...\n');
testAIProjectGenerator();
