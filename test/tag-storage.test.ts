import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildTagDefinitions,
  DEFAULT_UNCATEGORIZED_TAG,
  ensureDefaultTagForDomainsInMap,
  loadTagState,
  normalizeDomainTagsMap,
  removeTagFromDomains,
  renameTagInMap,
  resetTagStorageMemory,
  saveTagState,
  setPrimaryTagInMap,
} from '../lib/tag-storage';

describe('tag storage helpers', () => {
  beforeEach(() => {
    resetTagStorageMemory();
  });

  it('migrates legacy domain tags and preserves icon metadata', async () => {
    const state = await loadTagState(
      {
        'example.com': ['Focus'],
      },
      {
        Focus: 'Star',
      },
    );

    expect(state.domainTagsMap['example.com'][0]).toMatchObject({
      label: 'Focus',
      iconName: 'Star',
    });
    expect(
      state.tagDefinitions.some(
        (definition) =>
          definition.label === 'Focus' && definition.iconName === 'Star',
      ),
    ).toBe(true);
  });

  it('normalizes invalid legacy data and reports changed entries', () => {
    const result = normalizeDomainTagsMap({
      'bad.com': [' ', null, { label: ' Focus ', id: '' }, { label: 'Focus' }],
      'icon.com': [{ id: 'icon', label: ' Icon ', iconName: 'Heart' }],
      'empty.com': [' '],
      'skip.com': 'not-array',
    });

    expect(result.didChange).toBe(true);
    expect(result.normalizedMap['bad.com']).toHaveLength(1);
    expect(result.normalizedMap['bad.com'][0].label).toBe('Focus');
    expect(result.normalizedMap['icon.com'][0]).toMatchObject({
      label: 'Icon',
      iconName: 'Heart',
    });
    expect(result.normalizedMap['empty.com']).toBeUndefined();
    expect(result.normalizedMap['skip.com']).toBeUndefined();
  });

  it('reuses previous tag definition metadata', () => {
    const definitions = buildTagDefinitions(
      {
        'example.com': [{ id: 'new-id', label: 'Focus', iconName: 'Heart' }],
      },
      [
        {
          id: 'old-id',
          label: 'Focus',
          iconName: 'Star',
          createdAt: 1,
          updatedAt: 1,
        },
      ],
    );

    expect(definitions).toContainEqual(
      expect.objectContaining({
        id: 'old-id',
        label: 'Focus',
        iconName: 'Heart',
        createdAt: 1,
      }),
    );
    expect(
      definitions.some((tag) => tag.label === DEFAULT_UNCATEGORIZED_TAG),
    ).toBe(true);
  });

  it('saves and reloads memory state when IndexedDB is unavailable', async () => {
    await saveTagState({
      domainTagsMap: {
        'example.com': [
          { id: 'focus', label: 'Focus' },
          { id: 'duplicate', label: 'Focus' },
        ],
      },
      tagDefinitions: [],
    });

    const state = await loadTagState();

    expect(state.domainTagsMap['example.com']).toEqual([
      expect.objectContaining({ label: 'Focus' }),
    ]);
    expect(state.tagDefinitions.some((tag) => tag.label === 'Focus')).toBe(
      true,
    );
  });

  it('adds a new primary tag while keeping existing tags', () => {
    const nextMap = setPrimaryTagInMap(
      {
        'example.com': [
          { id: 'work', label: 'Work' },
          { id: 'read', label: 'Read' },
        ],
      },
      'example.com',
      'Life',
      'Heart',
    );

    expect(nextMap['example.com']).toEqual([
      expect.objectContaining({ label: 'Life', iconName: 'Heart' }),
      expect.objectContaining({ label: 'Work' }),
      expect.objectContaining({ label: 'Read' }),
    ]);
  });

  it('returns the original map for invalid primary tag input', () => {
    const map = {
      'example.com': [{ id: 'work', label: 'Work' }],
    };

    expect(setPrimaryTagInMap(map, '', 'Life')).toBe(map);
    expect(setPrimaryTagInMap(map, 'example.com', ' ')).toBe(map);
  });

  it('moves an existing secondary tag to primary without duplicates', () => {
    const nextMap = setPrimaryTagInMap(
      {
        'example.com': [
          { id: 'work', label: 'Work' },
          { id: 'read', label: 'Read' },
        ],
      },
      'example.com',
      'Read',
    );

    expect(nextMap['example.com'].map((tag) => tag.label)).toEqual([
      'Read',
      'Work',
    ]);
  });

  it('renames a global tag across primary and secondary bindings', () => {
    const nextMap = renameTagInMap(
      {
        'a.com': [
          { id: 'work', label: 'Work' },
          { id: 'life', label: 'Life' },
        ],
        'b.com': [{ id: 'work-2', label: 'Work' }],
      },
      'Work',
      'Focus',
      'Star',
    );

    expect(nextMap['a.com']).toEqual([
      expect.objectContaining({ label: 'Focus', iconName: 'Star' }),
      expect.objectContaining({ label: 'Life' }),
    ]);
    expect(nextMap['b.com'][0]).toMatchObject({
      label: 'Focus',
      iconName: 'Star',
    });
  });

  it('removes a tag label without dropping unrelated secondary tags', () => {
    const nextMap = removeTagFromDomains(
      {
        'a.com': [
          { id: 'work', label: 'Work' },
          { id: 'life', label: 'Life' },
        ],
        'b.com': [{ id: 'work-2', label: 'Work' }],
      },
      'Work',
    );

    expect(nextMap['a.com']).toEqual([
      expect.objectContaining({ label: 'Life' }),
    ]);
    expect(nextMap['b.com']).toBeUndefined();
  });

  it('returns the original map for invalid global rename input', () => {
    const map = {
      'example.com': [{ id: 'work', label: 'Work' }],
    };

    expect(renameTagInMap(map, '', 'Focus')).toBe(map);
    expect(renameTagInMap(map, 'Work', ' ')).toBe(map);
  });

  it('keeps domains empty when uncategorized tag is applied', () => {
    const nextMap = ensureDefaultTagForDomainsInMap(
      {
        'tagged.com': [{ id: 'work', label: 'Work' }],
      },
      ['tagged.com', 'empty.com', ' '],
    );

    expect(nextMap['tagged.com'][0].label).toBe('Work');
    expect(nextMap['empty.com']).toEqual([]);
  });
});
