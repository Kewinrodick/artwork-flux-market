import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export const useWishlist = (designId: string) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user && designId) {
      checkWishlist();
    }
  }, [user, designId]);

  const checkWishlist = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('wishlist')
      .select('id')
      .eq('user_id', user.id)
      .eq('design_id', designId)
      .maybeSingle();

    setIsInWishlist(!!data);
  };

  const toggleWishlist = async () => {
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please sign in to add designs to your wishlist',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('design_id', designId);

        if (error) throw error;

        setIsInWishlist(false);
        toast({
          title: 'Removed from wishlist',
          description: 'Design removed from your wishlist',
        });
      } else {
        // Add to wishlist
        const { error } = await supabase
          .from('wishlist')
          .insert({ user_id: user.id, design_id: designId });

        if (error) throw error;

        setIsInWishlist(true);
        toast({
          title: 'Added to wishlist',
          description: 'Design saved to your wishlist',
        });
      }
    } catch (error) {
      console.error('Wishlist error:', error);
      toast({
        title: 'Error',
        description: 'Failed to update wishlist',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return { isInWishlist, loading, toggleWishlist };
};