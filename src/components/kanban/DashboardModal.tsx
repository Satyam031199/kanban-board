import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { KanbanColumn } from '@/types/kanban';
import { CheckCircle, AlertCircle, PlayCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  columns: KanbanColumn[];
}

export const DashboardModal = ({ isOpen, onOpenChange, columns }: DashboardModalProps) => {
  // Calculate task statistics
  const taskStats = columns.map(column => ({
    name: column.title,
    count: column.cards.length,
    id: column.id
  }));

  // Calculate priority distribution across all tasks
  const allTasks = columns.flatMap(col => col.cards);
  const priorityStats = ['low', 'medium', 'high', 'critical'].map(priority => ({
    name: priority,
    count: allTasks.filter(task => task.priority === priority).length
  })).filter(stat => stat.count > 0);

  // Chart configurations
  const chartConfig = {
    todo: {
      label: "To Do",
      color: "hsl(var(--primary))"
    },
    "in-progress": {
      label: "In Progress", 
      color: "hsl(var(--secondary))"
    },
    "quality-control": {
      label: "Testing",
      color: "hsl(var(--accent))"
    },
    done: {
      label: "Done",
      color: "hsl(var(--muted))"
    }
  };

  const priorityConfig = {
    low: {
      label: "Low",
      color: "hsl(var(--priority-low))"
    },
    medium: {
      label: "Medium", 
      color: "hsl(var(--priority-medium))"
    },
    high: {
      label: "High",
      color: "hsl(var(--priority-high))"
    },
    critical: {
      label: "Critical",
      color: "hsl(var(--priority-critical))"
    }
  };

  const totalTasks = allTasks.length;
  const completedTasks = columns.find(col => col.title === 'Done')?.cards.length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[70%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Dashboard Analytics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{completedTasks}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                <PlayCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {columns.find(col => col.title === 'In Progress')?.cards.length || 0}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={cn("text-2xl font-bold", completionRate > 25 ? 'text-success' : 'text-destructive')}>{completionRate}%</div>
              </CardContent>
            </Card>
          </div>

          {/* Charts - Hidden on mobile */}
          <div className="hidden md:grid grid-cols-2 gap-6">
            {/* Task Distribution Bar Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Task Distribution by Status</CardTitle>
                <CardDescription>Number of tasks in each column</CardDescription>
              </CardHeader>
              <CardContent className='flex justify-center'>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <BarChart data={taskStats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                     <Bar 
                      dataKey="count" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Priority Distribution Pie Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Priority Distribution</CardTitle>
                <CardDescription>Tasks breakdown by priority level</CardDescription>
              </CardHeader>
              <CardContent className='flex justify-center'>
                <ChartContainer config={priorityConfig} className="h-[300px]">
                  <PieChart>
                    <Pie
                      data={priorityStats}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ name, count }) => `${name}: ${count}`}
                    >
                      {priorityStats.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={priorityConfig[entry.name as keyof typeof priorityConfig]?.color || '#8884d8'} 
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Breakdown Table */}
          {/* <Card>
            <CardHeader>
              <CardTitle>Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {columns.map((column) => (
                  <div key={column.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <h3 className="font-medium">{column.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {column.cards.length} task{column.cards.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{column.cards.length}</div>
                      <div className="text-xs text-muted-foreground">
                        {totalTasks > 0 ? Math.round((column.cards.length / totalTasks) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card> */}
        </div>
      </DialogContent>
    </Dialog>
  );
};