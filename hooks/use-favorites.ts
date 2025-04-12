"use client";

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

export function useFavorites() {
  const [favoriteStatus, setFavoriteStatus] = useState<Record<number, boolean>>({});
  const [isLoading, setIsLoading] = useState<Record<number, boolean>>({});
  const { user } = useAuth();
  const router = useRouter();
  
  // Check if a pet is favorited
  const checkFavoriteStatus = useCallback(async (pet_id: number) => {
    try {
      setIsLoading(prev => ({ ...prev, [pet_id]: true }));
      
      if (!user) {
        setFavoriteStatus(prev => ({ ...prev, [pet_id]: false }));
        return false;
      }
      
      const response = await fetch(`/api/favorites/check?pet_id=${pet_id}`);
      if (!response.ok) throw new Error('Failed to check favorite status');
      
      const { isFavorite } = await response.json();
      setFavoriteStatus(prev => ({ ...prev, [pet_id]: isFavorite }));
      return isFavorite;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, [pet_id]: false }));
    }
  }, [user]);
  
  // Toggle favorite status for a pet
  const toggleFavorite = useCallback(async (pet_id: number) => {
    try {
      if (!user) {
        router.push('/auth/signin?next=/pets');
        return;
      }
      
      setIsLoading(prev => ({ ...prev, [pet_id]: true }));
      const currentStatus = favoriteStatus[pet_id];
      
      // Optimistic update
      setFavoriteStatus(prev => ({ ...prev, [pet_id]: !currentStatus }));
      
      if (currentStatus) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?pet_id=${pet_id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to remove from favorites');
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pet_id }),
        });
        
        if (!response.ok) throw new Error('Failed to add to favorites');
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setFavoriteStatus(prev => ({ ...prev, [pet_id]: !prev[pet_id] }));
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(prev => ({ ...prev, [pet_id]: false }));
    }
  }, [user, router, favoriteStatus]);
  
  return {
    favoriteStatus,
    isLoading,
    checkFavoriteStatus,
    toggleFavorite,
    isFavorite: (pet_id: number) => favoriteStatus[pet_id] || false,
  };
} 