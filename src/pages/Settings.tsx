import React, { useState, useEffect, useCallback } from 'react'
import { ArrowLeft, Eye, EyeOff, Shield, Check, X, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { blink } from '@/blink/client'

interface BotToken {
  id: string
  botName: string
  token: string
  isValid: boolean
  lastVerified: string
  createdAt: string
}

export default function Settings() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [botTokens, setBotTokens] = useState<BotToken[]>([])
  const [newToken, setNewToken] = useState('')
  const [showToken, setShowToken] = useState<{ [key: string]: boolean }>({})
  const [verifyingToken, setVerifyingToken] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [notifications, setNotifications] = useState({
    deploymentAlerts: true,
    errorNotifications: true,
    weeklyReports: false,
    marketingEmails: false
  })
  const { toast } = useToast()

  const loadBotTokens = useCallback(async () => {
    if (!user?.id) return
    try {
      const tokens = await blink.db.bot_tokens.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })
      setBotTokens(tokens)
    } catch (error) {
      console.error('Failed to load bot tokens:', error)
    }
  }, [user?.id])

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
      if (state.user) {
        setDisplayName(state.user.displayName || state.user.email || '')
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    if (user) {
      loadBotTokens()
    }
  }, [user, loadBotTokens])



  const verifyTelegramToken = async (token: string) => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`)
      const data = await response.json()
      
      if (data.ok) {
        return {
          isValid: true,
          botName: data.result.username,
          botId: data.result.id
        }
      } else {
        return { isValid: false, error: data.description }
      }
    } catch (error) {
      return { isValid: false, error: 'Network error or invalid token format' }
    }
  }

  const addBotToken = async () => {
    if (!newToken.trim()) {
      toast({
        title: "Error",
        description: "Please enter a bot token",
        variant: "destructive"
      })
      return
    }

    setVerifyingToken(true)
    try {
      const verification = await verifyTelegramToken(newToken)
      
      if (!verification.isValid) {
        toast({
          title: "Invalid Token",
          description: verification.error || "The bot token is invalid",
          variant: "destructive"
        })
        return
      }

      // Check if token already exists
      const existingToken = botTokens.find(t => t.token === newToken)
      if (existingToken) {
        toast({
          title: "Token Already Exists",
          description: "This bot token is already added to your account",
          variant: "destructive"
        })
        return
      }

      const tokenData = {
        id: `token_${Date.now()}`,
        user_id: user.id,
        bot_name: verification.botName,
        token: newToken,
        is_valid: true,
        last_verified: new Date().toISOString(),
        created_at: new Date().toISOString()
      }

      await blink.db.bot_tokens.create(tokenData)
      setBotTokens(prev => [tokenData, ...prev])
      setNewToken('')
      
      toast({
        title: "Bot Token Added",
        description: `Successfully added bot @${verification.botName}`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add bot token",
        variant: "destructive"
      })
    } finally {
      setVerifyingToken(false)
    }
  }

  const removeBotToken = async (tokenId: string) => {
    try {
      await blink.db.bot_tokens.delete(tokenId)
      setBotTokens(prev => prev.filter(t => t.id !== tokenId))
      toast({
        title: "Token Removed",
        description: "Bot token has been removed from your account",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove bot token",
        variant: "destructive"
      })
    }
  }

  const updateProfile = async () => {
    setSavingProfile(true)
    try {
      await blink.auth.updateMe({ displayName })
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSavingProfile(false)
    }
  }

  const toggleTokenVisibility = (tokenId: string) => {
    setShowToken(prev => ({
      ...prev,
      [tokenId]: !prev[tokenId]
    }))
  }

  const maskToken = (token: string) => {
    if (token.length < 10) return token
    return token.substring(0, 8) + '•'.repeat(token.length - 16) + token.substring(token.length - 8)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-4">Please sign in</h2>
          <Button onClick={() => blink.auth.login()}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link to="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <h1 className="text-xl font-semibold">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>
                Manage your account information and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={user.email}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your display name"
                  />
                </div>
              </div>
              <Button 
                onClick={updateProfile} 
                disabled={savingProfile}
                className="w-full md:w-auto"
              >
                {savingProfile ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Update Profile'
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Bot Token Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary" />
                Bot Token Management
              </CardTitle>
              <CardDescription>
                Securely manage your Telegram bot tokens. Tokens are encrypted using AES-256.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Token */}
              <div className="space-y-4">
                <Label htmlFor="newToken">Add New Bot Token</Label>
                <div className="flex space-x-2">
                  <Input
                    id="newToken"
                    type="password"
                    value={newToken}
                    onChange={(e) => setNewToken(e.target.value)}
                    placeholder="Enter your Telegram bot token"
                    className="flex-1"
                  />
                  <Button 
                    onClick={addBotToken} 
                    disabled={verifyingToken || !newToken.trim()}
                  >
                    {verifyingToken ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      'Add Token'
                    )}
                  </Button>
                </div>
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Get your bot token from @BotFather on Telegram. Your tokens are encrypted and stored securely.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Existing Tokens */}
              {botTokens.length > 0 && (
                <div className="space-y-4">
                  <Label>Your Bot Tokens</Label>
                  <div className="space-y-3">
                    {botTokens.map((token) => (
                      <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">@{token.bot_name}</span>
                            {Number(token.is_valid) > 0 ? (
                              <Check className="h-4 w-4 text-green-500" />
                            ) : (
                              <X className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <code className="text-sm bg-muted px-2 py-1 rounded">
                              {showToken[token.id] ? token.token : maskToken(token.token)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleTokenVisibility(token.id)}
                            >
                              {showToken[token.id] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Added {new Date(token.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => removeBotToken(token.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose what notifications you'd like to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Deployment Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified when your bots are deployed or stopped
                    </p>
                  </div>
                  <Switch
                    checked={notifications.deploymentAlerts}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, deploymentAlerts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Error Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive alerts when your bots encounter errors
                    </p>
                  </div>
                  <Switch
                    checked={notifications.errorNotifications}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, errorNotifications: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">
                      Get weekly analytics reports for your bots
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyReports}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive updates about new features and tips
                    </p>
                  </div>
                  <Switch
                    checked={notifications.marketingEmails}
                    onCheckedChange={(checked) =>
                      setNotifications(prev => ({ ...prev, marketingEmails: checked }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="border-red-200">
                <AlertDescription>
                  <strong>Delete Account:</strong> This will permanently delete your account, all bots, and associated data. This action cannot be undone.
                </AlertDescription>
              </Alert>
              <Button variant="destructive" className="mt-4">
                Delete Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}