import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export default function ListenBook() {
  const { id } = useParams();
  const navigate = useNavigate();
  const audioRef = useRef(null);
  
  const [bookData, setBookData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Playlist State
  const [playlist, setPlaylist] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

  // --- SMART BOOKMARKING REF ---
  // We use a ref to store the initial time so we can jump to it once the audio loads
  const initialTimeRef = useRef(0);

  useEffect(() => {
    const fetchAudioAccess = async () => {
      try {
        const { data } = await api.get(`/books/${id}/read`);
        if (!data.audiobookUrl) {
          toast.error("No audiobook format available for this title.");
          navigate(-1);
          return;
        }
        
        setBookData(data);
        
        // --- FETCH SMART BOOKMARK STATE ---
        try {
          const stateRes = await api.get(`/books/${id}/playback-state`);
          if (stateRes.data) {
            setCurrentTrackIndex(stateRes.data.trackIndex || 0);
            initialTimeRef.current = stateRes.data.currentTime || 0;
            setCurrentTime(stateRes.data.currentTime || 0);
          }
        } catch (e) {
          console.warn("Could not load previous playback state", e);
        }
        
        const url = data.audiobookUrl;
        
        if (url.includes('archive.org/compress/')) {
          const match = url.match(/compress\/([^/]+)/);
          if (match && match[1]) {
            const identifier = match[1];
            try {
              const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
              const metaData = await metaRes.json();
              
              let mp3Files = metaData.files.filter(f => f.name.endsWith('.mp3') && f.source === 'original');
              
              if (mp3Files.length === 0) {
                mp3Files = metaData.files.filter(f => f.name.endsWith('.mp3') && !f.name.includes('_64kb'));
              }

              if (mp3Files.length > 0) {
                mp3Files.sort((a, b) => a.name.localeCompare(b.name));
                const formattedPlaylist = mp3Files.map(file => ({
                  title: file.title || file.name.replace('.mp3', '').replace(/_/g, ' '),
                  url: `https://archive.org/download/${identifier}/${file.name}`
                }));
                setPlaylist(formattedPlaylist);
              } else {
                toast.error("Could not extract playable MP3s from this archive.");
              }
            } catch (err) {
              console.error("Archive API Error:", err);
              toast.error("Failed to parse audiobook metadata.");
            }
          }
        } else {
          setPlaylist([{ title: "Full Audiobook", url: url.replace('http://', 'https://') }]);
        }
      } catch (err) {
        toast.error(err.response?.data?.message || "Access denied.");
        navigate('/my-orders'); 
      } finally {
        setLoading(false);
      }
    };

    fetchAudioAccess();
  }, [id, navigate]);

  // --- PERIODIC SYNC (SMART BOOKMARKING) ---
  useEffect(() => {
    // Only sync if the user is actively listening
    if (!isPlaying || playlist.length === 0) return;

    // Save progress to the database every 10 seconds
    const syncInterval = setInterval(() => {
      if (audioRef.current) {
        api.put(`/books/${id}/playback-state`, {
          trackIndex: currentTrackIndex,
          currentTime: audioRef.current.currentTime
        }).catch(err => console.warn("Failed to sync playback state", err));
      }
    }, 10000); 

    return () => clearInterval(syncInterval);
  }, [isPlaying, currentTrackIndex, id, playlist.length]);

  // Sync one last time when the component unmounts (e.g. user leaves the page)
  useEffect(() => {
    return () => {
      if (audioRef.current && playlist.length > 0) {
        api.put(`/books/${id}/playback-state`, {
          trackIndex: currentTrackIndex,
          currentTime: audioRef.current.currentTime
        }).catch(() => {});
      }
    };
  }, [id, currentTrackIndex, playlist.length]);

  // --- AUDIO CONTROLS ---
  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleNextTrack = () => {
    if (currentTrackIndex < playlist.length - 1) {
      setCurrentTrackIndex(prev => prev + 1);
      setIsPlaying(true);
    }
  };

  const handlePrevTrack = () => {
    if (currentTrackIndex > 0) {
      setCurrentTrackIndex(prev => prev - 1);
      setIsPlaying(true);
    }
  };

  const selectTrack = (index) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  
  const handleLoadedMetadata = () => {
    setDuration(audioRef.current.duration);
    
    // Jump to the saved bookmark time when the audio file finishes loading!
    if (initialTimeRef.current > 0) {
      audioRef.current.currentTime = initialTimeRef.current;
      setCurrentTime(initialTimeRef.current);
      initialTimeRef.current = 0; // Reset so it only happens once per track load
    }
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) audioRef.current.volume = val;
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  if (loading || playlist.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">Extracting chapters...</p>
      </div>
    );
  }

  const currentTrack = playlist[currentTrackIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col font-sans text-white overflow-hidden">
      
      {/* 
        UPDATED: We use a key on the audio element! 
        When the URL changes, React destroys the old audio element and creates a brand new one.
        This fixes racing condition bugs and lets autoPlay handle the transition natively.
      */}
      <audio 
        key={currentTrack.url} 
        ref={audioRef}
        src={currentTrack.url}
        autoPlay={isPlaying} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleNextTrack} 
      />

      {/* Top Navigation */}
      <div className="h-20 flex items-center justify-between px-6 lg:px-12 bg-slate-900 border-b border-slate-800 z-10">
        <h1 className="font-bold text-lg text-slate-200 truncate pr-4">{bookData.title}</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors font-medium text-sm flex-shrink-0"
        >
          Close Player
        </button>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Main Player */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900 relative">
          
          <div className={`relative w-40 h-40 md:w-56 md:h-56 mb-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-900/50 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
            <div className={`w-full h-full rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
               <div className="w-10 h-10 rounded-full bg-slate-800 border-2 border-slate-700"></div>
            </div>
            {isPlaying && (
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 flex gap-1 items-end h-5">
                 {[1,2,3,4,5].map(i => (
                   <div key={i} className="w-1.5 bg-indigo-500 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
                 ))}
              </div>
            )}
          </div>

          <div className="text-center max-w-md px-4 mb-8">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-white mb-1 truncate">
              {currentTrack.title}
            </h2>
            <p className="text-indigo-400 text-xs font-sans uppercase tracking-widest">
              Chapter {currentTrackIndex + 1} of {playlist.length}
            </p>
          </div>

          {/* Controls Container */}
          <div className="w-full max-w-xl bg-slate-800/80 backdrop-blur-md p-6 rounded-3xl border border-slate-700/50 shadow-xl">
            
            {/* Progress Bar */}
            <div className="flex items-center gap-4 mb-6">
              <span className="text-xs font-medium text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>
              <input 
                type="range" 
                min="0" 
                max={duration || 100} 
                value={currentTime} 
                onChange={handleSeek}
                className="flex-grow h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400"
              />
              <span className="text-xs font-medium text-slate-400 w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex items-center justify-between">
              
              {/* Volume */}
              <div className="flex items-center gap-2 hidden sm:flex w-24">
                <span className="text-slate-400 text-sm">🔈</span>
                <input 
                  type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange}
                  className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
                />
              </div>

              {/* Playback Controls */}
              <div className="flex items-center gap-6 mx-auto sm:mx-0">
                <button 
                  onClick={handlePrevTrack} 
                  disabled={currentTrackIndex === 0}
                  className="text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
                
                <button onClick={togglePlay} className="w-14 h-14 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-500 hover:scale-105 transition-all shadow-lg shadow-indigo-600/30">
                  {isPlaying ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  )}
                </button>

                <button 
                  onClick={handleNextTrack}
                  disabled={currentTrackIndex === playlist.length - 1}
                  className="text-slate-400 hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2"/></svg>
                </button>
              </div>

              <div className="w-24 hidden sm:block"></div>
            </div>
          </div>
        </div>

        {/* Right Side: Playlist Sidebar */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-64 lg:h-auto">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0">
            <h3 className="font-bold text-slate-200">Chapters ({playlist.length})</h3>
          </div>
          
          <div className="flex-grow overflow-y-auto custom-scrollbar p-2 space-y-1">
            {playlist.map((track, index) => (
              <button
                key={index}
                onClick={() => selectTrack(index)}
                className={`w-full text-left p-3 rounded-xl flex items-center gap-3 transition-colors ${
                  currentTrackIndex === index 
                    ? 'bg-indigo-600/20 text-indigo-300' 
                    : 'hover:bg-slate-800 text-slate-400'
                }`}
              >
                <div className="w-6 text-xs opacity-50 font-mono">{index + 1}</div>
                <div className="flex-grow truncate text-sm font-medium">
                  {track.title}
                </div>
                {currentTrackIndex === index && isPlaying && (
                  <div className="w-4 h-4 rounded-full bg-indigo-500 animate-pulse flex-shrink-0"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}