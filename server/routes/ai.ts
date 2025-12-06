import { Router, Request, Response, NextFunction } from 'express';
import aiService from '../services/aiService';
import { createError } from '../middleware/errorHandler';
import type { AIRequest } from '../services/aiService';

const router = Router();

/**
 * Validate AI request body
 */
const validateAIRequest = (req: Request, res: Response, next: NextFunction) => {
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
router.post('/explain', validateAIRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context, conversationHistory } = req.body;

    const aiRequest: AIRequest = {
      command: 'explain',
      code,
      language,
      context,
      conversationHistory,
    };

    const response = await aiService.processRequest(aiRequest);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/fix
 * Analyze code for errors and suggest fixes
 */
router.post('/fix', validateAIRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context, conversationHistory } = req.body;

    const aiRequest: AIRequest = {
      command: 'fix',
      code,
      language,
      context,
      conversationHistory,
    };

    const response = await aiService.processRequest(aiRequest);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/document
 * Generate documentation for the provided code
 */
router.post('/document', validateAIRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context, conversationHistory } = req.body;

    const aiRequest: AIRequest = {
      command: 'document',
      code,
      language,
      context,
      conversationHistory,
    };

    const response = await aiService.processRequest(aiRequest);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/complete
 * Provide code completion suggestions
 */
router.post('/complete', validateAIRequest, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context, conversationHistory, provider } = req.body;

    const aiRequest: AIRequest = {
      command: 'complete',
      code,
      language,
      context,
      conversationHistory,
      provider,
    };

    const response = await aiService.processRequest(aiRequest);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/ai/providers
 * Get list of available AI providers and their models
 */
router.get('/providers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = aiService.getAvailableProviders();
    res.json({
      providers,
      default: process.env.AI_PROVIDER || 'openai'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/ai/chat
 * General chat endpoint with provider selection
 */
router.post('/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code, language, context, conversationHistory, provider, command } = req.body;

    if (!code || !language) {
      return next(createError('Code and language are required', 400));
    }

    const aiRequest: AIRequest = {
      command: command || 'explain',
      code,
      language,
      context,
      conversationHistory,
      provider,
    };

    const response = await aiService.processRequest(aiRequest);
    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;
