import { createMarkdownExit } from "markdown-exit";
import TurndownService from "turndown";
import type {
  BasicInfo,
  CustomItem,
  Education,
  Experience,
  MenuSection,
  Project,
  ResumeData,
} from "@/types/resume";
import { DEFAULT_FIELD_ORDER } from "@/config/constants";
import { DEFAULT_TEMPLATES } from "@/config";
import { blankResumeState, blankResumeStateEn } from "@/config/initialResumeData";
import { getCustomFieldDisplayText, getCustomFieldHref } from "@/lib/customField";
import {
  hasMeaningfulRichTextContent,
  normalizeRichTextContent,
} from "@/lib/richText";
import { generateUUID } from "@/utils/uuid";

const md = createMarkdownExit({
  html: true,
  breaks: true,
  linkify: false,
});

const turndownService = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
});

const STANDARD_SECTION_IDS = new Set([
  "basic",
  "skills",
  "experience",
  "projects",
  "education",
  "selfEvaluation",
]);

const SECTION_ALIASES = {
  basic: ["basic", "profile", "基本信息", "个人信息"],
  skills: ["skills", "skill", "专业技能", "技能"],
  experience: ["experience", "work experience", "工作经验", "工作经历"],
  projects: ["projects", "project experience", "项目经历", "项目经验"],
  education: ["education", "教育经历", "教育背景"],
  selfEvaluation: ["self evaluation", "summary", "about me", "自我评价", "个人总结"],
} as const;

const BASIC_FIELD_LABELS: Record<string, Array<keyof BasicInfo | string>> = {
  Name: ["name", "姓名"],
  Title: ["title", "职位", "岗位"],
  Email: ["email", "邮箱"],
  Phone: ["phone", "电话", "手机号"],
  Location: ["location", "所在地", "地址"],
  "Employment Status": ["employementStatus", "求职状态", "在职状态"],
  "Birth Date": ["birthDate", "出生日期", "生日"],
};

const normalizeHeading = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[:：]/g, "");

const cleanupMarkdown = (value: string) =>
  value
    .replace(/\n{3,}/g, "\n\n")
    .trim();

const escapeMarkdown = (value: string) => value.replace(/\n+/g, " ").trim();

const getVisibleBasicFieldOrder = (resume: ResumeData) => {
  const fieldOrder = resume.basic.fieldOrder?.length
    ? resume.basic.fieldOrder
    : DEFAULT_FIELD_ORDER;

  return fieldOrder.filter((field) => field.visible !== false);
};

const getVisibleMenuSections = (resume: ResumeData) => {
  const menuSections = resume.menuSections?.length
    ? resume.menuSections
    : blankResumeState.menuSections;

  return [...menuSections]
    .filter((section) => section.enabled)
    .sort((a, b) => a.order - b.order);
};

const formatMetaLine = (label: string, value?: string) => {
  const normalizedValue = value?.trim();
  if (!normalizedValue) return "";
  return `- ${label}: ${normalizedValue}`;
};

const richTextHtmlToMarkdownInternal = (html?: string) => {
  if (!hasMeaningfulRichTextContent(html)) return "";
  return cleanupMarkdown(turndownService.turndown(normalizeRichTextContent(html)));
};

export const richTextHtmlToMarkdown = (html?: string) =>
  richTextHtmlToMarkdownInternal(html);

export const markdownToRichTextHtml = (markdown?: string) => {
  const normalized = markdown?.trim();
  if (!normalized) return "";
  return normalizeRichTextContent(md.render(normalized));
};

const renderBasicSection = (resume: ResumeData) => {
  const visibleFields = getVisibleBasicFieldOrder(resume);
  const visibleKeys = new Set(visibleFields.map((field) => field.key));
  const lines: string[] = [];

  if (visibleKeys.has("email") && resume.basic.email.trim()) {
    lines.push(formatMetaLine("Email", resume.basic.email)!);
  }
  if (visibleKeys.has("phone") && resume.basic.phone.trim()) {
    lines.push(formatMetaLine("Phone", resume.basic.phone)!);
  }
  if (visibleKeys.has("location") && resume.basic.location.trim()) {
    lines.push(formatMetaLine("Location", resume.basic.location)!);
  }
  if (visibleKeys.has("employementStatus") && resume.basic.employementStatus.trim()) {
    lines.push(formatMetaLine("Employment Status", resume.basic.employementStatus)!);
  }
  if (visibleKeys.has("birthDate") && resume.basic.birthDate.trim()) {
    lines.push(formatMetaLine("Birth Date", resume.basic.birthDate)!);
  }

  for (const field of resume.basic.customFields.filter((item) => item.visible !== false)) {
    const displayText = getCustomFieldDisplayText(field).trim();
    if (!displayText) continue;

    const href = getCustomFieldHref(field);
    const label = field.label?.trim() || "Custom";
    const value = href ? `[${displayText}](${href})` : displayText;
    lines.push(formatMetaLine(label, value)!);
  }

  return lines.filter(Boolean).join("\n");
};

const renderEducationItem = (item: Education) => {
  const blocks = [
    `### ${[item.school, item.major].filter(Boolean).join(" | ") || "Education"}`,
    formatMetaLine("Degree", item.degree),
    formatMetaLine(
      "Date",
      [item.startDate, item.endDate].filter(Boolean).join(" ~ ")
    ),
    formatMetaLine("GPA", item.gpa),
    richTextHtmlToMarkdownInternal(item.description),
  ].filter(Boolean);

  return blocks.join("\n\n");
};

const renderExperienceItem = (item: Experience) => {
  const blocks = [
    `### ${[item.company, item.position].filter(Boolean).join(" | ") || "Experience"}`,
    formatMetaLine("Date", item.date),
    richTextHtmlToMarkdownInternal(item.details),
  ].filter(Boolean);

  return blocks.join("\n\n");
};

const renderProjectItem = (item: Project) => {
  const linkValue = item.link?.trim()
    ? `[${(item.linkLabel || item.link).trim()}](${item.link.trim()})`
    : "";

  const blocks = [
    `### ${[item.name, item.role].filter(Boolean).join(" | ") || "Project"}`,
    formatMetaLine("Date", item.date),
    formatMetaLine("Link", linkValue),
    richTextHtmlToMarkdownInternal(item.description),
  ].filter(Boolean);

  return blocks.join("\n\n");
};

const renderCustomItem = (item: CustomItem) => {
  const blocks = [
    `### ${item.title.trim() || "Item"}`,
    formatMetaLine("Subtitle", item.subtitle),
    formatMetaLine("Date", item.dateRange),
    richTextHtmlToMarkdownInternal(item.description),
  ].filter(Boolean);

  return blocks.join("\n\n");
};

export const resumeToMarkdown = (resume: ResumeData): string => {
  const lines: string[] = [];
  const visibleFieldKeys = new Set(getVisibleBasicFieldOrder(resume).map((field) => field.key));
  const visibleMenuSections = getVisibleMenuSections(resume);

  lines.push(`# ${escapeMarkdown(resume.title || resume.basic.name || "Resume")}`);

  if (visibleFieldKeys.has("name") && resume.basic.name.trim()) {
    lines.push(resume.basic.name.trim());
  }
  if (visibleFieldKeys.has("title") && resume.basic.title.trim()) {
    lines.push(resume.basic.title.trim());
  }

  const basicSection = renderBasicSection(resume);
  if (basicSection) {
    lines.push("", basicSection);
  }

  for (const section of visibleMenuSections) {
    if (section.id === "basic") continue;

    if (section.id === "skills") {
      const content = richTextHtmlToMarkdownInternal(resume.skillContent);
      if (content) lines.push("", `## ${section.title}`, "", content);
      continue;
    }

    if (section.id === "selfEvaluation") {
      const content = richTextHtmlToMarkdownInternal(resume.selfEvaluationContent);
      if (content) lines.push("", `## ${section.title}`, "", content);
      continue;
    }

    if (section.id === "experience") {
      const content = resume.experience
        .filter((item) => item.visible !== false)
        .map(renderExperienceItem)
        .filter(Boolean)
        .join("\n\n");
      if (content) lines.push("", `## ${section.title}`, "", content);
      continue;
    }

    if (section.id === "projects") {
      const content = resume.projects
        .filter((item) => item.visible !== false)
        .map(renderProjectItem)
        .filter(Boolean)
        .join("\n\n");
      if (content) lines.push("", `## ${section.title}`, "", content);
      continue;
    }

    if (section.id === "education") {
      const content = resume.education
        .filter((item) => item.visible !== false)
        .map(renderEducationItem)
        .filter(Boolean)
        .join("\n\n");
      if (content) lines.push("", `## ${section.title}`, "", content);
      continue;
    }

    const customItems = resume.customData[section.id] || [];
    const content = customItems
      .filter((item) => item.visible !== false)
      .map(renderCustomItem)
      .filter(Boolean)
      .join("\n\n");

    if (content) {
      lines.push("", `## ${section.title}`, "", content);
    }
  }

  return cleanupMarkdown(lines.join("\n"));
};

const parseKeyValueLines = (content: string) => {
  const result: Record<string, string> = {};

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const normalized = trimmed.replace(/^[-*+]\s*/, "");
    const match = normalized.match(/^([^:：]+)[:：]\s*(.+)$/);
    if (!match) continue;

    result[normalizeHeading(match[1])] = match[2].trim();
  }

  return result;
};

const getBasicFieldValue = (map: Record<string, string>, candidates: Array<keyof BasicInfo | string>) => {
  for (const candidate of candidates) {
    const value = map[normalizeHeading(String(candidate))];
    if (value) return value;
  }
  return "";
};

const splitSectionBlocks = (content: string) => {
  const entries: Array<{ title: string; content: string }> = [];
  let currentTitle = "";
  let currentLines: string[] = [];

  for (const rawLine of content.split(/\r?\n/)) {
    const headingMatch = rawLine.match(/^###\s+(.+)$/);
    if (headingMatch) {
      if (currentTitle || currentLines.length > 0) {
        entries.push({ title: currentTitle, content: currentLines.join("\n").trim() });
      }
      currentTitle = headingMatch[1].trim();
      currentLines = [];
      continue;
    }
    currentLines.push(rawLine);
  }

  if (currentTitle || currentLines.length > 0) {
    entries.push({ title: currentTitle, content: currentLines.join("\n").trim() });
  }

  return entries.filter((entry) => entry.title || entry.content);
};

const parseSections = (markdown: string) => {
  const sections: Array<{ title: string; id: string; lines: string[] }> = [];
  let title = "";
  const prelude: string[] = [];
  let currentSection: { title: string; id: string; lines: string[] } | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const h1Match = rawLine.match(/^#\s+(.+)$/);
    if (h1Match && !title) {
      title = h1Match[1].trim();
      continue;
    }

    const h2Match = rawLine.match(/^##\s+(.+)$/);
    if (h2Match) {
      const headingTitle = h2Match[1].trim();
      const normalized = normalizeHeading(headingTitle);
      const id = Object.entries(SECTION_ALIASES).find(([, aliases]) =>
        aliases.includes(normalized as never)
      )?.[0] || `custom-${sections.length + 1}`;
      currentSection = { title: headingTitle, id, lines: [] };
      sections.push(currentSection);
      continue;
    }

    if (currentSection) {
      currentSection.lines.push(rawLine);
    } else {
      prelude.push(rawLine);
    }
  }

  return { title, prelude: prelude.join("\n").trim(), sections };
};

const createMenuSection = (id: string, title: string, order: number): MenuSection => ({
  id,
  title,
  icon: STANDARD_SECTION_IDS.has(id) ? blankResumeState.menuSections.find((item) => item.id === id)?.icon || "📝" : "📝",
  enabled: true,
  order,
});

const parseDateRange = (value: string) => {
  const normalized = value.replace(/^[-*+]\s*/, "").trim();
  const match = normalized.match(/(.+?)\s*[~～-]\s*(.+)/);
  if (!match) {
    return { startDate: "", endDate: normalized };
  }
  return {
    startDate: match[1].trim(),
    endDate: match[2].trim(),
  };
};

export const markdownToResume = (
  markdown: string,
  options: { locale: string; fileName?: string }
): ResumeData => {
  const { locale, fileName } = options;
  const baseResume = locale === "en" ? blankResumeStateEn : blankResumeState;
  const now = new Date().toISOString();
  const parsed = parseSections(markdown);
  const basicMap = parseKeyValueLines(parsed.prelude);
  const preludeLines = parsed.prelude
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const subtitleLine = preludeLines.find((line) => !line.startsWith("- ") && !line.includes(":"));
  const title = parsed.title || fileName?.trim() || baseResume.title;

  const menuSections: MenuSection[] = [
    createMenuSection("basic", baseResume.menuSections[0]?.title || "基本信息", 0),
  ];

  const education: Education[] = [];
  const experience: Experience[] = [];
  const projects: Project[] = [];
  const customData: Record<string, CustomItem[]> = {};
  let skillContent = "";
  let selfEvaluationContent = "";

  parsed.sections.forEach((section, index) => {
    menuSections.push(createMenuSection(section.id, section.title, index + 1));

    const body = section.lines.join("\n").trim();
    if (!body) return;

    if (section.id === "skills") {
      skillContent = markdownToRichTextHtml(body);
      return;
    }

    if (section.id === "selfEvaluation") {
      selfEvaluationContent = markdownToRichTextHtml(body);
      return;
    }

    const blocks = splitSectionBlocks(body);

    if (section.id === "experience") {
      for (const block of blocks) {
        const [company = "", position = ""] = block.title.split(/\s*[|｜]\s*/);
        const meta = parseKeyValueLines(block.content);
        const lines = block.content.split(/\r?\n/);
        const descriptionStart = lines.findIndex((line) => line.trim() && !/^[-*+]\s*[^:：]+[:：]/.test(line.trim()));
        const description = descriptionStart === -1 ? "" : lines.slice(descriptionStart).join("\n").trim();
        experience.push({
          id: generateUUID(),
          company: company.trim(),
          position: position.trim(),
          date: getBasicFieldValue(meta, ["date", "日期"]),
          details: markdownToRichTextHtml(description),
          visible: true,
        });
      }
      return;
    }

    if (section.id === "projects") {
      for (const block of blocks) {
        const [name = "", role = ""] = block.title.split(/\s*[|｜]\s*/);
        const meta = parseKeyValueLines(block.content);
        const lines = block.content.split(/\r?\n/);
        const descriptionStart = lines.findIndex((line) => line.trim() && !/^[-*+]\s*[^:：]+[:：]/.test(line.trim()));
        const description = descriptionStart === -1 ? "" : lines.slice(descriptionStart).join("\n").trim();
        const linkRaw = getBasicFieldValue(meta, ["link", "链接"]);
        const markdownLinkMatch = linkRaw.match(/^\[(.+)\]\((.+)\)$/);
        projects.push({
          id: generateUUID(),
          name: name.trim(),
          role: role.trim(),
          date: getBasicFieldValue(meta, ["date", "日期"]),
          description: markdownToRichTextHtml(description),
          link: markdownLinkMatch?.[2]?.trim() || linkRaw,
          linkLabel: markdownLinkMatch?.[1]?.trim() || "",
          visible: true,
        });
      }
      return;
    }

    if (section.id === "education") {
      for (const block of blocks) {
        const [school = "", major = ""] = block.title.split(/\s*[|｜]\s*/);
        const meta = parseKeyValueLines(block.content);
        const lines = block.content.split(/\r?\n/);
        const descriptionStart = lines.findIndex((line) => line.trim() && !/^[-*+]\s*[^:：]+[:：]/.test(line.trim()));
        const description = descriptionStart === -1 ? "" : lines.slice(descriptionStart).join("\n").trim();
        const { startDate, endDate } = parseDateRange(getBasicFieldValue(meta, ["date", "日期"]));
        education.push({
          id: generateUUID(),
          school: school.trim(),
          major: major.trim(),
          degree: getBasicFieldValue(meta, ["degree", "学位"]),
          startDate,
          endDate,
          gpa: getBasicFieldValue(meta, ["gpa", "绩点"]),
          description: markdownToRichTextHtml(description),
          visible: true,
        });
      }
      return;
    }

    customData[section.id] = blocks.map((block) => {
      const meta = parseKeyValueLines(block.content);
      const lines = block.content.split(/\r?\n/);
      const descriptionStart = lines.findIndex((line) => line.trim() && !/^[-*+]\s*[^:：]+[:：]/.test(line.trim()));
      const description = descriptionStart === -1 ? "" : lines.slice(descriptionStart).join("\n").trim();
      return {
        id: generateUUID(),
        title: block.title.trim(),
        subtitle: getBasicFieldValue(meta, ["subtitle", "副标题"]),
        dateRange: getBasicFieldValue(meta, ["date", "日期"]),
        description: markdownToRichTextHtml(description),
        visible: true,
      };
    });
  });

  return {
    ...baseResume,
    id: generateUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    templateId: DEFAULT_TEMPLATES[0]?.id,
    basic: {
      ...baseResume.basic,
      name: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Name) || "",
      title: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Title) || subtitleLine || "",
      email: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Email) || "",
      phone: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Phone) || "",
      location: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Location) || "",
      employementStatus: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS["Employment Status"]) || "",
      birthDate: getBasicFieldValue(basicMap, BASIC_FIELD_LABELS["Birth Date"]) || "",
      fieldOrder: DEFAULT_FIELD_ORDER.map((field) => ({
        ...field,
        visible: field.key === "name"
          ? Boolean(getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Name))
          : field.key === "title"
            ? Boolean(getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Title) || subtitleLine)
            : Boolean(
                field.key === "email"
                  ? getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Email)
                  : field.key === "phone"
                    ? getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Phone)
                    : field.key === "location"
                      ? getBasicFieldValue(basicMap, BASIC_FIELD_LABELS.Location)
                      : field.key === "birthDate"
                        ? getBasicFieldValue(basicMap, BASIC_FIELD_LABELS["Birth Date"])
                        : getBasicFieldValue(basicMap, BASIC_FIELD_LABELS["Employment Status"])
              ),
      })),
      customFields: [],
      photo: "",
      githubKey: "",
      githubUseName: "",
      githubContributionsVisible: false,
    },
    education,
    experience,
    projects,
    certificates: [],
    customData,
    skillContent,
    selfEvaluationContent,
    menuSections,
    activeSection: "basic",
    draggingProjectId: null,
    globalSettings: baseResume.globalSettings,
  };
};
