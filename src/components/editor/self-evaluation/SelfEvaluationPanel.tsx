import { useResumeStore } from "@/store/useResumeStore";
import Field from "../Field";

const SelfEvaluationPanel = () => {
    const { activeResume, updateSelfEvaluationContent, updateSelfEvaluationRemark } = useResumeStore();
    const selfEvaluationContent = activeResume?.selfEvaluationContent ?? "";
    const selfEvaluationRemark = activeResume?.selfEvaluationRemark ?? "";
    const handleChange = (value: string) => {
        updateSelfEvaluationContent(value);
    };

    return (
        <Field
            value={selfEvaluationContent}
            onChange={handleChange}
            remarkValue={selfEvaluationRemark}
            onRemarkChange={updateSelfEvaluationRemark}
            type="editor"
            placeholder="描述你的自我评价..."
        />
    );
};

export default SelfEvaluationPanel;
