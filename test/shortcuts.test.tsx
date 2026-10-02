import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Shortcuts } from '../components/shortcuts';
import type { Shortcut } from '../hooks/use-settings';

const manyShortcuts: Shortcut[] = Array.from({ length: 18 }, (_, index) => ({
  id: `shortcut-${index}`,
  title: `Shortcut ${index + 1}`,
  url: `https://example-${index}.com`,
}));

describe('Shortcuts', () => {
  it('renders many shortcuts inside a scrollable compact list', () => {
    render(<Shortcuts shortcuts={manyShortcuts} onUpdate={vi.fn()} />);

    const list = screen.getByRole('list', { name: '快捷方式列表' });

    expect(list.className).toContain('overflow-y-auto');
    expect(list.className).toContain('max-h-full');
    expect(screen.getAllByRole('listitem')).toHaveLength(
      manyShortcuts.length + 1,
    );
    expect(
      screen.getByRole('button', { name: /Add Shortcut/ }),
    ).toBeInTheDocument();
  });
});
