// Redimensionamento de covers com Pica (qualidade top pra downscale)
import Pica from "pica";

export const COVER = {
  aspect: 3 / 2, // 3:2
  width: 1200, // alvo 1x
  height: 800,
  quality: 0.86,
  mime: "image/jpeg",
};

const pica = Pica();

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

export async function resizeWithPica(input, { width, height, mime, quality }) {
  const img = await loadImage(input);
  const dst = document.createElement("canvas");
  dst.width = width;
  dst.height = height;

  // usa algoritmo de qualidade alta (Catmull-Rom / Lanczos)
  await pica.resize(img, dst, { quality: 3, alpha: false });
  const blob = await pica.toBlob(
    dst,
    mime || COVER.mime,
    quality ?? COVER.quality
  );
  return blob;
}

/**
 * Gera duas variantes de cover: @1x e @2x
 */
export async function makeCoverVariants(
  file,
  {
    width1x = COVER.width,
    height1x = COVER.height,
    mime = COVER.mime,
    quality = COVER.quality,
  } = {}
) {
  const oneXBlob = await resizeWithPica(file, {
    width: width1x,
    height: height1x,
    mime,
    quality,
  });
  const twoXBlob = await resizeWithPica(file, {
    width: width1x * 2,
    height: height1x * 2,
    mime,
    quality,
  });

  const oneXFile = new File([oneXBlob], "_cover@1x.jpg", { type: mime });
  const twoXFile = new File([twoXBlob], "_cover@2x.jpg", { type: mime });

  return { oneXFile, twoXFile };
}

/**
 * Helper pra usar image-set em background quando tivermos @1x.
 */
export function bgImageSet(cover1x) {
  if (!cover1x || !cover1x.includes("@1x"))
    return { backgroundImage: cover1x ? `url(${cover1x})` : "none" };
  const cover2x = cover1x.replace("@1x", "@2x");
  return {
    backgroundImage: `image-set(url(${cover1x}) 1x, url(${cover2x}) 2x)`,
  };
}

const API_URL = import.meta.env.VITE_API_URL;

export const coverThumbUrl = ({
  kind,
  groupSlug,
  albumSlug,
  w = 350,
  h = 200,
  dpr = 1,
}) => {
  const pxW = Math.round(w * dpr);
  const pxH = Math.round(h * dpr);
  return kind === "group"
    ? `${API_URL}/eventos/cover-thumb/group/${encodeURIComponent(
        groupSlug
      )}?w=${pxW}&h=${pxH}&fit=cover`
    : `${API_URL}/eventos/cover-thumb/album/${encodeURIComponent(
        groupSlug
      )}/${encodeURIComponent(albumSlug)}?w=${pxW}&h=${pxH}&fit=cover`;
};
