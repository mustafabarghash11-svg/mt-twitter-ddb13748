
-- Fix overly permissive policies
DROP POLICY "Users can create conversations" ON public.conversations;
CREATE POLICY "Users can create conversations" ON public.conversations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY "Users can add participants" ON public.conversation_participants;
CREATE POLICY "Users can add participants" ON public.conversation_participants FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
