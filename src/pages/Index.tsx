import { useState, useMemo } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardDetailModal } from '@/components/kanban/CardDetailModal';
import { DashboardModal } from '@/components/kanban/DashboardModal';
import { KanbanColumn, KanbanCard } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { BarChart3, Filter, Search, X, LogOut, User } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/contexts/AuthContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// Initial demo data
const initialColumns: KanbanColumn[] = [
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      {
        id: '1',
        title: 'Setup Production Line A',
        description: 'Configure and calibrate the new assembly line for Widget A production',
        priority: 'high',
        assignee: 'John Smith',
        dueDate: '2024-01-15',
        createdAt: '2024-01-01T10:00:00Z',
        tags: ['setup', 'production'],
      },
      {
        id: '2',
        title: 'Quality Control Review',
        description: 'Review and update quality control procedures for compliance',
        priority: 'medium',
        assignee: 'Sarah Johnson',
        dueDate: '2024-01-20',
        createdAt: '2024-01-02T14:30:00Z',
        tags: ['quality', 'compliance'],
      },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      {
        id: '3',
        title: 'Machine Maintenance',
        description: 'Scheduled maintenance on CNC Machine #3',
        priority: 'critical',
        assignee: 'Mike Wilson',
        dueDate: '2024-01-12',
        createdAt: '2024-01-03T09:15:00Z',
        tags: ['maintenance', 'critical'],
      },
    ],
  },
  {
    id: 'quality-control',
    title: 'Testing',
    cards: [
      {
        id: '4',
        title: 'Batch Testing #2024-001',
        description: 'Testing 500 units from morning production run',
        priority: 'high',
        assignee: 'Lisa Chen',
        dueDate: '2024-01-11',
        createdAt: '2024-01-04T11:45:00Z',
        tags: ['testing', 'batch'],
      },
    ],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      {
        id: '5',
        title: 'Equipment Calibration',
        description: 'Monthly calibration of measuring instruments completed',
        priority: 'medium',
        assignee: 'Tom Davis',
        dueDate: '2024-01-05',
        createdAt: '2024-01-05T16:20:00Z',
        tags: ['calibration', 'monthly'],
      },
    ],
  },
];

const Index = () => {
  const { user, signOut } = useAuth();
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [isCardModalOpen, setIsCardModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [filters, setFilters] = useState({
    assignee: 'all',
    priority: 'all',
    dueDate: ''
  });

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

  const handleUpdateCard = (cardId: string, cardData: Omit<KanbanCard, 'id' | 'createdAt'>) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.map(card => 
        card.id === cardId 
          ? { ...card, ...cardData }
          : card
      )
    }));
    setColumns(newColumns);
  };

  const handleDeleteCard = (cardId: string) => {
    const newColumns = columns.map(col => ({
      ...col,
      cards: col.cards.filter(card => card.id !== cardId)
    }));
    setColumns(newColumns);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Kanban Board</h1>
              <p className="text-primary-foreground/80 text-sm">
                Production workflow management system
              </p>
            </div>
            
            <div className="flex items-center gap-4">
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
                  <Button variant="secondary" size="sm">
                    <User className="h-4 w-4 mr-2" />
                    {user?.email?.split('@')[0] || 'User'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="text-sm">
                    <User className="h-4 w-4 mr-2" />
                    {user?.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive">
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
        <div className="bg-muted/50 border-b px-6 py-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Active filters:</span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {filters.assignee !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Assignee: {filters.assignee}
              </Badge>
            )}
            {filters.priority !== 'all' && (
              <Badge variant="secondary" className="text-xs">
                Priority: {filters.priority}
              </Badge>
            )}
            {filters.dueDate && (
              <Badge variant="secondary" className="text-xs">
                Due: {filters.dueDate}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Main Board */}
      <main className="h-[calc(100vh-120px)]">
        <KanbanBoard 
          columns={filteredColumns} 
          onColumnsChange={setColumns} 
          onCardClick={handleCardClick}
        />
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
