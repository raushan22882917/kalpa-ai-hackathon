# Available Technology Stacks

This document lists all available technology stacks in the AI Project Generator.

## 1. React + Node.js + Supabase
**Level:** Intermediate (Level 1)

### Stack Components
- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** Supabase

### Benefits
- Web App + Backend
- Classic JavaScript stack
- Simple REST APIs

### Best For
- Web applications
- REST APIs
- Full-stack apps

### Setup Commands

**Frontend:**
```bash
npx create-react-app react-node-app
cd react-node-app
npm install @supabase/supabase-js
```

**Backend:**
```bash
mkdir node-backend
cd node-backend
npm init -y
npm install express cors dotenv
```

---

## 2. React + Django REST Framework + Supabase
**Level:** Intermediate (Level 2)

### Stack Components
- **Frontend:** React
- **Backend:** Django REST Framework
- **Database:** Supabase

### Benefits
- Python backend
- Robust REST APIs
- Django admin panel

### Best For
- Enterprise apps
- Data-heavy applications
- Admin dashboards

### Setup Commands

**Frontend:**
```bash
npx create-react-app react-django-app
cd react-django-app
npm install @supabase/supabase-js
```

**Backend:**
```bash
mkdir django-backend
cd django-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install django djangorestframework
django-admin startproject core .
django-admin startapp api
```

---

## 3. React + FastAPI + Supabase
**Level:** Intermediate (Level 3)

### Stack Components
- **Frontend:** React
- **Backend:** FastAPI
- **Database:** Supabase

### Benefits
- Modern Python backend
- Fast and async
- Great for AI/ML

### Best For
- AI applications
- Data processing
- High-performance APIs

### Setup Commands

**Frontend:**
```bash
npx create-react-app react-fastapi-app
cd react-fastapi-app
npm install @supabase/supabase-js
```

**Backend:**
```bash
mkdir fastapi-backend
cd fastapi-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn
uvicorn main:app --reload
```

---

## 4. Next.js + Node.js + Supabase
**Level:** Advanced (Level 4)

### Stack Components
- **Frontend:** Next.js
- **Backend:** Node.js + Express
- **Database:** Supabase

### Benefits
- SSR/SSG support
- SEO-friendly
- Separate backend

### Best For
- SaaS applications
- Marketing sites
- E-commerce

### Setup Commands

**Frontend:**
```bash
npx create-next-app@latest next-node-app
cd next-node-app
npm install @supabase/supabase-js
```

**Backend:**
```bash
mkdir node-backend
cd node-backend
npm init -y
npm install express cors dotenv
```

---

## 5. Next.js + FastAPI + Supabase
**Level:** Advanced (Level 5)

### Stack Components
- **Frontend:** Next.js
- **Backend:** FastAPI
- **Database:** Supabase

### Benefits
- Python + TypeScript combo
- Great for AI + automation
- Modern stack

### Best For
- AI applications
- Data processing
- ML-powered apps

### Setup Commands

**Frontend:**
```bash
npx create-next-app@latest next-fastapi-app
cd next-fastapi-app
npm install @supabase/supabase-js
```

**Backend:**
```bash
mkdir fastapi-backend
cd fastapi-backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn
```

---

## 6. React Native + Expo + Supabase
**Level:** Mobile (Level 6)

### Stack Components
- **Frontend:** React Native
- **Mobile:** Expo
- **Backend:** Supabase
- **Database:** Supabase

### Benefits
- Perfect for mobile apps
- Cross-platform
- Real-time features

### Best For
- Mobile applications
- Cross-platform apps
- Social apps

### Setup Commands

**Frontend:**
```bash
npx create-expo-app rn-supabase-app
cd rn-supabase-app
npm install @supabase/supabase-js
```

---

## Quick Reference

| Stack | Frontend | Backend | Database | Level | Best For |
|-------|----------|---------|----------|-------|----------|
| React + Node.js + Supabase | React | Node.js + Express | Supabase | Intermediate | Web apps, REST APIs |
| React + Django + Supabase | React | Django REST | Supabase | Intermediate | Enterprise apps |
| React + FastAPI + Supabase | React | FastAPI | Supabase | Intermediate | AI/ML apps |
| Next.js + Node.js + Supabase | Next.js | Node.js + Express | Supabase | Advanced | SaaS, E-commerce |
| Next.js + FastAPI + Supabase | Next.js | FastAPI | Supabase | Advanced | AI-powered apps |
| React Native + Expo + Supabase | React Native | Supabase | Supabase | Mobile | Mobile apps |

---

## Notes

- All stacks use **Supabase** as the database for consistency and ease of use
- **npm** is the default package manager for all JavaScript/TypeScript projects
- Python projects use **pip** for package management
- All stacks support real-time features through Supabase
- Authentication and storage are built-in with Supabase

## Getting Started

To use any of these stacks in the AI Project Generator:

1. Open the Project Generator panel
2. Select "New Project"
3. Choose your desired tech stack
4. Follow the AI-guided setup process
5. The AI will generate the complete project structure with all necessary files

## Support

For questions or issues with any tech stack, please refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [React Documentation](https://react.dev)
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com)
- [Django Documentation](https://docs.djangoproject.com)
- [Expo Documentation](https://docs.expo.dev)
