import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { getUserProfile, getUserSettings, upsertUserProfile, upsertUserSettings } from '../services/settingsService.js';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const email = req.user?.email;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await getUserProfile(userId, email);
    return res.json({ profile });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch profile' });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const email = req.user?.email;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { full_name, avatar_url } = req.body ?? {};

    if (typeof full_name !== 'string' || full_name.trim().length < 2) {
      return res.status(400).json({ error: 'full_name must be at least 2 characters' });
    }

    if (avatar_url != null && typeof avatar_url !== 'string') {
      return res.status(400).json({ error: 'avatar_url must be a string or null' });
    }

    if (typeof avatar_url === 'string' && avatar_url.length > 2_000_000) {
      return res.status(400).json({ error: 'avatar_url is too large' });
    }

    const profile = await upsertUserProfile(
      userId,
      {
        full_name: full_name.trim(),
        avatar_url: avatar_url ?? null
      },
      email
    );

    return res.json({ profile, message: 'Profile updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
};

export const getSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const settings = await getUserSettings(userId);
    return res.json({ settings });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch settings' });
  }
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const {
      auto_assign,
      visit_reminders,
      daily_digest,
      desktop_notifications,
      compact_sidebar,
      timezone,
      language,
      crm_landing_page
    } = req.body ?? {};

    const boolFields = [
      ['auto_assign', auto_assign],
      ['visit_reminders', visit_reminders],
      ['daily_digest', daily_digest],
      ['desktop_notifications', desktop_notifications],
      ['compact_sidebar', compact_sidebar]
    ] as const;

    for (const [field, value] of boolFields) {
      if (value != null && typeof value !== 'boolean') {
        return res.status(400).json({ error: `${field} must be a boolean` });
      }
    }

    if (timezone != null && (typeof timezone !== 'string' || timezone.trim().length < 2)) {
      return res.status(400).json({ error: 'timezone must be a valid string' });
    }

    if (language != null && (typeof language !== 'string' || language.trim().length < 2)) {
      return res.status(400).json({ error: 'language must be a valid string' });
    }

    const allowedLandingPages = ['/dashboard', '/follow-ups', '/notifications', '/leads'];
    if (crm_landing_page != null && !allowedLandingPages.includes(crm_landing_page)) {
      return res.status(400).json({ error: 'crm_landing_page is invalid' });
    }

    const settings = await upsertUserSettings(userId, {
      auto_assign,
      visit_reminders,
      daily_digest,
      desktop_notifications,
      compact_sidebar,
      timezone: timezone?.trim(),
      language: language?.trim(),
      crm_landing_page
    });

    return res.json({ settings, message: 'Settings updated successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to update settings' });
  }
};
