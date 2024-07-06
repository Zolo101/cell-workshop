type Section = Partial<Record<string, string>>
type SectionGroup = Record<string, Section[]>

export const parseRaw = (raw: string) => {
    const sections: Section[] = [];
    let currentSection: Section = {}

    const lines = raw.split("\n");
    for (const line of lines) {
        const jsDoc = line.match(/^ \* @(\w+)\s(.+)/);
        if (line === "/**") currentSection = {}
        if (jsDoc) {
            const [, key, value] = jsDoc;
            currentSection[key] = value;
        }
        if (line === " */") sections.push(currentSection)
    }

    return sections;
}

export const groupSections = (sections: Section[]) => {
    const groups: SectionGroup = {};
    for (const section of sections) {
        let group = section.group;
        if (!group) {
            group = "Ungrouped"
        }
        // Create array if this is a new group name
        if (!groups[group]) groups[group] = [];
        groups[group].push(section);
    }

    return groups;
}