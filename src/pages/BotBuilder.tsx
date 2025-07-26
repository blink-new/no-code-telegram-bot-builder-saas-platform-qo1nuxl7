import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
} from 'reactflow'
import 'reactflow/dist/style.css'

import { Bot, ArrowLeft, Save, Play, Settings, Zap, MessageSquare, GitBranch, Database, Webhook, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'
import { ScrollArea } from '../components/ui/scroll-area'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'

// Custom Node Components
import TriggerNode from '../components/flow/TriggerNode'
import ActionNode from '../components/flow/ActionNode'
import LogicNode from '../components/flow/LogicNode'
import IntegrationNode from '../components/flow/IntegrationNode'

interface User {
  id: string
  email: string
  displayName?: string
}

interface BotBuilderProps {
  user: User
}

interface BotData {
  id: string
  name: string
  description: string
  status: string
  userId: string
}

// Node types for the flow builder
const nodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
  logic: LogicNode,
  integration: IntegrationNode,
}

// Initial nodes and edges
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'trigger',
    position: { x: 250, y: 100 },
    data: { 
      label: 'Start Command',
      triggerType: 'command',
      command: '/start',
      description: 'Triggered when user sends /start'
    },
  },
]

const initialEdges: Edge[] = []

// Node palette items
const nodeCategories = [
  {
    title: 'Triggers',
    icon: Zap,
    items: [
      { type: 'trigger', subtype: 'command', label: 'Command Trigger', description: 'Respond to specific commands' },
      { type: 'trigger', subtype: 'keyword', label: 'Keyword Trigger', description: 'Respond to keywords in messages' },
      { type: 'trigger', subtype: 'schedule', label: 'Scheduled Message', description: 'Send messages at specific times' },
      { type: 'trigger', subtype: 'join', label: 'User Joined', description: 'Welcome new group members' },
    ]
  },
  {
    title: 'Actions',
    icon: MessageSquare,
    items: [
      { type: 'action', subtype: 'text', label: 'Send Text', description: 'Send a text message' },
      { type: 'action', subtype: 'image', label: 'Send Image', description: 'Send an image with caption' },
      { type: 'action', subtype: 'keyboard', label: 'Inline Keyboard', description: 'Show interactive buttons' },
      { type: 'action', subtype: 'document', label: 'Send Document', description: 'Send files or documents' },
    ]
  },
  {
    title: 'Logic',
    icon: GitBranch,
    items: [
      { type: 'logic', subtype: 'condition', label: 'If/Else', description: 'Conditional branching' },
      { type: 'logic', subtype: 'input', label: 'Collect Input', description: 'Get user input and validate' },
      { type: 'logic', subtype: 'variable', label: 'Set Variable', description: 'Store and manage data' },
      { type: 'logic', subtype: 'delay', label: 'Delay', description: 'Wait before next action' },
    ]
  },
  {
    title: 'Integrations',
    icon: Database,
    items: [
      { type: 'integration', subtype: 'webhook', label: 'Webhook', description: 'Call external APIs' },
      { type: 'integration', subtype: 'database', label: 'Database', description: 'Store user data' },
      { type: 'integration', subtype: 'sheets', label: 'Google Sheets', description: 'Connect to spreadsheets' },
      { type: 'integration', subtype: 'email', label: 'Send Email', description: 'Send email notifications' },
    ]
  }
]

export default function BotBuilder({ user }: BotBuilderProps) {
  const { botId } = useParams<{ botId: string }>()
  const [bot, setBot] = useState<BotData | null>(null)
  const [loading, setLoading] = useState(true)
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'deployed' | 'error'>('idle')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { toast } = useToast()

  // Fetch bot data and flow
  useEffect(() => {
    const fetchBot = async () => {
      if (!botId) return
      
      try {
        const botData = await blink.db.bots.list({
          where: { id: botId, userId: user.id }
        })
        
        if (botData.length > 0) {
          setBot(botData[0])
          
          // Load existing flow data
          const flowData = await blink.db.bot_flows.list({
            where: { bot_id: botId, user_id: user.id },
            limit: 1
          })
          
          if (flowData.length > 0 && flowData[0].flow_data) {
            try {
              const parsedFlow = JSON.parse(flowData[0].flow_data)
              if (parsedFlow.nodes && parsedFlow.edges) {
                setNodes(parsedFlow.nodes)
                setEdges(parsedFlow.edges)
              }
            } catch (parseError) {
              console.error('Failed to parse flow data:', parseError)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch bot:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchBot()
  }, [botId, user.id, setNodes, setEdges])

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) => addEdge(params, eds))
      setHasUnsavedChanges(true)
    },
    [setEdges]
  )

  const saveFlow = useCallback(async () => {
    if (!botId || !user) return
    
    setSaveStatus('saving')
    try {
      const flowData = {
        nodes: nodes.map(node => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: node.data
        })),
        edges: edges.map(edge => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle,
          targetHandle: edge.targetHandle
        }))
      }

      // Check if flow already exists
      const existingFlows = await blink.db.bot_flows.list({
        where: { bot_id: botId },
        limit: 1
      })

      if (existingFlows.length > 0) {
        // Update existing flow
        await blink.db.bot_flows.update(existingFlows[0].id, {
          flow_data: JSON.stringify(flowData),
          updated_at: new Date().toISOString()
        })
      } else {
        // Create new flow
        await blink.db.bot_flows.create({
          id: `flow_${Date.now()}`,
          bot_id: botId,
          user_id: user.id,
          flow_data: JSON.stringify(flowData),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      // Update bot status to indicate it has been modified
      await blink.db.bots.update(botId, {
        status: 'draft',
        updatedAt: new Date().toISOString()
      })

      setSaveStatus('saved')
      setHasUnsavedChanges(false)
      setTimeout(() => setSaveStatus('idle'), 2000)
      
      toast({
        title: "Flow Saved",
        description: "Your bot flow has been saved successfully",
      })
    } catch (error) {
      console.error('Failed to save flow:', error)
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
      
      toast({
        title: "Save Failed",
        description: "Failed to save your bot flow",
        variant: "destructive"
      })
    }
  }, [botId, user, nodes, edges, toast])

  // Auto-save functionality
  useEffect(() => {
    if (!hasUnsavedChanges || !botId || !user) return

    const autoSaveTimer = setTimeout(() => {
      saveFlow()
    }, 2000) // Auto-save after 2 seconds of inactivity

    return () => clearTimeout(autoSaveTimer)
  }, [hasUnsavedChanges, botId, user, saveFlow])

  // Mark changes when nodes or edges change
  useEffect(() => {
    setHasUnsavedChanges(true)
  }, [nodes, edges])

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node)
  }, [])

  const onPaneClick = useCallback(() => {
    setSelectedNode(null)
  }, [])

  // Handle drag and drop from palette
  const onDragStart = (event: React.DragEvent, nodeType: string, subtype: string) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify({ nodeType, subtype }))
    event.dataTransfer.effectAllowed = 'move'
    setIsDragging(true)
  }

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const getDefaultNodeData = useCallback((nodeType: string, subtype: string) => {
    switch (nodeType) {
      case 'trigger':
        return {
          triggerType: subtype,
          command: subtype === 'command' ? '/command' : '',
          keyword: subtype === 'keyword' ? 'keyword' : '',
          schedule: subtype === 'schedule' ? '0 9 * * *' : '',
        }
      case 'action':
        return {
          actionType: subtype,
          text: subtype === 'text' ? 'Hello!' : '',
          imageUrl: subtype === 'image' ? '' : '',
          buttons: subtype === 'keyboard' ? [] : undefined,
        }
      case 'logic':
        return {
          logicType: subtype,
          condition: subtype === 'condition' ? '' : '',
          variable: subtype === 'variable' ? 'variable_name' : '',
          delay: subtype === 'delay' ? 1000 : undefined,
        }
      case 'integration':
        return {
          integrationType: subtype,
          url: subtype === 'webhook' ? '' : '',
          method: subtype === 'webhook' ? 'POST' : '',
        }
      default:
        return {}
    }
  }, [])

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()
      setIsDragging(false)

      const reactFlowBounds = (event.target as Element).getBoundingClientRect()
      const data = event.dataTransfer.getData('application/reactflow')
      
      if (!data) return

      const { nodeType, subtype } = JSON.parse(data)
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      }

      const newNode: Node = {
        id: `${nodeType}-${Date.now()}`,
        type: nodeType,
        position,
        data: {
          label: `New ${nodeType}`,
          subtype,
          ...getDefaultNodeData(nodeType, subtype)
        },
      }

      setNodes((nds) => nds.concat(newNode))
      setHasUnsavedChanges(true)
    },
    [setNodes, getDefaultNodeData]
  )

  const handleSave = async () => {
    await saveFlow()
  }

  const handleDeploy = async () => {
    if (!bot) return

    setDeployStatus('deploying')
    try {
      // First save the current flow
      await saveFlow()

      // Check if bot has a token assigned
      const botTokens = await blink.db.bot_tokens.list({
        where: { user_id: user.id },
        limit: 1
      })

      if (botTokens.length === 0) {
        toast({
          title: "No Bot Token",
          description: "Please add a bot token in Settings before deploying",
          variant: "destructive"
        })
        setDeployStatus('error')
        return
      }

      // Get flow data
      const flowData = await blink.db.bot_flows.list({
        where: { bot_id: bot.id },
        limit: 1
      })

      if (flowData.length === 0) {
        toast({
          title: "No Flow Data",
          description: "Please create a flow before deploying",
          variant: "destructive"
        })
        setDeployStatus('error')
        return
      }

      // Call deployment function
      const response = await blink.data.fetch({
        url: 'https://qo1nuxl7--telegram-bot-runtime.functions.blink.new',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          action: 'deploy',
          botId: bot.id,
          userId: user.id,
          botToken: botTokens[0].token,
          flowData: flowData[0].flow_data,
          botName: bot.name
        }
      })

      if (response.status === 200) {
        // Update bot status
        await blink.db.bots.update(bot.id, {
          status: 'active',
          deploymentStatus: 'deployed',
          lastDeployed: new Date().toISOString()
        })
        
        setBot(prev => prev ? { 
          ...prev, 
          status: 'active',
          deploymentStatus: 'deployed',
          lastDeployed: new Date().toISOString()
        } : null)

        setDeployStatus('deployed')
        toast({
          title: "Bot Deployed",
          description: `${bot.name} is now live on Telegram!`,
        })
      } else {
        throw new Error('Deployment failed')
      }
    } catch (error) {
      console.error('Failed to deploy bot:', error)
      setDeployStatus('error')
      
      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy bot",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading bot builder...</p>
        </div>
      </div>
    )
  }

  if (!bot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-2">Bot not found</h2>
          <p className="text-muted-foreground mb-4">The bot you're looking for doesn't exist.</p>
          <Button asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button asChild variant="ghost" size="sm">
                <Link to="/dashboard">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Link>
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center space-x-2">
                <Bot className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="font-semibold text-foreground">{bot.name}</h1>
                  <p className="text-xs text-muted-foreground">Flow Builder</p>
                </div>
              </div>
              <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                {bot.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                onClick={handleSave}
                disabled={saveStatus === 'saving'}
              >
                {saveStatus === 'saving' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : saveStatus === 'saved' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Saved
                  </>
                ) : saveStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                    Error
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save{hasUnsavedChanges ? '*' : ''}
                  </>
                )}
              </Button>
              <Button 
                onClick={handleDeploy} 
                className="bg-accent hover:bg-accent/90"
                disabled={deployStatus === 'deploying'}
              >
                {deployStatus === 'deploying' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deploying...
                  </>
                ) : deployStatus === 'deployed' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Deployed
                  </>
                ) : deployStatus === 'error' ? (
                  <>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Deploy
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Deploy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Node Palette Sidebar */}
        <div className="w-80 border-r border-border bg-card/30 flex flex-col">
          <div className="p-4 border-b border-border">
            <h2 className="font-semibold text-foreground mb-1">Node Palette</h2>
            <p className="text-sm text-muted-foreground">Drag nodes to the canvas</p>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6">
              {nodeCategories.map((category) => (
                <div key={category.title}>
                  <div className="flex items-center space-x-2 mb-3">
                    <category.icon className="h-4 w-4 text-primary" />
                    <h3 className="font-medium text-foreground">{category.title}</h3>
                  </div>
                  <div className="space-y-2">
                    {category.items.map((item) => (
                      <Card
                        key={`${item.type}-${item.subtype}`}
                        className="cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow"
                        draggable
                        onDragStart={(e) => onDragStart(e, item.type, item.subtype)}
                      >
                        <CardHeader className="p-3">
                          <CardTitle className="text-sm">{item.label}</CardTitle>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Flow Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            className={isDragging ? 'cursor-crosshair' : ''}
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            
            <Panel position="top-right" className="bg-card border border-border rounded-lg p-2">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Nodes: {nodes.length}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Connections: {edges.length}</span>
                </div>
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {/* Properties Panel */}
        {selectedNode && (
          <div className="w-80 border-l border-border bg-card/30 flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">Properties</h2>
                <Button variant="ghost" size="sm" onClick={() => setSelectedNode(null)}>
                  ×
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">Configure selected node</p>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-foreground mb-2">Node: {selectedNode.data.label}</h3>
                    <p className="text-sm text-muted-foreground">Type: {selectedNode.type}</p>
                  </div>
                  
                  {/* Node-specific configuration would go here */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-foreground">Label</label>
                      <input 
                        type="text" 
                        className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                        value={selectedNode.data.label}
                        onChange={(e) => {
                          setNodes((nds) =>
                            nds.map((node) =>
                              node.id === selectedNode.id
                                ? { ...node, data: { ...node.data, label: e.target.value } }
                                : node
                            )
                          )
                          setHasUnsavedChanges(true)
                        }}
                      />
                    </div>
                    
                    {selectedNode.type === 'trigger' && selectedNode.data.triggerType === 'command' && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Command</label>
                        <input 
                          type="text" 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                          value={selectedNode.data.command || ''}
                          placeholder="/start"
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id
                                  ? { ...node, data: { ...node.data, command: e.target.value } }
                                  : node
                              )
                            )
                            setHasUnsavedChanges(true)
                          }}
                        />
                      </div>
                    )}
                    
                    {selectedNode.type === 'action' && selectedNode.data.actionType === 'text' && (
                      <div>
                        <label className="text-sm font-medium text-foreground">Message Text</label>
                        <textarea 
                          className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm"
                          rows={3}
                          value={selectedNode.data.text || ''}
                          placeholder="Enter your message..."
                          onChange={(e) => {
                            setNodes((nds) =>
                              nds.map((node) =>
                                node.id === selectedNode.id
                                  ? { ...node, data: { ...node.data, text: e.target.value } }
                                  : node
                              )
                            )
                            setHasUnsavedChanges(true)
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </div>
        )}
      </div>
    </div>
  )
}