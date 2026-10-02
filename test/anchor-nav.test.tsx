import * as Tooltip from '@radix-ui/react-tooltip';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AnchorNav } from '../components/anchor';

describe('AnchorNav', () => {
  it('highlights the active page and supports clicking another anchor', () => {
    const handleSelect = vi.fn();

    render(
      <AnchorNav
        activeId="tabs"
        items={[
          { id: 0, key: 'home', label: '首页' },
          { id: 1, key: 'tabs', label: '标签页' },
        ]}
        onSelect={handleSelect}
      />,
    );

    expect(screen.getByRole('button', { name: '标签页' })).toHaveAttribute(
      'aria-current',
      'page',
    );

    fireEvent.click(screen.getByRole('button', { name: '首页' }));
    expect(handleSelect).toHaveBeenCalledWith('home');
  });

  it('renders anchors dynamically from items only', () => {
    render(
      <AnchorNav
        activeId="tabs"
        items={[
          { id: 0, key: 'home', label: '首页' },
          { id: 1, key: 'tabs', label: '标签页' },
          { id: 2, key: 'settings', label: '设置' },
        ]}
        onSelect={vi.fn()}
      />,
    );

    expect(screen.getAllByRole('button')).toHaveLength(3);
  });

  it('renders nothing when there are no anchors', () => {
    const { container } = render(
      <AnchorNav activeId="home" items={[]} onSelect={vi.fn()} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('shows tooltip with prefix and label on hover', async () => {
    render(
      <Tooltip.Provider>
        <AnchorNav
          activeId="home"
          items={[
            { id: 0, key: 'home', label: '首页', prefix: 'A1' },
            { id: 1, key: 'tabs', label: '标签页' },
          ]}
          onSelect={vi.fn()}
        />
      </Tooltip.Provider>,
    );

    const homeButton = screen.getByRole('button', { name: '首页' });
    fireEvent.pointerEnter(homeButton);
    fireEvent.focus(homeButton);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip', { hidden: true });
      expect(within(tooltip).getByText('A1')).toBeInTheDocument();
      expect(within(tooltip).getAllByText('首页').length).toBeGreaterThan(0);
    });

    const tabsButton = screen.getByRole('button', { name: '标签页' });
    fireEvent.pointerEnter(tabsButton);
    fireEvent.focus(tabsButton);

    await waitFor(() => {
      const tooltips = screen.getAllByRole('tooltip', { hidden: true });
      const currentTooltip = tooltips[tooltips.length - 1];
      expect(within(currentTooltip).getByText('02')).toBeInTheDocument();
      expect(
        within(currentTooltip).getAllByText('标签页').length,
      ).toBeGreaterThan(0);
    });
  });
});
