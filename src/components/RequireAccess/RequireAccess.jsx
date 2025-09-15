// src/components/RequireAccess/RequireAccess.jsx
import { useMsal } from "@azure/msal-react";
import PropTypes from "prop-types";
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
 *  - usuário estiver logado (MSAL)
 *  - nível do perfil >= nivelMinimo
 *  - se requireEditor = true, então perfil.permissaoEventos === "editor"
 */
const RequireAccess = ({ nivelMinimo = "graduado", requireEditor = false, children }) => {
  const { accounts } = useMsal();
  const account = accounts?.[0];
  const logado = !!account;

  if (!logado) return null;

  const email = account.username;
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
