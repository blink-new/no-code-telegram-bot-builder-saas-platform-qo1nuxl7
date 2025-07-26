import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { Zap, Hash, Clock, UserPlus } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface TriggerNodeData {
  label: string
  triggerType: 'command' | 'keyword' | 'schedule' | 'join'
  command?: string
  keyword?: string
  schedule?: string
  description?: string
}

const TriggerNode = memo(({ data, selected }: NodeProps<TriggerNodeData>) => {
  const getIcon = () => {
    switch (data.triggerType) {
      case 'command':
        return <Hash className="h-4 w-4" />
      case 'keyword':
        return <Zap className="h-4 w-4" />
      case 'schedule':
        return <Clock className="h-4 w-4" />
      case 'join':
        return <UserPlus className="h-4 w-4" />
      default:
        return <Zap className="h-4 w-4" />
    }
  }

  const getSubtitle = () => {
    switch (data.triggerType) {
      case 'command':
        return data.command || '/command'
      case 'keyword':
        return data.keyword || 'keyword'
      case 'schedule':
        return data.schedule || 'Daily at 9 AM'
      case 'join':
        return 'New member joins'
      default:
        return 'Trigger'
    }
  }

  return (
    <Card className={`min-w-[200px] ${selected ? 'ring-2 ring-primary' : ''}`}>
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 rounded-md text-primary">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-foreground">{data.label}</h3>
              <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Trigger
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

TriggerNode.displayName = 'TriggerNode'

export default TriggerNode