import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Calendar, User } from 'lucide-react';
import { KanbanCard as KanbanCardType } from '@/types/kanban';
import { cn } from '@/lib/utils';

interface KanbanCardProps {
  card: KanbanCardType;
  onEdit?: (card: KanbanCardType) => void;
  onDelete?: (cardId: string) => void;
  onCardClick?: (card: KanbanCardType) => void;
}

const priorityColors = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-warning text-warning-foreground',
  high: 'bg-accent text-accent-foreground',
  critical: 'bg-destructive text-destructive-foreground',
};

export function KanbanCard({ card, onEdit, onDelete, onCardClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab active:cursor-grabbing transition-all duration-200',
        'hover:animate-card-hover hover:border-primary/20',
        'bg-card border border-border shadow-sm',
        isDragging && 'opacity-50 rotate-3 shadow-lg'
      )}
      onClick={(e) => {
        // Only trigger onClick if not dragging
        if (!isDragging) {
          onCardClick?.(card);
        }
      }}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <h3 className="font-medium text-card-foreground leading-tight">
            {card.title}
          </h3>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant="secondary" 
            className={cn(priorityColors[card.priority], 'text-xs')}
          >
            {card.priority}
          </Badge>
          {card.tags?.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {card.description && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {card.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            {card.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{card.assignee}</span>
              </div>
            )}
          </div>
          
          {card.dueDate && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(card.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}