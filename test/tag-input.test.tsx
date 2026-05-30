import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { TagInput } from '../components/tag-input';

describe('TagInput', () => {
  it('submits and closes on Enter', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TagInput onSubmit={onSubmit} onClose={onClose} placeholder="域名标签" />,
    );

    const input = screen.getByPlaceholderText('域名标签');
    fireEvent.change(input, { target: { value: ' Focus ' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(onSubmit).toHaveBeenCalledWith('Focus', undefined);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('submits and closes when focus leaves the component', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <>
        <TagInput
          onSubmit={onSubmit}
          onClose={onClose}
          placeholder="域名标签"
        />
        <button type="button">Outside</button>
      </>,
    );

    const input = screen.getByPlaceholderText('域名标签');
    const outsideButton = screen.getByRole('button', { name: 'Outside' });

    fireEvent.change(input, { target: { value: 'Pinned' } });
    fireEvent.focusOut(input, { relatedTarget: outsideButton });

    expect(onSubmit).toHaveBeenCalledWith('Pinned', undefined);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not submit when focus moves to the icon picker trigger', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TagInput onSubmit={onSubmit} onClose={onClose} placeholder="域名标签" />,
    );

    const input = screen.getByPlaceholderText('域名标签');
    const iconTrigger = screen.getByTitle('选择图标');

    fireEvent.change(input, { target: { value: 'Pinned' } });
    fireEvent.focusOut(input, { relatedTarget: iconTrigger });

    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('disables submit when submitDisabled is true', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    render(
      <TagInput
        onSubmit={onSubmit}
        onClose={onClose}
        placeholder="域名标签"
        submitButtonLabel="确认添加"
        submitDisabled
      />,
    );

    const input = screen.getByPlaceholderText('域名标签');
    const submitButton = screen.getByRole('button', { name: '确认添加' });

    fireEvent.change(input, { target: { value: 'Pinned' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(submitButton).toBeDisabled();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('opens the icon picker upward when there is not enough space below', () => {
    const onSubmit = vi.fn();
    const onClose = vi.fn();

    const originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 320,
    });

    const rectSpy = vi
      .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
      .mockImplementation(() => ({
        x: 0,
        y: 260,
        top: 260,
        left: 0,
        bottom: 300,
        right: 220,
        width: 220,
        height: 40,
        toJSON: () => ({}),
      }));

    render(
      <TagInput onSubmit={onSubmit} onClose={onClose} placeholder="域名标签" />,
    );

    fireEvent.click(screen.getByTitle('选择图标'));

    expect(screen.getByTestId('tag-icon-picker')).toHaveAttribute(
      'data-placement',
      'top',
    );

    rectSpy.mockRestore();
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: originalInnerHeight,
    });
  });
});
