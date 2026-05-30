import { useCallback, useEffect, useState } from 'react';
import type { TagIconName } from '../components/tag-input';
import {
  buildTagDefinitions,
  createTagId,
  type DomainTag,
  type DomainTagsMap,
  ensureDefaultTagForDomainsInMap,
  type LegacyTagIconsMap,
  loadTagState,
  removeTagDefinition,
  removeTagFromDomains,
  renameTagDefinition,
  renameTagInMap,
  saveTagState,
  setPrimaryTagInMap,
  type TagDefinition,
  type TagsMap,
  upsertTagDefinition,
} from '../lib/tag-storage';

export type { DomainTag, DomainTagsMap, TagsMap };

function saveChromeTabTags(newMap: TagsMap) {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.set({ tab_tags: newMap });
  }
}

export function useTags() {
  const [tagsMap, setTagsMap] = useState<TagsMap>({});
  const [domainTagsMap, setDomainTagsMap] = useState<DomainTagsMap>({});
  const [tagDefinitions, setTagDefinitions] = useState<TagDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadFromLegacyStorage = (
      rawDomainTags?: unknown,
      legacyTagIcons?: LegacyTagIconsMap,
    ) => {
      loadTagState(rawDomainTags, legacyTagIcons)
        .then((state) => {
          if (!isMounted) {
            return;
          }
          setDomainTagsMap(state.domainTagsMap);
          setTagDefinitions(state.tagDefinitions);
        })
        .finally(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    };

    if (typeof chrome === 'undefined' || !chrome.storage) {
      loadFromLegacyStorage();
      return () => {
        isMounted = false;
      };
    }

    chrome.storage.local.get(
      ['tab_tags', 'domain_tags', 'tag_icons'],
      (result) => {
        if (result.tab_tags) {
          setTagsMap(result.tab_tags as TagsMap);
        }
        loadFromLegacyStorage(
          result.domain_tags,
          (result.tag_icons as LegacyTagIconsMap | undefined) ?? {},
        );
      },
    );

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes.tab_tags) {
        setTagsMap((changes.tab_tags.newValue as TagsMap | undefined) ?? {});
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => {
      isMounted = false;
      chrome.storage.onChanged.removeListener(listener);
    };
  }, []);

  const persistDomainTags = useCallback((newMap: DomainTagsMap) => {
    setTagDefinitions((previousDefinitions) => {
      const nextDefinitions = buildTagDefinitions(newMap, previousDefinitions);
      void saveTagState({
        domainTagsMap: newMap,
        tagDefinitions: nextDefinitions,
      });
      return nextDefinitions;
    });
  }, []);

  const saveTags = useCallback((newMap: TagsMap) => {
    setTagsMap(newMap);
    saveChromeTabTags(newMap);
  }, []);

  const saveDomainTags = useCallback(
    (newMap: DomainTagsMap) => {
      setDomainTagsMap(newMap);
      persistDomainTags(newMap);
    },
    [persistDomainTags],
  );

  const addGlobalTag = useCallback(
    (label: string, iconName?: TagIconName) => {
      setTagDefinitions((previousDefinitions) => {
        const nextDefinitions = upsertTagDefinition(
          previousDefinitions,
          label,
          iconName,
        );
        if (nextDefinitions === previousDefinitions) {
          return previousDefinitions;
        }
        void saveTagState({
          domainTagsMap,
          tagDefinitions: nextDefinitions,
        });
        return nextDefinitions;
      });
    },
    [domainTagsMap],
  );

  const addTag = useCallback((url: string, tag: string, _iconName?: string) => {
    setTagsMap((prev) => {
      const currentTags = prev[url] || [];
      if (currentTags.includes(tag)) return prev;

      const newMap = {
        ...prev,
        [url]: [...currentTags, tag],
      };
      saveChromeTabTags(newMap);
      return newMap;
    });
  }, []);

  const removeTag = useCallback((url: string, tag: string) => {
    setTagsMap((prev) => {
      const currentTags = prev[url] || [];
      if (!currentTags.includes(tag)) return prev;

      const newTags = currentTags.filter((t) => t !== tag);
      const newMap = { ...prev };

      if (newTags.length === 0) {
        delete newMap[url];
      } else {
        newMap[url] = newTags;
      }

      saveChromeTabTags(newMap);
      return newMap;
    });
  }, []);

  const addDomainTag = useCallback(
    (domain: string, label: string, iconName?: TagIconName) => {
      const trimmedLabel = label.trim();
      if (!trimmedLabel) {
        return;
      }

      setDomainTagsMap((prev) => {
        const currentTags = prev[domain] || [];
        const existingTag = currentTags.find(
          (currentTag) => currentTag.label === trimmedLabel,
        );

        if (existingTag) {
          if (!iconName || existingTag.iconName === iconName) {
            return prev;
          }

          const nextTags = currentTags.map((currentTag) =>
            currentTag.id === existingTag.id
              ? { ...currentTag, iconName }
              : currentTag,
          );
          const newMap = {
            ...prev,
            [domain]: nextTags,
          };
          persistDomainTags(newMap);
          return newMap;
        }

        if (currentTags.length === 0) {
          const newMap = setPrimaryTagInMap(
            prev,
            domain,
            trimmedLabel,
            iconName,
          );
          persistDomainTags(newMap);
          return newMap;
        }

        const newMap = {
          ...prev,
          [domain]: [
            ...currentTags,
            { id: createTagId(), label: trimmedLabel, iconName },
          ],
        };
        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  const removeDomainTag = useCallback(
    (domain: string, tagIdOrLabel: string) => {
      setDomainTagsMap((prev) => {
        const currentTags = prev[domain] || [];
        const nextTags = currentTags.filter(
          (currentTag) =>
            currentTag.id !== tagIdOrLabel && currentTag.label !== tagIdOrLabel,
        );
        if (nextTags.length === currentTags.length) return prev;

        const newMap = { ...prev };

        if (nextTags.length === 0) {
          delete newMap[domain];
        } else {
          newMap[domain] = nextTags;
        }

        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  const updateDomainTag = useCallback(
    (
      domain: string,
      tagId: string,
      nextLabel: string,
      nextIconName?: TagIconName,
    ) => {
      const trimmedLabel = nextLabel.trim();
      if (!trimmedLabel) {
        return;
      }

      setDomainTagsMap((prev) => {
        const currentTags = prev[domain] || [];
        const targetTag = currentTags.find((tag) => tag.id === tagId);
        if (!targetTag) {
          return prev;
        }

        const duplicateTag = currentTags.find(
          (tag) => tag.id !== tagId && tag.label === trimmedLabel,
        );

        let nextTags: DomainTag[];
        if (duplicateTag) {
          nextTags = currentTags
            .filter((tag) => tag.id !== tagId)
            .map((tag) =>
              tag.id === duplicateTag.id
                ? {
                    ...tag,
                    iconName:
                      nextIconName ??
                      targetTag.iconName ??
                      duplicateTag.iconName,
                  }
                : tag,
            );
        } else {
          nextTags = currentTags.map((tag) =>
            tag.id === tagId
              ? {
                  ...tag,
                  label: trimmedLabel,
                  iconName: nextIconName ?? tag.iconName,
                }
              : tag,
          );
        }

        const newMap = {
          ...prev,
          [domain]: nextTags,
        };
        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  const addDomainTagToMany = useCallback(
    (
      domains: string[],
      label: string,
      iconName?: TagIconName,
      isPrimary: boolean = false,
    ) => {
      const trimmedLabel = label.trim();
      const uniqueDomains = Array.from(
        new Set(domains.filter((domain) => domain.trim())),
      );
      if (!trimmedLabel || uniqueDomains.length === 0) {
        return;
      }

      setDomainTagsMap((prev) => {
        let didChange = false;
        let newMap = { ...prev };

        for (const domain of uniqueDomains) {
          if (isPrimary) {
            const prevMap = newMap;
            newMap = setPrimaryTagInMap(newMap, domain, trimmedLabel, iconName);
            if (newMap !== prevMap) didChange = true;
            continue;
          }

          const currentTags = newMap[domain] || [];
          const existingTag = currentTags.find(
            (currentTag) => currentTag.label === trimmedLabel,
          );

          if (existingTag) {
            if (iconName && existingTag.iconName !== iconName) {
              newMap[domain] = currentTags.map((currentTag) =>
                currentTag.id === existingTag.id
                  ? { ...currentTag, iconName }
                  : currentTag,
              );
              didChange = true;
            }
            continue;
          }

          newMap[domain] = [
            ...currentTags,
            { id: createTagId(), label: trimmedLabel, iconName },
          ];
          didChange = true;
        }

        if (!didChange) {
          return prev;
        }

        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  const setDomainPrimaryTag = useCallback(
    (domain: string, label: string, iconName?: TagIconName) => {
      setDomainTagsMap((prev) => {
        const newMap = setPrimaryTagInMap(prev, domain, label, iconName);
        if (newMap === prev) {
          return prev;
        }
        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  const renameGlobalTag = useCallback(
    (oldLabel: string, nextLabel: string, nextIconName?: TagIconName) => {
      setDomainTagsMap((prev) => {
        const newMap = renameTagInMap(prev, oldLabel, nextLabel, nextIconName);
        setTagDefinitions((previousDefinitions) => {
          const renamedDefinitions = renameTagDefinition(
            previousDefinitions,
            oldLabel,
            nextLabel,
            nextIconName,
          );
          const nextDefinitions = buildTagDefinitions(
            newMap,
            renamedDefinitions,
          );
          void saveTagState({
            domainTagsMap: newMap,
            tagDefinitions: nextDefinitions,
          });
          return nextDefinitions;
        });
        return newMap;
      });
    },
    [],
  );

  const removeGlobalTag = useCallback((label: string) => {
    setDomainTagsMap((prev) => {
      const newMap = removeTagFromDomains(prev, label);
      setTagDefinitions((previousDefinitions) => {
        const nextDefinitions = buildTagDefinitions(
          newMap,
          removeTagDefinition(previousDefinitions, label),
        );
        void saveTagState({
          domainTagsMap: newMap,
          tagDefinitions: nextDefinitions,
        });
        return nextDefinitions;
      });
      return newMap;
    });
  }, []);

  const updateGlobalTagIcon = useCallback(
    (label: string, iconName?: TagIconName) => {
      renameGlobalTag(label, label, iconName);
    },
    [renameGlobalTag],
  );

  const ensureDefaultTagForDomains = useCallback(
    (domains: string[]) => {
      setDomainTagsMap((prev) => {
        const newMap = ensureDefaultTagForDomainsInMap(prev, domains);
        if (newMap === prev) {
          return prev;
        }
        persistDomainTags(newMap);
        return newMap;
      });
    },
    [persistDomainTags],
  );

  // Get all unique tags across all URLs
  const allUniqueTags = Array.from(
    new Set([
      ...Object.values(tagsMap).flat(),
      ...Object.values(domainTagsMap)
        .flat()
        .map((tag) => tag.label),
      ...tagDefinitions.map((tag) => tag.label),
    ]),
  ).sort();

  return {
    tagsMap,
    domainTagsMap,
    tagDefinitions,
    loading,
    addTag,
    removeTag,
    addDomainTag,
    removeDomainTag,
    updateDomainTag,
    addDomainTagToMany,
    setDomainPrimaryTag,
    addGlobalTag,
    renameGlobalTag,
    removeGlobalTag,
    updateGlobalTagIcon,
    ensureDefaultTagForDomains,
    saveTags,
    saveDomainTags,
    allUniqueTags,
  };
}
