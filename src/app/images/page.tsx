import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ImageList } from "@/components/images/ImageList";

export const dynamic = "force-dynamic";

export default function ImagesPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Gerenciar imagens</h1>
          <p className="text-sm text-slate-500">
            Envie, edite e organize as imagens do quadro.
          </p>
        </div>
        <Link href="/images/new">
          <Button>+ Adicionar imagem</Button>
        </Link>
      </div>
      <ImageList />
    </div>
  );
}
