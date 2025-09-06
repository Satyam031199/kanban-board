import { useState } from 'react';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { KanbanColumn, KanbanCard } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Settings, Filter, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
    title: 'Quality Control',
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
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-gradient-primary text-primary-foreground shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Manufacturing Control Board</h1>
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
              
              <Button variant="secondary" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
              
              <Button variant="secondary" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="h-[calc(100vh-120px)]">
        <KanbanBoard columns={columns} onColumnsChange={setColumns} />
      </main>
    </div>
  );
};

export default Index;
