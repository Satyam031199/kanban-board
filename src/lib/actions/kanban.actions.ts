import { supabase } from '@/integrations/supabase/client';
import { KanbanCard, KanbanColumn } from '@/types/kanban';

export interface DatabaseBoard {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseColumn {
  id: string;
  board_id: string;
  title: string;
  position: number;
  card_limit?: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseCard {
  id: string;
  column_id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  due_date?: string;
  position: number;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

// Board Actions
export const createBoard = async (title: string, description?: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('kanban_boards')
    .insert({
      title,
      description,
      user_id: user.id
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getUserBoards = async () => {
  const { data, error } = await supabase
    .from('kanban_boards')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as DatabaseBoard[];
};

export const updateBoard = async (boardId: string, updates: Partial<Pick<DatabaseBoard, 'title' | 'description'>>) => {
  const { data, error } = await supabase
    .from('kanban_boards')
    .update(updates)
    .eq('id', boardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteBoard = async (boardId: string) => {
  const { error } = await supabase
    .from('kanban_boards')
    .delete()
    .eq('id', boardId);

  if (error) throw error;
};

// Column Actions
export const createColumn = async (boardId: string, title: string, position: number = 0) => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .insert({
      board_id: boardId,
      title,
      position
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getBoardColumns = async (boardId: string) => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .select('*')
    .eq('board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data as DatabaseColumn[];
};

export const updateColumn = async (columnId: string, updates: Partial<Pick<DatabaseColumn, 'title' | 'position' | 'card_limit'>>) => {
  const { data, error } = await supabase
    .from('kanban_columns')
    .update(updates)
    .eq('id', columnId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteColumn = async (columnId: string) => {
  const { error } = await supabase
    .from('kanban_columns')
    .delete()
    .eq('id', columnId);

  if (error) throw error;
};

// Card Actions
export const createCard = async (cardData: {
  columnId: string;
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  position?: number;
  tags?: string[];
}) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User must be authenticated');
  }

  const { data, error } = await supabase
    .from('kanban_cards')
    .insert({
      column_id: cardData.columnId,
      user_id: user.id,
      title: cardData.title,
      description: cardData.description,
      priority: cardData.priority || 'medium',
      assignee: cardData.assignee,
      due_date: cardData.dueDate,
      position: cardData.position || 0,
      tags: cardData.tags
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getColumnCards = async (columnId: string) => {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select('*')
    .eq('column_id', columnId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data as DatabaseCard[];
};

export const getBoardCards = async (boardId: string) => {
  const { data, error } = await supabase
    .from('kanban_cards')
    .select(`
      *,
      kanban_columns!inner(board_id)
    `)
    .eq('kanban_columns.board_id', boardId)
    .order('position', { ascending: true });

  if (error) throw error;
  return data as DatabaseCard[];
};

export const updateCard = async (cardId: string, updates: Partial<Omit<DatabaseCard, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
  const { data, error } = await supabase
    .from('kanban_cards')
    .update(updates)
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const moveCard = async (cardId: string, newColumnId: string, newPosition: number) => {
  const { data, error } = await supabase
    .from('kanban_cards')
    .update({
      column_id: newColumnId,
      position: newPosition
    })
    .eq('id', cardId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteCard = async (cardId: string) => {
  const { error } = await supabase
    .from('kanban_cards')
    .delete()
    .eq('id', cardId);

  if (error) throw error;
};

// Utility functions
export const reorderCards = async (columnId: string, cardIds: string[]) => {
  const updates = cardIds.map((cardId, index) => 
    supabase
      .from('kanban_cards')
      .update({ position: index })
      .eq('id', cardId)
  );

  const results = await Promise.all(updates);
  
  for (const result of results) {
    if (result.error) throw result.error;
  }
  
  return results;
};

export const getFullBoardData = async (boardId: string) => {
  // Get board info
  const { data: board, error: boardError } = await supabase
    .from('kanban_boards')
    .select('*')
    .eq('id', boardId)
    .single();

  if (boardError) throw boardError;

  // Get columns for the board
  const columns = await getBoardColumns(boardId);
  
  // Get all cards for the board
  const cards = await getBoardCards(boardId);

  // Organize cards by column
  const columnsWithCards = columns.map(column => ({
    ...column,
    cards: cards.filter(card => card.column_id === column.id)
  }));

  return {
    board,
    columns: columnsWithCards
  };
};