// src/helpers/agendaTreino.js
import { LOCAIS } from "../constants/localHorariosTreinos";

// retorna [] se local inválido
export const getHorariosDoLocal = (localTreino) =>
  (localTreino && LOCAIS[localTreino]?.horarios) || [];

// retorna "" se local inválido
export const getDiasDoLocal = (localTreino) =>
  (localTreino && LOCAIS[localTreino]?.dias) || "";

// encontra o objeto do horário
export const findHorario = (localTreino, horarioId) =>
  getHorariosDoLocal(localTreino).find((h) => h.value === horarioId);

// label “bonito” do horário
export const getHorarioLabel = (localTreino, horarioId) => {
  const h = findHorario(localTreino, horarioId);
  return h ? h.label : (horarioId || "");
};

// professor referente ao horário
export const getProfessorLabel = (localTreino, horarioId) => {
  const h = findHorario(localTreino, horarioId);
  return h ? h.professorLabel : "";
};
