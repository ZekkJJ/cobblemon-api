'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export default function MusicPlayer() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(true);
    const [volume, setVolume] = useState(0.3);
    const [showControls, setShowControls] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
    const animationRef = useRef<number | null>(null);

    // Load mute state from localStorage
    useEffect(() => {
        const savedMuted = localStorage.getItem('music_muted');
        const savedVolume = localStorage.getItem('music_volume');

        if (savedMuted !== null) {
            setIsMuted(savedMuted === 'true');
        }
        if (savedVolume !== null) {
            setVolume(parseFloat(savedVolume));
        }
    }, []);

    // Save mute state to localStorage
    useEffect(() => {
        localStorage.setItem('music_muted', String(isMuted));
        localStorage.setItem('music_volume', String(volume));
    }, [isMuted, volume]);

    // Initialize audio
    useEffect(() => {
        const audio = new Audio('/background-music.mp3');
        audio.loop = true;
        audio.volume = volume;
        audio.muted = isMuted;
        audioRef.current = audio;

        audio.addEventListener('canplaythrough', () => {
            setIsLoaded(true);
        });

        // Auto-play when user interacts
        const handleInteraction = () => {
            if (audio.paused && !isMuted) {
                audio.play().catch(() => { });
                setIsPlaying(true);
            }
        };

        document.addEventListener('click', handleInteraction, { once: true });

        return () => {
            audio.pause();
            document.removeEventListener('click', handleInteraction);
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, []);

    // Setup audio analyzer for visualizer
    const setupAnalyzer = useCallback(() => {
        if (!audioRef.current || audioContextRef.current) return;

        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = audioContext.createMediaElementSource(audioRef.current);
            sourceRef.current = source;
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            drawVisualizer();
        } catch (e) {
            console.error('Audio context error:', e);
        }
    }, []);

    // Draw visualizer
    const drawVisualizer = useCallback(() => {
        if (!canvasRef.current || !analyserRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const analyser = analyserRef.current;
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyser.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = canvas.width / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = (dataArray[i] / 255) * canvas.height;

                // Gradient from red to yellow
                const hue = 0 + (i / bufferLength) * 30;
                ctx.fillStyle = `hsla(${hue}, 80%, 50%, 0.8)`;

                ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);
                x += barWidth;
            }
        };

        draw();
    }, []);

    // Handle play/pause
    const togglePlay = async () => {
        if (!audioRef.current) return;

        if (!audioContextRef.current) {
            setupAnalyzer();
        }

        if (audioContextRef.current?.state === 'suspended') {
            await audioContextRef.current.resume();
        }

        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            await audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Handle mute toggle
    const toggleMute = async () => {
        if (!audioRef.current) return;

        const newMuted = !isMuted;
        setIsMuted(newMuted);
        audioRef.current.muted = newMuted;

        if (!newMuted && !isPlaying) {
            if (!audioContextRef.current) {
                setupAnalyzer();
            }
            if (audioContextRef.current?.state === 'suspended') {
                await audioContextRef.current.resume();
            }
            await audioRef.current.play();
            setIsPlaying(true);
        }
    };

    // Handle volume change
    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };

    return (
        <div
            className="fixed bottom-4 right-4 z-50"
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
        >
            {/* Visualizer and controls container */}
            <div
                className={`flex items-end gap-2 bg-gray-900/90 backdrop-blur-lg rounded-xl border border-gray-700 p-2 transition-all duration-300 ${showControls ? 'opacity-100' : 'opacity-70'
                    }`}
            >
                {/* Mini visualizer */}
                <canvas
                    ref={canvasRef}
                    width={60}
                    height={24}
                    className="rounded"
                />

                {/* Controls */}
                <div className={`flex items-center gap-2 transition-all duration-300 ${showControls ? 'w-32 opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                    {/* Volume slider */}
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="w-16 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />
                </div>

                {/* Mute button */}
                <button
                    onClick={toggleMute}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isMuted
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-red-600 text-white'
                        }`}
                    title={isMuted ? 'Activar música' : 'Silenciar'}
                >
                    <i className={`fas fa-${isMuted ? 'volume-mute' : 'volume-up'}`}></i>
                </button>
            </div>

            {/* Ticker - shows when playing */}
            {isPlaying && !isMuted && (
                <div className="absolute -top-6 right-0 bg-gray-900/80 rounded-lg px-2 py-0.5 text-[10px] text-gray-400 whitespace-nowrap overflow-hidden max-w-[150px]">
                    <span className="inline-block animate-marquee">
                        🎵 Littleroot Town - Pokémon Ruby/Sapphire/Emerald
                    </span>
                </div>
            )}
        </div>
    );
}
