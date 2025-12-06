# Complete Fitness Tracker Project - AI Prompt

Copy and paste this prompt into the AI File Manager Chat to generate the entire project:

---

## PROMPT:

```
Create a complete full-stack fitness tracker application with both web and mobile versions.

PROJECT NAME: FitTrack Pro

TECH STACK:
- Frontend Web: React + TypeScript + Vite + TailwindCSS
- Mobile App: React Native + TypeScript + Expo
- Backend: Node.js + Express + TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt
- API: RESTful

FEATURES:
1. User Authentication (Register, Login, Password Reset)
2. Workout Tracking (Create, Log, View workouts)
3. Exercise Library (Pre-defined exercises with instructions)
4. Nutrition Logging (Meals, Calories, Macros)
5. Progress Tracking (Weight, Body measurements, Photos)
6. Goal Setting (Weight goals, Workout goals)
7. Dashboard (Statistics, Charts, Recent activity)
8. Social Features (Friends, Share workouts)
9. Profile Management (Settings, Preferences)
10. Dark Mode Support

CREATE THE FOLLOWING STRUCTURE:

fitness-tracker/
├── frontend-web/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ProtectedRoute.tsx
│   │   │   ├── Dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── StatsCard.tsx
│   │   │   │   ├── ProgressChart.tsx
│   │   │   │   └── RecentActivity.tsx
│   │   │   ├── Workouts/
│   │   │   │   ├── WorkoutList.tsx
│   │   │   │   ├── WorkoutForm.tsx
│   │   │   │   ├── WorkoutDetail.tsx
│   │   │   │   ├── ExerciseCard.tsx
│   │   │   │   └── ExerciseLibrary.tsx
│   │   │   ├── Nutrition/
│   │   │   │   ├── MealLog.tsx
│   │   │   │   ├── FoodSearch.tsx
│   │   │   │   ├── MacroTracker.tsx
│   │   │   │   ├── CalorieCounter.tsx
│   │   │   │   └── NutritionDashboard.tsx
│   │   │   ├── Progress/
│   │   │   │   ├── ProgressTracker.tsx
│   │   │   │   ├── WeightChart.tsx
│   │   │   │   ├── MeasurementLog.tsx
│   │   │   │   └── PhotoGallery.tsx
│   │   │   ├── Goals/
│   │   │   │   ├── GoalList.tsx
│   │   │   │   ├── GoalForm.tsx
│   │   │   │   ├── GoalProgress.tsx
│   │   │   │   └── GoalCard.tsx
│   │   │   ├── Social/
│   │   │   │   ├── FriendsList.tsx
│   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   ├── ShareWorkout.tsx
│   │   │   │   └── UserSearch.tsx
│   │   │   ├── Profile/
│   │   │   │   ├── UserProfile.tsx
│   │   │   │   ├── ProfileSettings.tsx
│   │   │   │   ├── ProfileStats.tsx
│   │   │   │   └── AccountSettings.tsx
│   │   │   └── Common/
│   │   │       ├── Header.tsx
│   │   │       ├── Sidebar.tsx
│   │   │       ├── Footer.tsx
│   │   │       ├── LoadingSpinner.tsx
│   │   │       ├── ErrorBoundary.tsx
│   │   │       └── Modal.tsx
│   │   ├── services/
│   │   │   ├── api.ts
│   │   │   ├── auth.ts
│   │   │   ├── workouts.ts
│   │   │   ├── nutrition.ts
│   │   │   ├── progress.ts
│   │   │   ├── goals.ts
│   │   │   └── social.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useWorkouts.ts
│   │   │   ├── useNutrition.ts
│   │   │   ├── useProgress.ts
│   │   │   ├── useGoals.ts
│   │   │   └── useTheme.ts
│   │   ├── context/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── ThemeContext.tsx
│   │   │   └── AppContext.tsx
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── workout.ts
│   │   │   ├── exercise.ts
│   │   │   ├── nutrition.ts
│   │   │   ├── progress.ts
│   │   │   └── goal.ts
│   │   ├── utils/
│   │   │   ├── validation.ts
│   │   │   ├── formatting.ts
│   │   │   ├── calculations.ts
│   │   │   ├── dateHelpers.ts
│   │   │   └── constants.ts
│   │   ├── styles/
│   │   │   ├── global.css
│   │   │   ├── variables.css
│   │   │   └── tailwind.css
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example

Generate all files with complete, production-ready code including:
- Full TypeScript interfaces and types
- Complete component implementations with state management
- API service functions with error handling
- Custom hooks with proper dependencies
- Context providers with full functionality
- Utility functions for calculations and formatting
- Responsive CSS with Tailwind classes
- Form validation and error messages
- Loading states and error boundaries
```

---

## HOW TO USE:

1. Open your IDE
2. Click the 💬 Chat icon in the Activity Bar
3. Paste the prompt above
4. Wait for AI to generate all files
5. Review and customize as needed

## WHAT YOU'LL GET:

✅ Complete React web application
✅ Full TypeScript type definitions
✅ All components with proper structure
✅ API services with error handling
✅ Custom hooks for state management
✅ Context providers for global state
✅ Utility functions and helpers
✅ Responsive styling with Tailwind
✅ Form validation
✅ Loading and error states

## NEXT STEPS AFTER GENERATION:

1. Install dependencies:
   ```bash
   cd fitness-tracker/frontend-web
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

---

**Note:** This prompt generates the frontend web application. For backend and mobile app, use the additional prompts below.
