import { TemplateDesigner } from '@/components/TemplateDesigner';

export default function NewTemplatePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">New Template</h1>
      <TemplateDesigner />
    </div>
  );
}
