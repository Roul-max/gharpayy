import express from 'express';
import { Router } from 'express';
import leadsRouter from './leads.js';
import matchingRouter from './matching.js';
import analyticsRouter from './analytics.js';
import messagesRouter from './messages.js';
import operationsRouter from './operations.js';
import publicRouter from './public.js';
import settingsRouter from './settings.js';
import authRouter from './auth.js';
import paymentsRouter from '../modules/payments/routes.js';
import storageRouter from '../modules/storage/routes.js';
import { aiAssistantService } from '../services/aiAssistantService.js';

const router = Router();

// Leads
router.use('/leads', leadsRouter);

// Matching
router.use('/matching', matchingRouter);

// Analytics
router.use('/analytics', analyticsRouter);

// Messages
router.use('/messages', messagesRouter);

// Public lead/visit/chat endpoints (no auth)
router.use('/public', publicRouter);

router.get('/health/ai', async (_req, res) => {
  const groqKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL ?? 'llama-3.1-70b-versatile';
  const baseURL = process.env.GROQ_BASE_URL ?? 'https://api.groq.com/openai/v1';
  const maskKey = (value?: string) => {
    if (!value) return null;
    if (value.length <= 8) return `${value.slice(0, 2)}***${value.slice(-2)}`;
    return `${value.slice(0, 4)}***${value.slice(-4)}`;
  };
  try {
    const response = await aiAssistantService.reply({ message: 'ping' });
    res.json({
      status: response?.source === 'groq' ? 'ok' : 'degraded',
      source: response?.source ?? 'fallback',
      provider: 'groq',
      model,
      base_url: baseURL,
      has_api_key: Boolean(groqKey),
      key_source: groqKey ? 'GROQ_API_KEY' : 'none',
      key_preview: maskKey(groqKey)
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'down',
      error: error?.message ?? 'AI health check failed',
      provider: 'groq',
      model,
      base_url: baseURL,
      has_api_key: Boolean(groqKey),
      key_source: groqKey ? 'GROQ_API_KEY' : 'none',
      key_preview: maskKey(groqKey)
    });
  }
});

// Current user session data
router.use('/auth', authRouter);
router.use('/payments', paymentsRouter);
router.use('/storage', storageRouter);

// Operational CRM APIs (auth + RBAC)
router.use('/', operationsRouter);

// User settings/profile APIs
router.use('/settings', settingsRouter);

export default router;
