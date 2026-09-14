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

  document.getElementById('nomePacienteMedicamentos').textContent = paciente.nome;
  document.getElementById('avatarCabecalhoPaciente').innerHTML = renderizarAvatar(paciente.foto, paciente.nome);

  iniciarMotorAlarmes({ tipo: 'profissional', id: sessaoAtual.id });
  renderizarListaMedicamentos();

  document.getElementById('botaoSair').addEventListener('click', function () { sair('../index.html'); });
  document.getElementById('botaoNovoMedicamento').addEventListener('click', abrirModalNovoMedicamento);
  document.getElementById('fecharModalMedicamento').addEventListener('click', fecharModalMedicamento);
  document.getElementById('botaoCancelarMedicamento').addEventListener('click', fecharModalMedicamento);
  document.getElementById('modalMedicamento').addEventListener('click', function (e) { if (e.target.id === 'modalMedicamento') fecharModalMedicamento(); });
  document.getElementById('formularioMedicamento').addEventListener('submit', function (e) { e.preventDefault(); salvarFormularioMedicamento(); });

  document.addEventListener('bemEstarAtualizarPainel', renderizarListaMedicamentos);
});

function renderizarListaMedicamentos() {
  const container = document.getElementById('listaMedicamentos');
  const medicamentos = obterMedicamentosPorPaciente(pacienteIdAtual);
  const hoje = obterDataHoraAtualBrasil().data;

  if (medicamentos.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhum medicamento cadastrado ainda.</div>';
    return;
  }

  container.innerHTML = medicamentos.map(function (m) {
    const confirmadoHoje = m.ultimaConfirmacaoData === hoje;
    return '<div class="item-lista">' +
      '<div class="item-lista-info">' +
        '<h4>' + escaparHtml(m.nome) + '</h4>' +
        '<p>' + escaparHtml(m.dosagem) + ' • ' + escaparHtml(m.frequencia || '') + ' • Horário: ' + m.horario + '</p>' +
        '<p>Início: ' + formatarDataBr(m.dataInicio) + (m.dataFim ? ' • Até: ' + formatarDataBr(m.dataFim) : '') + '</p>' +
      '</div>' +
      '<div class="item-lista-acoes">' +
        '<span class="distintivo distintivo--' + m.via + '">' + (m.via === 'oral' ? 'Oral' : 'Intravenosa') + '</span>' +
        '<span class="distintivo distintivo--' + (confirmadoHoje ? 'administrado' : 'pendente') + '">' + (confirmadoHoje ? 'Administrado hoje' : 'Pendente') + '</span>' +
        (!confirmadoHoje ? '<button type="button" class="botao botao--secundario botao--pequeno" onclick="marcarMedicamentoAdministrado(\'' + m.id + '\')">Marcar administrado</button>' : '') +
        '<button type="button" class="botao botao--secundario botao--pequeno" onclick="abrirModalEditarMedicamento(\'' + m.id + '\')">Editar</button>' +
        '<button type="button" class="botao botao--perigo botao--pequeno" onclick="excluirMedicamentoConfirmar(\'' + m.id + '\')">Excluir</button>' +
      '</div>' +
    '</div>';
  }).join('');
}

function abrirModalNovoMedicamento() {
  document.getElementById('tituloModalMedicamento').textContent = 'Novo medicamento';
  document.getElementById('formularioMedicamento').reset();
  document.getElementById('medicamentoIdFormulario').value = '';
  document.getElementById('medicamentoDataInicio').value = obterDataHoraAtualBrasil().data;
  document.getElementById('modalMedicamento').classList.remove('oculto');
}

function abrirModalEditarMedicamento(id) {
  const medicamento = obterMedicamentoPorId(id);
  if (!medicamento) return;
  document.getElementById('tituloModalMedicamento').textContent = 'Editar medicamento';
  document.getElementById('medicamentoIdFormulario').value = medicamento.id;
  document.getElementById('medicamentoNome').value = medicamento.nome;
  document.getElementById('medicamentoVia').value = medicamento.via;
  document.getElementById('medicamentoDosagem').value = medicamento.dosagem;
  document.getElementById('medicamentoFrequencia').value = medicamento.frequencia;
  document.getElementById('medicamentoHorario').value = medicamento.horario;
  document.getElementById('medicamentoDataInicio').value = medicamento.dataInicio;
  document.getElementById('medicamentoDataFim').value = medicamento.dataFim;
  document.getElementById('modalMedicamento').classList.remove('oculto');
}

function fecharModalMedicamento() {
  document.getElementById('modalMedicamento').classList.add('oculto');
}

function salvarFormularioMedicamento() {
  const idExistente = document.getElementById('medicamentoIdFormulario').value;
  const nome = document.getElementById('medicamentoNome').value.trim();
  const via = document.getElementById('medicamentoVia').value;
  const dosagem = document.getElementById('medicamentoDosagem').value.trim();
  const frequencia = document.getElementById('medicamentoFrequencia').value.trim();
  const horario = document.getElementById('medicamentoHorario').value;
  const dataInicio = document.getElementById('medicamentoDataInicio').value;
  const dataFim = document.getElementById('medicamentoDataFim').value;

  if (!nome || !dosagem || !horario || !dataInicio) {
    mostrarNotificacao('Preencha nome, dosagem, horário e data de início.', 'erro');
    return;
  }

  if (dataFim && dataFim < dataInicio) {
    mostrarNotificacao('A data final não pode ser anterior à data de início.', 'erro');
    return;
  }

  const medicamentoAnterior = idExistente ? obterMedicamentoPorId(idExistente) : null;

  salvarMedicamento({
    id: idExistente || gerarId('med'),
    pacienteId: pacienteIdAtual,
    nome: nome,
    via: via,
    dosagem: dosagem,
    frequencia: frequencia,
    horario: horario,
    dataInicio: dataInicio,
    dataFim: dataFim,
    ultimaConfirmacaoData: medicamentoAnterior ? medicamentoAnterior.ultimaConfirmacaoData : ''
  });

  mostrarNotificacao(idExistente ? 'Medicamento atualizado.' : 'Medicamento cadastrado.', 'sucesso');
  fecharModalMedicamento();
  renderizarListaMedicamentos();
}

function marcarMedicamentoAdministrado(id) {
  const medicamento = obterMedicamentoPorId(id);
  if (!medicamento) return;
  medicamento.ultimaConfirmacaoData = obterDataHoraAtualBrasil().data;
  salvarMedicamento(medicamento);
  mostrarNotificacao('Medicamento confirmado como administrado.', 'sucesso');
  renderizarListaMedicamentos();
}

function excluirMedicamentoConfirmar(id) {
  const medicamento = obterMedicamentoPorId(id);
  confirmarAcao('Excluir o medicamento "' + medicamento.nome + '"?', function () {
    excluirMedicamento(id);
    mostrarNotificacao('Medicamento excluído.', 'sucesso');
    renderizarListaMedicamentos();
  });
}
