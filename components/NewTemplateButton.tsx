import Link from 'next/link';

export function NewTemplateButton() {
  return (
    <Link
      href="/templates/new"
      className="inline-flex items-center rounded bg-emerald-600 text-white px-4 py-2 text-sm min-h-11 hover:bg-emerald-700"
    >
      + New Template
    </Link>
  );
}
