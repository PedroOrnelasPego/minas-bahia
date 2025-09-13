// helpers/agenda.js
import { LOCAIS } from "../constants/localHorariosTreinos.js";

export const getHorarioLabel = (localTreino, horarioId) => {
  if (!localTreino || !horarioId) return "";
  const horarios = LOCAIS[localTreino]?.horarios || [];
  const found = horarios.find((h) => h.value === horarioId);
  return found ? found.label : horarioId;
};

export const getDiasDoLocal = (localTreino) => {
  return LOCAIS[localTreino]?.dias || "";
};
