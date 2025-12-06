import { Router } from 'express';
import aiService from '../services/aiService';
import { createError } from '../middleware/errorHandler';
const router = Router();
/**
 * Validate AI request body
 */
const validateAIRequest = (req, res, next) => {
    const { code, language } = req.body;
    if (!code || typeof code !== 'string') {
        return next(createError('Code is required and must be a string', 400));
    }
    if (!language || typeof language !== 'string') {
        return next(createError('Language is required and must be a string', 400));
    }
    next();
};
/**
 * POST /api/ai/explain
 * Explain what the provided code does
 */
router.post('/explain', validateAIRequest, async (req, res, next) => {
    try {
        const { code, language, context, conversationHistory } = req.body;
        const aiRequest = {
            command: 'explain',
            code,
            language,
            context,
            conversationHistory,
        };
        const response = await aiService.processRequest(aiRequest);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/ai/fix
 * Analyze code for errors and suggest fixes
 */
router.post('/fix', validateAIRequest, async (req, res, next) => {
    try {
        const { code, language, context, conversationHistory } = req.body;
        const aiRequest = {
            command: 'fix',
            code,
            language,
            context,
            conversationHistory,
        };
        const response = await aiService.processRequest(aiRequest);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/ai/document
 * Generate documentation for the provided code
 */
router.post('/document', validateAIRequest, async (req, res, next) => {
    try {
        const { code, language, context, conversationHistory } = req.body;
        const aiRequest = {
            command: 'document',
            code,
            language,
            context,
            conversationHistory,
        };
        const response = await aiService.processRequest(aiRequest);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
/**
 * POST /api/ai/complete
 * Provide code completion suggestions
 */
router.post('/complete', validateAIRequest, async (req, res, next) => {
    try {
        const { code, language, context, conversationHistory } = req.body;
        const aiRequest = {
            command: 'complete',
            code,
            language,
            context,
            conversationHistory,
        };
        const response = await aiService.processRequest(aiRequest);
        res.json(response);
    }
    catch (error) {
        next(error);
    }
});
export default router;
