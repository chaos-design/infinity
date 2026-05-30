import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPanel } from '../components/settings-panel';
import type { Settings } from '../hooks/use-settings';

const toastMock = vi.hoisted(() => vi.fn());

vi.mock('sonner', () => ({
  Toaster: () => null,
  toast: toastMock,
}));

const baseSettings: Settings = {
  searchEngine: 'google',
  backgroundType: 'unsplash',
  backgroundColor: '#0f172a',
  backgroundGradient: 'linear-gradient(135deg, #0f172a, #581c87, #0f172a)',
  backgroundGradientFrom: '#0f172a',
  backgroundGradientVia: '#581c87',
  backgroundGradientTo: '#0f172a',
  theme: 'system',
  activePage: 'home',
  tabsViewMode: 'domain',
  showSeconds: true,
  scrollThroughNestedPanels: false,
  shortcuts: [],
};

describe('SettingsPanel', () => {
  beforeEach(() => {
    toastMock.mockClear();
  });

  it('opens as a right drawer with about content', () => {
    render(<SettingsPanel settings={baseSettings} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    const aboutTab = screen.getByRole('tab', { name: 'About' });
    fireEvent.pointerDown(aboutTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(aboutTab, { button: 0, ctrlKey: false });
    fireEvent.click(aboutTab);

    expect(screen.getByRole('dialog').className).toContain(
      'slide-in-from-right',
    );
    expect(screen.getByRole('dialog').className).toContain('760px');
    expect(screen.getByText('Infinity')).toBeInTheDocument();
    expect(screen.getByText('GitHub Repository')).toBeInTheDocument();
    expect(screen.getByText('Tech Stack')).toBeInTheDocument();
  });

  it('updates checkbox based general settings', () => {
    const onUpdate = vi.fn();
    render(<SettingsPanel settings={baseSettings} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    fireEvent.click(screen.getByRole('switch', { name: /显示秒/ }));
    fireEvent.click(screen.getByRole('switch', { name: /滚轮透传/ }));

    expect(onUpdate).toHaveBeenCalledWith({ showSeconds: false });
    expect(onUpdate).toHaveBeenCalledWith({
      scrollThroughNestedPanels: true,
    });
  });

  it('updates segmented radio settings', () => {
    const onUpdate = vi.fn();
    render(<SettingsPanel settings={baseSettings} onUpdate={onUpdate} />);

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Bing' }));

    expect(screen.getByRole('radio', { name: 'Google' })).toBeChecked();
    expect(onUpdate).toHaveBeenCalledWith({ searchEngine: 'bing' });
    expect(toastMock).toHaveBeenCalledWith('搜索引擎已更新', {
      description: '当前搜索引擎：Bing',
    });

    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' });
    fireEvent.pointerDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.click(appearanceTab);
    fireEvent.click(screen.getByRole('radio', { name: 'Gradient' }));

    expect(screen.getByRole('radio', { name: 'Random Image' })).toBeChecked();
    expect(onUpdate).toHaveBeenCalledWith({ backgroundType: 'gradient' });
    expect(toastMock).toHaveBeenCalledWith('背景模式已更新', {
      description: '当前模式：gradient',
    });
  });

  it('calls sonner toast after updating a setting', () => {
    render(<SettingsPanel settings={baseSettings} onUpdate={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    fireEvent.click(screen.getByRole('switch', { name: /显示秒/ }));

    expect(toastMock).toHaveBeenCalledWith('时间显示已更新', {
      description: '已关闭秒级显示',
    });
  });

  it('updates gradient colors through the flow editor', () => {
    const onUpdate = vi.fn();
    render(
      <SettingsPanel
        settings={{ ...baseSettings, backgroundType: 'gradient' }}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' });
    fireEvent.pointerDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.click(appearanceTab);
    const originColorTrigger = screen.getByRole('button', {
      name: '选择 Origin 颜色',
    });
    const compactColorPreset = screen.getAllByRole('button', {
      name: '选择预设颜色 #8b5cf6',
    })[0];
    fireEvent.click(compactColorPreset);

    expect(compactColorPreset.className).toContain('h-5 w-5');
    expect(compactColorPreset.className).toContain('cursor-pointer');
    expect(compactColorPreset).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByLabelText('HEX 颜色值')).not.toBeInTheDocument();
    expect(screen.getByLabelText('选择 Origin 颜色')).toBeInTheDocument();
    expect(screen.getByLabelText('选择 Core 颜色')).toBeInTheDocument();
    expect(screen.getByLabelText('选择 Horizon 颜色')).toBeInTheDocument();
    expect(screen.getByLabelText('选择 Origin 颜色').className).toContain(
      'cursor-pointer',
    );
    fireEvent.click(originColorTrigger);
    expect(originColorTrigger).toHaveAttribute('aria-expanded', 'true');
    const originPickerPanel = screen.getByLabelText('Origin 取色面板');
    expect(originPickerPanel).toBeInTheDocument();
    expect(
      within(originPickerPanel).queryByRole('button', {
        name: /选择预设颜色/,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(originPickerPanel).getByLabelText('R 通道'),
    ).toBeInTheDocument();
    expect(screen.getAllByText('#0f172a')[0]).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({
      backgroundGradient: 'linear-gradient(135deg, #8b5cf6, #581c87, #0f172a)',
      backgroundGradientFrom: '#8b5cf6',
      backgroundGradientVia: '#581c87',
      backgroundGradientTo: '#0f172a',
    });
    expect(toastMock).toHaveBeenCalledWith('渐变配置已更新', {
      description: 'Origin: #8b5cf6',
    });
  });

  it('applies a sci-fi gradient preset', () => {
    const onUpdate = vi.fn();
    render(
      <SettingsPanel
        settings={{ ...baseSettings, backgroundType: 'gradient' }}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' });
    fireEvent.pointerDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.click(appearanceTab);
    fireEvent.click(screen.getByRole('button', { name: /Nebula/ }));

    expect(screen.getByRole('button', { name: /Mint/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Ember/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lagoon/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Dawn/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Solar/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Iris/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Coral/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Arctic/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lime/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Rose/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Indigo/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copper/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Prism/ })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Nebula/ }).parentElement,
    ).toHaveClass('grid-cols-6');
    expect(screen.getByTestId('gradient-preview-stop-1')).toHaveTextContent(
      '1Origin',
    );
    expect(screen.getByTestId('gradient-preview-stop-2')).toHaveTextContent(
      '2Core',
    );
    expect(screen.getByTestId('gradient-preview-stop-3')).toHaveTextContent(
      '3Horizon',
    );
    expect(onUpdate).toHaveBeenCalledWith({
      backgroundGradient: 'linear-gradient(135deg, #0f172a, #7c3aed, #06b6d4)',
      backgroundGradientFrom: '#0f172a',
      backgroundGradientVia: '#7c3aed',
      backgroundGradientTo: '#06b6d4',
    });
    expect(toastMock).toHaveBeenCalledWith('渐变预设已应用', {
      description: 'Nebula',
    });
  });

  it('updates solid background color from the compact preset strip', () => {
    const onUpdate = vi.fn();
    const { container } = render(
      <SettingsPanel
        settings={{ ...baseSettings, backgroundType: 'color' }}
        onUpdate={onUpdate}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: '打开设置' }));
    const appearanceTab = screen.getByRole('tab', { name: 'Appearance' });
    fireEvent.pointerDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.mouseDown(appearanceTab, { button: 0, ctrlKey: false });
    fireEvent.click(appearanceTab);
    const backgroundColorTrigger = screen.getByRole('button', {
      name: '选择 Background Color 颜色',
    });
    const selectedPreset = screen.getByRole('button', {
      name: '选择预设颜色 #0f172a',
    });
    const solidColorPresets = screen.getAllByRole('button', {
      name: /选择预设颜色/,
    });
    const purplePreset = screen.getByRole('button', {
      name: '选择预设颜色 #7c3aed',
    });

    expect(solidColorPresets.length).toBeGreaterThan(20);
    expect(solidColorPresets[0].className).toContain('h-5 w-5');
    expect(solidColorPresets[0].parentElement?.className).toContain(
      'flex-wrap',
    );
    expect(backgroundColorTrigger).toHaveTextContent('#0f172a');
    expect(backgroundColorTrigger.className).toContain('text-white/70');
    expect(backgroundColorTrigger.querySelector('span')?.className).toContain(
      'h-6 w-6',
    );
    expect(selectedPreset.className).toContain('cursor-pointer');
    expect(selectedPreset.className).toContain('ring-2');
    expect(selectedPreset).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(purplePreset);

    expect(screen.getByText('Background Color')).toBeInTheDocument();
    expect(screen.getByText('选择纯色背景。')).toBeInTheDocument();
    expect(screen.queryByLabelText('R 通道')).not.toBeInTheDocument();
    expect(
      container.querySelector('input[type="color"]'),
    ).not.toBeInTheDocument();
    fireEvent.click(backgroundColorTrigger);
    expect(backgroundColorTrigger).toHaveAttribute('aria-expanded', 'true');
    const backgroundPickerPanel = screen.getByLabelText(
      'Background Color 取色面板',
    );
    expect(backgroundPickerPanel).toBeInTheDocument();
    expect(
      within(backgroundPickerPanel).queryByRole('button', {
        name: /选择预设颜色/,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(backgroundPickerPanel).getByLabelText('R 通道'),
    ).toBeInTheDocument();
    expect(onUpdate).toHaveBeenCalledWith({ backgroundColor: '#7c3aed' });
    expect(toastMock).toHaveBeenCalledWith('背景颜色已更新', {
      description: '#7c3aed',
    });
  });
});
