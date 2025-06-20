const baseUrl = "https://portal-capoeira-backend-b4hucqbpbfd3aubd.brazilsouth-01.azurewebsites.net/perfil";

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

export async function atualizarPerfil(id, perfilAtualizado) {
  const response = await fetch(`${baseUrl}/${id}`, {
    method: "PUT", // ou PATCH se o backend aceitar atualizações parciais
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(perfilAtualizado),
  });

  if (!response.ok) {
    throw new Error("Erro ao atualizar perfil");
  }

  return await response.json();
}


export async function buscarPerfil(id) {
  const response = await fetch(`${baseUrl}/${id}`);

  if (!response.ok) {
    throw new Error("Erro ao buscar perfil");
  }

  return await response.json();
}
