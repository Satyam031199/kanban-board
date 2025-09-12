import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddCardDialog } from './AddCardDialog';
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types/kanban';
import { ScrollArea } from '@/components/ui/scroll-area';
import { createCard, moveCard } from '@/lib/actions/kanban.actions';
import { useToast } from '@/hooks/use-toast';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  onColumnsChange: (columns: KanbanColumnType[]) => void;
  onCardClick?: (card: KanbanCardType) => void;
}

export function KanbanBoard({ columns, onColumnsChange, onCardClick }: KanbanBoardProps) {
  const { toast } = useToast();
  const [activeCard, setActiveCard] = useState<KanbanCardType | null>(null);
  const [addCardDialog, setAddCardDialog] = useState<{
    isOpen: boolean;
    columnId: string | null;
  }>({ isOpen: false, columnId: null });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    setActiveCard(card);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overColumnId = over.id as string;

    const activeCard = findCard(activeCardId);
    if (!activeCard) return;

    const activeColumn = findColumnByCardId(activeCardId);
    const overColumn = columns.find(col => col.id === overColumnId);

    if (!activeColumn || !overColumn) return;

    // Moving between columns
    if (activeColumn.id !== overColumn.id) {
      try {
        // Update in database
        await moveCard(activeCardId, overColumnId, overColumn.cards.length);

        // Update local state
        const newActiveCards = activeColumn.cards.filter(card => card.id !== activeCardId);
        const newOverCards = [...overColumn.cards, activeCard];

        const newColumns = columns.map(col => {
          if (col.id === activeColumn.id) {
            return { ...col, cards: newActiveCards };
          }
          if (col.id === overColumn.id) {
            return { ...col, cards: newOverCards };
          }
          return col;
        });

        onColumnsChange(newColumns);
      } catch (error) {
        console.error('Error moving card:', error);
        toast({
          title: "Error",
          description: "Failed to move card",
          variant: "destructive",
        });
      }
    }
    // Note: Reordering within the same column can be implemented later if needed
  };

  const findCard = (cardId: string): KanbanCardType | null => {
    for (const column of columns) {
      const card = column.cards.find(card => card.id === cardId);
      if (card) return card;
    }
    return null;
  };

  const findColumnByCardId = (cardId: string): KanbanColumnType | null => {
    return columns.find(column => 
      column.cards.some(card => card.id === cardId)
    ) || null;
  };

  const handleAddCard = (columnId: string) => {
    setAddCardDialog({ isOpen: true, columnId });
  };

  const handleCreateCard = async (cardData: Omit<KanbanCardType, 'id' | 'createdAt'>) => {
    if (!addCardDialog.columnId) return;

    try {
      // Create in database
      const newCard = await createCard({
        columnId: addCardDialog.columnId,
        title: cardData.title,
        description: cardData.description,
        priority: cardData.priority,
        assignee: cardData.assignee,
        dueDate: cardData.dueDate,
        tags: cardData.tags,
        position: columns.find(col => col.id === addCardDialog.columnId)?.cards.length || 0,
      });

      // Transform and update local state
      const frontendCard: KanbanCardType = {
        id: newCard.id,
        title: newCard.title,
        description: newCard.description || undefined,
        priority: newCard.priority as 'low' | 'medium' | 'high' | 'critical',
        assignee: newCard.assignee || undefined,
        dueDate: newCard.due_date || undefined,
        createdAt: newCard.created_at,
        tags: newCard.tags || undefined,
      };

      const newColumns = columns.map(col =>
        col.id === addCardDialog.columnId
          ? { ...col, cards: [...col.cards, frontendCard] }
          : col
      );

      onColumnsChange(newColumns);
      
      toast({
        title: "Success",
        description: "Card created successfully",
      });
    } catch (error) {
      console.error('Error creating card:', error);
      toast({
        title: "Error",
        description: "Failed to create card",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCard = (cardId: string, cardData: Omit<KanbanCardType, 'id' | 'createdAt'>) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.map(card => 
        card.id === cardId 
          ? { ...card, ...cardData }
          : card
      )
    }));
    onColumnsChange(newColumns);
  };

  const handleDeleteCard = (cardId: string) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => card.id !== cardId)
    }));
    onColumnsChange(newColumns);
  };

  const currentColumnTitle = addCardDialog.columnId 
    ? columns.find(col => col.id === addCardDialog.columnId)?.title 
    : undefined;

  return (
    <>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="w-full h-full">
          <ScrollArea className="h-full">
            {/* Mobile: Vertical stacking */}
            <div className="md:hidden space-y-4 p-3">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onCardClick={onCardClick}
                  onEditCard={(card) => handleUpdateCard(card.id, card)}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </div>
            
            {/* Desktop: Horizontal layout */}
            <div className="hidden md:flex gap-6 p-6 min-w-max justify-center">
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onAddCard={handleAddCard}
                  onCardClick={onCardClick}
                  onEditCard={(card) => handleUpdateCard(card.id, card)}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
            </div>
          </ScrollArea>
        </div>

        <DragOverlay>
          {activeCard ? (
            <div className="rotate-3 opacity-90">
              <KanbanCard card={activeCard} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <AddCardDialog
        isOpen={addCardDialog.isOpen}
        onOpenChange={(open) => setAddCardDialog(prev => ({ ...prev, isOpen: open }))}
        onAddCard={handleCreateCard}
        columnTitle={currentColumnTitle}
      />
    </>
  );
}