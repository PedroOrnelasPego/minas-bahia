// src/components/CalendarioAniversarios/CalendarioAniversarios.jsx
import { useState, useMemo, useEffect } from "react";
import Calendar from "react-calendar";
import { format, startOfMonth, differenceInYears } from "date-fns";
import http from "../../services/http";
import "react-calendar/dist/Calendar.css";
import "./CalendarioAniversarios.scss";

const API_URL = import.meta.env.VITE_API_URL;

function parseIsoLocal(iso) {
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}
function parseDateLoose(s) {
  if (!s) return null;
  const iso = parseIsoLocal(s);
  if (iso) return iso;
  const br = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return new Date(Number(br[3]), Number(br[2]) - 1, Number(br[1]));
  const nat = new Date(s);
  return isNaN(nat) ? null : nat;
}
function sameMonthDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth();
}

/** Idade que irá completar no ANO base (ex.: ano mostrado no calendário) */
function idadeQueVaiCompletarNoAno(nascimento, anoBase) {
  if (!(nascimento instanceof Date)) return null;
  const aniversarioNoAno = new Date(
    anoBase,
    nascimento.getMonth(),
    nascimento.getDate()
  );
  // diferença inteira entre “aniversário daquele ano” e a data de nascimento
  return differenceInYears(aniversarioNoAno, nascimento);
}

const CalendarioAniversarios = () => {
  const [dataSelecionada, setDataSelecionada] = useState(new Date());
  const [mesAtivo, setMesAtivo] = useState(startOfMonth(new Date()));
  const [aniversarios, setAniversarios] = useState([]);
  const [calVersion, setCalVersion] = useState(0);

  useEffect(() => {
    const month = mesAtivo.getMonth() + 1;
    http
      .get(`${API_URL}/perfil/__public/aniversarios`, {
        params: { month, limit: 2000 },
      })
      .then(({ data }) => {
        setAniversarios(Array.isArray(data) ? data : []);
        setCalVersion((v) => v + 1); // força refresh dos “dots”
      })
      .catch(() => {
        setAniversarios([]);
        setCalVersion((v) => v + 1);
      });
  }, [mesAtivo]);

  const items = useMemo(() => {
    return (aniversarios || [])
      .map((x) => {
        const dt = parseDateLoose(x.dataNascimento);
        return dt ? { nome: x.nome || "", date: dt } : null;
      })
      .filter(Boolean);
  }, [aniversarios]);

  const aniversariantesDoDia = useMemo(
    () => items.filter((i) => sameMonthDay(i.date, dataSelecionada)),
    [items, dataSelecionada]
  );

  return (
    <div className="calendario-container text-center">
      <h5 className="mb-3">🎂 Aniversários</h5>

      <Calendar
        key={`${mesAtivo.getFullYear()}-${mesAtivo.getMonth()}-${calVersion}`}
        onChange={setDataSelecionada}
        value={dataSelecionada}
        onActiveStartDateChange={({ activeStartDate, view }) => {
          if (view === "month" && activeStartDate) {
            setMesAtivo(startOfMonth(activeStartDate));
            const sameDay = new Date(
              activeStartDate.getFullYear(),
              activeStartDate.getMonth(),
              dataSelecionada.getDate()
            );
            setDataSelecionada(sameDay);
          }
        }}
        tileContent={({ date }) =>
          items.some((i) => sameMonthDay(i.date, date)) ? (
            <div className="dot" title="Aniversário" />
          ) : null
        }
      />

      <div className="mt-3">
        <h6>
          {format(dataSelecionada, "dd/MM")}{" "}
          {aniversariantesDoDia.length > 0 ? "🎉" : ""}
        </h6>

        {aniversariantesDoDia.length > 0 ? (
          <ul className="list-unstyled mt-2">
            {aniversariantesDoDia.map((a, idx) => {
              const idade = idadeQueVaiCompletarNoAno(
                a.date,
                dataSelecionada.getFullYear()
              );
              return (
                <li key={`${a.nome}-${idx}`} className="mb-2">
                  <strong>{a.nome || "Sem nome"}</strong>
                  {idade !== null && (
                    <div className="text-muted small">
                      Irá completar {idade} anos
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-muted small mt-2">Nenhum aniversário neste dia</p>
        )}
      </div>
    </div>
  );
};

export default CalendarioAniversarios;
