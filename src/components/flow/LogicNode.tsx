import { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { GitBranch, Type, Variable, Clock } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'

interface LogicNodeData {
  label: string
  logicType: 'condition' | 'input' | 'variable' | 'delay'
  condition?: string
  variable?: string
  delay?: number
  description?: string
}

const LogicNode = memo(({ data, selected }: NodeProps<LogicNodeData>) => {
  const getIcon = () => {
    switch (data.logicType) {
      case 'condition':
        return <GitBranch className="h-4 w-4" />
      case 'input':
        return <Type className="h-4 w-4" />
      case 'variable':
        return <Variable className="h-4 w-4" />
      case 'delay':
        return <Clock className="h-4 w-4" />
      default:
        return <GitBranch className="h-4 w-4" />
    }
  }

  const getSubtitle = () => {
    switch (data.logicType) {
      case 'condition':
        return data.condition || 'If/Else condition'
      case 'input':
        return 'Collect user input'
      case 'variable':
        return data.variable || 'variable_name'
      case 'delay':
        return data.delay ? `Wait ${data.delay}ms` : 'Wait 1 second'
      default:
        return 'Logic'
    }
  }

  const hasMultipleOutputs = data.logicType === 'condition'

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
            <div className="p-1.5 bg-orange-100 rounded-md text-orange-600">
              {getIcon()}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-sm text-foreground">{data.label}</h3>
              <p className="text-xs text-muted-foreground">{getSubtitle()}</p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs border-orange-200 text-orange-600">
            Logic
          </Badge>
        </div>
        
        {data.description && (
          <p className="text-xs text-muted-foreground mt-2">{data.description}</p>
        )}
      </CardContent>
      
      {hasMultipleOutputs ? (
        <>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            className="w-3 h-3 bg-green-500 border-2 border-background"
            style={{ left: '25%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            className="w-3 h-3 bg-red-500 border-2 border-background"
            style={{ left: '75%' }}
          />
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-primary border-2 border-background"
        />
      )}
    </Card>
  )
})

LogicNode.displayName = 'LogicNode'

export default LogicNode