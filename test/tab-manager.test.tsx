import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { TabManager } from '../components/tab-manager';
import { useTabs } from '../hooks/use-tabs';
import { useTags } from '../hooks/use-tags';

vi.mock('../hooks/use-tabs');
vi.mock('../hooks/use-tags');

const createDomainTag = (id: string, label: string, iconName?: string) => ({
  id,
  label,
  iconName,
});

const setViewportWidth = (width: number) => {
  Object.defineProperty(window, 'innerWidth', {
    configurable: true,
    value: width,
    writable: true,
  });
  fireEvent(window, new Event('resize'));
};

describe('TabManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    setViewportWidth(1200);
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {},
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      allUniqueTags: [],
    });
  });

  it('should render loading state initially', () => {
    (useTabs as Mock).mockReturnValue({
      loading: true,
      tabGroups: [],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);
    expect(screen.getByText('Loading tabs...')).toBeInTheDocument();
  });

  it('should return null when there are no tab groups', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const { container } = render(<TabManager />);
    expect(container.firstChild).toBeNull();
  });

  it('should render tab groups correctly', () => {
    const mockTabs = [
      {
        domain: 'example.com',
        tabs: [
          {
            id: 1,
            windowId: 1,
            url: 'https://example.com/1',
            title: 'Example 1',
            active: false,
          },
          {
            id: 2,
            windowId: 1,
            url: 'https://example.com/2',
            title: 'Example 2',
            active: false,
            favIconUrl: 'http://example.com/favicon.ico',
          },
        ],
      },
    ];

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: mockTabs,
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    expect(
      screen.getByRole('heading', {
        name: 'Open Tabs',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('1 个分组 / 2 Tabs')).toBeInTheDocument();
    expect(screen.getAllByText('example.com').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Open Tabs').length).toBeGreaterThan(0);
    expect(screen.getByText('Example 1')).toBeInTheDocument();
    expect(screen.getByText('Example 2')).toBeInTheDocument();
    expect(screen.queryByText('Menu')).toBeNull();
    expect(screen.queryByText('域名聚合')).toBeNull();
    expect(screen.queryByText('当前筛选')).toBeNull();
  });

  it('should adapt domain masonry columns and toolbar by viewport width', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'a.com',
          tabs: [{ id: 1, windowId: 1, title: 'A', url: 'https://a.com' }],
        },
        {
          domain: 'b.com',
          tabs: [{ id: 2, windowId: 1, title: 'B', url: 'https://b.com' }],
        },
        {
          domain: 'c.com',
          tabs: [{ id: 3, windowId: 1, title: 'C', url: 'https://c.com' }],
        },
        {
          domain: 'd.com',
          tabs: [{ id: 4, windowId: 1, title: 'D', url: 'https://d.com' }],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    setViewportWidth(799);
    render(<TabManager />);

    expect(screen.getAllByTestId('domain-masonry-column')).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: '批量加标签' }).parentElement,
    ).toHaveClass('flex-nowrap');
    expect(screen.getByText(/个分组/).parentElement).toHaveClass('max-w-[48%]');

    setViewportWidth(800);
    expect(screen.getAllByTestId('domain-masonry-column')).toHaveLength(2);

    setViewportWidth(1100);
    expect(screen.getAllByTestId('domain-masonry-column')).toHaveLength(3);

    setViewportWidth(1351);
    expect(screen.getAllByTestId('domain-masonry-column')).toHaveLength(4);
  });

  it('should open batch tag dialog from the toolbar button', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'batch.com',
          tabs: [
            {
              id: 1,
              windowId: 1,
              title: 'Batch Tab',
              url: 'https://batch.com',
            },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByRole('button', { name: /批量加标签/ }));

    expect(screen.getByText('批量给多个域名添加标签')).toBeInTheDocument();
  });

  it('should confirm before closing a domain group', () => {
    const mockCloseGroup = vi.fn();
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        { domain: 'test.com', tabs: [{ id: 1, windowId: 1, title: 'Test' }] },
      ],
      closeTab: vi.fn(),
      closeGroup: mockCloseGroup,
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    const closeBtn = screen.getByTitle('Close all tabs in this group');
    fireEvent.click(closeBtn);

    expect(
      screen.getByText('将关闭 test.com 下的所有标签页，此操作不可撤销。'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText('确认关闭'));
    expect(mockCloseGroup).toHaveBeenCalledWith('test.com');
  });

  it('should close the confirm modal without deleting tabs', () => {
    const mockCloseGroup = vi.fn();
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        { domain: 'test.com', tabs: [{ id: 1, windowId: 1, title: 'Test' }] },
      ],
      closeTab: vi.fn(),
      closeGroup: mockCloseGroup,
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByTitle('Close all tabs in this group'));
    fireEvent.click(screen.getByText('取消'));

    expect(
      screen.queryByText('将关闭 test.com 下的所有标签页，此操作不可撤销。'),
    ).toBeNull();
    expect(mockCloseGroup).not.toHaveBeenCalled();
  });

  it('should call closeTab when tab close button is clicked', () => {
    const mockCloseTab = vi.fn();
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        { domain: 'test.com', tabs: [{ id: 1, windowId: 1, title: 'Test' }] },
      ],
      closeTab: mockCloseTab,
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    const closeBtn = screen.getByTitle('Close tab');
    fireEvent.click(closeBtn);

    expect(mockCloseTab).toHaveBeenCalledWith(1);
  });

  it('should call switchToTab when tab is clicked', () => {
    const mockSwitchToTab = vi.fn();
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: mockSwitchToTab,
    });

    render(<TabManager />);

    const tabItem = screen.getByText('Test').closest('button');
    fireEvent.click(tabItem!);

    expect(mockSwitchToTab).toHaveBeenCalledWith(1, 1);
  });

  it('should handle tag operations', () => {
    const mockAddDomainTag = vi.fn();
    const mockRemoveDomainTag = vi.fn();
    const mockUpdateDomainTag = vi.fn();

    (useTags as Mock).mockReturnValue({
      tagsMap: { 'https://test.com': ['Work'] },
      domainTagsMap: {
        'test.com': [createDomainTag('focus-tag', 'Focus')],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: mockAddDomainTag,
      removeDomainTag: mockRemoveDomainTag,
      updateDomainTag: mockUpdateDomainTag,
      addDomainTagToMany: vi.fn(),
      allUniqueTags: ['Focus', 'Work'],
    });

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    const addDomainTagBtn = screen.getByTitle('添加域名标签');
    fireEvent.click(addDomainTagBtn);
    const activeArticle = screen
      .getByPlaceholderText('域名标签')
      .closest('article');
    expect(activeArticle).not.toBeNull();
    expect(activeArticle).toHaveClass('z-20');
    const domainTagInput = screen.getByPlaceholderText('域名标签');
    fireEvent.change(domainTagInput, { target: { value: 'Pinned' } });
    fireEvent.keyDown(domainTagInput, { key: 'Enter', code: 'Enter' });
    expect(mockAddDomainTag).toHaveBeenCalledWith(
      'test.com',
      'Pinned',
      undefined,
    );

    fireEvent.click(screen.getByTitle('添加域名标签'));
    const domainTagInput2 = screen.getByPlaceholderText('域名标签');
    fireEvent.keyDown(domainTagInput2, { key: 'Escape', code: 'Escape' });
    expect(screen.queryByPlaceholderText('域名标签')).toBeNull();

    fireEvent.click(screen.getByTitle('添加域名标签'));
    const domainTagInput3 = screen.getByPlaceholderText('域名标签');
    fireEvent.blur(domainTagInput3);
    expect(screen.queryByPlaceholderText('域名标签')).toBeNull();

    fireEvent.click(screen.getByTitle('编辑标签 Focus'));
    const editTagInput = screen.getByPlaceholderText('修改标签');
    fireEvent.change(editTagInput, { target: { value: 'Deep Focus' } });
    fireEvent.keyDown(editTagInput, { key: 'Enter', code: 'Enter' });
    expect(mockUpdateDomainTag).toHaveBeenCalledWith(
      'test.com',
      'focus-tag',
      'Deep Focus',
      undefined,
    );

    const removeDomainTagBtn = screen.getByLabelText('Remove domain tag Focus');
    fireEvent.click(removeDomainTagBtn!);
    expect(mockRemoveDomainTag).toHaveBeenCalledWith('test.com', 'focus-tag');

    // Tag filtering
    fireEvent.focus(screen.getByPlaceholderText('搜索域名或选择标签...'));
    const tagFilterBtn = screen.getAllByRole('button', { name: 'Focus' })[0];
    fireEvent.click(tagFilterBtn);

    const allFilterBtn = screen.getByText('全部标签', { selector: 'button' });
    fireEvent.click(allFilterBtn);
  });

  it('should filter by selected domain', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
        {
          domain: 'other.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Other', url: 'https://other.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.focus(screen.getByPlaceholderText('搜索域名或选择标签...'));
    fireEvent.click(screen.getByRole('button', { name: /test\.com/ }));

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText('Other')).toBeNull();
  });

  it('should delete a domain-bound tag from the tag filter delete action', () => {
    const mockRemoveGlobalTag = vi.fn();
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [createDomainTag('focus-tag', 'Focus', 'Star')],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      removeGlobalTag: mockRemoveGlobalTag,
      allUniqueTags: ['Focus'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.focus(screen.getByPlaceholderText('搜索域名或选择标签...'));
    fireEvent.click(screen.getByLabelText('删除标签 Focus'));

    expect(mockRemoveGlobalTag).toHaveBeenCalledWith('Focus');
  });

  it('should filter domains by search query', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
        {
          domain: 'other.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Other', url: 'https://other.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.focus(screen.getByPlaceholderText('搜索域名或选择标签...'));
    fireEvent.change(screen.getByPlaceholderText('搜索域名或选择标签...'), {
      target: { value: 'test' },
    });

    expect(
      screen.getByRole('button', { name: /test\.com/ }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /other\.com/ })).toBeNull();
    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.queryByText('Other')).toBeNull();
  });

  it('should support interactions inside a multi-tab domain card', () => {
    const mockCloseTab = vi.fn();
    const mockSwitchToTab = vi.fn();
    const mockAddDomainTag = vi.fn();
    const mockRemoveDomainTag = vi.fn();

    (useTags as Mock).mockReturnValue({
      tagsMap: {
        'https://multi.com/a': ['Work'],
      },
      domainTagsMap: {
        'multi.com': [createDomainTag('study-tag', '学习', 'BookOpen')],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: mockAddDomainTag,
      removeDomainTag: mockRemoveDomainTag,
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      allUniqueTags: ['Work'],
    });

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'multi.com',
          tabs: [
            {
              id: 1,
              windowId: 1,
              title: 'Multi A',
              url: 'https://multi.com/a',
            },
            {
              id: 2,
              windowId: 1,
              title: 'Multi B',
              url: 'https://multi.com/b',
              favIconUrl: 'https://multi.com/favicon.ico',
            },
          ],
        },
      ],
      closeTab: mockCloseTab,
      closeGroup: vi.fn(),
      switchToTab: mockSwitchToTab,
    });

    render(<TabManager />);

    fireEvent.click(screen.getByText('Multi A'));
    expect(mockSwitchToTab).toHaveBeenCalledWith(1, 1);

    fireEvent.click(screen.getByLabelText('Remove domain tag 学习'));
    expect(mockRemoveDomainTag).toHaveBeenCalledWith('multi.com', 'study-tag');

    expect(screen.queryByRole('button', { name: '工作' })).toBeNull();
    expect(mockAddDomainTag).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByTitle('Close tab')[0]);
    expect(mockCloseTab).toHaveBeenCalledWith(1);
  });

  it('should batch add a tag only to manually checked domains in the current result', () => {
    const mockAddDomainTagToMany = vi.fn();

    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [createDomainTag('focus', 'Focus')],
        'other.com': [],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: mockAddDomainTagToMany,
      allUniqueTags: ['Focus'],
    });

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
        {
          domain: 'other.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Other', url: 'https://other.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));
    const batchTagInput = screen.getByPlaceholderText('输入标签内容');
    const submitButton = screen.getByRole('button', { name: '确认添加' });

    expect(batchTagInput.closest('.flex-1')).toBeInTheDocument();
    fireEvent.change(batchTagInput, { target: { value: 'Batch Tag' } });
    expect(submitButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /test\.com/i }));
    fireEvent.click(screen.getByRole('checkbox', { name: /other\.com/i }));
    expect(submitButton).not.toBeDisabled();

    fireEvent.change(
      screen.getByPlaceholderText('搜索要批量添加标签的域名...'),
      {
        target: { value: 'test' },
      },
    );

    fireEvent.click(screen.getByRole('button', { name: '确认添加' }));

    expect(mockAddDomainTagToMany).toHaveBeenCalledWith(
      ['test.com'],
      'Batch Tag',
      undefined,
      false,
    );
  });

  it('should show domain tag labels in the batch domain hover panel', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [
          createDomainTag('focus', 'Focus'),
          createDomainTag('read', 'Read'),
        ],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      allUniqueTags: ['Focus', 'Read'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));

    expect(screen.getAllByText('Focus').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Read').length).toBeGreaterThan(1);
  });

  it('should not render empty hover copy for batch domains without tags', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      allUniqueTags: [],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));

    expect(screen.queryByText('未设置标签')).toBeNull();
  });

  it('should batch add a tag as primary when adding from tag view', () => {
    const mockAddDomainTagToMany = vi.fn();

    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [],
      },
      tagDefinitions: [],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: mockAddDomainTagToMany,
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: [],
    });

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /test\.com/i }));
    fireEvent.change(screen.getByPlaceholderText('输入标签内容'), {
      target: { value: 'Batch Tag' },
    });
    fireEvent.click(screen.getByRole('button', { name: '确认添加' }));

    expect(mockAddDomainTagToMany).toHaveBeenCalledWith(
      ['test.com'],
      'Batch Tag',
      undefined,
      true,
    );
  });

  it('should keep common quick tags in the batch tag dialog', () => {
    const mockAddDomainTagToMany = vi.fn();

    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'test.com': [],
      },
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: mockAddDomainTagToMany,
      allUniqueTags: [],
    });

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    expect(screen.queryByRole('button', { name: '工作' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /test\.com/i }));
    fireEvent.click(screen.getByRole('button', { name: '娱乐' }));

    expect(mockAddDomainTagToMany).toHaveBeenCalledWith(
      ['test.com'],
      '娱乐',
      'Gamepad2',
      false,
    );
  });

  it('should close the batch dialog from the top-right close button', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.click(screen.getByRole('button', { name: '批量加标签' }));
    expect(screen.getByText('批量给多个域名添加标签')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '关闭批量添加弹窗' }));

    expect(screen.queryByText('批量给多个域名添加标签')).toBeNull();
  });

  it('should clear selected filters from the compact sidebar', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
        {
          domain: 'other.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Other', url: 'https://other.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager />);

    fireEvent.focus(screen.getByPlaceholderText('搜索域名或选择标签...'));
    fireEvent.click(screen.getByRole('button', { name: /test\.com/ }));
    fireEvent.click(screen.getByTitle('清空'));

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });

  it('should apply heavier damped scroll on main container', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    const scrollByMock = vi.fn();
    mainContainer.scrollBy = scrollByMock;

    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 250,
    });

    fireEvent.wheel(mainContainer, { deltaY: 100 });
    (animationFrameCallback as unknown as FrameRequestCallback)(0);

    expect(scrollByMock).toHaveBeenCalledWith({
      top: 6.6000000000000005,
      behavior: 'auto',
    });

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
  });

  it('should not forward wheel events to root before the boundary threshold is reached', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 0,
    });

    fireEvent.wheel(mainContainer, { deltaY: -100 });
    fireEvent.wheel(mainContainer, { deltaY: -100 });

    expect(animationFrameCallback).toBeNull();
    expect(rootScrollByMock).not.toHaveBeenCalled();

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
  });

  it('should forward upward wheel events to root after a strong boundary gesture is accumulated', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 0,
    });

    fireEvent.wheel(mainContainer, { deltaY: -100 });
    fireEvent.wheel(mainContainer, { deltaY: -100 });
    fireEvent.wheel(mainContainer, { deltaY: -100 });
    fireEvent.wheel(mainContainer, { deltaY: -100 });
    fireEvent.wheel(mainContainer, { deltaY: -100 });
    (animationFrameCallback as unknown as FrameRequestCallback)(0);

    expect(rootScrollByMock).toHaveBeenCalledWith({
      top: -10.8,
      behavior: 'auto',
    });

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
  });

  it('should forward downward wheel events to root after a strong boundary gesture is accumulated', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 500,
    });

    fireEvent.wheel(mainContainer, { deltaY: 100 });
    fireEvent.wheel(mainContainer, { deltaY: 100 });
    fireEvent.wheel(mainContainer, { deltaY: 100 });
    fireEvent.wheel(mainContainer, { deltaY: 100 });
    fireEvent.wheel(mainContainer, { deltaY: 100 });
    (animationFrameCallback as unknown as FrameRequestCallback)(0);

    expect(rootScrollByMock).toHaveBeenCalledWith({
      top: 10.8,
      behavior: 'auto',
    });

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
  });

  it('should ignore small inertia-like boundary wheel events for page switching', () => {
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 0,
    });

    for (let index = 0; index < 10; index += 1) {
      fireEvent.wheel(mainContainer, { deltaY: -50 });
    }

    expect(animationFrameCallback).toBeNull();
    expect(rootScrollByMock).not.toHaveBeenCalled();

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
  });

  it('should reset page switch intent when boundary gestures pause too long', () => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);

    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'test.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Test', url: 'https://test.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager />);

    let animationFrameCallback: FrameRequestCallback | null = null;
    const requestAnimationFrameSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        animationFrameCallback = cb;
        return 1;
      });

    const mainContainer = container.querySelector(
      '.min-h-0.flex-1.overflow-y-auto',
    ) as HTMLElement;
    Object.defineProperty(mainContainer, 'scrollHeight', {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(mainContainer, 'clientHeight', {
      configurable: true,
      value: 500,
    });
    Object.defineProperty(mainContainer, 'scrollTop', {
      configurable: true,
      value: 0,
    });

    fireEvent.wheel(mainContainer, { deltaY: -150 });
    vi.setSystemTime(1400);
    fireEvent.wheel(mainContainer, { deltaY: -150 });
    vi.setSystemTime(1500);
    fireEvent.wheel(mainContainer, { deltaY: -150 });

    expect(animationFrameCallback).toBeNull();
    expect(rootScrollByMock).not.toHaveBeenCalled();

    requestAnimationFrameSpy.mockRestore();
    document.body.removeChild(rootDiv);
    vi.useRealTimers();
  });

  it('should render tag mode containers and show domain tag chips', () => {
    const mockEnsureDefaultTagForDomains = vi.fn();
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [
          createDomainTag('work', 'Work', 'BriefcaseBusiness'),
          createDomainTag('life-secondary', 'Life', 'Heart'),
        ],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: mockEnsureDefaultTagForDomains,
      allUniqueTags: ['Work'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    expect(screen.getByTitle('编辑标签容器 Work')).toBeInTheDocument();
    expect(screen.getAllByText('docs.com')).toHaveLength(1);
    expect(screen.queryByTestId('tag-container-Life')).toBeNull();
    // In tag view, domain tags should NOT be shown.
    expect(screen.queryAllByTitle('添加域名标签').length).toBe(0);
    expect(screen.queryAllByTitle('编辑标签 Work').length).toBe(0);
  });

  it('should not render empty tag containers from global definitions', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'empty',
          label: 'Empty',
          iconName: 'Flag',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      addGlobalTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      removeGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work', 'Empty'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    expect(screen.queryByTestId('tag-container-Empty')).toBeNull();
    expect(screen.queryByText('将域名卡片拖入这里')).toBeNull();
  });

  it('should not expose standalone tag creation and can delete derived tags', () => {
    const mockRemoveGlobalTag = vi.fn();
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      addGlobalTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      removeGlobalTag: mockRemoveGlobalTag,
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    expect(screen.queryByRole('button', { name: '新增标签容器' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '删除标签容器 Work' }));

    expect(mockRemoveGlobalTag).toHaveBeenCalledWith('Work');
  });

  it('should update primary tag when dropping a domain into another tag container', () => {
    const mockSetDomainPrimaryTag = vi.fn();
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
        'life.com': [createDomainTag('life', 'Life', 'Heart')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'life',
          label: 'Life',
          iconName: 'Heart',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: mockSetDomainPrimaryTag,
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work', 'Life'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
        {
          domain: 'life.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Life', url: 'https://life.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    fireEvent.drop(screen.getByTestId('tag-container-Life'), {
      dataTransfer: {
        getData: vi.fn((type: string) =>
          type === 'application/domain' ? 'docs.com' : '',
        ),
      },
    });

    expect(mockSetDomainPrimaryTag).toHaveBeenCalledWith(
      'docs.com',
      'Life',
      'Heart',
    );
  });

  it('should rename a tag container from tag mode', () => {
    const mockRenameGlobalTag = vi.fn();
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
        'life.com': [createDomainTag('life', 'Life', 'Heart')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: mockRenameGlobalTag,
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
        {
          domain: 'life.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Life', url: 'https://life.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    fireEvent.click(screen.getByTitle('编辑标签容器 Work'));
    const input = screen.getByPlaceholderText('修改标签容器');
    fireEvent.change(input, { target: { value: 'Research' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    expect(mockRenameGlobalTag).toHaveBeenCalledWith(
      'Work',
      'Research',
      'BriefcaseBusiness',
    );
  });

  it('should switch tabs view with icon-only buttons', () => {
    const mockOnTabsViewModeChange = vi.fn();
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(
      <TabManager
        tabsViewMode="domain"
        onTabsViewModeChange={mockOnTabsViewModeChange}
      />,
    );

    expect(screen.queryByText('域名视图')).toBeNull();
    expect(screen.queryByText('标签视图')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: '标签视图' }));
    expect(mockOnTabsViewModeChange).toHaveBeenCalledWith('tag');
  });

  it('should keep fixed width for tag view columns', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
        'life.com': [createDomainTag('life', 'Life', 'Heart')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
        {
          domain: 'life.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Life', url: 'https://life.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    expect(screen.getByTestId('tag-container-Work')).toHaveClass(
      'w-[340px]',
      'min-w-[340px]',
    );
  });

  it('should handle horizontal wheel inside tag board without triggering vertical damping', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    const rootDiv = document.createElement('div');
    rootDiv.id = 'newtab-scroll-root';
    const rootScrollByMock = vi.fn();
    rootDiv.scrollBy = rootScrollByMock;
    document.body.appendChild(rootDiv);

    const { container } = render(<TabManager tabsViewMode="tag" />);
    const tagBoard = container.querySelector('.overflow-x-auto') as HTMLElement;
    const tagBoardScrollByMock = vi.fn();
    tagBoard.scrollBy = tagBoardScrollByMock;

    fireEvent.wheel(tagBoard, { deltaX: 84, deltaY: 10 });

    expect(tagBoardScrollByMock).toHaveBeenCalledWith({
      left: 84,
      behavior: 'auto',
    });
    expect(rootScrollByMock).not.toHaveBeenCalled();

    document.body.removeChild(rootDiv);
  });

  it('should show drag feedback for tag containers and cards', () => {
    (useTags as Mock).mockReturnValue({
      tagsMap: {},
      domainTagsMap: {
        'docs.com': [createDomainTag('work', 'Work', 'BriefcaseBusiness')],
        'life.com': [createDomainTag('life', 'Life', 'Heart')],
      },
      tagDefinitions: [
        {
          id: 'work',
          label: 'Work',
          iconName: 'BriefcaseBusiness',
          createdAt: 1,
          updatedAt: 1,
        },
        {
          id: 'life',
          label: 'Life',
          iconName: 'Heart',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      addTag: vi.fn(),
      removeTag: vi.fn(),
      addDomainTag: vi.fn(),
      removeDomainTag: vi.fn(),
      updateDomainTag: vi.fn(),
      addDomainTagToMany: vi.fn(),
      setDomainPrimaryTag: vi.fn(),
      renameGlobalTag: vi.fn(),
      ensureDefaultTagForDomains: vi.fn(),
      allUniqueTags: ['Work', 'Life'],
    });
    (useTabs as Mock).mockReturnValue({
      loading: false,
      tabGroups: [
        {
          domain: 'docs.com',
          tabs: [
            { id: 1, windowId: 1, title: 'Docs', url: 'https://docs.com' },
          ],
        },
        {
          domain: 'life.com',
          tabs: [
            { id: 2, windowId: 1, title: 'Life', url: 'https://life.com' },
          ],
        },
      ],
      closeTab: vi.fn(),
      closeGroup: vi.fn(),
      switchToTab: vi.fn(),
    });

    render(<TabManager tabsViewMode="tag" />);

    const draggedCard = screen.getByText('docs.com').closest('article');
    const targetContainer = screen.getByTestId('tag-container-Life');
    const dataTransfer = {
      setData: vi.fn(),
      getData: vi.fn(),
      effectAllowed: '',
    };

    fireEvent.dragStart(draggedCard as HTMLElement, { dataTransfer });
    expect(draggedCard).toHaveClass('opacity-60');

    fireEvent.dragEnter(targetContainer);
    expect(targetContainer).toHaveClass('border-white/30');

    fireEvent.dragEnd(draggedCard as HTMLElement);
    expect(draggedCard).not.toHaveClass('opacity-60');
  });
});
