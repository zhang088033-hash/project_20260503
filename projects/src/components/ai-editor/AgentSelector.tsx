'use client';

import { AIAgent } from '@/lib/ai-agents';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Lightbulb, FileText, Share2, Target } from 'lucide-react';

interface AgentSelectorProps {
  agents: AIAgent[];
  selectedAgent: AIAgent;
  onSelectAgent: (agent: AIAgent) => void;
}

export function AgentSelector({ agents, selectedAgent, onSelectAgent }: AgentSelectorProps) {
  const getAgentIcon = (agentId: string) => {
    switch (agentId) {
      case 'brainstorm':
        return <Lightbulb className="h-5 w-5" />;
      case 'scriptwriter':
        return <FileText className="h-5 w-5" />;
      case 'postcreator':
        return <Share2 className="h-5 w-5" />;
      case 'strategist':
        return <Target className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-purple-600" />
        <span className="font-medium">选择创作助手</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {agents.map((agent) => (
          <Card
            key={agent.id}
            className={`cursor-pointer transition-all hover:scale-[1.02] ${
              selectedAgent.id === agent.id
                ? 'ring-2 ring-purple-500 bg-purple-50'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectAgent(agent)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${agent.color}`}>
                  {getAgentIcon(agent.id)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium flex items-center gap-2">
                    <span>{agent.icon}</span>
                    <span>{agent.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {agent.description}
                  </p>
                </div>
              </div>
              
              {selectedAgent.id === agent.id && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {agent.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="text-[10px] h-5">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
