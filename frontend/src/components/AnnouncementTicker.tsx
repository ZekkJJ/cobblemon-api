'use client';

import { useState, useEffect, useRef } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://cobblemon-los-pitufos-backend.onrender.com';

interface Announcement {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'event';
  createdAt: string;
  expiresAt: string;
}

export default function AnnouncementTicker() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasPlayedSound = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch active announcement
  const fetchAnnouncement = async () => {
    try {
      const response = await fetch(`${API_URL}/api/announcements/active`);
      if (response.ok) {
        const data = await response.json();
        
        if (data.announcement) {
          // Check if this is a new announcement we haven't played sound for
          if (hasPlayedSound.current !== data.announcement.id) {
            setAnnouncement(data.announcement);
            setIsVisible(true);
            
            // Play notification sound ONCE for this announcement
            playNotificationSound();
            hasPlayedSound.current = data.announcement.id;
          } else {
            // Same announcement, just update it
            setAnnouncement(data.announcement);
            setIsVisible(true);
          }
        } else {
          setAnnouncement(null);
          setIsVisible(false);
        }
      }
    } catch (error) {
      console.error('Error fetching announcement:', error);
    }
  };

  const playNotificationSound = () => {
    try {
      // Create audio element for notification sound
      // Using confirm.mp3 as notification sound
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/confirm.mp3');
        audioRef.current.volume = 0.6;
      }
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {
        // Autoplay blocked, that's fine
      });
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchAnnouncement();
    
    // Poll every 10 seconds for new announcements
    const interval = setInterval(fetchAnnouncement, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Check expiration
  useEffect(() => {
    if (!announcement) return;
    
    const checkExpiration = () => {
      if (new Date() > new Date(announcement.expiresAt)) {
        setAnnouncement(null);
        setIsVisible(false);
      }
    };
    
    const interval = setInterval(checkExpiration, 1000);
    return () => clearInterval(interval);
  }, [announcement]);

  if (!isVisible || !announcement) return null;

  const typeStyles = {
    info: 'bg-gradient-to-r from-blue-600 to-blue-500 border-blue-400',
    warning: 'bg-gradient-to-r from-yellow-600 to-orange-500 border-yellow-400',
    success: 'bg-gradient-to-r from-green-600 to-emerald-500 border-green-400',
    event: 'bg-gradient-to-r from-purple-600 to-pink-500 border-purple-400',
  };

  const typeIcons = {
    info: 'fa-info-circle',
    warning: 'fa-exclamation-triangle',
    success: 'fa-check-circle',
    event: 'fa-star',
  };

  // Calculate time remaining
  const getTimeRemaining = () => {
    const now = new Date();
    const expires = new Date(announcement.expiresAt);
    const diff = expires.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  const timeRemaining = getTimeRemaining();

  return (
    <div className={`fixed top-0 left-0 right-0 z-[60] ${typeStyles[announcement.type]} border-b-2 shadow-lg animate-slideDown`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center py-1.5 gap-3">
          {/* Icon */}
          <i className={`fas ${typeIcons[announcement.type]} text-white text-base animate-pulse`}></i>
          
          {/* Scrolling text container */}
          <div className="flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap">
              <span className="text-white font-bold text-xs md:text-sm">
                {announcement.message}
              </span>
              <span className="mx-8 text-white/50">•</span>
              <span className="text-white font-bold text-xs md:text-sm">
                {announcement.message}
              </span>
              <span className="mx-8 text-white/50">•</span>
              <span className="text-white font-bold text-xs md:text-sm">
                {announcement.message}
              </span>
            </div>
          </div>
          
          {/* Time remaining */}
          {timeRemaining && (
            <div className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded text-[10px] text-white/80 shrink-0">
              <i className="fas fa-clock text-[10px]"></i>
              <span>{timeRemaining}</span>
            </div>
          )}
          
          {/* Close button */}
          <button
            onClick={() => setIsVisible(false)}
            className="text-white/70 hover:text-white transition-colors p-0.5 shrink-0"
            title="Ocultar anuncio"
          >
            <i className="fas fa-times text-sm"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
