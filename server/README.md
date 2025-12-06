# AI Backend Service

This is the backend service for the Kalpa AI Editor. It provides AI-powered code assistance through REST API endpoints.

## Features

- Code explanation
- Code fixing and error correction
- Documentation generation
- Code completion suggestions
- Support for OpenAI, Anthropic Claude, and Google Gemini APIs
- Request timeout handling (10 seconds)
- Comprehensive error handling and logging

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory (use `.env.example` as template):
```bash
cp .env.example .env
```

3. Configure your environment variables in `.env`:
```env
PORT=3001
CORS_ORIGIN=http://localhost:5173

# Choose your AI provider
AI_PROVIDER=openai  # or 'anthropic' or 'gemini'

# Add your API key (choose one or more)
OPENAI_API_KEY=your_openai_api_key_here
# OR
ANTHROPIC_API_KEY=your_anthropic_api_key_here
# OR
GEMINI_API_KEY=your_gemini_api_key_here

AI_REQUEST_TIMEOUT=10000
```

## Running the Server

### Development Mode
```bash
npm run server
```

This will start the server with hot-reloading on port 3001 (or the port specified in `.env`).

### Production Build
```bash
npm run server:build
node server/dist/index.js
```

## API Endpoints

All endpoints are prefixed with `/api/ai`.

### POST /api/ai/explain
Explains what the provided code does.

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript",
  "context": "Optional context about the code",
  "conversationHistory": [
    { "role": "user", "content": "Previous question" },
    { "role": "assistant", "content": "Previous answer" }
  ]
}
```

**Response:**
```json
{
  "result": "This function adds two numbers together and returns the result."
}
```

### POST /api/ai/fix
Analyzes code for errors and suggests fixes.

**Request Body:**
```json
{
  "code": "function add(a, b) { a + b; }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "result": "Fixed code explanation...",
  "suggestions": [
    {
      "newText": "function add(a, b) { return a + b; }",
      "description": "Added return statement"
    }
  ]
}
```

### POST /api/ai/document
Generates documentation for the provided code.

**Request Body:**
```json
{
  "code": "function add(a, b) { return a + b; }",
  "language": "javascript"
}
```

**Response:**
```json
{
  "result": "/**\n * Adds two numbers together\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} Sum of a and b\n */\nfunction add(a, b) { return a + b; }"
}
```

### POST /api/ai/complete
Provides code completion suggestions.

**Request Body:**
```json
{
  "code": "const numbers = [1, 2, 3];\nconst result = ",
  "language": "javascript"
}
```

**Response:**
```json
{
  "result": "Code completion...",
  "suggestions": [
    {
      "newText": "numbers.map(n => n * 2)",
      "description": "Map array to double values"
    }
  ]
}
```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (API key not configured or invalid)
- `408` - Request Timeout (AI request took longer than 10 seconds)
- `500` - Internal Server Error

Error responses follow this format:
```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

## Testing

Run all tests:
```bash
npm test
```

Run only backend tests:
```bash
npm test -- server/tests/
```

Run tests in watch mode:
```bash
npm run test:watch
```

## Architecture

- `server/index.ts` - Main server entry point
- `server/routes/ai.ts` - API route handlers
- `server/services/aiService.ts` - AI service integration with OpenAI/Anthropic
- `server/middleware/` - Express middleware (error handling, logging)
- `server/tests/` - Unit and property-based tests

## Security

- API keys are stored in environment variables
- CORS is configured to only allow requests from the frontend origin
- Input validation on all endpoints
- Request size limits (10MB)
- Comprehensive error logging without exposing sensitive data
