import PropTypes from "prop-types";
import { getAuthEmail } from "../../auth/session";
import { getPerfilCache } from "../../utils/profileCache";

const NIVEIS = [
  "visitante",
  "aluno",
  "graduado",
  "monitor",
  "instrutor",
  "professor",
  "contramestre",
  "mestre",
];

const rankNivel = (n) => {
  const i = NIVEIS.indexOf((n || "").toLowerCase());
  return i < 0 ? -1 : i;
};

/**
 * Exibe children somente se:
 *  - usuário estiver logado (Google ou Microsoft)
 *  - nível do perfil >= nivelMinimo
 *  - se requireEditor = true, então perfil.permissaoEventos === "editor"
 */
const RequireAccess = ({
  nivelMinimo = "graduado",
  requireEditor = false,
  children,
}) => {
  const email = getAuthEmail();
  if (!email) return null;

  const perfil = getPerfilCache(email) || {};
  const nivelUsuario = perfil?.nivelAcesso || "visitante";
  const ehEditor = (perfil?.permissaoEventos || "leitor") === "editor";

  const permitido =
    rankNivel(nivelUsuario) >= rankNivel(nivelMinimo) &&
    (!requireEditor || ehEditor);

  if (!permitido) return null;
  return children;
};

RequireAccess.propTypes = {
  nivelMinimo: PropTypes.oneOf(NIVEIS),
  requireEditor: PropTypes.bool,
  children: PropTypes.node,
};

export default RequireAccess;
