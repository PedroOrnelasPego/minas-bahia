//services/backend.js

//Backend Azure
const baseUrl =
"https://portal-capoeira-backend-b4hucqbpbfd3aubd.brazilsouth-01.azurewebsites.net/perfil";

//Backend Local
//const baseUrl = "http://localhost:4000/perfil";

export async function criarPerfil(perfil) {
  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(perfil),
  });

  if (!response.ok) {
    throw new Error("Erro ao criar perfil");
  }

  return await response.json();
}

export async function atualizarPerfil(id, perfilAtualizado, opts = {}) {
  const { signal } = opts;
  const response = await fetch(`${baseUrl}/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(perfilAtualizado),
    signal,
  });
  if (!response.ok) throw new Error("Erro ao atualizar perfil");
  return await response.json();
}

export async function buscarPerfil(id, opts = {}) {
  const { signal } = opts;
  const response = await fetch(`${baseUrl}/${encodeURIComponent(id)}`, {
    signal,
  });
  if (!response.ok) throw new Error("Erro ao buscar perfil");
  return await response.json();
}
