import { TechStack } from '../types/projectGenerator';

export const PREDEFINED_STACKS: TechStack[] = [
  // 1. React + Node.js + Supabase
  {
    id: 'react-node-supabase',
    name: 'React + Node.js + Supabase',
    level: 'intermediate',
    levelNumber: 1,
    frontend: 'React',
    backend: 'Node.js + Express',
    database: 'Supabase',
    benefits: ['Web App + Backend', 'Classic JavaScript stack', 'Simple REST APIs'],
    useCases: ['Web applications', 'REST APIs', 'Full-stack apps'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-react-app react-node-app',
        'cd react-node-app',
        'npm install @supabase/supabase-js'
      ],
      backend: [
        'mkdir node-backend',
        'cd node-backend',
        'npm init -y',
        'npm install express cors dotenv'
      ]
    }
  },
  
  // 2. React + Django REST Framework + Supabase
  {
    id: 'react-django-supabase',
    name: 'React + Django REST Framework + Supabase',
    level: 'intermediate',
    levelNumber: 2,
    frontend: 'React',
    backend: 'Django REST Framework',
    database: 'Supabase',
    benefits: ['Python backend', 'Robust REST APIs', 'Django admin panel'],
    useCases: ['Enterprise apps', 'Data-heavy applications', 'Admin dashboards'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-react-app react-django-app',
        'cd react-django-app',
        'npm install @supabase/supabase-js'
      ],
      backend: [
        'mkdir django-backend',
        'cd django-backend',
        'python -m venv venv',
        'source venv/bin/activate',
        'pip install django djangorestframework',
        'django-admin startproject core .',
        'django-admin startapp api'
      ]
    }
  },
  
  // 3. React + FastAPI + Supabase
  {
    id: 'react-fastapi-supabase',
    name: 'React + FastAPI + Supabase',
    level: 'intermediate',
    levelNumber: 3,
    frontend: 'React',
    backend: 'FastAPI',
    database: 'Supabase',
    benefits: ['Modern Python backend', 'Fast and async', 'Great for AI/ML'],
    useCases: ['AI applications', 'Data processing', 'High-performance APIs'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-react-app react-fastapi-app',
        'cd react-fastapi-app',
        'npm install @supabase/supabase-js'
      ],
      backend: [
        'mkdir fastapi-backend',
        'cd fastapi-backend',
        'python -m venv venv',
        'source venv/bin/activate',
        'pip install fastapi uvicorn',
        'uvicorn main:app --reload'
      ]
    }
  },
  
  // 4. Next.js + Node.js + Supabase
  {
    id: 'nextjs-node-supabase',
    name: 'Next.js + Node.js + Supabase',
    level: 'advanced',
    levelNumber: 4,
    frontend: 'Next.js',
    backend: 'Node.js + Express',
    database: 'Supabase',
    benefits: ['SSR/SSG support', 'SEO-friendly', 'Separate backend'],
    useCases: ['SaaS applications', 'Marketing sites', 'E-commerce'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-next-app@latest next-node-app',
        'cd next-node-app',
        'npm install @supabase/supabase-js'
      ],
      backend: [
        'mkdir node-backend',
        'cd node-backend',
        'npm init -y',
        'npm install express cors dotenv'
      ]
    }
  },
  
  // 5. Next.js + FastAPI + Supabase
  {
    id: 'nextjs-fastapi-supabase',
    name: 'Next.js + FastAPI + Supabase',
    level: 'advanced',
    levelNumber: 5,
    frontend: 'Next.js',
    backend: 'FastAPI',
    database: 'Supabase',
    benefits: ['Python + TypeScript combo', 'Great for AI + automation', 'Modern stack'],
    useCases: ['AI applications', 'Data processing', 'ML-powered apps'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-next-app@latest next-fastapi-app',
        'cd next-fastapi-app',
        'npm install @supabase/supabase-js'
      ],
      backend: [
        'mkdir fastapi-backend',
        'cd fastapi-backend',
        'python -m venv venv',
        'source venv/bin/activate',
        'pip install fastapi uvicorn'
      ]
    }
  },
  
  // 6. React Native + Expo + Supabase
  {
    id: 'expo-supabase',
    name: 'React Native + Expo + Supabase',
    level: 'mobile',
    levelNumber: 6,
    frontend: 'React Native',
    mobile: 'Expo',
    backend: 'Supabase',
    database: 'Supabase',
    benefits: ['Perfect for mobile apps', 'Cross-platform', 'Real-time features'],
    useCases: ['Mobile applications', 'Cross-platform apps', 'Social apps'],
    packageManager: 'npm',
    setupCommands: {
      frontend: [
        'npx create-expo-app rn-supabase-app',
        'cd rn-supabase-app',
        'npm install @supabase/supabase-js'
      ]
    }
  }
];
