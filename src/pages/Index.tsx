import { useState, useMemo, useEffect } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { DashboardModal } from '@/components/kanban/DashboardModal';
import { KanbanColumn, KanbanCard } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { BarChart3, Filter, Search, X, LogOut, User } from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { 
  createBoard, 
  createColumn, 
  getFullBoardData, 
  updateCard, 
  deleteCard,
  DatabaseCard,
  DatabaseColumn 
} from '@/lib/actions/kanban.actions';
import Loader from '@/components/kanban/Loader';

// Transform database data to frontend format
const transformDatabaseData = (columns: (DatabaseColumn & { cards: DatabaseCard[] })[]): KanbanColumn[] => {
  return columns.map(col => ({
    id: col.id,
    title: col.title as 'To Do' | 'In Progress' | 'Testing' | 'Done',
    limit: col.card_limit || undefined,
    cards: col.cards.map(card => ({
      id: card.id,
      title: card.title,
      description: card.description || undefined,
      priority: card.priority as 'low' | 'medium' | 'high' | 'critical',
      assignee: card.assignee || undefined,
      dueDate: card.due_date || undefined,
      createdAt: card.created_at,
      tags: card.tags || undefined,
    }))
  }));
};

const Index = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [columns, setColumns] = useState<KanbanColumn[]>([]);
  const [currentBoardId, setCurrentBoardId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [filters, setFilters] = useState({
    assignee: 'all',
    priority: 'all',
    dueDate: ''
  });

  // Initialize board data
  useEffect(() => {
    const initializeBoard = async () => {
      if (!user) return;
      try {
        setLoading(true);
        
        // Try to get user's existing boards
        const { getUserBoards } = await import('@/lib/actions/kanban.actions');
        const boards = await getUserBoards();
        
        let boardId: string;
        
        if (boards.length === 0) {
          // Create default board and columns for new users
          const board = await createBoard('My Kanban Board', 'Production workflow management system');
          boardId = board.id;
          
          // Create default columns
          await Promise.all([
            createColumn(boardId, 'To Do', 0),
            createColumn(boardId, 'In Progress', 1),
            createColumn(boardId, 'Testing', 2),
            createColumn(boardId, 'Done', 3),
          ]);
        } else {
          // Use the first (most recent) board
          boardId = boards[0].id;
        }
        
        // Load full board data
        const boardData = await getFullBoardData(boardId);
        setCurrentBoardId(boardId);
        setColumns(transformDatabaseData(boardData.columns));
        
      } catch (error) {
        console.error('Error initializing board:', error);
        toast({
          title: "Error",
          description: "Failed to load board data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    initializeBoard();
  }, []);

  // Get unique assignees and priorities for filter options
  const filterOptions = useMemo(() => {
    const allCards = columns.flatMap(col => col.cards);
    const assignees = [...new Set(allCards.map(card => card.assignee).filter(Boolean))];
    const priorities = ['low', 'medium', 'high', 'critical'];
    return { assignees, priorities };
  }, [columns]);

  // Filter and search logic
  const filteredColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      cards: column.cards.filter(card => {
        // Search filter
        const matchesSearch = !searchTerm || 
          card.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (card.description && card.description.toLowerCase().includes(searchTerm.toLowerCase()));

        // Assignee filter
        const matchesAssignee = filters.assignee === 'all' || card.assignee === filters.assignee;

        // Priority filter
        const matchesPriority = filters.priority === 'all' || card.priority === filters.priority;

        // Due date filter (simple - could be enhanced)
        const matchesDueDate = !filters.dueDate || card.dueDate === filters.dueDate;

        return matchesSearch && matchesAssignee && matchesPriority && matchesDueDate;
      })
    }));
  }, [columns, searchTerm, filters]);

  const clearFilters = () => {
    setFilters({ assignee: 'all', priority: 'all', dueDate: '' });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm || filters.assignee !== 'all' || filters.priority !== 'all' || filters.dueDate;

  const handleCardClick = (card: KanbanCard) => {
    setSelectedCard(card);
    setIsCardModalOpen(true);
  };

  const handleUpdateCard = async (cardId: string, cardData: Omit<KanbanCard, 'id' | 'createdAt'>) => {
    try {
      // Update in database
      await updateCard(cardId, {
        title: cardData.title,
        description: cardData.description,
        priority: cardData.priority,
        assignee: cardData.assignee,
        due_date: cardData.dueDate,
        tags: cardData.tags,
      });

      // Update local state
      const newColumns = columns.map(col => ({
        ...col,
        cards: col.cards.map(card => 
          card.id === cardId 
            ? { ...card, ...cardData }
            : card
        )
      }));
      setColumns(newColumns);

      toast({
        title: "Success",
        description: "Card updated successfully",
      });
    } catch (error) {
      console.error('Error updating card:', error);
      toast({
        title: "Error",
        description: "Failed to update card",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCard = async (cardId: string) => {
    try {
      // Delete from database
      await deleteCard(cardId);

      // Update local state
      const newColumns = columns.map(col => ({
        ...col,
        cards: col.cards.filter(card => card.id !== cardId)
      }));
      setColumns(newColumns);

      toast({
        title: "Success",
        description: "Card deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting card:', error);
      toast({
        title: "Error",
        description: "Failed to delete card",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-bold truncate">Kanban Board</h1>
              <p className="text-primary-foreground/80 text-xs sm:text-sm hidden sm:block">
                Production workflow management system
              </p>
            </div>
            
            {/* Mobile Actions */}
            <div className="flex items-center gap-2 sm:hidden">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="relative">
                    <Search className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search cards..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="relative">
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="ml-1 h-2 w-2 p-0">
                        •
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filters</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Assignee</label>
                        <Select value={filters.assignee} onValueChange={(value) => 
                          setFilters(prev => ({ ...prev, assignee: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="All assignees" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {filterOptions.assignees.map(assignee => (
                              <SelectItem key={assignee} value={assignee}>
                                {assignee}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priority</label>
                        <Select value={filters.priority} onValueChange={(value) => 
                          setFilters(prev => ({ ...prev, priority: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="All priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {filterOptions.priorities.map(priority => (
                              <SelectItem key={priority} value={priority}>
                                <span className="capitalize">{priority}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Due Date</label>
                        <Input
                          type="date"
                          value={filters.dueDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="secondary" size="sm" onClick={() => setIsDashboardOpen(true)}>
                <BarChart3 className="h-4 w-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className='cursor-pointer h-8 w-8'>
                    <AvatarImage src={user?.identities[0]?.identity_data?.avatar_url} />
                    <AvatarFallback className='text-white bg-red-500 text-xs'>{user?.identities[0]?.identity_data?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm">
                    <User className="h-4 w-4 mr-2" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search cards..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/60"
                />
              </div>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" size="sm" className="relative">
                    <Filter className="h-4 w-4 mr-2" />
                    Filters
                    {hasActiveFilters && (
                      <Badge variant="destructive" className="ml-2 h-2 w-2 p-0 text-[10px]">
                        •
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">Filters</h3>
                      {hasActiveFilters && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Clear
                        </Button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-1 block">Assignee</label>
                        <Select value={filters.assignee} onValueChange={(value) => 
                          setFilters(prev => ({ ...prev, assignee: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="All assignees" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All assignees</SelectItem>
                            {filterOptions.assignees.map(assignee => (
                              <SelectItem key={assignee} value={assignee}>
                                {assignee}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Priority</label>
                        <Select value={filters.priority} onValueChange={(value) => 
                          setFilters(prev => ({ ...prev, priority: value }))
                        }>
                          <SelectTrigger>
                            <SelectValue placeholder="All priorities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All priorities</SelectItem>
                            {filterOptions.priorities.map(priority => (
                              <SelectItem key={priority} value={priority}>
                                <span className="capitalize">{priority}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium mb-1 block">Due Date</label>
                        <Input
                          type="date"
                          value={filters.dueDate}
                          onChange={(e) => setFilters(prev => ({ ...prev, dueDate: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              
              <Button variant="secondary" size="sm" onClick={() => setIsDashboardOpen(true)}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className='cursor-pointer'>
                    <AvatarImage src={user?.identities[0]?.identity_data?.avatar_url} />
                    <AvatarFallback className='text-white bg-red-500'>{user?.identities[0]?.identity_data?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm">
                    <User className="h-4 w-4 mr-2" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive cursor-pointer">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="bg-muted/50 border-b px-4 sm:px-6 py-2">
          <div className="flex items-center gap-2 text-sm overflow-x-auto">
            <span className="text-muted-foreground whitespace-nowrap">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Search: "{searchTerm}"
              </Badge>
            )}
            {filters.assignee !== 'all' && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Assignee: {filters.assignee}
              </Badge>
            )}
            {filters.priority !== 'all' && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Priority: {filters.priority}
              </Badge>
            )}
            {filters.dueDate && (
              <Badge variant="secondary" className="text-xs whitespace-nowrap">
                Due: {filters.dueDate}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main Board */}
      <main className="h-[calc(100vh-120px)] sm:h-[calc(100vh-140px)]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader />
            </div>
          </div>
        ) : (
          <KanbanBoard 
            columns={filteredColumns} 
            onColumnsChange={setColumns} 
            onCardClick={handleCardClick}
          />
        )}
      </main>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        isOpen={isCardModalOpen}
        onOpenChange={setIsCardModalOpen}
        onUpdateCard={handleUpdateCard}
        onDeleteCard={handleDeleteCard}
      />

      {/* Dashboard Modal */}
      <DashboardModal
        isOpen={isDashboardOpen}
        onOpenChange={setIsDashboardOpen}
        columns={columns}
      />
    </div>
  );
};

export default Index;
