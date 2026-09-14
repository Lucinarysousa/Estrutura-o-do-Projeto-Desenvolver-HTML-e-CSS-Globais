let sessaoAtual = null;
let pacienteAtualModalInfo = null;

document.addEventListener('DOMContentLoaded', function () {
  sessaoAtual = exigirSessao('profissional', '../index.html');
  if (!sessaoAtual) return;

  inicializarCabecalhoProfissional();
  atualizarPainelProfissional();
  iniciarMotorAlarmes({ tipo: 'profissional', id: sessaoAtual.id });

  document.getElementById('botaoSair').addEventListener('click', function () {
    sair('../index.html');
  });

  document.getElementById('fecharModalInfo').addEventListener('click', fecharModalInfoPaciente);
  document.getElementById('modalInfoPaciente').addEventListener('click', function (evento) {
    if (evento.target.id === 'modalInfoPaciente') fecharModalInfoPaciente();
  });

  document.getElementById('botaoEditarPacienteModal').addEventListener('click', function () {
    if (!pacienteAtualModalInfo) return;
    const id = pacienteAtualModalInfo;
    fecharModalInfoPaciente();
    abrirModalEditarPaciente(id);
  });

  document.getElementById('botaoExcluirPacienteModal').addEventListener('click', function () {
    if (!pacienteAtualModalInfo) return;
    const paciente = obterPacientePorId(pacienteAtualModalInfo);
    confirmarAcao('Tem certeza que deseja excluir o paciente "' + paciente.nome + '"? Todos os dados de vacinas, medicamentos e anamnese serão apagados.', function () {
      excluirPaciente(paciente.id);
      mostrarNotificacao('Paciente excluído.', 'sucesso');
      fecharModalInfoPaciente();
      atualizarPainelProfissional();
    });
  });

  document.addEventListener('bemEstarAtualizarPainel', atualizarPainelProfissional);
});

function inicializarCabecalhoProfissional() {
  const profissional = obterProfissionalPorId(sessaoAtual.id);
  document.getElementById('nomeProfissionalCabecalho').textContent = profissional.nome;
  document.getElementById('avatarCabecalho').innerHTML = renderizarAvatar(profissional.foto, profissional.nome);
}

function atualizarPainelProfissional() {
  renderizarAgendaMedicacoes();
  renderizarGradePacientes();
}

function renderizarAgendaMedicacoes() {
  const container = document.getElementById('listaAgendaMedicacoes');
  const pacientes = obterPacientesPorProfissional(sessaoAtual.id);
  const mapaPacientes = {};
  pacientes.forEach(function (p) { mapaPacientes[p.id] = p; });

  const hoje = obterDataHoraAtualBrasil().data;
  let medicamentos = [];
  pacientes.forEach(function (p) {
    medicamentos = medicamentos.concat(obterMedicamentosPorPaciente(p.id));
  });

  medicamentos = medicamentos.filter(function (m) {
    const inicioOk = !m.dataInicio || m.dataInicio <= hoje;
    const fimOk = !m.dataFim || m.dataFim >= hoje;
    return inicioOk && fimOk;
  }).sort(function (a, b) { return a.horario.localeCompare(b.horario); });

  if (medicamentos.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhuma medicação agendada no momento.</div>';
    return;
  }

  container.innerHTML = medicamentos.map(function (m) {
    const paciente = mapaPacientes[m.pacienteId];
    const confirmadoHoje = m.ultimaConfirmacaoData === hoje;
    return '<div class="item-lista">' +
      '<div class="item-lista-info">' +
        '<h4>' + escaparHtml(m.nome) + ' — ' + escaparHtml(paciente ? paciente.nome : '') + '</h4>' +
        '<p>Horário: ' + m.horario + ' • ' + escaparHtml(m.dosagem) + '</p>' +
      '</div>' +
      '<div class="item-lista-acoes">' +
        '<span class="distintivo distintivo--' + m.via + '">' + (m.via === 'oral' ? 'Oral' : 'Intravenosa') + '</span>' +
        '<span class="distintivo distintivo--' + (confirmadoHoje ? 'administrado' : 'pendente') + '">' + (confirmadoHoje ? 'Administrado hoje' : 'Pendente') + '</span>' +
      '</div>' +
    '</div>';
  }).join('');
}

function renderizarGradePacientes() {
  const container = document.getElementById('gradePacientes');
  const pacientes = obterPacientesPorProfissional(sessaoAtual.id);

  if (pacientes.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhum paciente cadastrado ainda.</div>';
    return;
  }

  container.innerHTML = pacientes.map(function (p) {
    const idade = calcularIdade(p.dataNascimento);
    return '<div class="cartao cartao-paciente" data-id="' + p.id + '">' +
      renderizarAvatar(p.foto, p.nome, 'avatar-grande') +
      '<h3>' + escaparHtml(p.nome) + '</h3>' +
      '<p>CPF: ' + formatarCpf(p.cpf) + '</p>' +
      '<p>' + (idade !== null ? idade + ' anos' : '') + '</p>' +
    '</div>';
  }).join('');

  container.querySelectorAll('.cartao-paciente').forEach(function (cartao) {
    cartao.addEventListener('click', function () {
      abrirModalInfoPaciente(cartao.getAttribute('data-id'));
    });
  });
}

function abrirModalInfoPaciente(id) {
  const paciente = obterPacientePorId(id);
  if (!paciente) return;
  pacienteAtualModalInfo = id;

  document.getElementById('nomeModalInfo').textContent = paciente.nome;

  const anamnese = obterAnamnesePorPaciente(id) || {};
  const reforcos = obterReforcosPorPaciente(id).filter(function (r) { return r.status === 'pendente'; });
  const medicamentos = obterMedicamentosPorPaciente(id);
  const hoje = obterDataHoraAtualBrasil().data;

  let html = '';
  html += '<p class="texto-ajuda" style="margin-bottom:16px;">CPF: ' + formatarCpf(paciente.cpf) + ' • ' + calcularIdade(paciente.dataNascimento) + ' anos • ' + escaparHtml(paciente.email) + '</p>';

  html += '<div class="subtitulo-bloco-info">Sinais vitais e anamnese</div>';
  html += '<div class="grade-sinais-vitais">' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Temperatura</span><span class="valor-sinal">' + escaparHtml(anamnese.temperatura || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Pulso</span><span class="valor-sinal">' + escaparHtml(anamnese.pulso || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Freq. Respiratória</span><span class="valor-sinal">' + escaparHtml(anamnese.frequenciaRespiratoria || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Pressão Arterial</span><span class="valor-sinal">' + escaparHtml(anamnese.pressaoArterial || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">SpO2</span><span class="valor-sinal">' + escaparHtml(anamnese.saturacao || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Glicemia</span><span class="valor-sinal">' + escaparHtml(anamnese.glicemia || '—') + '</span></div>' +
  '</div>';

  html += '<div class="subtitulo-bloco-info">Alergia medicamentosa</div>';
  html += '<div class="bloco-texto-livre">' + escaparHtml(anamnese.alergiaMedicamentosa || 'Nenhuma informada.') + '</div>';

  html += '<div class="subtitulo-bloco-info">Histórico familiar</div>';
  html += '<div class="bloco-texto-livre">' + escaparHtml(anamnese.historicoFamiliar || 'Nenhum informado.') + '</div>';

  html += '<div class="subtitulo-bloco-info">Lembretes de reforço de vacina</div>';
  if (reforcos.length === 0) {
    html += '<div class="mensagem-vazia">Nenhum reforço pendente.</div>';
  } else {
    html += '<div class="lista-itens">' + reforcos.map(function (r) {
      const vacina = obterVacinaPorId(r.vacinaId);
      return '<div class="item-lista"><div class="item-lista-info"><h4>' + escaparHtml(vacina ? vacina.nome : '') + '</h4><p>Agendado para ' + formatarDataHoraBr(r.data, r.horario) + '</p></div></div>';
    }).join('') + '</div>';
  }

  html += '<div class="subtitulo-bloco-info">Agenda de medicamentos</div>';
  if (medicamentos.length === 0) {
    html += '<div class="mensagem-vazia">Nenhum medicamento cadastrado.</div>';
  } else {
    html += '<div class="lista-itens">' + medicamentos.map(function (m) {
      const confirmadoHoje = m.ultimaConfirmacaoData === hoje;
      return '<div class="item-lista">' +
        '<div class="item-lista-info"><h4>' + escaparHtml(m.nome) + '</h4><p>Horário: ' + m.horario + ' • ' + escaparHtml(m.dosagem) + '</p></div>' +
        '<div class="item-lista-acoes">' +
          '<span class="distintivo distintivo--' + m.via + '">' + (m.via === 'oral' ? 'Oral' : 'Intravenosa') + '</span>' +
          '<span class="distintivo distintivo--' + (confirmadoHoje ? 'administrado' : 'pendente') + '">' + (confirmadoHoje ? 'Administrado hoje' : 'Pendente') + '</span>' +
        '</div>' +
      '</div>';
    }).join('') + '</div>';
  }

  html += '<div class="links-modal-info">' +
    '<a class="botao botao--secundario" href="vacinas.html?pacienteId=' + id + '">Gerenciar vacinas</a>' +
    '<a class="botao botao--secundario" href="medicamentos.html?pacienteId=' + id + '">Gerenciar medicamentos</a>' +
  '</div>';

  document.getElementById('corpoModalInfo').innerHTML = html;
  document.getElementById('modalInfoPaciente').classList.remove('oculto');
}

function fecharModalInfoPaciente() {
  document.getElementById('modalInfoPaciente').classList.add('oculto');
}
