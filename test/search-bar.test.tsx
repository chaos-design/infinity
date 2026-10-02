import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SearchBar } from '../components/search-bar';

describe('SearchBar', () => {
  it('should render current engine and notify on change', () => {
    const onEngineChange = vi.fn();

    render(<SearchBar engine="google" onEngineChange={onEngineChange} />);

    expect(screen.getByPlaceholderText('Search Google...')).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText('Use Bing'));

    expect(onEngineChange).toHaveBeenCalledWith('bing');
    expect(screen.getByPlaceholderText('Search Google...')).toBeInTheDocument();
  });
});
