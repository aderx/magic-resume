import { useResumeStore } from "@/store/useResumeStore";
import { cn } from "@/lib/utils";
import Field from "../Field";

const SkillPanel = () => {
  const { activeResume, updateSkillContent } = useResumeStore();
  const { skillContent = "" } = activeResume || {};
  const handleChange = (value: string) => {
    updateSkillContent(value);
  };

  return (
    <Field
      value={skillContent}
      onChange={handleChange}
      type="editor"
      placeholder="描述你的技能、专长等..."
    />
  );
};

export default SkillPanel;
