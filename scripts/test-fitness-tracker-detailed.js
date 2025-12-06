#!/usr/bin/env node

/**
 * Detailed test for Fitness Tracker project generation
 */

const API_URL = 'http://localhost:3001/api/ai';

async function generateFitnessTrackerProject() {
  console.log('🏋️ Generating Fitness Tracker Project Architecture...\n');

  const prompt = `Create a complete project structure for a fitness tracker application.

REQUIREMENTS:
- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database: MongoDB with Mongoose
- Authentication: JWT
- Features: Workouts, Nutrition, Progress, Goals, Social

Generate the complete folder structure with all necessary files.`;

  try {
    const response = await fetch(`${API_URL}/explain`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: prompt,
        language: 'text',
        context: 'Full-stack fitness tracker application architecture'
      })
    });

    const data = await response.json();
    const result = data.explanation || data.result || JSON.stringify(data, null, 2);
    
    console.log('📋 PROJECT ARCHITECTURE:\n');
    console.log(result);
    console.log('\n' + '='.repeat(80));
    
    // Save to file
    const fs = await import('fs');
    const outputPath = 'fitness-tracker-architecture.md';
    fs.writeFileSync(outputPath, `# Fitness Tracker Project Architecture\n\n${result}`);
    console.log(`\n✅ Architecture saved to: ${outputPath}`);
    
    // Generate project structure
    console.log('\n📁 Suggested Project Structure:\n');
    const structure = `
fitness-tracker/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   └── ProgressChart.tsx
│   │   │   ├── Workouts/
│   │   │   │   ├── WorkoutList.tsx
│   │   │   │   ├── WorkoutForm.tsx
│   │   │   │   ├── ExerciseCard.tsx
│   │   │   │   └── WorkoutDetail.tsx
│   │   │   ├── Nutrition/
│   │   │   │   ├── MealLog.tsx
│   │   │   │   ├── FoodSearch.tsx
│   │   │   │   ├── MacroTracker.tsx
│   │   │   │   └── CalorieCounter.tsx
│   │   │   ├── Goals/
│   │   │   │   ├── GoalList.tsx
│   │   │   │   ├── GoalForm.tsx
│   │   │   │   └── GoalProgress.tsx
│   │   │   ├── Social/
│   │   │   │   ├── FriendsList.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   └── ShareWorkout.tsx
│   │   │   ├── Profile/
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── ProfileSettings.tsx
│   │   │   │   └── ProfileStats.tsx
│   │   │   └── Common/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Footer.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── workouts.ts
│   │   │   ├── nutrition.ts
│   │   │   ├── goals.ts
│   │   │   └── social.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWorkouts.ts
│   │   │   ├── useNutrition.ts
│   │   │   └── useGoals.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── workout.ts
│   │   │   ├── nutrition.ts
│   │   │   └── goal.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   └── calculations.ts
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   └── variables.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── workoutController.ts
│   │   │   ├── nutritionController.ts
│   │   │   ├── goalController.ts
│   │   │   └── socialController.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Workout.ts
│   │   │   ├── Exercise.ts
│   │   │   ├── Meal.ts
│   │   │   ├── Goal.ts
│   │   │   └── Activity.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── users.ts
│   │   │   ├── workouts.ts
│   │   │   ├── nutrition.ts
│   │   │   ├── goals.ts
│   │   │   └── social.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts
│   │   │   ├── validation.ts
│   │   │   ├── errorHandler.ts
│   │   │   └── logger.ts
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   ├── bcrypt.ts
│   │   │   └── validators.ts
│   │   ├── config/
│   │   │   ├── database.ts
│   │   │   └── environment.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── shared/
│   └── types/
│       ├── api.ts
│       └── common.ts
│
├── .gitignore
├── README.md
└── docker-compose.yml
`;
    
    console.log(structure);
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Use the AI File Manager Chat to create this structure');
    console.log('2. Type: "Generate a fitness tracker project with React and Express"');
    console.log('3. Or use @ mentions to create specific files');
    console.log('4. Example: "Create @frontend/src/App.tsx for fitness tracker"');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateFitnessTrackerProject();
