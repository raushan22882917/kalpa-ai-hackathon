#!/bin/bash

# Fitness Tracker Project Generator
# Creates a complete full-stack fitness tracker application

set -e

echo "🏋️  Fitness Tracker Project Generator"
echo "======================================"
echo ""

# Get project location from user
read -p "📁 Enter project location (default: ~/Desktop/fitness-tracker): " PROJECT_PATH
PROJECT_PATH=${PROJECT_PATH:-~/Desktop/fitness-tracker}

# Expand tilde to home directory
PROJECT_PATH="${PROJECT_PATH/#\~/$HOME}"

echo ""
echo "📍 Project will be created at: $PROJECT_PATH"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🚀 Creating project structure..."

# Create main project directory
mkdir -p "$PROJECT_PATH"
cd "$PROJECT_PATH"

echo "✅ Created main directory"

# Create frontend-web structure
echo "📦 Creating frontend-web..."
mkdir -p frontend-web/src/{components/{Auth,Dashboard,Workouts,Nutrition,Goals,Profile,Common},services,hooks,context,types,utils,styles}
mkdir -p frontend-web/public

echo "✅ Frontend structure created"

# Create backend structure
echo "📦 Creating backend..."
mkdir -p backend/src/{controllers,models,routes,middleware,services,utils,config,types}

echo "✅ Backend structure created"

# Create mobile-app structure
echo "📦 Creating mobile-app..."
mkdir -p mobile-app/src/{screens,components,navigation,services,hooks,types}

echo "✅ Mobile structure created"

echo ""
echo "📝 Generating code files..."
echo ""
