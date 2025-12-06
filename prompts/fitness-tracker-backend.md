# Fitness Tracker Backend - AI Prompt

## PROMPT FOR BACKEND:

```
Create a complete Node.js + Express + TypeScript backend for the FitTrack Pro fitness tracker application.

TECH STACK:
- Runtime: Node.js
- Framework: Express + TypeScript
- Database: MongoDB + Mongoose
- Authentication: JWT + bcrypt
- Validation: express-validator
- File Upload: multer
- Email: nodemailer
- Logging: winston

CREATE BACKEND STRUCTURE:

backend/
├── src/
│   ├── controllers/
│   │   ├── authController.ts
│   │   ├── userController.ts
│   │   ├── workoutController.ts
│   │   ├── exerciseController.ts
│   │   ├── nutritionController.ts
│   │   ├── progressController.ts
│   │   ├── goalController.ts
│   │   └── socialController.ts
│   ├── models/
│   │   ├── User.ts
│   │   ├── Workout.ts
│   │   ├── Exercise.ts
│   │   ├── Meal.ts
│   │   ├── Progress.ts
│   │   ├── Goal.ts
│   │   └── Activity.ts
│   ├── routes/
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   ├── workouts.ts
│   │   ├── exercises.ts
│   │   ├── nutrition.ts
│   │   ├── progress.ts
│   │   ├── goals.ts
│   │   └── social.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── validation.ts
│   │   ├── errorHandler.ts
│   │   ├── logger.ts
│   │   └── upload.ts
│   ├── services/
│   │   ├── authService.ts
│   │   ├── emailService.ts
│   │   ├── notificationService.ts
│   │   └── storageService.ts
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── validators.ts
│   │   └── helpers.ts
│   ├── config/
│   │   ├── database.ts
│   │   ├── environment.ts
│   │   └── constants.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env.example

GENERATE WITH:
- Complete Mongoose schemas with validation
- RESTful API endpoints with proper HTTP methods
- JWT authentication middleware
- Password hashing with bcrypt
- Input validation with express-validator
- Error handling middleware
- File upload handling for progress photos
- Email service for notifications
- Logging with winston
- Environment configuration
- TypeScript types and interfaces
- API documentation comments
```
