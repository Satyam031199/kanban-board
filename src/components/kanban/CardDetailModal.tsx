import { useState } from 'react';
import { KanbanCard } from '@/types/kanban';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, User, Clock, Tag, Edit, Save, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CardDetailModalProps {
  card: KanbanCard | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCard: (cardId: string, cardData: Omit<KanbanCard, 'id' | 'createdAt'>) => void;
  onDeleteCard: (cardId: string) => void;
}

export function CardDetailModal({ 
  card, 
  isOpen, 
  onOpenChange, 
  onUpdateCard, 
  onDeleteCard 
}: CardDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Omit<KanbanCard, 'id' | 'createdAt'>>({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    dueDate: '',
    tags: []
  });

  if (!card) return null;

  const handleEdit = () => {
    setEditData({
      title: card.title,
      description: card.description || '',
      priority: card.priority,
      assignee: card.assignee || '',
      dueDate: card.dueDate || '',
      tags: card.tags || []
    });
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdateCard(card.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const handleDelete = () => {
    onDeleteCard(card.id);
    onOpenChange(false);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-accent text-accent-foreground';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const addTag = (newTag: string) => {
    if (newTag && !editData.tags?.includes(newTag)) {
      setEditData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag]
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Edit Card' : 'Card Details'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <>
                  <Button variant="outline" size="sm" onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive hover:text-destructive-foreground">
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Card</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{card.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            {isEditing ? (
              <Input
                value={editData.title}
                onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Card title"
              />
            ) : (
              <h2 className="text-lg font-semibold">{card.title}</h2>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            {isEditing ? (
              <Textarea
                value={editData.description}
                onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Card description"
                rows={4}
              />
            ) : (
              <p className="text-muted-foreground whitespace-pre-wrap">
                {card.description || 'No description provided'}
              </p>
            )}
          </div>

          <Separator />

          {/* Card Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Priority */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Priority
              </label>
              {isEditing ? (
                <Select value={editData.priority} onValueChange={(value) => 
                  setEditData(prev => ({ ...prev, priority: value as any }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={getPriorityColor(card.priority)}>
                  {card.priority.toUpperCase()}
                </Badge>
              )}
            </div>

            {/* Assignee */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                Assignee
              </label>
              {isEditing ? (
                <Input
                  value={editData.assignee}
                  onChange={(e) => setEditData(prev => ({ ...prev, assignee: e.target.value }))}
                  placeholder="Assigned to"
                />
              ) : (
                <p className="text-muted-foreground">{card.assignee || 'Unassigned'}</p>
              )}
            </div>

            {/* Due Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Due Date
              </label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editData.dueDate}
                  onChange={(e) => setEditData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              ) : (
                <p className="text-muted-foreground">
                  {card.dueDate ? format(new Date(card.dueDate), 'PPP') : 'No due date'}
                </p>
              )}
            </div>

            {/* Created Date */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Created
              </label>
              <p className="text-muted-foreground">
                {format(new Date(card.createdAt), 'PPP p')}
              </p>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Tags</label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {editData.tags?.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder="Add tag (press Enter)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addTag(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {card.tags?.length ? (
                  card.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No tags</p>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}