import { useResumeStore } from "@/store/useResumeStore";
import Field from "../Field";

const SelfEvaluationPanel = () => {
    const { activeResume, updateSelfEvaluationContent } = useResumeStore();
    const selfEvaluationContent = activeResume?.selfEvaluationContent ?? "";
    const handleChange = (value: string) => {
        updateSelfEvaluationContent(value);
    };

    return (
        <Field
            value={selfEvaluationContent}
            onChange={handleChange}
            type="editor"
            placeholder="描述你的自我评价..."
        />
    );
};

export default SelfEvaluationPanel;
