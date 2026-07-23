import Link from "next/link";
import { ImageUploadForm } from "@/components/images/ImageUploadForm";

export default function NewImagePage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <div className="mb-6">
        <Link href="/images" className="text-sm text-slate-500 hover:underline">
          ← Voltar para o gerenciamento
        </Link>
        <h1 className="mt-2 text-xl font-semibold">Adicionar imagem</h1>
        <p className="text-sm text-slate-500">
          A imagem será publicada no quadro após o envio.
        </p>
      </div>
      <ImageUploadForm />
    </div>
  );
}
