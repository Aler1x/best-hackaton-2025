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
  const checkFavoriteStatus = useCallback(async (petId: number) => {
    try {
      setIsLoading(prev => ({ ...prev, [petId]: true }));
      
      if (!user) {
        setFavoriteStatus(prev => ({ ...prev, [petId]: false }));
        return false;
      }
      
      const response = await fetch(`/api/favorites/check?petId=${petId}`);
      if (!response.ok) throw new Error('Failed to check favorite status');
      
      const { isFavorite } = await response.json();
      setFavoriteStatus(prev => ({ ...prev, [petId]: isFavorite }));
      return isFavorite;
    } catch (error) {
      console.error('Error checking favorite status:', error);
      return false;
    } finally {
      setIsLoading(prev => ({ ...prev, [petId]: false }));
    }
  }, [user]);
  
  // Toggle favorite status for a pet
  const toggleFavorite = useCallback(async (petId: number) => {
    try {
      if (!user) {
        router.push('/auth/signin?next=/pets');
        return;
      }
      
      setIsLoading(prev => ({ ...prev, [petId]: true }));
      const currentStatus = favoriteStatus[petId];
      
      // Optimistic update
      setFavoriteStatus(prev => ({ ...prev, [petId]: !currentStatus }));
      
      if (currentStatus) {
        // Remove from favorites
        const response = await fetch(`/api/favorites?petId=${petId}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) throw new Error('Failed to remove from favorites');
        toast.success('Removed from favorites');
      } else {
        // Add to favorites
        const response = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ petId }),
        });
        
        if (!response.ok) throw new Error('Failed to add to favorites');
        toast.success('Added to favorites');
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert optimistic update on error
      setFavoriteStatus(prev => ({ ...prev, [petId]: !prev[petId] }));
      toast.error('Failed to update favorites');
    } finally {
      setIsLoading(prev => ({ ...prev, [petId]: false }));
    }
  }, [user, router, favoriteStatus]);
  
  return {
    favoriteStatus,
    isLoading,
    checkFavoriteStatus,
    toggleFavorite,
    isFavorite: (petId: number) => favoriteStatus[petId] || false,
  };
} 