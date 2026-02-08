'use client';

import { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Terminal } from 'lucide-react';

interface LogEntry {
  timestamp: string;
  type: 'request' | 'response' | 'error' | 'info';
  message: string;
  data?: any;
  duration?: number;
}

let logEntries: LogEntry[] = [];
let listeners: (() => void)[] = [];

export function addLog(type: LogEntry['type'], message: string, data?: any, duration?: number) {
  const entry: LogEntry = {
    timestamp: new Date().toLocaleTimeString(),
    type,
    message,
    data,
    duration,
  };

  logEntries.push(entry);
  if (logEntries.length > 50) {
    logEntries.shift(); // Keep last 50 entries
  }

  // Notify all listeners
  listeners.forEach(fn => fn());
}

export default function DebugConsole() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(logEntries);

  useEffect(() => {
    const updateLogs = () => setLogs([...logEntries]);
    listeners.push(updateLogs);

    return () => {
      listeners = listeners.filter(fn => fn !== updateLogs);
    };
  }, []);

  const clearLogs = () => {
    logEntries = [];
    setLogs([]);
  };

  const getTypeColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'request': return 'text-blue-400';
      case 'response': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'info': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const getTypeIcon = (type: LogEntry['type']) => {
    switch (type) {
      case 'request': return '→';
      case 'response': return '←';
      case 'error': return '✗';
      case 'info': return 'ℹ';
      default: return '·';
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900 border-t border-gray-700 shadow-2xl">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 bg-gray-800 cursor-pointer hover:bg-gray-750 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-sm font-medium text-gray-200">Debug Console</span>
          {logs.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded-full">
              {logs.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {logs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearLogs();
              }}
              className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors"
            >
              Clear
            </button>
          )}
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Console Content */}
      {isOpen && (
        <div className="h-64 overflow-y-auto p-4 font-mono text-xs bg-gray-900">
          {logs.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              No logs yet. API calls will appear here.
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log, index) => (
                <div key={index} className="flex gap-3">
                  <span className="text-gray-500 flex-shrink-0">{log.timestamp}</span>
                  <span className={`flex-shrink-0 ${getTypeColor(log.type)}`}>
                    {getTypeIcon(log.type)}
                  </span>
                  <div className="flex-1">
                    <div className={getTypeColor(log.type)}>
                      {log.message}
                      {log.duration && (
                        <span className="ml-2 text-gray-500">({log.duration}ms)</span>
                      )}
                    </div>
                    {log.data && (
                      <pre className="mt-1 text-gray-400 text-xs overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
