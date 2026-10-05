import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  images: {
    // As logos dos ativos vêm do servidor de imagens em localhost:9000. Dentro do
    // container do Next esse endereço não existe, então o navegador carrega a
    // imagem direto, sem passar pelo otimizador do servidor.
    unoptimized: true,
  },
};

export default nextConfig;
