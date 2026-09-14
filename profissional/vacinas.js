let sessaoAtual = null;
let pacienteIdAtual = null;

document.addEventListener('DOMContentLoaded', function () {
  sessaoAtual = exigirSessao('profissional', '../index.html');
  if (!sessaoAtual) return;

  const parametros = new URLSearchParams(window.location.search);
  pacienteIdAtual = parametros.get('pacienteId');
  const paciente = obterPacientePorId(pacienteIdAtual);
  if (!paciente || paciente.profissionalId !== sessaoAtual.id) {
    window.location.href = 'dashboard.html';
    return;
  }

  document.getElementById('nomePacienteVacinas').textContent = paciente.nome;
  document.getElementById('avatarCabecalhoPaciente').innerHTML = renderizarAvatar(paciente.foto, paciente.nome);

  iniciarMotorAlarmes({ tipo: 'profissional', id: sessaoAtual.id });
  renderizarListaVacinas();

  document.getElementById('botaoSair').addEventListener('click', function () { sair('../index.html'); });
  document.getElementById('botaoNovaVacina').addEventListener('click', abrirModalNovaVacina);
  document.getElementById('fecharModalVacina').addEventListener('click', fecharModalVacina);
  document.getElementById('botaoCancelarVacina').addEventListener('click', fecharModalVacina);
  document.getElementById('modalVacina').addEventListener('click', function (e) { if (e.target.id === 'modalVacina') fecharModalVacina(); });
  document.getElementById('formularioVacina').addEventListener('submit', function (e) { e.preventDefault(); salvarFormularioVacina(); });

  document.getElementById('fecharModalReforco').addEventListener('click', fecharModalReforco);
  document.getElementById('botaoCancelarReforco').addEventListener('click', fecharModalReforco);
  document.getElementById('modalReforco').addEventListener('click', function (e) { if (e.target.id === 'modalReforco') fecharModalReforco(); });
  document.getElementById('formularioReforco').addEventListener('submit', function (e) { e.preventDefault(); salvarFormularioReforco(); });

  document.addEventListener('bemEstarAtualizarPainel', renderizarListaVacinas);
});

function renderizarListaVacinas() {
  const container = document.getElementById('listaVacinas');
  const vacinas = obterVacinasPorPaciente(pacienteIdAtual);

  if (vacinas.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhuma vacina registrada ainda.</div>';
    return;
  }

  container.innerHTML = vacinas.map(function (v) {
    const reforcos = obterReforcosPorVacina(v.id);
    let reforcosHtml = '';
    if (reforcos.length > 0) {
      reforcosHtml = '<div class="lista-reforcos"><div class="titulo-reforcos">Reforços</div><div class="lista-itens">' +
        reforcos.map(function (r) {
          return '<div class="item-lista">' +
            '<div class="item-lista-info"><h4>' + formatarDataHoraBr(r.data, r.horario) + '</h4></div>' +
            '<div class="item-lista-acoes">' +
              '<span class="distintivo distintivo--' + r.status + '">' + (r.status === 'concluido' ? 'Concluído' : 'Pendente') + '</span>' +
              (r.status === 'pendente' ? '<button type="button" class="botao botao--secundario botao--pequeno" onclick="marcarReforcoConcluido(\'' + r.id + '\')">Marcar concluído</button>' : '') +
              '<button type="button" class="botao botao--perigo botao--pequeno" onclick="excluirReforcoConfirmar(\'' + r.id + '\')">Excluir</button>' +
            '</div>' +
          '</div>';
        }).join('') + '</div></div>';
    }
    return '<div class="cartao cartao-vacina">' +
      '<div class="cabecalho-vacina">' +
        '<div><h3>' + escaparHtml(v.nome) + '</h3><p>Aplicada em ' + formatarDataBr(v.dataAplicacao) + (v.dose ? ' • ' + escaparHtml(v.dose) : '') + '</p></div>' +
        '<div class="acoes-vacina">' +
          '<button type="button" class="botao botao--secundario botao--pequeno" onclick="abrirModalNovoReforco(\'' + v.id + '\')">+ Reforço</button>' +
          '<button type="button" class="botao botao--secundario botao--pequeno" onclick="abrirModalEditarVacina(\'' + v.id + '\')">Editar</button>' +
          '<button type="button" class="botao botao--perigo botao--pequeno" onclick="excluirVacinaConfirmar(\'' + v.id + '\')">Excluir</button>' +
        '</div>' +
      '</div>' +
      (v.observacoes ? '<div class="bloco-texto-livre">' + escaparHtml(v.observacoes) + '</div>' : '') +
      reforcosHtml +
    '</div>';
  }).join('');
}

function abrirModalNovaVacina() {
  document.getElementById('tituloModalVacina').textContent = 'Nova vacina';
  document.getElementById('formularioVacina').reset();
  document.getElementById('vacinaIdFormulario').value = '';
  document.getElementById('modalVacina').classList.remove('oculto');
}

function abrirModalEditarVacina(id) {
  const vacina = obterVacinaPorId(id);
  if (!vacina) return;
  document.getElementById('tituloModalVacina').textContent = 'Editar vacina';
  document.getElementById('vacinaIdFormulario').value = vacina.id;
  document.getElementById('vacinaNome').value = vacina.nome;
  document.getElementById('vacinaDataAplicacao').value = vacina.dataAplicacao;
  document.getElementById('vacinaDose').value = vacina.dose;
  document.getElementById('vacinaObservacoes').value = vacina.observacoes;
  document.getElementById('modalVacina').classList.remove('oculto');
}

function fecharModalVacina() {
  document.getElementById('modalVacina').classList.add('oculto');
}

function salvarFormularioVacina() {
  const idExistente = document.getElementById('vacinaIdFormulario').value;
  const nome = document.getElementById('vacinaNome').value.trim();
  const dataAplicacao = document.getElementById('vacinaDataAplicacao').value;
  const dose = document.getElementById('vacinaDose').value.trim();
  const observacoes = document.getElementById('vacinaObservacoes').value.trim();

  if (!nome || !dataAplicacao) {
    mostrarNotificacao('Preencha o nome e a data de aplicação.', 'erro');
    return;
  }

  salvarVacina({
    id: idExistente || gerarId('vac'),
    pacienteId: pacienteIdAtual,
    nome: nome,
    dataAplicacao: dataAplicacao,
    dose: dose,
    observacoes: observacoes
  });

  mostrarNotificacao(idExistente ? 'Vacina atualizada.' : 'Vacina registrada.', 'sucesso');
  fecharModalVacina();
  renderizarListaVacinas();
}

function excluirVacinaConfirmar(id) {
  const vacina = obterVacinaPorId(id);
  confirmarAcao('Excluir a vacina "' + vacina.nome + '"? Os reforços vinculados também serão apagados.', function () {
    excluirVacina(id);
    mostrarNotificacao('Vacina excluída.', 'sucesso');
    renderizarListaVacinas();
  });
}

function abrirModalNovoReforco(vacinaId) {
  document.getElementById('formularioReforco').reset();
  document.getElementById('reforcoVacinaIdFormulario').value = vacinaId;
  document.getElementById('reforcoIdFormulario').value = '';
  document.getElementById('modalReforco').classList.remove('oculto');
}

function fecharModalReforco() {
  document.getElementById('modalReforco').classList.add('oculto');
}

function salvarFormularioReforco() {
  const vacinaId = document.getElementById('reforcoVacinaIdFormulario').value;
  const idExistente = document.getElementById('reforcoIdFormulario').value;
  const data = document.getElementById('reforcoData').value;
  const horario = document.getElementById('reforcoHorario').value;

  if (!data || !horario) {
    mostrarNotificacao('Informe data e horário do reforço.', 'erro');
    return;
  }

  salvarReforco({
    id: idExistente || gerarId('ref'),
    vacinaId: vacinaId,
    pacienteId: pacienteIdAtual,
    data: data,
    horario: horario,
    status: idExistente ? ((obterReforcoPorId(idExistente) || {}).status || 'pendente') : 'pendente'
  });

  mostrarNotificacao('Reforço agendado com sucesso.', 'sucesso');
  fecharModalReforco();
  renderizarListaVacinas();
}

function marcarReforcoConcluido(id) {
  const reforco = obterReforcoPorId(id);
  if (!reforco) return;
  reforco.status = 'concluido';
  salvarReforco(reforco);
  mostrarNotificacao('Reforço marcado como concluído.', 'sucesso');
  renderizarListaVacinas();
}

function excluirReforcoConfirmar(id) {
  confirmarAcao('Excluir este reforço agendado?', function () {
    excluirReforco(id);
    mostrarNotificacao('Reforço excluído.', 'sucesso');
    renderizarListaVacinas();
  });
}
