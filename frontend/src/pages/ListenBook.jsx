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
  const [audioSrc, setAudioSrc] = useState(""); // NEW: Stores the direct MP3 link
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);

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
        
        // --- THE MAGIC: DYNAMIC MP3 EXTRACTOR ---
        const url = data.audiobookUrl;
        
        // Check if it's a LibriVox/Archive.org ZIP link
        if (url.includes('archive.org/compress/')) {
          // Extract the unique book identifier from the URL
          const match = url.match(/compress\/([^/]+)/);
          if (match && match[1]) {
            const identifier = match[1];
            try {
              // Ask Archive.org for the metadata of this specific book
              const metaRes = await fetch(`https://archive.org/metadata/${identifier}`);
              const metaData = await metaRes.json();
              
              // Find the first actual .mp3 file inside the archive
              const mp3File = metaData.files.find(f => f.name.endsWith('.mp3'));
              
              if (mp3File) {
                // Build the direct streaming URL
                const directUrl = `https://archive.org/download/${identifier}/${mp3File.name}`;
                setAudioSrc(directUrl);
              } else {
                toast.error("Could not extract a playable MP3 from this archive.");
              }
            } catch (err) {
              console.error("Archive API Error:", err);
              toast.error("Failed to parse audiobook metadata.");
            }
          }
        } else {
          // If it's already a standard link (like Cloudinary), just use it
          setAudioSrc(url.replace('http://', 'https://'));
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

  const togglePlay = () => {
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);
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

  if (loading || !audioSrc) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mb-4"></div>
        <p className="text-slate-400 text-sm animate-pulse">Extracting audio stream...</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col font-sans text-white">
      <audio 
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="h-20 flex items-center justify-between px-6 lg:px-12 bg-slate-900 border-b border-slate-800">
        <h1 className="font-bold text-lg text-slate-200 truncate pr-4">{bookData.title}</h1>
        <button 
          onClick={() => navigate(-1)}
          className="px-5 py-2 bg-slate-800 text-slate-300 rounded-full hover:bg-slate-700 transition-colors font-medium text-sm flex-shrink-0"
        >
          Close Player
        </button>
      </div>

      <div className="flex-grow flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-slate-900">
        
        <div className={`relative w-48 h-48 md:w-64 md:h-64 mb-12 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 p-1 shadow-2xl shadow-indigo-900/50 transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}>
          <div className={`w-full h-full rounded-full bg-slate-900 border-4 border-slate-800 flex items-center justify-center ${isPlaying ? 'animate-[spin_10s_linear_infinite]' : ''}`}>
             <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-slate-700"></div>
          </div>
          {isPlaying && (
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-1 items-end h-6">
               {[1,2,3,4,5].map(i => (
                 <div key={i} className="w-1.5 bg-indigo-500 rounded-t-sm animate-pulse" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }}></div>
               ))}
            </div>
          )}
        </div>

        <h2 className="text-2xl md:text-3xl font-serif font-bold text-white mb-8 text-center px-4">
          {bookData.title} <span className="text-indigo-400 text-sm font-sans uppercase tracking-widest block mt-2">Audiobook</span>
        </h2>

        <div className="w-full max-w-2xl bg-slate-800/50 backdrop-blur-md p-6 md:p-8 rounded-3xl border border-slate-700/50 shadow-xl">
          
          <div className="flex items-center gap-4 mb-8">
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
            <div className="flex items-center gap-2 hidden md:flex w-32">
              <span className="text-slate-400 text-sm">🔈</span>
              <input 
                type="range" min="0" max="1" step="0.05" value={volume} onChange={handleVolumeChange}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-slate-400"
              />
            </div>

            <div className="flex items-center gap-6 md:gap-8 mx-auto md:mx-0">
              <button onClick={() => handleSeek({target: {value: Math.max(0, currentTime - 15)}})} className="text-slate-400 hover:text-white transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><text x="10" y="16" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text></svg>
              </button>
              
              <button onClick={togglePlay} className="w-16 h-16 flex items-center justify-center bg-indigo-600 text-white rounded-full hover:bg-indigo-500 hover:scale-105 transition-all shadow-lg shadow-indigo-600/30">
                {isPlaying ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="ml-1"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                )}
              </button>

              <button onClick={() => handleSeek({target: {value: Math.min(duration, currentTime + 15)}})} className="text-slate-400 hover:text-white transition">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><text x="10" y="16" fontSize="8" fill="currentColor" stroke="none" fontFamily="sans-serif">15</text></svg>
              </button>
            </div>

            <div className="w-32 hidden md:block"></div>
          </div>
        </div>
      </div>
    </div>
  );
}