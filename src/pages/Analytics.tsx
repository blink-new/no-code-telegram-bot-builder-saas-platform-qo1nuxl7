import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Bot, Users, MessageSquare, TrendingUp, Activity, Calendar } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Separator } from '../components/ui/separator'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { blink } from '../blink/client'

interface User {
  id: string
  email: string
  displayName?: string
}

interface AnalyticsProps {
  user: User
}

interface BotData {
  id: string
  name: string
  description: string
  status: string
  userId: string
  totalUsers?: number
  dailyMessages?: number
  createdAt?: string
}

interface AnalyticsData {
  totalUsers: number
  dailyActiveUsers: number
  totalMessages: number
  popularCommands: Array<{ command: string; count: number }>
  dailyStats: Array<{ date: string; messages: number; users: number }>
}

export default function Analytics({ user }: AnalyticsProps) {
  const { botId } = useParams<{ botId: string }>()
  const [bot, setBot] = useState<BotData | null>(null)
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch bot data and analytics
  useEffect(() => {
    const fetchData = async () => {
      if (!botId) return
      
      try {
        const botData = await blink.db.bots.list({
          where: { id: botId, userId: user.id }
        })
        
        if (botData.length > 0) {
          setBot(botData[0])
          
          // Mock analytics data - in real app, this would come from your analytics service
          setAnalytics({
            totalUsers: 1247,
            dailyActiveUsers: 89,
            totalMessages: 5432,
            popularCommands: [
              { command: '/start', count: 234 },
              { command: '/help', count: 156 },
              { command: '/settings', count: 89 },
              { command: '/info', count: 67 },
            ],
            dailyStats: [
              { date: '2024-01-20', messages: 145, users: 23 },
              { date: '2024-01-21', messages: 189, users: 31 },
              { date: '2024-01-22', messages: 167, users: 28 },
              { date: '2024-01-23', messages: 203, users: 35 },
              { date: '2024-01-24', messages: 178, users: 29 },
              { date: '2024-01-25', messages: 234, users: 42 },
              { date: '2024-01-26', messages: 198, users: 38 },
            ]
          })
        }
      } catch (error) {
        console.error('Failed to fetch analytics:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [botId, user.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 text-primary animate-pulse mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
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
    <div className="min-h-screen bg-background">
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
                  <p className="text-xs text-muted-foreground">Analytics Dashboard</p>
                </div>
              </div>
              <Badge variant={bot.status === 'active' ? 'default' : 'secondary'}>
                {bot.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button asChild variant="outline">
                <Link to={`/bot/${botId}/builder`}>
                  Edit Bot
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalUsers.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Daily Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.dailyActiveUsers}</div>
                <p className="text-xs text-muted-foreground">
                  +5% from yesterday
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{analytics?.totalMessages.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  +8% from last week
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">73.2%</div>
                <p className="text-xs text-muted-foreground">
                  +2.1% from last week
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="commands">Popular Commands</TabsTrigger>
              <TabsTrigger value="logs">Activity Logs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Daily Activity</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Messages and user activity over the last 7 days
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics?.dailyStats.map((stat) => (
                      <div key={stat.date} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{new Date(stat.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center space-x-6 text-sm">
                          <div className="flex items-center space-x-2">
                            <MessageSquare className="h-3 w-3 text-primary" />
                            <span>{stat.messages} messages</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="h-3 w-3 text-accent" />
                            <span>{stat.users} users</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="commands" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Most Used Commands</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Commands ranked by usage frequency
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.popularCommands.map((cmd, index) => (
                      <div key={cmd.command} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-medium text-primary">
                            {index + 1}
                          </div>
                          <code className="font-mono text-sm bg-muted px-2 py-1 rounded">{cmd.command}</code>
                        </div>
                        <div className="text-sm font-medium">{cmd.count} uses</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="logs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Latest bot interactions and system events
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm">User @john_doe sent /start command</span>
                      </div>
                      <span className="text-xs text-muted-foreground">2 minutes ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm">Bot sent welcome message to @jane_smith</span>
                      </div>
                      <span className="text-xs text-muted-foreground">5 minutes ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-sm">New user @mike_wilson joined the bot</span>
                      </div>
                      <span className="text-xs text-muted-foreground">12 minutes ago</span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        <span className="text-sm">Webhook triggered for user data update</span>
                      </div>
                      <span className="text-xs text-muted-foreground">18 minutes ago</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}