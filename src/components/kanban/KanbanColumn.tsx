import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types/kanban';
import { KanbanCard } from './KanbanCard';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  column: KanbanColumnType;
  onAddCard?: (columnId: string) => void;
  onEditCard?: (card: KanbanCardType) => void;
  onDeleteCard?: (cardId: string) => void;
  onCardClick?: (card: KanbanCardType) => void;
}

export function KanbanColumn({ 
  column, 
  onAddCard, 
  onEditCard, 
  onDeleteCard,
  onCardClick
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex flex-col h-full min-w-[300px] max-w-[350px]">
      {/* Column Header */}
      <div className="p-4 bg-column-bg rounded-t-lg border border-border">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-column-header text-lg">
            {column.title}
          </h2>
          <Badge variant="secondary" className="bg-muted">
            {column.cards.length}
            {column.limit && `/${column.limit}`}
          </Badge>
        </div>
        
        <Button
          onClick={() => onAddCard?.(column.id)}
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Card
        </Button>
      </div>

      {/* Cards Container */}
      <Card
        ref={setNodeRef}
        className={cn(
          'flex-1 p-4 rounded-t-none border-t-0 bg-column-bg/50 transition-colors',
          isOver && 'bg-drag-active/10 border-drag-active animate-drag-enter'
        )}
      >
        <SortableContext items={column.cards} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[200px]">
            {column.cards.map((card) => (
              <div key={card.id} className="group">
                <KanbanCard
                  card={card}
                  onEdit={onEditCard}
                  onDelete={onDeleteCard}
                  onCardClick={onCardClick}
                />
              </div>
            ))}
            
            {column.cards.length === 0 && (
              <div className="flex items-center justify-center h-32 text-muted-foreground">
                <div className="text-center">
                  <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No cards yet</p>
                  <p className="text-xs">Add a card to get started</p>
                </div>
              </div>
            )}
          </div>
        </SortableContext>
      </Card>
    </div>
  );
}