import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bot, Plus, Settings, BarChart3, Play, Pause, Trash2, User, LogOut, AlertCircle, CheckCircle, Clock, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../components/ui/dropdown-menu'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Textarea } from '../components/ui/textarea'
import { Alert, AlertDescription } from '../components/ui/alert'
import { useToast } from '../hooks/use-toast'
import { blink } from '../blink/client'

interface User {
  id: string
  email: string
  displayName?: string
}

interface Bot {
  id: string
  name: string
  description: string
  status: 'active' | 'inactive' | 'draft' | 'deploying' | 'error'
  totalUsers: number
  dailyMessages: number
  createdAt: string
  userId: string
  deploymentStatus?: 'deployed' | 'stopped' | 'deploying' | 'error'
  lastDeployed?: string
  errorMessage?: string
  botToken?: string
}

interface DashboardProps {
  user: User
}

export default function Dashboard({ user }: DashboardProps) {
  const [bots, setBots] = useState<Bot[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newBotName, setNewBotName] = useState('')
  const [newBotDescription, setNewBotDescription] = useState('')
  const [deployingBots, setDeployingBots] = useState<Set<string>>(new Set())
  const [botTokens, setBotTokens] = useState<any[]>([])
  const { toast } = useToast()

  const fetchBots = useCallback(async () => {
    try {
      const botsData = await blink.db.bots.list({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })
      setBots(botsData)
    } catch (error) {
      console.error('Failed to fetch bots:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  const fetchBotTokens = useCallback(async () => {
    try {
      const tokens = await blink.db.bot_tokens.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setBotTokens(tokens)
    } catch (error) {
      console.error('Failed to fetch bot tokens:', error)
    }
  }, [user.id])

  useEffect(() => {
    fetchBots()
    fetchBotTokens()
  }, [fetchBots, fetchBotTokens])

  const handleCreateBot = async () => {
    if (!newBotName.trim()) return

    try {
      const newBot = await blink.db.bots.create({
        name: newBotName,
        description: newBotDescription,
        status: 'draft',
        totalUsers: 0,
        dailyMessages: 0,
        userId: user.id,
        createdAt: new Date().toISOString(),
        deploymentStatus: 'stopped'
      })
      
      setBots(prev => [newBot, ...prev])
      setNewBotName('')
      setNewBotDescription('')
      setIsCreateDialogOpen(false)
      
      toast({
        title: "Bot Created",
        description: `${newBotName} has been created successfully`,
      })
    } catch (error) {
      console.error('Failed to create bot:', error)
      toast({
        title: "Error",
        description: "Failed to create bot",
        variant: "destructive"
      })
    }
  }

  const stopBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (!bot) return

    try {
      // Call stop function
      await blink.data.fetch({
        url: 'https://qo1nuxl7--telegram-bot-runtime.functions.blink.new',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          action: 'stop',
          botId,
          userId: user.id
        }
      })

      // Update bot status
      await blink.db.bots.update(botId, {
        status: 'inactive',
        deploymentStatus: 'stopped'
      })
      
      setBots(prev => prev.map(b => 
        b.id === botId 
          ? { ...b, status: 'inactive', deploymentStatus: 'stopped' }
          : b
      ))

      toast({
        title: "Bot Stopped",
        description: `${bot.name} has been stopped`,
      })
    } catch (error) {
      console.error('Failed to stop bot:', error)
      toast({
        title: "Error",
        description: "Failed to stop bot",
        variant: "destructive"
      })
    }
  }

  const handleDeleteBot = async (botId: string) => {
    try {
      // Stop bot if it's running
      await stopBot(botId)
      
      // Delete from database
      await blink.db.bots.delete(botId)
      setBots(prev => prev.filter(bot => bot.id !== botId))
      
      toast({
        title: "Bot Deleted",
        description: "Bot has been deleted successfully",
      })
    } catch (error) {
      console.error('Failed to delete bot:', error)
      toast({
        title: "Error",
        description: "Failed to delete bot",
        variant: "destructive"
      })
    }
  }

  const deployBot = async (botId: string) => {
    const bot = bots.find(b => b.id === botId)
    if (!bot) return

    // Check if bot has a token assigned
    if (!bot.botToken && botTokens.length === 0) {
      toast({
        title: "No Bot Token",
        description: "Please add a bot token in Settings before deploying",
        variant: "destructive"
      })
      return
    }

    setDeployingBots(prev => new Set(prev).add(botId))
    
    try {
      // Update bot status to deploying
      await blink.db.bots.update(botId, {
        status: 'deploying',
        deploymentStatus: 'deploying'
      })
      
      setBots(prev => prev.map(b => 
        b.id === botId 
          ? { ...b, status: 'deploying', deploymentStatus: 'deploying' }
          : b
      ))

      // Get bot flow data
      const flowData = await blink.db.bot_flows.list({
        where: { bot_id: botId },
        limit: 1
      })

      const flow = flowData[0]
      if (!flow) {
        throw new Error('No flow data found for this bot')
      }

      // Use the first available token if bot doesn't have one assigned
      const tokenToUse = bot.botToken || botTokens[0]?.token
      if (!tokenToUse) {
        throw new Error('No bot token available')
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
          botId,
          userId: user.id,
          botToken: tokenToUse,
          flowData: flow.flow_data,
          botName: bot.name
        }
      })

      if (response.status === 200) {
        // Update bot status to active
        await blink.db.bots.update(botId, {
          status: 'active',
          deploymentStatus: 'deployed',
          lastDeployed: new Date().toISOString()
        })
        
        setBots(prev => prev.map(b => 
          b.id === botId 
            ? { 
                ...b, 
                status: 'active', 
                deploymentStatus: 'deployed',
                lastDeployed: new Date().toISOString()
              }
            : b
        ))

        toast({
          title: "Bot Deployed",
          description: `${bot.name} is now live on Telegram!`,
        })
      } else {
        throw new Error('Deployment failed')
      }
    } catch (error) {
      console.error('Failed to deploy bot:', error)
      
      // Update bot status to error
      await blink.db.bots.update(botId, {
        status: 'error',
        deploymentStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      })
      
      setBots(prev => prev.map(b => 
        b.id === botId 
          ? { 
              ...b, 
              status: 'error', 
              deploymentStatus: 'error',
              errorMessage: error instanceof Error ? error.message : 'Unknown error'
            }
          : b
      ))

      toast({
        title: "Deployment Failed",
        description: error instanceof Error ? error.message : "Failed to deploy bot",
        variant: "destructive"
      })
    } finally {
      setDeployingBots(prev => {
        const newSet = new Set(prev)
        newSet.delete(botId)
        return newSet
      })
    }
  }

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200'
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'draft': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'deploying': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string, deploymentStatus?: string) => {
    if (status === 'deploying') {
      return <Loader2 className="h-3 w-3 animate-spin" />
    }
    
    switch (deploymentStatus) {
      case 'deployed':
        return <CheckCircle className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      case 'deploying':
        return <Loader2 className="h-3 w-3 animate-spin" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your bots...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary" />
              <span className="text-xl font-semibold text-foreground">TeleFlow</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90">
                    <Plus className="h-4 w-4 mr-2" />
                    New Bot
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Bot</DialogTitle>
                    <DialogDescription>
                      Give your bot a name and description to get started.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Bot Name</Label>
                      <Input
                        id="name"
                        value={newBotName}
                        onChange={(e) => setNewBotName(e.target.value)}
                        placeholder="My Awesome Bot"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newBotDescription}
                        onChange={(e) => setNewBotDescription(e.target.value)}
                        placeholder="What does your bot do?"
                        rows={3}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateBot} disabled={!newBotName.trim()}>
                        Create Bot
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{user.displayName || user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Bots</h1>
          <p className="text-muted-foreground">
            Manage and monitor your Telegram bots
          </p>
        </div>

        {/* Bot Token Warning */}
        {botTokens.length === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need to add a bot token in <Link to="/settings" className="underline">Settings</Link> before you can deploy your bots.
            </AlertDescription>
          </Alert>
        )}

        {bots.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No bots yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first bot to get started with TeleFlow
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Bot
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bots.map((bot) => (
              <Card key={bot.id} className="border-border hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-1">{bot.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {bot.description || 'No description'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(bot.status, bot.deploymentStatus)}
                      <Badge className={getStatusColor(bot.status)}>
                        {bot.status}
                      </Badge>
                    </div>
                  </div>
                  {bot.errorMessage && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-xs">
                        {bot.errorMessage}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Users</p>
                      <p className="font-semibold">{bot.totalUsers}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Daily Messages</p>
                      <p className="font-semibold">{bot.dailyMessages}</p>
                    </div>
                  </div>
                  
                  {bot.lastDeployed && (
                    <p className="text-xs text-muted-foreground mb-4">
                      Last deployed: {new Date(bot.lastDeployed).toLocaleString()}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/bot/${bot.id}/builder`}>
                          <Settings className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`/bot/${bot.id}/analytics`}>
                          <BarChart3 className="h-4 w-4 mr-1" />
                          Analytics
                        </Link>
                      </Button>
                    </div>
                    
                    <div className="flex space-x-1">
                      {bot.deploymentStatus === 'deployed' ? (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-orange-600 hover:text-orange-700"
                          onClick={() => stopBot(bot.id)}
                          disabled={deployingBots.has(bot.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="text-green-600 hover:text-green-700"
                          onClick={() => deployBot(bot.id)}
                          disabled={deployingBots.has(bot.id) || botTokens.length === 0}
                        >
                          {deployingBots.has(bot.id) ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteBot(bot.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}