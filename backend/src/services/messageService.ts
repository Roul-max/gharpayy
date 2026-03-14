import { supabase } from '../config/supabase.js';
import { emitRealtime } from '../realtime/socket.js';

export const messageService = {
  async getConversationByLead(leadId: string) {
    const { data: conversation, error: conversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (conversationError) throw conversationError;
    if (!conversation) return [];

    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('id, message, channel, sender_id, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true });

    if (messagesError) throw messagesError;
    return messages ?? [];
  },

  async sendMessageToLead(leadId: string, userId: string, message: string, channel: string) {
    // 1. Get or create conversation
    let { data: conversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('lead_id', leadId)
      .maybeSingle();

    if (!conversation) {
      const { data: newConv, error: convError } = await supabase
        .from('conversations')
        .insert([{ lead_id: leadId, agent_id: userId }])
        .select('id')
        .single();
      
      if (convError) throw convError;
      conversation = newConv;
    }

    if (!conversation) {
      throw new Error('Unable to create conversation');
    }

    // 2. Insert message
    const { data: newMessage, error: msgError } = await supabase
      .from('messages')
      .insert([{
        conversation_id: conversation.id,
        sender_id: userId,
        message,
        channel: channel || 'internal'
      }])
      .select()
      .single();

    if (msgError) throw msgError;

    // 3. Update first_response_at if not set
    const { data: lead } = await supabase
      .from('leads')
      .select('first_response_at')
      .eq('id', leadId)
      .single();

    if (lead && !lead.first_response_at) {
      await supabase
        .from('leads')
        .update({ first_response_at: new Date().toISOString() })
        .eq('id', leadId);
    }

    emitRealtime('message.sent', { lead_id: leadId, message_id: newMessage.id, channel: newMessage.channel });
    return newMessage;
  }
};
