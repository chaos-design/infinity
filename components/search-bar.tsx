import { Search } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { Settings } from '../hooks/use-settings';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface SearchBarProps {
  engine: Settings['searchEngine'];
  onEngineChange: (engine: Settings['searchEngine']) => void;
}

const engines = {
  google: {
    url: 'https://www.google.com/search?q=',
    placeholder: 'Search Google...',
    label: 'Google',
    accent: 'from-white/20 to-white/5',
  },
  bing: {
    url: 'https://www.bing.com/search?q=',
    placeholder: 'Search Bing...',
    label: 'Bing',
    accent: 'from-cyan-400/20 to-emerald-400/5',
  },
};

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M21.64 12.2c0-.64-.06-1.25-.16-1.84H12v3.48h5.42a4.64 4.64 0 0 1-2.01 3.05v2.52h3.25c1.9-1.75 2.98-4.33 2.98-7.21Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.25-2.52c-.9.6-2.05.96-3.36.96-2.58 0-4.76-1.74-5.54-4.08H3.1v2.6A9.99 9.99 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.46 13.92A5.99 5.99 0 0 1 6.16 12c0-.67.12-1.31.3-1.92v-2.6H3.1A10 10 0 0 0 2 12c0 1.61.38 3.14 1.1 4.52l3.36-2.6Z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.98c1.47 0 2.8.5 3.84 1.49l2.87-2.87C16.95 2.98 14.7 2 12 2A9.99 9.99 0 0 0 3.1 7.48l3.36 2.6C7.24 7.72 9.42 5.98 12 5.98Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function BingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4">
      <path
        d="M8.09 3.19v14.95l4.65 2.67 8.17-4.73-4.67-2.72-3.48 2.02V8.61L8.09 3.19Z"
        fill="#4FD1C5"
      />
    </svg>
  );
}

const engineIcons = {
  google: GoogleIcon,
  bing: BingIcon,
};

export const SearchBar: React.FC<SearchBarProps> = ({
  engine,
  onEngineChange,
}) => {
  const [query, setQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.location.href = `${engines[engine].url}${encodeURIComponent(query)}`;
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full max-w-3xl mx-auto relative group"
    >
      <div className="flex items-center rounded-[2rem] border border-white/20 bg-black/20 hover:bg-black/30 focus-within:bg-black/40 backdrop-blur-xl text-white shadow-[0_8px_32px_rgba(0,0,0,0.3)] focus-within:ring-2 focus-within:ring-white/40 transition-all overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-r border-white/10 px-3 py-2">
          {Object.entries(engines).map(([key, value]) => {
            const Icon = engineIcons[key as keyof typeof engineIcons];
            const isActive = engine === key;

            return (
              <Button
                key={key}
                variant="ghost"
                type="button"
                aria-label={`Use ${value.label}`}
                aria-pressed={isActive}
                onClick={() => onEngineChange(key as Settings['searchEngine'])}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-all ${
                  isActive
                    ? `border-white/30 bg-gradient-to-br ${value.accent} text-white shadow-[0_6px_24px_rgba(15,23,42,0.28)]`
                    : 'border-transparent bg-white/0 text-white/55 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon />
                <span className="hidden md:inline">{value.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex min-w-0 flex-1 items-center pl-6">
          <Search className="h-6 w-6 flex-shrink-0 text-white/60 group-focus-within:text-white transition-colors" />
        </div>
        <Input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="block h-auto w-full min-w-0 border-0 bg-transparent pl-16 pr-6 py-4 text-lg text-white shadow-none placeholder:text-white/60 focus-visible:ring-0 md:py-5 md:text-xl"
          placeholder={engines[engine].placeholder}
          autoFocus
        />
      </div>
    </form>
  );
};
