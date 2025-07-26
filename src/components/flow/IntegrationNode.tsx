import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Webhook, Database, Sheet, Mail } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface IntegrationNodeData {
  label: string
  integrationType: 'webhook' | 'database' | 'sheets' | 'email'
  url?: string
  method?: string
  description?: string
}

const IntegrationNode = memo(({ data, selected }: NodeProps<IntegrationNodeData>) => {
  const getIcon = () => {
    switch (data.integrationType) {
      case 'webhook':
        return <Webhook className="h-4 w-4" />
      case 'database':
        return <Database className="h-4 w-4" />
      case 'sheets':
        return <Sheet className="h-4 w-4" />
      case 'email':
        return <Mail className="h-4 w-4" />
      default:
        return <Webhook className="h-4 w-4" />
    }
  }

  const getSubtitle = () => {
    switch (data.integrationType) {
      case 'webhook':
        return data.url ? `${data.method || 'POST'} ${data.url.substring(0, 20)}...` : 'External API call'
      case 'database':
        return 'Store user data'
      case 'sheets':
        return 'Google Sheets'
      case 'email':
        return 'Send notification'
      default:
        return 'Integration'
    }
  }

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-accent border-2 border-background"
      />
      
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-purple-100 rounded-md text-purple-600">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-foreground">{data.label}</h3>
              <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-purple-200 text-purple-600">
            Integration
          </Badge>
        </div>
        
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2">{data.description}</p>
        )}
      </CardContent>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-primary border-2 border-background"
      />
    </Card>
  )
})

IntegrationNode.displayName = 'IntegrationNode'

export default IntegrationNode