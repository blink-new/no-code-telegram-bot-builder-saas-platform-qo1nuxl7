import { Bot } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Bot className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground mb-2">TeleFlow</h1>
        <p className="text-muted-foreground">Loading your bot builder...</p>
      </div>
    </div>
  )
}