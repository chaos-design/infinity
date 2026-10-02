import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest';
import { useTags } from '../hooks/use-tags';
import { resetTagStorageMemory } from '../lib/tag-storage';

describe('useTags', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetTagStorageMemory();
    (chrome.storage.local.get as Mock).mockImplementation(
      (_keys: unknown, callback: (value: unknown) => void) => {
        callback({
          domain_tags: {
            'example.com': ['Focus'],
          },
          tag_icons: {
            Focus: 'Star',
          },
        });
      },
    );
  });

  it('migrates legacy domain tags and supports updates and batch add', async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.domainTagsMap['example.com']).toHaveLength(1);
    expect(result.current.domainTagsMap['example.com'][0]).toMatchObject({
      label: 'Focus',
      iconName: 'Star',
    });

    const focusTagId = result.current.domainTagsMap['example.com'][0].id;

    act(() => {
      result.current.updateDomainTag(
        'example.com',
        focusTagId,
        'Deep Focus',
        'Heart',
      );
    });

    expect(result.current.domainTagsMap['example.com'][0]).toMatchObject({
      id: focusTagId,
      label: 'Deep Focus',
      iconName: 'Heart',
    });

    act(() => {
      result.current.addDomainTagToMany(
        ['example.com', 'other.com'],
        'Pinned',
        'Flag',
      );
    });

    expect(
      result.current.domainTagsMap['example.com'].some(
        (tag) => tag.label === 'Pinned' && tag.iconName === 'Flag',
      ),
    ).toBe(true);
    expect(result.current.domainTagsMap['other.com']).toEqual([
      expect.objectContaining({
        label: 'Pinned',
        iconName: 'Flag',
      }),
    ]);
  });

  it('supports primary tag updates, global rename, and default binding', async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addDomainTag('example.com', 'Read', 'BookOpen');
    });
    act(() => {
      result.current.setDomainPrimaryTag('example.com', 'Read');
    });

    expect(result.current.domainTagsMap['example.com'][0].label).toBe('Read');
    expect(
      result.current.domainTagsMap['example.com'].some(
        (tag) => tag.label === 'Focus',
      ),
    ).toBe(true);

    act(() => {
      result.current.renameGlobalTag('Read', 'Research', 'Lightbulb');
    });

    expect(result.current.domainTagsMap['example.com'][0]).toMatchObject({
      label: 'Research',
      iconName: 'Lightbulb',
    });

    act(() => {
      result.current.ensureDefaultTagForDomains(['empty.com']);
    });

    expect(result.current.domainTagsMap['empty.com']).toEqual([]);
  });

  it('keeps the first domain tag as primary and supports primary batch add', async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addDomainTag('empty.com', 'Study', 'BookOpen');
    });

    expect(result.current.domainTagsMap['empty.com']).toEqual([
      expect.objectContaining({
        label: 'Study',
        iconName: 'BookOpen',
      }),
    ]);

    act(() => {
      result.current.addDomainTag('empty.com', 'Work', 'BriefcaseBusiness');
    });

    expect(result.current.domainTagsMap['empty.com'][0]).toMatchObject({
      label: 'Study',
      iconName: 'BookOpen',
    });
    expect(
      result.current.domainTagsMap['empty.com'].some(
        (tag) => tag.label === 'Work' && tag.iconName === 'BriefcaseBusiness',
      ),
    ).toBe(true);

    act(() => {
      result.current.addDomainTagToMany(
        ['example.com', 'empty.com'],
        'Pinned',
        'Flag',
        true,
      );
    });

    expect(result.current.domainTagsMap['example.com'][0]).toMatchObject({
      label: 'Pinned',
      iconName: 'Flag',
    });
    expect(
      result.current.domainTagsMap['example.com'].some(
        (tag) => tag.label === 'Focus',
      ),
    ).toBe(true);
    expect(result.current.domainTagsMap['empty.com'][0]).toMatchObject({
      label: 'Pinned',
      iconName: 'Flag',
    });
    expect(
      result.current.domainTagsMap['empty.com'].some(
        (tag) => tag.label === 'Study',
      ),
    ).toBe(true);
    expect(
      result.current.domainTagsMap['empty.com'].some(
        (tag) => tag.label === 'Work',
      ),
    ).toBe(true);
  });

  it('removes a tag label from all matching domain bindings', async () => {
    const { result } = renderHook(() => useTags());

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.addGlobalTag('Planning', 'Flag');
    });

    expect(result.current.tagDefinitions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: 'Planning',
          iconName: 'Flag',
        }),
      ]),
    );

    act(() => {
      result.current.setDomainPrimaryTag('example.com', 'Planning', 'Flag');
    });
    act(() => {
      result.current.addDomainTag('secondary.com', 'Planning', 'Flag');
    });
    act(() => {
      result.current.addDomainTag('secondary.com', 'Archive', 'BookOpen');
    });
    act(() => {
      result.current.setDomainPrimaryTag(
        'secondary.com',
        'Archive',
        'BookOpen',
      );
    });

    expect(result.current.domainTagsMap['example.com'][0].label).toBe(
      'Planning',
    );
    expect(
      result.current.domainTagsMap['secondary.com'].some(
        (tag) => tag.label === 'Planning',
      ),
    ).toBe(true);

    act(() => {
      result.current.removeGlobalTag('Planning');
    });

    expect(result.current.domainTagsMap['example.com']).toEqual([
      expect.objectContaining({
        label: 'Focus',
      }),
    ]);
    expect(result.current.domainTagsMap['secondary.com']).toEqual([
      expect.objectContaining({
        label: 'Archive',
      }),
    ]);
    expect(
      result.current.tagDefinitions.some((tag) => tag.label === 'Planning'),
    ).toBe(false);
  });
});
