#!/usr/bin/env node

/**
 * Test script for AI File Manager Chat
 * Simulates the prompt: "design full project of fitness tracker"
 */

const API_URL = 'http://localhost:3001/api/ai';

async function testFitnessTrackerPrompt() {
  console.log('🚀 Testing AI File Manager Chat with Fitness Tracker prompt...\n');

  const prompt = `Design a complete full-stack fitness tracker application with the following requirements:

PROJECT STRUCTURE:
- Frontend: React with TypeScript
- Backend: Node.js/Express API
- Database: MongoDB or PostgreSQL
- Authentication: JWT-based auth

FEATURES TO INCLUDE:
1. User authentication and profiles
2. Workout tracking (exercises, sets, reps, weight)
3. Nutrition logging (meals, calories, macros)
4. Progress tracking with charts
5. Goal setting and achievement tracking
6. Social features (friends, sharing workouts)
7. Exercise library with instructions
8. Dashboard with statistics

TECHNICAL REQUIREMENTS:
- RESTful API design
- Responsive UI design
- Data visualization
- Real-time updates
- Mobile-friendly
- Secure authentication
- Input validation
- Error handling

Please provide:
1. Complete folder structure
2. Key file names and their purposes
3. Database schema design
4. API endpoint structure
5. Component hierarchy
6. State management approach

Generate a comprehensive project architecture document.`;

  try {
    console.log('📤 Sending request to AI backend...\n');
    
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: prompt,
        language: 'markdown',
        context: 'Project architecture design for fitness tracker application'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Response received!\n');
    console.log('=' .repeat(80));
    console.log('FITNESS TRACKER PROJECT DESIGN');
    console.log('='.repeat(80));
    console.log('\n');
    console.log(data.explanation || data.result || data);
    console.log('\n');
    console.log('='.repeat(80));
    console.log('\n✨ Design complete! You can now use this structure in the AI File Manager Chat.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure:');
    console.error('1. Backend server is running (npm run server)');
    console.error('2. API keys are configured in .env file');
    console.error('3. Port 3001 is accessible');
  }
}

// Run the test
testFitnessTrackerPrompt();
