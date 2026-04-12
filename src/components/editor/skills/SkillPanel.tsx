import { useResumeStore } from "@/store/useResumeStore";
import Field from "../Field";

const SkillPanel = () => {
  const { activeResume, updateSkillContent, updateSkillRemark } = useResumeStore();
  const { skillContent = "", skillRemark = "" } = activeResume || {};
  const handleChange = (value: string) => {
    updateSkillContent(value);
  };

  return (
    <Field
      value={skillContent}
      onChange={handleChange}
      remarkValue={skillRemark}
      onRemarkChange={updateSkillRemark}
      type="editor"
      placeholder="描述你的技能、专长等..."
    />
  );
};

export default SkillPanel;
