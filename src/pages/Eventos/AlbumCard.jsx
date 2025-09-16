import PropTypes from "prop-types";
import RequireAccess from "../../components/RequireAccess/RequireAccess";
import { coverThumbUrl, getVersionFromUrl } from "../../utils/covers";

const CARD_W = 350;
const CARD_H = 200;

const AlbumCard = ({ group, onOpen, onEdit, onDelete }) => {
  // use o "v" da URL da capa (quando existir) para versionar as thumbs
  const v = getVersionFromUrl(group.coverUrl || "");
  const src1x = coverThumbUrl({
    kind: "group",
    groupSlug: group.slug,
    w: CARD_W,
    h: CARD_H,
    dpr: 1,
    v,
  });
  const src2x = coverThumbUrl({
    kind: "group",
    groupSlug: group.slug,
    w: CARD_W,
    h: CARD_H,
    dpr: 2,
    v,
  });

  return (
    <figure
      className="event-card"
      onClick={() => onOpen && onOpen(group)}
      role="button"
      aria-label={`Abrir grupo ${group.title}`}
    >
      <div className="cards-eventos position-relative">
        {group.coverUrl ? (
          <img
            src={src1x}
            srcSet={`${src1x} 1x, ${src2x} 2x`}
            alt={group.title}
            width={CARD_W}
            height={CARD_H}
            loading="lazy"
            decoding="async"
            className="cover-img"
          />
        ) : (
          <div className="w-100 h-100 card-placeholder">capa do grupo</div>
        )}

        <RequireAccess nivelMinimo="graduado" requireEditor>
          <button
            type="button"
            className="icon-btn trash-btn"
            title="Excluir grupo"
            aria-label={`Excluir grupo ${group.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete(group);
            }}
          >
            🗑️
          </button>
        </RequireAccess>

        <RequireAccess nivelMinimo="graduado" requireEditor>
          <button
            type="button"
            className="icon-btn edit-btn"
            title="Editar grupo"
            aria-label={`Editar grupo ${group.title}`}
            onClick={(e) => {
              e.stopPropagation();
              onEdit && onEdit(group);
            }}
          >
            ✏️
          </button>
        </RequireAccess>
      </div>

      <figcaption className="card-caption">
        <div className="card-title">{group.title}</div>
        <div className="card-meta">{group.albumCount ?? 0} álbuns</div>
      </figcaption>
    </figure>
  );
};

AlbumCard.propTypes = {
  group: PropTypes.shape({
    slug: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    coverUrl: PropTypes.string,
    albums: PropTypes.array,
    albumCount: PropTypes.number,
  }).isRequired,
  onOpen: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
};

export default AlbumCard;
