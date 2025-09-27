// SmartCover.jsx
import PropTypes from "prop-types";

/**
 * Renderiza capa responsiva, tentando usar @2x automaticamente quando existir.
 * - Se a URL vier com "_cover@1x.jpg", o srcSet inclui também "_cover@2x.jpg 2x".
 * - Mantém object-fit: cover e preserva o arredondamento do card.
 */
const SmartCover = ({ url, alt = "", className = "" }) => {
  const is1x = typeof url === "string" && url.includes("@1x");
  const srcSet = is1x ? `${url} 1x, ${url.replace("@1x", "@2x")} 2x` : undefined;

  return (
    <img
      className={className}
      src={url}
      srcSet={srcSet}
      alt={alt}
      loading="lazy"
      decoding="async"
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        imageRendering: "auto",
      }}
    />
  );
};

SmartCover.propTypes = {
  url: PropTypes.string.isRequired,
  alt: PropTypes.string,
  className: PropTypes.string,
};

export default SmartCover;
