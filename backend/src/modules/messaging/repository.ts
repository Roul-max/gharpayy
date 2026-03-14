import { supabase } from '../../config/supabase.js';

export const messagingRepository = {
  listByConversation(conversationId: string) {
    return supabase.from('messages').select('*').eq('conversation_id', conversationId);
  }
};
