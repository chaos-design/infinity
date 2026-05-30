import { describe, expect, it } from 'vitest';
import {
  buildDomainTagData,
  buildTagContainersFromDomainData,
} from '../lib/tag-relations';

describe('tag relations', () => {
  it('builds domain tag data without changing the domain list', () => {
    const domainTagData = buildDomainTagData(['域名xx', '域名xxxxx'], {
      域名xx: [
        { id: 'tag-1', label: '1' },
        { id: 'tag-2', label: '2' },
      ],
    });

    expect(domainTagData).toEqual({
      域名xx: {
        tags: [
          { id: 'tag-1', label: '1' },
          { id: 'tag-2', label: '2' },
        ],
      },
      域名xxxxx: {
        tags: [],
      },
    });
  });

  it('converts domain tag data to primary tag containers with origins', () => {
    const tagContainers = buildTagContainersFromDomainData({
      域名xx: {
        tags: [
          { id: 'tag-1', label: '1' },
          { id: 'tag-2', label: '2' },
        ],
      },
      域名yyy: {
        tags: [{ id: 'tag-3', label: '1' }],
      },
      域名xxxxx: {
        tags: [],
      },
    });

    expect(tagContainers).toEqual([
      {
        id: 'tag-1',
        label: '1',
        origin: ['域名xx', '域名yyy'],
        isUncategorized: false,
      },
      {
        id: '未分类',
        label: '未分类',
        origin: ['域名xxxxx'],
        isUncategorized: true,
      },
    ]);
  });

  it('keeps each domain in only its first tag container', () => {
    const tagContainers = buildTagContainersFromDomainData({
      'docs.com': {
        tags: [
          { id: 'work', label: 'Work', iconName: 'BriefcaseBusiness' },
          { id: 'life', label: 'Life', iconName: 'Heart' },
        ],
      },
    });

    expect(tagContainers).toEqual([
      {
        id: 'work',
        label: 'Work',
        iconName: 'BriefcaseBusiness',
        origin: ['docs.com'],
        isUncategorized: false,
      },
    ]);
  });
});
