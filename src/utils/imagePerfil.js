// src/utils/imagePerfil.js
import pica from "pica";

export const AVATAR = {
  aspect: 3 / 4, // 3:4
  width: 600, // largura final salva (se usar optimizeProfilePhoto)
  height: 800, // altura final salva
  thumbWidth: 150, // miniatura
  thumbHeight: 200,
  quality: 0.82, // 0..1
  mime: "image/jpeg",
};

// carrega um File/Blob ou dataURL em um HTMLImageElement
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  });
}

// desenha em canvas e retorna Blob (resize simples)
export function drawToCanvasBlob(
  img,
  { w, h, sx = 0, sy = 0, sw, sh, mime, quality }
) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (sw && sh) {
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      ctx.drawImage(img, 0, 0, w, h);
    }
    canvas.toBlob(
      (blob) => resolve(blob),
      mime || "image/jpeg",
      quality != null ? quality : 0.82
    );
  });
}

/**
 * Otimiza uma imagem (File/Blob ou dataURL) para o padrão de avatar 600x800
 * (não usada no fluxo 1x/2x, mas deixei aqui caso queira).
 */
export async function optimizeProfilePhoto(
  input,
  {
    width = AVATAR.width,
    height = AVATAR.height,
    quality = AVATAR.quality,
    mime = AVATAR.mime,
  } = {}
) {
  const img = await loadImage(input);
  const blob = await drawToCanvasBlob(img, {
    w: width,
    h: height,
    mime,
    quality,
  });
  const file = new File([blob], "foto-perfil.jpg", { type: mime });
  return file;
}

/** (Opcional) gera thumbnail 150x200 */
export async function makeProfileThumb(
  input,
  {
    width = AVATAR.thumbWidth,
    height = AVATAR.thumbHeight,
    quality = AVATAR.quality,
    mime = AVATAR.mime,
  } = {}
) {
  const img = await loadImage(input);
  const blob = await drawToCanvasBlob(img, {
    w: width,
    h: height,
    mime,
    quality,
  });
  const file = new File([blob], "foto-perfil-thumb.jpg", { type: mime });
  return file;
}

/**
 * NOVO: Gera duas versões com downscale de alta qualidade (pica):
 *  - 150x200 (@1x)
 *  - 300x400 (@2x)
 */
export async function makeAvatarVariants(
  input,
  {
    oneX = { w: 150, h: 200 },
    twoX = { w: 300, h: 400 },
    mime = "image/jpeg",
    quality = 0.82,
  } = {}
) {
  const img = await loadImage(input);

  // canvas origem
  const src = document.createElement("canvas");
  src.width = img.naturalWidth;
  src.height = img.naturalHeight;
  src.getContext("2d").drawImage(img, 0, 0);

  async function resizeTo({ w, h }, suffix) {
    const dst = document.createElement("canvas");
    dst.width = w;
    dst.height = h;
    await pica().resize(src, dst, { quality: 3, alpha: false });
    const blob = await pica().toBlob(dst, mime, quality);
    return new File([blob], `foto-perfil${suffix}.jpg`, { type: mime });
  }

  const oneXFile = await resizeTo(oneX, "@1x");
  const twoXFile = await resizeTo(twoX, "@2x");
  return { oneXFile, twoXFile };
}
