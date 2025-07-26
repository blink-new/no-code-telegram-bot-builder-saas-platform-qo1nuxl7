import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { MessageSquare, Image, Keyboard, FileText } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface ActionNodeData {
  label: string
  actionType: 'text' | 'image' | 'keyboard' | 'document'
  text?: string
  imageUrl?: string
  buttons?: Array<{ text: string; action: string }>
  description?: string
}

const ActionNode = memo(({ data, selected }: NodeProps<ActionNodeData>) => {
  const getIcon = () => {
    switch (data.actionType) {
      case 'text':
        return <MessageSquare className="h-4 w-4" />
      case 'image':
        return <Image className="h-4 w-4" />
      case 'keyboard':
        return <Keyboard className="h-4 w-4" />
      case 'document':
        return <FileText className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getSubtitle = () => {
    switch (data.actionType) {
      case 'text':
        return data.text ? `"${data.text.substring(0, 30)}${data.text.length > 30 ? '...' : ''}"` : 'Text message'
      case 'image':
        return data.imageUrl ? 'Image with caption' : 'Send image'
      case 'keyboard':
        return data.buttons ? `${data.buttons.length} buttons` : 'Interactive buttons'
      case 'document':
        return 'Send file'
      default:
        return 'Action'
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
            <div className="p-1.5 bg-accent/10 rounded-md text-accent">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-foreground">{data.label}</h3>
              <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            Action
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

ActionNode.displayName = 'ActionNode'

export default ActionNode