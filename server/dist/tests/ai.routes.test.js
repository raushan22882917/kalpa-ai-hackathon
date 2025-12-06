import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import aiRoutes from '../routes/ai';
import aiService from '../services/aiService';
import { errorHandler } from '../middleware/errorHandler';
// Create a test app
const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.use('/api/ai', aiRoutes);
    app.use(errorHandler);
    return app;
};
describe('AI API Endpoints', () => {
    let app;
    beforeEach(() => {
        app = createTestApp();
        vi.clearAllMocks();
    });
    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('POST /api/ai/explain', () => {
        it('should explain code successfully with valid input', async () => {
            // Mock the AI service
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: 'This function adds two numbers together and returns the result.',
            });
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'function add(a, b) { return a + b; }',
                language: 'javascript',
            });
            expect(response.status).toBe(200);
            expect(response.body.result).toContain('adds two numbers');
            expect(aiService.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                command: 'explain',
                code: 'function add(a, b) { return a + b; }',
                language: 'javascript',
            }));
        });
        it('should return 400 when code is missing', async () => {
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                language: 'javascript',
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Code is required');
        });
        it('should return 400 when language is missing', async () => {
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'function test() {}',
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Language is required');
        });
        it('should handle context and conversation history', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: 'Based on the previous context, this function...',
            });
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'const result = add(5, 3);',
                language: 'javascript',
                context: 'This is part of a calculator application',
                conversationHistory: [
                    { role: 'user', content: 'What does this do?' },
                    { role: 'assistant', content: 'It adds numbers.' },
                ],
            });
            expect(response.status).toBe(200);
            expect(aiService.processRequest).toHaveBeenCalledWith(expect.objectContaining({
                context: 'This is part of a calculator application',
                conversationHistory: expect.any(Array),
            }));
        });
    });
    describe('POST /api/ai/fix', () => {
        it('should fix erroneous code successfully', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: 'Fixed code:\n```javascript\nfunction add(a, b) { return a + b; }\n```\nFixed the missing return statement.',
                suggestions: [
                    {
                        newText: 'function add(a, b) { return a + b; }',
                        description: 'Added return statement',
                    },
                ],
            });
            const response = await request(app)
                .post('/api/ai/fix')
                .send({
                code: 'function add(a, b) { a + b; }',
                language: 'javascript',
            });
            expect(response.status).toBe(200);
            expect(response.body.result).toContain('Fixed code');
            expect(response.body.suggestions).toBeDefined();
            expect(response.body.suggestions.length).toBeGreaterThan(0);
        });
        it('should handle syntax errors in code', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: 'Fixed syntax error: missing closing brace',
                suggestions: [
                    {
                        newText: 'function test() { console.log("hello"); }',
                        description: 'Added closing brace',
                    },
                ],
            });
            const response = await request(app)
                .post('/api/ai/fix')
                .send({
                code: 'function test() { console.log("hello");',
                language: 'javascript',
            });
            expect(response.status).toBe(200);
            expect(response.body.result).toContain('Fixed');
        });
    });
    describe('POST /api/ai/document', () => {
        it('should generate documentation for undocumented code', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: '/**\n * Adds two numbers together\n * @param {number} a - First number\n * @param {number} b - Second number\n * @returns {number} Sum of a and b\n */\nfunction add(a, b) { return a + b; }',
            });
            const response = await request(app)
                .post('/api/ai/document')
                .send({
                code: 'function add(a, b) { return a + b; }',
                language: 'javascript',
            });
            expect(response.status).toBe(200);
            expect(response.body.result).toContain('/**');
            expect(response.body.result).toContain('@param');
            expect(response.body.result).toContain('@returns');
        });
        it('should generate Python docstrings for Python code', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: 'def add(a, b):\n    """\n    Add two numbers together.\n    \n    Args:\n        a: First number\n        b: Second number\n    \n    Returns:\n        Sum of a and b\n    """\n    return a + b',
            });
            const response = await request(app)
                .post('/api/ai/document')
                .send({
                code: 'def add(a, b):\n    return a + b',
                language: 'python',
            });
            expect(response.status).toBe(200);
            expect(response.body.result).toContain('"""');
            expect(response.body.result).toContain('Args:');
        });
    });
    describe('POST /api/ai/complete', () => {
        it('should provide code completion suggestions', async () => {
            vi.spyOn(aiService, 'processRequest').mockResolvedValue({
                result: '```javascript\nconst result = numbers.map(n => n * 2);\n```',
                suggestions: [
                    {
                        newText: 'const result = numbers.map(n => n * 2);',
                        description: 'Map array to double values',
                    },
                ],
            });
            const response = await request(app)
                .post('/api/ai/complete')
                .send({
                code: 'const numbers = [1, 2, 3];\nconst result = ',
                language: 'javascript',
            });
            expect(response.status).toBe(200);
            expect(response.body.suggestions).toBeDefined();
        });
    });
    describe('Error Handling', () => {
        it('should handle AI service timeout errors', async () => {
            vi.spyOn(aiService, 'processRequest').mockRejectedValue({
                statusCode: 408,
                message: 'AI request timed out. Please try again.',
            });
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'function test() {}',
                language: 'javascript',
            });
            expect(response.status).toBe(408);
            expect(response.body.error.message).toContain('timed out');
        });
        it('should handle AI service authentication errors', async () => {
            vi.spyOn(aiService, 'processRequest').mockRejectedValue({
                statusCode: 401,
                message: 'OpenAI API key not configured',
            });
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'function test() {}',
                language: 'javascript',
            });
            expect(response.status).toBe(401);
            expect(response.body.error.message).toContain('API key');
        });
        it('should handle invalid request body types', async () => {
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 123, // Should be string
                language: 'javascript',
            });
            expect(response.status).toBe(400);
            expect(response.body.error.message).toContain('Code is required and must be a string');
        });
        it('should handle generic server errors', async () => {
            vi.spyOn(aiService, 'processRequest').mockRejectedValue(new Error('Unexpected error'));
            const response = await request(app)
                .post('/api/ai/explain')
                .send({
                code: 'function test() {}',
                language: 'javascript',
            });
            expect(response.status).toBe(500);
        });
    });
});
