import PropTypes from "prop-types";
import RequireAccess from "../../components/RequireAccess/RequireAccess";

const AlbumCard = ({ group, onOpen, onEdit, onDelete }) => {
  const cover = group.coverUrl || "";

  return (
    <div
      className="cards-eventos position-relative"
      style={{ backgroundImage: cover ? `url(${cover})` : "none" }}
      onClick={() => onOpen && onOpen(group)}
    >
      {!cover && (
        <div className="w-100 h-100 card-placeholder">capa do grupo</div>
      )}

      <RequireAccess nivelMinimo="graduado" requireEditor>
        {/* Lixeira */}
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

      {/* Lápis */}
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

      <div className="card-overlay-title">
        <div>{group.title}</div>
        <div className="card-sub">{group.albumCount ?? 0} álbuns</div>
      </div>
    </div>
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
  onDelete: PropTypes.func, // << novo
};

export default AlbumCard;
