// src/utils/imagePerfil.js
export const AVATAR = {
  aspect: 3 / 4,        // 3:4
  width: 600,           // largura final salva
  height: 800,          // altura final salva
  thumbWidth: 150,      // opcional: miniatura
  thumbHeight: 200,
  quality: 0.82,        // 0..1
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

// desenha em canvas e retorna Blob
export function drawToCanvasBlob(img, { w, h, sx = 0, sy = 0, sw, sh, mime, quality }) {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    // se vierem coordenadas de crop (sx, sy, sw, sh) usamos; senão encaixa full
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
 * Otimiza uma imagem (File/Blob ou dataURL) para o padrão de avatar.
 * Se você quiser só redimensionar o RESULTADO do seu CropImageModal,
 * passe o File/Blob recortado e ele gera o final 600x800.
 */
export async function optimizeProfilePhoto(input, {
  width = AVATAR.width,
  height = AVATAR.height,
  quality = AVATAR.quality,
  mime = AVATAR.mime,
} = {}) {
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

/**
 * (Opcional) Gera thumbnail 150x200
 */
export async function makeProfileThumb(input, {
  width = AVATAR.thumbWidth,
  height = AVATAR.thumbHeight,
  quality = AVATAR.quality,
  mime = AVATAR.mime,
} = {}) {
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
