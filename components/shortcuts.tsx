import { Edit2, Plus, X } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import type { Shortcut } from '../hooks/use-settings';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ShortcutsProps {
  shortcuts: Shortcut[];
  onUpdate: (shortcuts: Shortcut[]) => void;
}

export const Shortcuts: React.FC<ShortcutsProps> = ({
  shortcuts,
  onUpdate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  const handleOpen = (shortcut?: Shortcut) => {
    if (shortcut) {
      setEditingId(shortcut.id);
      setTitle(shortcut.title);
      setUrl(shortcut.url);
    } else {
      setEditingId(null);
      setTitle('');
      setUrl('');
    }
    setIsOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = url;
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = `https://${finalUrl}`;
    }

    if (editingId) {
      onUpdate(
        shortcuts.map((s) =>
          s.id === editingId ? { ...s, title, url: finalUrl } : s,
        ),
      );
    } else {
      onUpdate([
        ...shortcuts,
        { id: Date.now().toString(), title, url: finalUrl },
      ]);
    }
    setIsOpen(false);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onUpdate(shortcuts.filter((s) => s.id !== id));
  };

  return (
    <>
      <ul
        aria-label="快捷方式列表"
        className="mx-auto flex max-h-full w-full max-w-4xl flex-wrap content-start justify-center gap-3 overflow-y-auto overscroll-contain px-2 py-1 custom-scrollbar sm:gap-4"
      >
        {shortcuts.map((shortcut) => (
          <li key={shortcut.id} className="group relative z-10">
            <a
              href={shortcut.url}
              className="flex h-[5.5rem] w-20 flex-col items-center rounded-xl border border-white/10 bg-black/20 px-2.5 pb-2.5 pt-4 shadow-lg backdrop-blur-md transition-colors hover:bg-black/30 sm:h-24 sm:w-[5.5rem] sm:px-3 sm:pb-3 sm:pt-4"
            >
              <div className="mb-2 flex aspect-square h-8 shrink-0 items-center justify-center rounded-full bg-white/10 shadow-inner sm:h-9">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${shortcut.url}&sz=64`}
                  alt={shortcut.title}
                  className="h-4 w-4 drop-shadow-md sm:h-5 sm:w-5"
                />
              </div>
              <span className="w-full truncate text-center text-xs font-medium text-white/90 drop-shadow-md sm:text-sm">
                {shortcut.title}
              </span>
            </a>
            <div className="absolute right-1 top-1 z-20 flex space-x-1 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
              <Button
                type="button"
                variant="icon"
                size="icon"
                onClick={(e) => {
                  e.preventDefault();
                  handleOpen(shortcut);
                }}
                className="h-6 w-6 bg-blue-500/85 p-1 text-white shadow-lg backdrop-blur-md hover:bg-blue-500"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={(e) => handleDelete(shortcut.id, e)}
                className="h-6 w-6 bg-red-500/85 p-1 text-white shadow-lg backdrop-blur-md hover:bg-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </li>
        ))}

        <li className="relative z-10">
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpen()}
            className="group flex h-[5.5rem] w-20 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-black/10 p-2.5 shadow-lg backdrop-blur-md transition-colors hover:bg-black/20 sm:h-24 sm:w-[5.5rem] sm:p-3"
          >
            <div className="mb-2 flex aspect-square h-8 shrink-0 items-center justify-center rounded-full bg-white/5 sm:h-9">
              <Plus className="h-5 w-5 text-white/70 sm:h-6 sm:w-6" />
            </div>
            <span className="w-full truncate text-center text-xs font-medium text-white/70 drop-shadow-md sm:text-sm">
              Add Shortcut
            </span>
          </Button>
        </li>
      </ul>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          showClose={false}
          className="z-[170] w-[90vw] max-w-md rounded-3xl"
        >
          <DialogTitle className="mb-4">
            {editingId ? 'Edit Shortcut' : 'Add Shortcut'}
          </DialogTitle>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="shortcut-title" className="mb-1 block">
                Title
              </Label>
              <Input
                id="shortcut-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="p-3"
                required
              />
            </div>
            <div>
              <Label htmlFor="shortcut-url" className="mb-1 block">
                URL
              </Label>
              <Input
                id="shortcut-url"
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="p-3"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Save</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};
