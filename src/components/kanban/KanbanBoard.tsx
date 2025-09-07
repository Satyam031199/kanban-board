import { useState } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddCardDialog } from './AddCardDialog';
import { KanbanColumn as KanbanColumnType, KanbanCard as KanbanCardType } from '@/types/kanban';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KanbanBoardProps {
  columns: KanbanColumnType[];
  onColumnsChange: (columns: KanbanColumnType[]) => void;
  onCardClick?: (card: KanbanCardType) => void;
}

export function KanbanBoard({ columns, onColumnsChange, onCardClick }: KanbanBoardProps) {
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
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const card = findCard(active.id as string);
    setActiveCard(card);
  };

  const handleDragEnd = (event: DragEndEvent) => {
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

    // Moving within the same column
    if (activeColumn.id === overColumn.id) {
      const cardIndex = activeColumn.cards.findIndex(card => card.id === activeCardId);
      const newCards = arrayMove(activeColumn.cards, cardIndex, cardIndex);
      
      const newColumns = columns.map(col =>
        col.id === activeColumn.id ? { ...col, cards: newCards } : col
      );
      
      onColumnsChange(newColumns);
    } else {
      // Moving between columns
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
    }
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

  const handleCreateCard = (cardData: Omit<KanbanCardType, 'id' | 'createdAt'>) => {
    if (!addCardDialog.columnId) return;

    const newCard: KanbanCardType = {
      ...cardData,
      id: `card-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    const newColumns = columns.map(col =>
      col.id === addCardDialog.columnId
        ? { ...col, cards: [...col.cards, newCard] }
        : col
    );

    onColumnsChange(newColumns);
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
        <ScrollArea className="w-full">
          <div className="flex gap-6 p-6 min-w-max justify-center">
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