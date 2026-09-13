function definirSessao(tipo, id) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify({ tipo: tipo, id: id }));
}

function obterSessao() {
  try {
    return JSON.parse(localStorage.getItem(CHAVE_SESSAO));
  } catch (erro) {
    return null;
  }
}

function encerrarSessao() {
  localStorage.removeItem(CHAVE_SESSAO);
}

function exigirSessao(tipoEsperado, caminhoLogin) {
  const sessao = obterSessao();
  if (!sessao || sessao.tipo !== tipoEsperado) {
    window.location.href = caminhoLogin;
    return null;
  }
  if (tipoEsperado === 'profissional' && !obterProfissionalPorId(sessao.id)) {
    encerrarSessao();
    window.location.href = caminhoLogin;
    return null;
  }
  if (tipoEsperado === 'paciente' && !obterPacientePorId(sessao.id)) {
    encerrarSessao();
    window.location.href = caminhoLogin;
    return null;
  }
  return sessao;
}

function autenticar(email, senha) {
  const emailNormalizado = (email || '').trim().toLowerCase();
  const profissional = obterProfissionais().find(function (item) {
    return item.email.toLowerCase() === emailNormalizado && item.senha === senha;
  });
  if (profissional) {
    return { tipo: 'profissional', dados: profissional };
  }
  const paciente = obterPacientes().find(function (item) {
    return item.email.toLowerCase() === emailNormalizado && item.senha === senha;
  });
  if (paciente) {
    return { tipo: 'paciente', dados: paciente };
  }
  return null;
}

function sair(caminhoLogin) {
  encerrarSessao();
  window.location.href = caminhoLogin;
}
