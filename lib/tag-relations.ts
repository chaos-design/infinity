import type { DomainTag, DomainTagsMap } from './tag-storage';
import { DEFAULT_UNCATEGORIZED_TAG } from './tag-storage';

export interface DomainTagRelation {
  tags: DomainTag[];
}

export type DomainTagData = Record<string, DomainTagRelation>;

export interface TagContainerData {
  id: string;
  label: string;
  iconName?: DomainTag['iconName'];
  origin: string[];
  isUncategorized: boolean;
}

function cloneDomainTags(tags: DomainTag[]) {
  return tags.map((tag) => ({ ...tag }));
}

function createUncategorizedContainer(
  uncategorizedLabel: string,
): TagContainerData {
  return {
    id: uncategorizedLabel,
    label: uncategorizedLabel,
    origin: [],
    isUncategorized: true,
  };
}

export function buildDomainTagData(
  domains: string[],
  domainTagsMap: DomainTagsMap,
): DomainTagData {
  return Object.fromEntries(
    domains.map((domain) => [
      domain,
      {
        tags: cloneDomainTags(domainTagsMap[domain] ?? []),
      },
    ]),
  );
}

export function buildTagContainersFromDomainData(
  domainTagData: DomainTagData,
  uncategorizedLabel = DEFAULT_UNCATEGORIZED_TAG,
): TagContainerData[] {
  const containerMap = new Map<string, TagContainerData>();

  for (const [domain, relation] of Object.entries(domainTagData)) {
    const validTags = relation.tags.filter(
      (t) => t.label !== uncategorizedLabel,
    );

    if (validTags.length === 0) {
      const container =
        containerMap.get(uncategorizedLabel) ??
        createUncategorizedContainer(uncategorizedLabel);
      container.origin.push(domain);
      containerMap.set(uncategorizedLabel, container);
      continue;
    }

    const primaryTag = validTags[0];
    const container = containerMap.get(primaryTag.label) ?? {
      id: primaryTag.id || primaryTag.label,
      label: primaryTag.label,
      iconName: primaryTag.iconName,
      origin: [],
      isUncategorized: false,
    };

    container.iconName = container.iconName ?? primaryTag.iconName;
    container.origin.push(domain);
    containerMap.set(primaryTag.label, container);
  }

  return Array.from(containerMap.values()).sort((a, b) => {
    if (a.isUncategorized && !b.isUncategorized) return 1;
    if (!a.isUncategorized && b.isUncategorized) return -1;
    return a.label.localeCompare(b.label);
  });
}
