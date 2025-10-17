/**
 * Custom AI Agent Builder Service
 * 
 * Allows users to create, configure, and deploy custom AI-powered financial agents
 * 
 * Features:
 * - Visual agent builder
 * - Custom triggers and actions
 * - AI-powered decision making
 * - Natural language rule definition
 * - Agent marketplace
 * - Template library
 */

import { geminiService } from './gemini';

// ==================== TYPES ====================

export interface CustomAgent {
  id: string;
  userId: string;
  name: string;
  description: string;
  icon: string;
  category: 'savings' | 'investment' | 'spending' | 'tax' | 'debt' | 'custom';
  status: 'draft' | 'active' | 'paused' | 'archived';
  
  // Agent Configuration
  config: {
    aiModel: 'gemini' | 'custom';
    temperature: number; // AI creativity (0-1)
    maxTokens: number;
    persona: string; // AI agent personality
    systemPrompt: string; // Base instructions for AI
  };
  
  // Triggers - When the agent should activate
  triggers: AgentTrigger[];
  
  // Conditions - Rules to evaluate
  conditions: AgentCondition[];
  
  // Actions - What the agent does
  actions: AgentAction[];
  
  // Learning & Memory
  memory: {
    enabled: boolean;
    contextWindow: number; // Number of past events to remember
    learningRate: number; // How quickly agent adapts
  };
  
  // Execution Stats
  stats: {
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    averageExecutionTime: number;
    lastExecuted?: Date;
    totalImpact: number; // Money saved/earned
  };
  
  // Permissions & Safety
  permissions: {
    canTransferMoney: boolean;
    maxTransactionAmount: number;
    requiresConfirmation: boolean;
    confirmationThreshold: number;
    allowedAccounts: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date; // When the agent last ran
  publishedToMarketplace: boolean;
}

export interface AgentTrigger {
  id: string;
  type: 'time' | 'event' | 'threshold' | 'pattern' | 'ai_detected';
  
  // Time-based triggers
  schedule?: {
    type: 'daily' | 'weekly' | 'monthly' | 'cron';
    value: string; // e.g., "09:00" or "0 9 * * *"
  };
  
  // Event-based triggers
  event?: {
    type: 'transaction' | 'account_update' | 'market_change' | 'goal_milestone' | 'custom';
    filters: Record<string, any>;
  };
  
  // Threshold-based triggers
  threshold?: {
    metric: 'balance' | 'spending' | 'income' | 'savings_rate' | 'custom';
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=';
    value: number;
  };
  
  // AI-detected patterns
  aiPattern?: {
    description: string; // Natural language pattern description
    confidence: number; // Minimum confidence to trigger (0-1)
  };
  
  enabled: boolean;
}

export interface AgentCondition {
  id: string;
  type: 'simple' | 'compound' | 'ai_evaluated';
  
  // Simple condition
  simple?: {
    field: string; // e.g., "account.balance", "transaction.amount"
    operator: '>' | '<' | '>=' | '<=' | '==' | '!=' | 'contains' | 'matches';
    value: any;
  };
  
  // Compound condition (AND/OR logic)
  compound?: {
    operator: 'AND' | 'OR' | 'NOT';
    conditions: AgentCondition[];
  };
  
  // AI-evaluated condition
  aiEvaluation?: {
    prompt: string; // Natural language condition
    expectedOutput: 'true' | 'false' | 'yes' | 'no';
  };
}

export interface AgentAction {
  id: string;
  type: 'transfer' | 'notify' | 'analyze' | 'recommend' | 'execute' | 'ai_decision';
  priority: number; // Execution order
  
  // Transfer action
  transfer?: {
    fromAccount: string;
    toAccount: string;
    amountType: 'fixed' | 'percentage' | 'calculated' | 'ai_determined';
    amount?: number;
    percentage?: number;
    calculation?: string; // JavaScript expression
    memo: string;
  };
  
  // Notification action
  notify?: {
    channels: ('email' | 'push' | 'sms' | 'in_app')[];
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
  
  // Analysis action
  analyze?: {
    dataSource: string;
    analysisType: 'pattern' | 'anomaly' | 'forecast' | 'optimization';
    outputDestination: string;
  };
  
  // Recommendation action
  recommend?: {
    category: string;
    generateUsing: 'rules' | 'ai' | 'hybrid';
    presentTo: 'user' | 'dashboard' | 'email';
  };
  
  // AI decision action (let AI decide what to do)
  aiDecision?: {
    context: string; // What information to give AI
    allowedActions: string[]; // What AI can choose to do
    safetyConstraints: string[]; // What AI must not do
  };
  
  // Retry logic
  retry?: {
    enabled: boolean;
    maxAttempts: number;
    backoffSeconds: number;
  };
  
  enabled: boolean;
}

export interface AgentExecution {
  id: string;
  agentId: string;
  userId: string;
  triggeredBy: {
    triggerType: string;
    triggerId: string;
    timestamp: Date;
    data: any;
  };
  conditionsEvaluated: {
    conditionId: string;
    result: boolean;
    reason: string;
  }[];
  actionsExecuted: {
    actionId: string;
    status: 'success' | 'failed' | 'skipped';
    result: any;
    error?: string;
    timestamp: Date;
  }[];
  status: 'success' | 'partial_success' | 'failed';
  executionTime: number; // milliseconds
  impact: number; // Financial impact
  aiInteractions: {
    prompt: string;
    response: string;
    timestamp: Date;
  }[];
  createdAt: Date;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedImpact: string;
  usageCount: number;
  rating: number;
  author: string;
  template: Partial<CustomAgent>;
  examples: string[];
  tags: string[];
}

// ==================== CUSTOM AGENT BUILDER SERVICE ====================

export class CustomAgentBuilderService {
  /**
   * Create a new custom agent from scratch
   */
  async createAgent(userId: string, config: Partial<CustomAgent>): Promise<CustomAgent> {
    const agent: CustomAgent = {
      id: `AGENT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      name: config.name || 'Unnamed Agent',
      description: config.description || '',
      icon: config.icon || '🤖',
      category: config.category || 'custom',
      status: 'draft',
      
      config: {
        aiModel: 'gemini',
        temperature: 0.7,
        maxTokens: 1024,
        persona: 'Professional Financial Advisor',
        systemPrompt: this.generateDefaultSystemPrompt(config.category || 'custom'),
        ...config.config,
      },
      
      triggers: config.triggers || [],
      conditions: config.conditions || [],
      actions: config.actions || [],
      
      memory: {
        enabled: true,
        contextWindow: 10,
        learningRate: 0.1,
        ...config.memory,
      },
      
      stats: {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        totalImpact: 0,
      },
      
      permissions: {
        canTransferMoney: false,
        maxTransactionAmount: 0,
        requiresConfirmation: true,
        confirmationThreshold: 1000,
        allowedAccounts: [],
        ...config.permissions,
      },
      
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: new Date(),
      publishedToMarketplace: false,
    };

    // Save to storage
    await this.saveAgent(agent);

    console.log(`✅ Created custom agent: ${agent.name} (${agent.id})`);
    return agent;
  }

  /**
   * Create agent from natural language description
   */
  async createAgentFromNaturalLanguage(
    userId: string,
    description: string
  ): Promise<CustomAgent> {
    try {
      console.log('🤖 Creating agent from description:', description);

      // Use AI to parse the description and generate agent config
      const prompt = `
You are an AI agent builder. Parse this user request and create a financial agent configuration:

User Request: "${description}"

Generate a JSON configuration with:
1. name: short name for the agent
2. description: detailed description
3. category: savings|investment|spending|tax|debt|custom
4. triggers: array of trigger configurations
5. conditions: array of condition configurations
6. actions: array of action configurations
7. systemPrompt: instructions for the AI agent

Example output:
{
  "name": "Smart Saver",
  "description": "Automatically saves 10% of income",
  "category": "savings",
  "triggers": [{"type": "event", "event": {"type": "transaction", "filters": {"category": "income"}}}],
  "conditions": [{"type": "simple", "simple": {"field": "transaction.amount", "operator": ">", "value": 5000}}],
  "actions": [{"type": "transfer", "transfer": {"amountType": "percentage", "percentage": 10}}],
  "systemPrompt": "You are a savings assistant..."
}

Now generate for: "${description}"
`;

      const response = await geminiService.chat(prompt, { category: 'agent_builder' });
      
      // Parse AI response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse agent configuration from AI response');
      }

      const parsedConfig = JSON.parse(jsonMatch[0]);

      // Create agent with AI-generated config
      return await this.createAgent(userId, parsedConfig);

    } catch (error) {
      console.error('Error creating agent from NL:', error);
      
      // Fallback: create basic agent
      return await this.createAgent(userId, {
        name: 'Custom Agent',
        description,
        category: 'custom',
      });
    }
  }

  /**
   * Execute an agent (triggered by some event)
   */
  async executeAgent(
    agentId: string,
    triggerData: any
  ): Promise<AgentExecution> {
    const startTime = Date.now();
    
    const agent = await this.getAgent(agentId);
    if (!agent) {
      throw new Error('Agent not found');
    }

    if (agent.status !== 'active') {
      throw new Error('Agent is not active');
    }

    console.log(`🚀 Executing agent: ${agent.name}`);

    const execution: AgentExecution = {
      id: `EXEC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agent.id,
      userId: agent.userId,
      triggeredBy: {
        triggerType: triggerData.type || 'manual',
        triggerId: triggerData.id || 'manual',
        timestamp: new Date(),
        data: triggerData,
      },
      conditionsEvaluated: [],
      actionsExecuted: [],
      status: 'success',
      executionTime: 0,
      impact: 0,
      aiInteractions: [],
      createdAt: new Date(),
    };

    try {
      // Step 1: Evaluate all conditions
      console.log('📋 Evaluating conditions...');
      const conditionResults = await this.evaluateConditions(
        agent.conditions,
        triggerData,
        agent,
        execution
      );

      execution.conditionsEvaluated = conditionResults;

      // Check if all conditions passed
      const allConditionsPassed = conditionResults.every(c => c.result);

      if (!allConditionsPassed) {
        console.log('❌ Conditions not met, skipping actions');
        execution.status = 'failed';
        await this.saveExecution(execution);
        return execution;
      }

      // Step 2: Execute actions
      console.log('⚡ Executing actions...');
      const actionResults = await this.executeActions(
        agent.actions,
        triggerData,
        agent,
        execution
      );

      execution.actionsExecuted = actionResults;

      // Determine overall status
      const successfulActions = actionResults.filter(a => a.status === 'success').length;
      const failedActions = actionResults.filter(a => a.status === 'failed').length;

      if (failedActions === 0) {
        execution.status = 'success';
      } else if (successfulActions > 0) {
        execution.status = 'partial_success';
      } else {
        execution.status = 'failed';
      }

      // Calculate impact
      execution.impact = this.calculateImpact(actionResults);

      // Update agent stats
      await this.updateAgentStats(agent, execution);

    } catch (error: any) {
      console.error('Error executing agent:', error);
      execution.status = 'failed';
      execution.actionsExecuted.push({
        actionId: 'error',
        status: 'failed',
        result: null,
        error: error.message,
        timestamp: new Date(),
      });
    }

    execution.executionTime = Date.now() - startTime;

    // Save execution log
    await this.saveExecution(execution);

    console.log(`✅ Agent execution complete: ${execution.status} (${execution.executionTime}ms)`);

    return execution;
  }

  /**
   * Evaluate agent conditions
   */
  private async evaluateConditions(
    conditions: AgentCondition[],
    triggerData: any,
    agent: CustomAgent,
    execution: AgentExecution
  ): Promise<Array<{ conditionId: string; result: boolean; reason: string }>> {
    const results: Array<{ conditionId: string; result: boolean; reason: string }> = [];

    for (const condition of conditions) {
      try {
        let result = false;
        let reason = '';

        if (condition.type === 'simple' && condition.simple) {
          // Evaluate simple condition
          const value = this.getFieldValue(triggerData, condition.simple.field);
          result = this.evaluateOperator(value, condition.simple.operator, condition.simple.value);
          reason = `${condition.simple.field} ${condition.simple.operator} ${condition.simple.value} => ${result}`;
        } 
        else if (condition.type === 'compound' && condition.compound) {
          // Evaluate compound condition (recursive)
          const subResults = await this.evaluateConditions(
            condition.compound.conditions,
            triggerData,
            agent,
            execution
          );

          if (condition.compound.operator === 'AND') {
            result = subResults.every(r => r.result);
          } else if (condition.compound.operator === 'OR') {
            result = subResults.some(r => r.result);
          } else if (condition.compound.operator === 'NOT') {
            result = !subResults[0]?.result;
          }

          reason = `${condition.compound.operator}(${subResults.map(r => r.result).join(', ')}) => ${result}`;
        }
        else if (condition.type === 'ai_evaluated' && condition.aiEvaluation) {
          // Let AI evaluate the condition
          const aiPrompt = `
${agent.config.systemPrompt}

Evaluate this condition:
${condition.aiEvaluation.prompt}

Context:
${JSON.stringify(triggerData, null, 2)}

Respond with ONLY "${condition.aiEvaluation.expectedOutput}" or "false".
`;

          const aiResponse = await geminiService.chat(aiPrompt, { agentId: agent.id });
          
          execution.aiInteractions.push({
            prompt: aiPrompt,
            response: aiResponse,
            timestamp: new Date(),
          });

          result = aiResponse.toLowerCase().includes(condition.aiEvaluation.expectedOutput.toLowerCase());
          reason = `AI evaluated: ${aiResponse}`;
        }

        results.push({
          conditionId: condition.id,
          result,
          reason,
        });

      } catch (error: any) {
        console.error(`Error evaluating condition ${condition.id}:`, error);
        results.push({
          conditionId: condition.id,
          result: false,
          reason: `Error: ${error.message}`,
        });
      }
    }

    return results;
  }

  /**
   * Execute agent actions
   */
  private async executeActions(
    actions: AgentAction[],
    triggerData: any,
    agent: CustomAgent,
    execution: AgentExecution
  ): Promise<Array<{ actionId: string; status: 'success' | 'failed' | 'skipped'; result: any; error?: string; timestamp: Date }>> {
    const results: Array<{ actionId: string; status: 'success' | 'failed' | 'skipped'; result: any; error?: string; timestamp: Date }> = [];

    // Sort by priority
    const sortedActions = [...actions].sort((a, b) => a.priority - b.priority);

    for (const action of sortedActions) {
      if (!action.enabled) {
        results.push({
          actionId: action.id,
          status: 'skipped',
          result: null,
          timestamp: new Date(),
        });
        continue;
      }

      try {
        let result: any = null;

        if (action.type === 'notify' && action.notify) {
          // Send notification
          result = await this.sendNotification(action.notify, agent);
        }
        else if (action.type === 'transfer' && action.transfer) {
          // Execute transfer (with safety checks)
          result = await this.executeTransfer(action.transfer, agent, triggerData);
        }
        else if (action.type === 'ai_decision' && action.aiDecision) {
          // Let AI decide what to do
          result = await this.executeAIDecision(action.aiDecision, agent, triggerData, execution);
        }
        else if (action.type === 'recommend' && action.recommend) {
          // Generate recommendations
          result = await this.generateRecommendation(action.recommend, agent, triggerData);
        }

        results.push({
          actionId: action.id,
          status: 'success',
          result,
          timestamp: new Date(),
        });

      } catch (error: any) {
        console.error(`Error executing action ${action.id}:`, error);
        
        results.push({
          actionId: action.id,
          status: 'failed',
          result: null,
          error: error.message,
          timestamp: new Date(),
        });

        // Retry if configured
        if (action.retry?.enabled) {
          // TODO: Implement retry logic
        }
      }
    }

    return results;
  }

  /**
   * Execute AI decision action
   */
  private async executeAIDecision(
    aiDecision: any,
    agent: CustomAgent,
    triggerData: any,
    execution: AgentExecution
  ): Promise<any> {
    const prompt = `
${agent.config.systemPrompt}

You are executing as a financial AI agent. Based on the following context, decide what action to take:

Context: ${aiDecision.context}
${JSON.stringify(triggerData, null, 2)}

You can choose from these actions:
${aiDecision.allowedActions.join(', ')}

Safety Constraints (DO NOT violate):
${aiDecision.safetyConstraints.join(', ')}

Respond with a JSON object containing your decision:
{
  "action": "chosen_action",
  "reasoning": "why you chose this",
  "parameters": { /* action-specific parameters */ }
}
`;

    const aiResponse = await geminiService.chat(prompt, { agentId: agent.id });

    execution.aiInteractions.push({
      prompt,
      response: aiResponse,
      timestamp: new Date(),
    });

    // Parse AI decision
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON decision');
    }

    const decision = JSON.parse(jsonMatch[0]);

    // Validate decision against safety constraints
    if (!aiDecision.allowedActions.includes(decision.action)) {
      throw new Error(`AI chose disallowed action: ${decision.action}`);
    }

    return decision;
  }

  /**
   * Generate recommendation
   */
  private async generateRecommendation(
    recommend: any,
    agent: CustomAgent,
    triggerData: any
  ): Promise<any> {
    if (recommend.generateUsing === 'ai') {
      const prompt = `
${agent.config.systemPrompt}

Generate a financial recommendation in category: ${recommend.category}

Based on this data:
${JSON.stringify(triggerData, null, 2)}

Return JSON with:
{
  "title": "...",
  "description": "...",
  "priority": "low|medium|high",
  "potentialImpact": number (₹),
  "actionSteps": ["...", "..."]
}
`;

      const aiResponse = await geminiService.chat(prompt, { agentId: agent.id });
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    }

    return {
      title: `${recommend.category} recommendation`,
      description: 'Generated by custom agent',
      priority: 'medium',
    };
  }

  /**
   * Send notification
   */
  private async sendNotification(notify: any, agent: CustomAgent): Promise<any> {
    console.log(`📧 Sending notification: ${notify.title}`);
    
    // TODO: Integrate with actual notification service
    const notification = {
      channels: notify.channels,
      title: notify.title,
      message: notify.message,
      priority: notify.priority,
      agentId: agent.id,
      agentName: agent.name,
      timestamp: new Date(),
    };

    // Save to localStorage for demo
    const notifications = JSON.parse(localStorage.getItem(`notifications_${agent.userId}`) || '[]');
    notifications.unshift(notification);
    localStorage.setItem(`notifications_${agent.userId}`, JSON.stringify(notifications.slice(0, 50)));

    return notification;
  }

  /**
   * Execute transfer
   */
  private async executeTransfer(transfer: any, agent: CustomAgent, triggerData: any): Promise<any> {
    // Safety checks
    if (!agent.permissions.canTransferMoney) {
      throw new Error('Agent does not have permission to transfer money');
    }

    let amount = 0;

    if (transfer.amountType === 'fixed') {
      amount = transfer.amount || 0;
    } else if (transfer.amountType === 'percentage') {
      const baseAmount = triggerData.transaction?.amount || 0;
      amount = (baseAmount * (transfer.percentage || 0)) / 100;
    } else if (transfer.amountType === 'calculated') {
      // Evaluate calculation (simple eval, be careful in production!)
      amount = eval(transfer.calculation);
    }

    if (amount > agent.permissions.maxTransactionAmount) {
      throw new Error(`Transfer amount (₹${amount}) exceeds agent limit (₹${agent.permissions.maxTransactionAmount})`);
    }

    if (agent.permissions.requiresConfirmation && amount >= agent.permissions.confirmationThreshold) {
      // Create pending transfer for user confirmation
      return {
        status: 'pending_confirmation',
        amount,
        from: transfer.fromAccount,
        to: transfer.toAccount,
        memo: transfer.memo,
      };
    }

    // Execute transfer
    console.log(`💸 Executing transfer: ₹${amount} from ${transfer.fromAccount} to ${transfer.toAccount}`);
    
    // TODO: Integrate with actual transfer service
    return {
      status: 'completed',
      amount,
      from: transfer.fromAccount,
      to: transfer.toAccount,
      memo: transfer.memo,
      timestamp: new Date(),
    };
  }

  // ==================== HELPER METHODS ====================

  private generateDefaultSystemPrompt(category: string): string {
    const prompts: Record<string, string> = {
      savings: 'You are a savings optimization expert. Help users maximize their savings through smart automation and behavioral insights.',
      investment: 'You are an investment advisor. Provide data-driven, risk-aware investment recommendations following Indian market regulations.',
      spending: 'You are a spending analyst. Help users understand and optimize their spending patterns.',
      tax: 'You are a tax optimization specialist. Provide advice following Indian Income Tax Act 1961.',
      debt: 'You are a debt management expert. Help users strategically manage and reduce debt.',
      custom: 'You are a financial assistant. Help users achieve their financial goals.',
    };

    return prompts[category] || prompts.custom;
  }

  private getFieldValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateOperator(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case '>': return value > compareValue;
      case '<': return value < compareValue;
      case '>=': return value >= compareValue;
      case '<=': return value <= compareValue;
      case '==': return value == compareValue;
      case '!=': return value != compareValue;
      case 'contains': return String(value).includes(String(compareValue));
      case 'matches': return new RegExp(compareValue).test(String(value));
      default: return false;
    }
  }

  private calculateImpact(actionResults: any[]): number {
    let totalImpact = 0;

    for (const result of actionResults) {
      if (result.status === 'success' && result.result) {
        if (result.result.amount) {
          totalImpact += result.result.amount;
        }
      }
    }

    return totalImpact;
  }

  private async updateAgentStats(agent: CustomAgent, execution: AgentExecution): Promise<void> {
    agent.stats.totalExecutions++;
    
    if (execution.status === 'success') {
      agent.stats.successfulExecutions++;
    } else {
      agent.stats.failedExecutions++;
    }

    agent.stats.averageExecutionTime = 
      (agent.stats.averageExecutionTime * (agent.stats.totalExecutions - 1) + execution.executionTime) / 
      agent.stats.totalExecutions;

    agent.stats.totalImpact += execution.impact;
    agent.stats.lastExecuted = new Date();

    await this.saveAgent(agent);
  }

  // ==================== STORAGE METHODS ====================

  private async saveAgent(agent: CustomAgent): Promise<void> {
    const agents = await this.getAllAgents(agent.userId);
    const existingIndex = agents.findIndex(a => a.id === agent.id);

    if (existingIndex >= 0) {
      agents[existingIndex] = agent;
    } else {
      agents.push(agent);
    }

    localStorage.setItem(`custom_agents_${agent.userId}`, JSON.stringify(agents));
  }

  async getAgent(agentId: string): Promise<CustomAgent | null> {
    const allAgents = JSON.parse(localStorage.getItem('custom_agents') || '[]');
    return allAgents.find((a: CustomAgent) => a.id === agentId) || null;
  }

  async getAllAgents(userId: string): Promise<CustomAgent[]> {
    return JSON.parse(localStorage.getItem(`custom_agents_${userId}`) || '[]');
  }

  async deleteAgent(agentId: string, userId: string): Promise<void> {
    const agents = await this.getAllAgents(userId);
    const filtered = agents.filter(a => a.id !== agentId);
    localStorage.setItem(`custom_agents_${userId}`, JSON.stringify(filtered));
  }

  // Get all agents for a user
  async getAgentsByUser(userId: string): Promise<CustomAgent[]> {
    return await this.getAllAgents(userId);
  }

  // Enable an agent
  async enableAgent(agentId: string): Promise<void> {
    const agents = JSON.parse(localStorage.getItem(`custom_agents_all`) || '[]');
    const agent = agents.find((a: CustomAgent) => a.id === agentId);
    if (agent) {
      agent.status = 'active';
      agent.updatedAt = new Date();
      localStorage.setItem(`custom_agents_all`, JSON.stringify(agents));
      
      // Also update user-specific storage
      const userId = agent.userId;
      const userAgents = await this.getAllAgents(userId);
      const userAgent = userAgents.find(a => a.id === agentId);
      if (userAgent) {
        userAgent.status = 'active';
        userAgent.updatedAt = new Date();
        localStorage.setItem(`custom_agents_${userId}`, JSON.stringify(userAgents));
      }
    }
  }

  // Disable an agent
  async disableAgent(agentId: string): Promise<void> {
    const agents = JSON.parse(localStorage.getItem(`custom_agents_all`) || '[]');
    const agent = agents.find((a: CustomAgent) => a.id === agentId);
    if (agent) {
      agent.status = 'paused';
      agent.updatedAt = new Date();
      localStorage.setItem(`custom_agents_all`, JSON.stringify(agents));
      
      // Also update user-specific storage
      const userId = agent.userId;
      const userAgents = await this.getAllAgents(userId);
      const userAgent = userAgents.find(a => a.id === agentId);
      if (userAgent) {
        userAgent.status = 'paused';
        userAgent.updatedAt = new Date();
        localStorage.setItem(`custom_agents_${userId}`, JSON.stringify(userAgents));
      }
    }
  }

  private async saveExecution(execution: AgentExecution): Promise<void> {
    const executions = JSON.parse(localStorage.getItem(`agent_executions_${execution.userId}`) || '[]');
    executions.unshift(execution);
    localStorage.setItem(`agent_executions_${execution.userId}`, JSON.stringify(executions.slice(0, 100)));
  }

  async getExecutions(userId: string, agentId?: string): Promise<AgentExecution[]> {
    const executions = JSON.parse(localStorage.getItem(`agent_executions_${userId}`) || '[]');
    return agentId ? executions.filter((e: AgentExecution) => e.agentId === agentId) : executions;
  }

  // ==================== AGENT TEMPLATES ====================

  getAgentTemplates(): AgentTemplate[] {
    return [
      {
        id: 'template_smart_saver',
        name: 'Smart Saver',
        description: 'Automatically saves 10% of every income deposit',
        category: 'savings',
        difficulty: 'beginner',
        estimatedImpact: '₹5,000-15,000/month',
        usageCount: 1234,
        rating: 4.8,
        author: 'FinanceAI Team',
        template: {
          name: 'Smart Saver',
          category: 'savings',
          triggers: [
            {
              id: 'trigger1',
              type: 'event',
              event: {
                type: 'transaction',
                filters: { category: 'income' },
              },
              enabled: true,
            },
          ],
          conditions: [
            {
              id: 'cond1',
              type: 'simple',
              simple: {
                field: 'transaction.amount',
                operator: '>',
                value: 5000,
              },
            },
          ],
          actions: [
            {
              id: 'action1',
              type: 'transfer',
              priority: 1,
              transfer: {
                fromAccount: 'checking',
                toAccount: 'savings',
                amountType: 'percentage',
                percentage: 10,
                memo: 'Automatic savings',
              },
              enabled: true,
            },
          ],
        },
        examples: ['Save 10% of salary', 'Build emergency fund'],
        tags: ['savings', 'automation', 'beginner'],
      },
      {
        id: 'template_bill_reminder',
        name: 'Bill Payment Reminder',
        description: 'Smart reminders for upcoming bills',
        category: 'spending',
        difficulty: 'beginner',
        estimatedImpact: 'Avoid late fees',
        usageCount: 856,
        rating: 4.6,
        author: 'Community',
        template: {
          name: 'Bill Payment Reminder',
          category: 'spending',
          triggers: [
            {
              id: 'trigger1',
              type: 'time',
              schedule: {
                type: 'daily',
                value: '09:00',
              },
              enabled: true,
            },
          ],
          actions: [
            {
              id: 'action1',
              type: 'notify',
              priority: 1,
              notify: {
                channels: ['push', 'email'],
                title: 'Upcoming Bills',
                message: 'You have bills due soon',
                priority: 'medium',
              },
              enabled: true,
            },
          ],
        },
        examples: ['Credit card due dates', 'Utility bill reminders'],
        tags: ['bills', 'reminders', 'automation'],
      },
    ];
  }

  async createFromTemplate(userId: string, templateId: string): Promise<CustomAgent> {
    const templates = this.getAgentTemplates();
    const template = templates.find(t => t.id === templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    return await this.createAgent(userId, template.template);
  }
}

// Export singleton instance
export const customAgentBuilder = new CustomAgentBuilderService();
