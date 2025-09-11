export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  assignee?: string;
  dueDate?: string;
  createdAt: string;
  tags?: string[];
}

export interface KanbanColumn {
  id: string;
  title: 'To Do' | 'In Progress' | 'Testing' | 'Done';
  cards: KanbanCard[];
  limit?: number;
}

export type Priority = KanbanCard['priority'];