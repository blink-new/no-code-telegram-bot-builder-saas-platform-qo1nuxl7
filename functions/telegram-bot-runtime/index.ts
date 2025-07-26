import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@blinkdotnew/sdk";

// Initialize Blink client
const blink = createClient({
  projectId: Deno.env.get('BLINK_PROJECT_ID') || 'no-code-telegram-bot-builder-saas-platform-qo1nuxl7',
  authRequired: false
});

// Store active bot instances
const activeBots = new Map<string, any>();

interface TelegramUpdate {
  update_id: number;
  message?: {
    message_id: number;
    from: {
      id: number;
      is_bot: boolean;
      first_name: string;
      username?: string;
    };
    chat: {
      id: number;
      first_name?: string;
      username?: string;
      type: string;
    };
    date: number;
    text?: string;
  };
}

interface FlowNode {
  id: string;
  type: string;
  data: {
    label?: string;
    message?: string;
    command?: string;
    keyword?: string;
    condition?: string;
    delay?: number;
    variable?: string;
    value?: string;
  };
  position: { x: number; y: number };
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

interface FlowData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}

// Telegram Bot API helper functions
async function sendTelegramMessage(botToken: string, chatId: number, text: string, replyMarkup?: any) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      reply_markup: replyMarkup,
      parse_mode: 'HTML'
    }),
  });
  
  return await response.json();
}

async function setTelegramWebhook(botToken: string, webhookUrl: string) {
  const url = `https://api.telegram.org/bot${botToken}/setWebhook`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: webhookUrl,
      allowed_updates: ['message', 'callback_query']
    }),
  });
  
  return await response.json();
}

async function deleteTelegramWebhook(botToken: string) {
  const url = `https://api.telegram.org/bot${botToken}/deleteWebhook`;
  const response = await fetch(url, {
    method: 'POST',
  });
  
  return await response.json();
}

// Flow execution engine
class BotFlowExecutor {
  private flowData: FlowData;
  private botToken: string;
  private botId: string;
  private userId: string;

  constructor(flowData: FlowData, botToken: string, botId: string, userId: string) {
    this.flowData = flowData;
    this.botToken = botToken;
    this.botId = botId;
    this.userId = userId;
  }

  async processMessage(update: TelegramUpdate) {
    if (!update.message) return;

    const message = update.message;
    const chatId = message.chat.id;
    const text = message.text || '';
    const userId = message.from.id;

    console.log(`Processing message: "${text}" from user ${userId} in chat ${chatId}`);

    // Find trigger nodes that match this message
    const triggerNodes = this.flowData.nodes.filter(node => 
      node.type === 'trigger' && this.matchesTrigger(node, text)
    );

    if (triggerNodes.length === 0) {
      // No matching trigger found, send default response
      await sendTelegramMessage(
        this.botToken, 
        chatId, 
        "I didn't understand that. Try typing /start to begin."
      );
      return;
    }

    // Execute the flow starting from the first matching trigger
    for (const triggerNode of triggerNodes) {
      await this.executeFlow(triggerNode, chatId, userId, { text, chatId, userId });
    }

    // Log the interaction
    await this.logInteraction(userId, chatId, text, 'message_received');
  }

  private matchesTrigger(node: FlowNode, text: string): boolean {
    const data = node.data;
    
    if (data.command && text.startsWith('/')) {
      return text.toLowerCase() === data.command.toLowerCase();
    }
    
    if (data.keyword) {
      return text.toLowerCase().includes(data.keyword.toLowerCase());
    }
    
    return false;
  }

  private async executeFlow(node: FlowNode, chatId: number, userId: number, context: any) {
    console.log(`Executing node: ${node.type} - ${node.id}`);

    try {
      switch (node.type) {
        case 'action':
          await this.executeActionNode(node, chatId, context);
          break;
        case 'logic':
          await this.executeLogicNode(node, chatId, userId, context);
          break;
        case 'integration':
          await this.executeIntegrationNode(node, chatId, context);
          break;
      }

      // Find and execute next nodes
      const nextNodes = this.getNextNodes(node.id);
      for (const nextNode of nextNodes) {
        await this.executeFlow(nextNode, chatId, userId, context);
      }
    } catch (error) {
      console.error(`Error executing node ${node.id}:`, error);
      await sendTelegramMessage(
        this.botToken,
        chatId,
        "Sorry, something went wrong. Please try again."
      );
    }
  }

  private async executeActionNode(node: FlowNode, chatId: number, context: any) {
    const data = node.data;
    
    if (data.message) {
      // Send text message
      await sendTelegramMessage(this.botToken, chatId, data.message);
    }
  }

  private async executeLogicNode(node: FlowNode, chatId: number, userId: number, context: any) {
    const data = node.data;
    
    if (data.delay) {
      // Add delay
      await new Promise(resolve => setTimeout(resolve, data.delay * 1000));
    }
    
    if (data.variable && data.value) {
      // Store variable (in a real implementation, you'd store this in a database)
      context[data.variable] = data.value;
    }
  }

  private async executeIntegrationNode(node: FlowNode, chatId: number, context: any) {
    const data = node.data;
    
    // Placeholder for integration logic
    console.log(`Integration node executed: ${data.label}`);
  }

  private getNextNodes(nodeId: string): FlowNode[] {
    const outgoingEdges = this.flowData.edges.filter(edge => edge.source === nodeId);
    return outgoingEdges.map(edge => 
      this.flowData.nodes.find(node => node.id === edge.target)
    ).filter(Boolean) as FlowNode[];
  }

  private async logInteraction(userId: number, chatId: number, message: string, type: string) {
    try {
      await blink.db.bot_logs.create({
        id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        bot_id: this.botId,
        user_id: this.userId,
        telegram_user_id: userId.toString(),
        telegram_chat_id: chatId.toString(),
        message_text: message,
        interaction_type: type,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to log interaction:', error);
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname;

    // Handle webhook requests from Telegram
    if (path.startsWith('/webhook/')) {
      const botId = path.split('/')[2];
      
      if (req.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
      }

      const update: TelegramUpdate = await req.json();
      console.log(`Received webhook for bot ${botId}:`, JSON.stringify(update, null, 2));

      const botInstance = activeBots.get(botId);
      if (!botInstance) {
        console.error(`No active bot found for ID: ${botId}`);
        return new Response('Bot not found', { status: 404 });
      }

      await botInstance.processMessage(update);
      return new Response('OK');
    }

    // Handle deployment/management requests
    if (req.method === 'POST') {
      const body = await req.json();
      const { action, botId, userId, botToken, flowData, botName } = body;

      console.log(`Received ${action} request for bot ${botId}`);

      switch (action) {
        case 'deploy': {
          if (!botToken || !flowData || !botId) {
            return new Response(
              JSON.stringify({ error: 'Missing required fields' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Verify bot token
          const verifyResponse = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
          const verifyData = await verifyResponse.json();
          
          if (!verifyData.ok) {
            return new Response(
              JSON.stringify({ error: 'Invalid bot token' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Create webhook URL
          const webhookUrl = `${url.origin}/webhook/${botId}`;
          
          // Set webhook
          const webhookResult = await setTelegramWebhook(botToken, webhookUrl);
          if (!webhookResult.ok) {
            console.error('Failed to set webhook:', webhookResult);
            return new Response(
              JSON.stringify({ error: 'Failed to set webhook' }),
              { 
                status: 500,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Create bot executor instance
          const executor = new BotFlowExecutor(flowData, botToken, botId, userId);
          activeBots.set(botId, executor);

          // Update deployment status
          await blink.db.bot_deployments.create({
            id: `deploy_${Date.now()}`,
            bot_id: botId,
            user_id: userId,
            status: 'deployed',
            webhook_url: webhookUrl,
            deployed_at: new Date().toISOString()
          });

          console.log(`Bot ${botId} deployed successfully with webhook: ${webhookUrl}`);

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Bot deployed successfully',
              webhookUrl 
            }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }

        case 'stop': {
          if (!botId) {
            return new Response(
              JSON.stringify({ error: 'Bot ID required' }),
              { 
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            );
          }

          // Get bot token from database
          const deployments = await blink.db.bot_deployments.list({
            where: { bot_id: botId, status: 'deployed' },
            limit: 1
          });

          if (deployments.length > 0) {
            // Get bot token to delete webhook
            const tokens = await blink.db.bot_tokens.list({
              where: { user_id: userId },
              limit: 1
            });

            if (tokens.length > 0) {
              await deleteTelegramWebhook(tokens[0].token);
            }

            // Update deployment status
            await blink.db.bot_deployments.update(deployments[0].id, {
              status: 'stopped',
              stopped_at: new Date().toISOString()
            });
          }

          // Remove from active bots
          activeBots.delete(botId);

          console.log(`Bot ${botId} stopped successfully`);

          return new Response(
            JSON.stringify({ 
              success: true, 
              message: 'Bot stopped successfully' 
            }),
            { 
              status: 200,
              headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
              }
            }
          );
        }

        default:
          return new Response(
            JSON.stringify({ error: 'Unknown action' }),
            { 
              status: 400,
              headers: { 'Content-Type': 'application/json' }
            }
          );
      }
    }

    return new Response('Not found', { status: 404 });

  } catch (error) {
    console.error('Error in telegram-bot-runtime:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
});