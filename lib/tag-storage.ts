import type { TagIconName } from '../components/tag-input';

export const DEFAULT_UNCATEGORIZED_TAG = '未分类';

export type TagsMap = Record<string, string[]>;

export interface DomainTag {
  id: string;
  label: string;
  iconName?: TagIconName;
  updatedAt?: number;
}

export type DomainTagsMap = Record<string, DomainTag[]>;

export interface TagDefinition {
  id: string;
  label: string;
  iconName?: TagIconName;
  createdAt: number;
  updatedAt: number;
}

export interface TagStorageState {
  domainTagsMap: DomainTagsMap;
  tagDefinitions: TagDefinition[];
}

type LegacyDomainTagsMap = Record<string, Array<string | DomainTag>>;
export type LegacyTagIconsMap = Record<string, string>;

const DB_NAME = 'tab_blank_tags';
const DB_VERSION = 1;
const TAG_STORE = 'tag_definitions';
const DOMAIN_STORE = 'domain_bindings';

let memoryState: TagStorageState | null = null;

export function createTagId() {
  return `tag_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function now() {
  return Date.now();
}

function cloneState(state: TagStorageState): TagStorageState {
  return {
    domainTagsMap: Object.fromEntries(
      Object.entries(state.domainTagsMap).map(([domain, tags]) => [
        domain,
        tags.map((tag) => ({ ...tag })),
      ]),
    ),
    tagDefinitions: state.tagDefinitions.map((tag) => ({ ...tag })),
  };
}

function hasIndexedDb() {
  return typeof indexedDB !== 'undefined';
}

/* v8 ignore start -- Browser IndexedDB integration is unavailable in jsdom. */
function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
}

async function openDatabase() {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(TAG_STORE)) {
      db.createObjectStore(TAG_STORE, { keyPath: 'label' });
    }
    if (!db.objectStoreNames.contains(DOMAIN_STORE)) {
      db.createObjectStore(DOMAIN_STORE, { keyPath: 'domain' });
    }
  };

  return requestToPromise(request);
}
/* v8 ignore stop */

function normalizeTags(tags: DomainTag[]) {
  const seenLabels = new Set<string>();
  const normalizedTags: DomainTag[] = [];

  for (const tag of tags) {
    const label = tag.label.trim();
    if (!label || seenLabels.has(label)) {
      continue;
    }

    seenLabels.add(label);
    normalizedTags.push({
      id: tag.id || createTagId(),
      label,
      iconName: tag.iconName,
      updatedAt: tag.updatedAt,
    });
  }

  return normalizedTags;
}

export function normalizeDomainTagsMap(
  rawDomainTags: unknown,
  legacyTagIcons: LegacyTagIconsMap = {},
) {
  const normalizedMap: DomainTagsMap = {};
  let didChange = false;

  if (!rawDomainTags || typeof rawDomainTags !== 'object') {
    return { normalizedMap, didChange };
  }

  for (const [domain, rawTags] of Object.entries(
    rawDomainTags as LegacyDomainTagsMap,
  )) {
    if (!Array.isArray(rawTags)) {
      didChange = true;
      continue;
    }

    const tags: DomainTag[] = [];
    for (const rawTag of rawTags) {
      if (typeof rawTag === 'string') {
        const label = rawTag.trim();
        if (!label) {
          didChange = true;
          continue;
        }
        tags.push({
          id: createTagId(),
          label,
          iconName: legacyTagIcons[label] as TagIconName | undefined,
        });
        didChange = true;
        continue;
      }

      if (!rawTag || typeof rawTag !== 'object') {
        didChange = true;
        continue;
      }

      const label =
        'label' in rawTag && typeof rawTag.label === 'string'
          ? rawTag.label.trim()
          : '';
      if (!label) {
        didChange = true;
        continue;
      }

      const id =
        'id' in rawTag && typeof rawTag.id === 'string' && rawTag.id.trim()
          ? rawTag.id
          : createTagId();
      const iconName =
        'iconName' in rawTag && typeof rawTag.iconName === 'string'
          ? (rawTag.iconName as TagIconName)
          : (legacyTagIcons[label] as TagIconName | undefined);

      if (
        !('id' in rawTag) ||
        !rawTag.id ||
        ('label' in rawTag && rawTag.label !== label)
      ) {
        didChange = true;
      }

      tags.push({ id, label, iconName });
    }

    const normalizedTags = normalizeTags(tags);
    if (normalizedTags.length > 0) {
      normalizedMap[domain] = normalizedTags;
    } else if (rawTags.length > 0) {
      didChange = true;
    }
    if (normalizedTags.length !== tags.length) {
      didChange = true;
    }
  }

  return { normalizedMap, didChange };
}

export function buildTagDefinitions(
  domainTagsMap: DomainTagsMap,
  previousDefinitions: TagDefinition[] = [],
) {
  const definitionMap = new Map<string, TagDefinition>();
  const currentTime = now();

  for (const definition of previousDefinitions) {
    definitionMap.set(definition.label, { ...definition });
  }

  for (const tags of Object.values(domainTagsMap)) {
    for (const tag of tags) {
      const existing = definitionMap.get(tag.label);
      definitionMap.set(tag.label, {
        id: existing?.id ?? tag.id ?? createTagId(),
        label: tag.label,
        iconName: tag.iconName ?? existing?.iconName,
        createdAt: existing?.createdAt ?? currentTime,
        updatedAt: currentTime,
      });
    }
  }

  if (!definitionMap.has(DEFAULT_UNCATEGORIZED_TAG)) {
    definitionMap.set(DEFAULT_UNCATEGORIZED_TAG, {
      id: createTagId(),
      label: DEFAULT_UNCATEGORIZED_TAG,
      createdAt: currentTime,
      updatedAt: currentTime,
    });
  }

  return Array.from(definitionMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label),
  );
}

export function upsertTagDefinition(
  tagDefinitions: TagDefinition[],
  label: string,
  iconName?: TagIconName,
) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    return tagDefinitions;
  }

  const currentTime = now();
  const existingDefinition = tagDefinitions.find(
    (definition) => definition.label === trimmedLabel,
  );
  if (existingDefinition) {
    if (!iconName || existingDefinition.iconName === iconName) {
      return tagDefinitions;
    }

    return tagDefinitions
      .map((definition) =>
        definition.label === trimmedLabel
          ? { ...definition, iconName, updatedAt: currentTime }
          : definition,
      )
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  return [
    ...tagDefinitions,
    {
      id: createTagId(),
      label: trimmedLabel,
      iconName,
      createdAt: currentTime,
      updatedAt: currentTime,
    },
  ].sort((a, b) => a.label.localeCompare(b.label));
}

export function removeTagDefinition(
  tagDefinitions: TagDefinition[],
  label: string,
) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel || trimmedLabel === DEFAULT_UNCATEGORIZED_TAG) {
    return tagDefinitions;
  }

  const nextDefinitions = tagDefinitions.filter(
    (definition) => definition.label !== trimmedLabel,
  );
  return nextDefinitions.length === tagDefinitions.length
    ? tagDefinitions
    : nextDefinitions;
}

export function renameTagDefinition(
  tagDefinitions: TagDefinition[],
  oldLabel: string,
  nextLabel: string,
  nextIconName?: TagIconName,
) {
  const trimmedOldLabel = oldLabel.trim();
  const trimmedNextLabel = nextLabel.trim();
  if (!trimmedOldLabel || !trimmedNextLabel) {
    return tagDefinitions;
  }

  const currentTime = now();
  const existingDefinition = tagDefinitions.find(
    (definition) => definition.label === trimmedOldLabel,
  );
  const mergedDefinitions = removeTagDefinition(
    tagDefinitions,
    trimmedOldLabel,
  );
  const targetDefinition = mergedDefinitions.find(
    (definition) => definition.label === trimmedNextLabel,
  );

  return [
    ...mergedDefinitions.filter(
      (definition) => definition.label !== trimmedNextLabel,
    ),
    {
      id: targetDefinition?.id ?? existingDefinition?.id ?? createTagId(),
      label: trimmedNextLabel,
      iconName:
        nextIconName ??
        existingDefinition?.iconName ??
        targetDefinition?.iconName,
      createdAt:
        targetDefinition?.createdAt ??
        existingDefinition?.createdAt ??
        currentTime,
      updatedAt: currentTime,
    },
  ].sort((a, b) => a.label.localeCompare(b.label));
}

export function removeTagFromDomains(
  domainTagsMap: DomainTagsMap,
  label: string,
) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel || trimmedLabel === DEFAULT_UNCATEGORIZED_TAG) {
    return domainTagsMap;
  }

  let didChange = false;
  const newMap: DomainTagsMap = {};
  for (const [domain, tags] of Object.entries(domainTagsMap)) {
    const nextTags = tags.filter((tag) => tag.label !== trimmedLabel);
    if (nextTags.length !== tags.length) {
      didChange = true;
    }
    if (nextTags.length > 0) {
      newMap[domain] = nextTags;
    }
  }

  return didChange ? newMap : domainTagsMap;
}

export function setPrimaryTagInMap(
  domainTagsMap: DomainTagsMap,
  domain: string,
  label: string,
  iconName?: TagIconName,
) {
  const trimmedLabel = label.trim();
  if (!domain.trim() || !trimmedLabel) {
    return domainTagsMap;
  }

  if (trimmedLabel === DEFAULT_UNCATEGORIZED_TAG) {
    return {
      ...domainTagsMap,
      [domain]: [],
    };
  }

  const currentTags = domainTagsMap[domain] ?? [];
  const existingTarget = currentTags.find((tag) => tag.label === trimmedLabel);
  const primaryTag: DomainTag = existingTarget
    ? {
        ...existingTarget,
        iconName: iconName ?? existingTarget.iconName,
        updatedAt: Date.now(),
      }
    : {
        id: createTagId(),
        label: trimmedLabel,
        iconName,
        updatedAt: Date.now(),
      };
  const secondaryTags = currentTags.filter((tag) => {
    if (tag.label === trimmedLabel) return false;
    return true;
  });
  const nextTags = normalizeTags([primaryTag, ...secondaryTags]);

  return {
    ...domainTagsMap,
    [domain]: nextTags,
  };
}

export function renameTagInMap(
  domainTagsMap: DomainTagsMap,
  oldLabel: string,
  nextLabel: string,
  nextIconName?: TagIconName,
) {
  const trimmedOldLabel = oldLabel.trim();
  const trimmedNextLabel = nextLabel.trim();
  if (!trimmedOldLabel || !trimmedNextLabel) {
    return domainTagsMap;
  }

  const newMap: DomainTagsMap = {};
  for (const [domain, tags] of Object.entries(domainTagsMap)) {
    const nextTags = tags.map((tag) =>
      tag.label === trimmedOldLabel
        ? {
            ...tag,
            label: trimmedNextLabel,
            iconName: nextIconName ?? tag.iconName,
          }
        : tag,
    );
    const normalizedTags = normalizeTags(nextTags);
    if (normalizedTags.length > 0) {
      newMap[domain] = normalizedTags;
    }
  }

  return newMap;
}

export function ensureDefaultTagForDomainsInMap(
  domainTagsMap: DomainTagsMap,
  domains: string[],
) {
  let nextMap = domainTagsMap;

  for (const domain of domains) {
    if (!domain.trim()) {
      continue;
    }
    const currentTags = nextMap[domain] ?? [];
    if (currentTags.length === 0) {
      nextMap = setPrimaryTagInMap(nextMap, domain, DEFAULT_UNCATEGORIZED_TAG);
    }
  }

  return nextMap;
}

async function readIndexedDbState(): Promise<TagStorageState | null> {
  /* v8 ignore next -- Browser IndexedDB integration is unavailable in jsdom. */
  if (hasIndexedDb()) {
    /* v8 ignore start -- Browser IndexedDB integration is unavailable in jsdom. */
    try {
      const db = await openDatabase();
      const transaction = db.transaction([TAG_STORE, DOMAIN_STORE], 'readonly');
      const tagDefinitions = await requestToPromise<TagDefinition[]>(
        transaction.objectStore(TAG_STORE).getAll(),
      );
      const domainBindings = await requestToPromise<
        Array<{ domain: string; tags: DomainTag[] }>
      >(transaction.objectStore(DOMAIN_STORE).getAll());
      db.close();

      if (tagDefinitions.length === 0 && domainBindings.length === 0) {
        return null;
      }

      return {
        tagDefinitions,
        domainTagsMap: Object.fromEntries(
          domainBindings
            .map((binding) => [binding.domain, normalizeTags(binding.tags)])
            .filter(([, tags]) => (tags as DomainTag[]).length > 0),
        ) as DomainTagsMap,
      };
    } catch (error) {
      console.warn('Failed to read tag data from IndexedDB.', error);
      return memoryState ? cloneState(memoryState) : null;
    }
    /* v8 ignore stop */
  }

  return memoryState ? cloneState(memoryState) : null;
}

export async function saveTagState(state: TagStorageState) {
  const normalizedState: TagStorageState = {
    domainTagsMap: Object.fromEntries(
      Object.entries(state.domainTagsMap)
        .map(([domain, tags]) => [domain, normalizeTags(tags)])
        .filter(([, tags]) => (tags as DomainTag[]).length > 0),
    ) as DomainTagsMap,
    tagDefinitions: buildTagDefinitions(
      state.domainTagsMap,
      state.tagDefinitions,
    ),
  };
  memoryState = cloneState(normalizedState);

  /* v8 ignore next -- Browser IndexedDB integration is unavailable in jsdom. */
  if (hasIndexedDb()) {
    /* v8 ignore start -- Browser IndexedDB integration is unavailable in jsdom. */
    try {
      const db = await openDatabase();
      const transaction = db.transaction(
        [TAG_STORE, DOMAIN_STORE],
        'readwrite',
      );
      const tagStore = transaction.objectStore(TAG_STORE);
      const domainStore = transaction.objectStore(DOMAIN_STORE);

      tagStore.clear();
      domainStore.clear();
      for (const definition of normalizedState.tagDefinitions) {
        tagStore.put(definition);
      }
      for (const [domain, tags] of Object.entries(
        normalizedState.domainTagsMap,
      )) {
        domainStore.put({ domain, tags, updatedAt: now() });
      }

      await transactionDone(transaction);
      db.close();
    } catch (error) {
      console.warn('Failed to save tag data to IndexedDB.', error);
    }
    /* v8 ignore stop */
  }
}

export async function loadTagState(
  rawDomainTags?: unknown,
  legacyTagIcons: LegacyTagIconsMap = {},
) {
  const storedState = await readIndexedDbState();
  if (storedState) {
    return {
      ...storedState,
      tagDefinitions: buildTagDefinitions(
        storedState.domainTagsMap,
        storedState.tagDefinitions,
      ),
    };
  }

  const { normalizedMap } = normalizeDomainTagsMap(
    rawDomainTags,
    legacyTagIcons,
  );
  const migratedState = {
    domainTagsMap: normalizedMap,
    tagDefinitions: buildTagDefinitions(normalizedMap),
  };
  await saveTagState(migratedState);
  return migratedState;
}

export function resetTagStorageMemory() {
  memoryState = null;
}
