-- Create kanban boards table
CREATE TABLE public.kanban_boards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kanban columns table
CREATE TABLE public.kanban_columns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  board_id UUID NOT NULL REFERENCES public.kanban_boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  card_limit INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create kanban cards table
CREATE TABLE public.kanban_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id UUID NOT NULL REFERENCES public.kanban_columns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  assignee TEXT,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.kanban_boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_cards ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for kanban_boards
CREATE POLICY "Users can view their own boards" 
ON public.kanban_boards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own boards" 
ON public.kanban_boards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own boards" 
ON public.kanban_boards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own boards" 
ON public.kanban_boards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create RLS policies for kanban_columns
CREATE POLICY "Users can view columns of their boards" 
ON public.kanban_columns 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards 
    WHERE id = kanban_columns.board_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create columns in their boards" 
ON public.kanban_columns 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.kanban_boards 
    WHERE id = kanban_columns.board_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can update columns in their boards" 
ON public.kanban_columns 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards 
    WHERE id = kanban_columns.board_id 
    AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete columns in their boards" 
ON public.kanban_columns 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.kanban_boards 
    WHERE id = kanban_columns.board_id 
    AND user_id = auth.uid()
  )
);

-- Create RLS policies for kanban_cards
CREATE POLICY "Users can view their own cards" 
ON public.kanban_cards 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cards" 
ON public.kanban_cards 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards" 
ON public.kanban_cards 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards" 
ON public.kanban_cards 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_kanban_boards_user_id ON public.kanban_boards(user_id);
CREATE INDEX idx_kanban_columns_board_id ON public.kanban_columns(board_id);
CREATE INDEX idx_kanban_cards_column_id ON public.kanban_cards(column_id);
CREATE INDEX idx_kanban_cards_user_id ON public.kanban_cards(user_id);

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_kanban_boards_updated_at
BEFORE UPDATE ON public.kanban_boards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_columns_updated_at
BEFORE UPDATE ON public.kanban_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_cards_updated_at
BEFORE UPDATE ON public.kanban_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();