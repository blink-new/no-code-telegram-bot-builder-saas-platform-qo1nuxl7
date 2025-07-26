import { Bot, Zap, Shield, BarChart3, Github } from 'lucide-react'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { blink } from '../blink/client'

export default function LandingPage() {
  const handleLogin = () => {
    blink.auth.login()
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
            <Button onClick={handleLogin} className="bg-primary hover:bg-primary/90">
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            Build Telegram Bots
            <span className="text-primary block">Without Code</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Create powerful, interactive Telegram bots with our visual drag-and-drop builder. 
            Perfect for marketers, community managers, and business owners.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={handleLogin} 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            >
              Start Building Free
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-lg px-8 py-3"
            >
              View Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Everything you need to build amazing bots
            </h2>
            <p className="text-lg text-muted-foreground">
              Professional tools designed for non-technical users
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-border">
              <CardHeader>
                <Bot className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Visual Flow Builder</CardTitle>
                <CardDescription>
                  Drag-and-drop interface to design conversation flows without coding
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Zap className="h-12 w-12 text-accent mb-4" />
                <CardTitle>One-Click Deploy</CardTitle>
                <CardDescription>
                  Deploy your bots instantly with our managed hosting infrastructure
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-grade encryption for your bot tokens and user data
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <BarChart3 className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Real-time Analytics</CardTitle>
                <CardDescription>
                  Track user engagement, popular commands, and bot performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Github className="h-12 w-12 text-primary mb-4" />
                <CardTitle>OAuth Integration</CardTitle>
                <CardDescription>
                  Sign in securely with Google, GitHub, or other OAuth providers
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <Bot className="h-12 w-12 text-accent mb-4" />
                <CardTitle>Multi-tenant SaaS</CardTitle>
                <CardDescription>
                  Scalable architecture supporting thousands of concurrent bots
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Ready to build your first bot?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join thousands of users creating engaging Telegram experiences
          </p>
          <Button 
            onClick={handleLogin} 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <span className="font-semibold text-foreground">TeleFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 TeleFlow. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}