import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import { Play, Square, Pause } from 'lucide-react';

export const Stopwatch = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [time, setTime] = useState(0); // Time in seconds

  useEffect(() => {
    // Load state from localStorage on mount
    const savedState = localStorage.getItem('drivermetrics_stopwatch');
    if (savedState) {
      const { savedTime, lastStarted, isRunning: wasRunning } = JSON.parse(savedState);
      if (wasRunning) {
        const now = Date.now();
        const elapsed = Math.floor((now - lastStarted) / 1000);
        setTime(savedTime + elapsed);
        setIsRunning(true);
      } else {
        setTime(savedTime);
      }
    }
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(intervalId);
  }, [isRunning]);

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (isRunning) {
      localStorage.setItem('drivermetrics_stopwatch', JSON.stringify({
        savedTime: time,
        lastStarted: Date.now(),
        isRunning: true
      }));
    } else {
      localStorage.setItem('drivermetrics_stopwatch', JSON.stringify({
        savedTime: time,
        lastStarted: null,
        isRunning: false
      }));
    }
  }, [isRunning, time]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTime(0);
    localStorage.removeItem('drivermetrics_stopwatch');
  };

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-zinc-400 mb-1">Tempo na Rua</h3>
          <div className="text-3xl font-mono font-bold text-zinc-100">
            {formatTime(time)}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleStartPause} 
            size="icon" 
            className={`h-12 w-12 rounded-full ${isRunning ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'} text-white`}
          >
            {isRunning ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
          </Button>
          {(time > 0 || isRunning) && (
            <Button 
              onClick={handleStop} 
              size="icon" 
              variant="destructive"
              className="h-12 w-12 rounded-full"
            >
              <Square className="h-5 w-5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
