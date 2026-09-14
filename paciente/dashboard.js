let sessaoAtual = null;

document.addEventListener('DOMContentLoaded', function () {
  sessaoAtual = exigirSessao('paciente', '../index.html');
  if (!sessaoAtual) return;

  renderizarPainelPaciente();
  iniciarMotorAlarmes({ tipo: 'paciente', id: sessaoAtual.id });

  document.getElementById('botaoSair').addEventListener('click', function () { sair('../index.html'); });
  document.addEventListener('bemEstarAtualizarPainel', renderizarPainelPaciente);
});

function renderizarPainelPaciente() {
  const paciente = obterPacientePorId(sessaoAtual.id);

  document.getElementById('nomePacienteCabecalho').textContent = paciente.nome;
  document.getElementById('avatarCabecalho').innerHTML = renderizarAvatar(paciente.foto, paciente.nome);
  document.getElementById('avatarResumoPaciente').innerHTML = renderizarAvatar(paciente.foto, paciente.nome, 'avatar-grande');
  document.getElementById('nomeResumoPaciente').textContent = paciente.nome;
  document.getElementById('detalhesResumoPaciente').textContent = 'CPF: ' + formatarCpf(paciente.cpf) + ' • ' + calcularIdade(paciente.dataNascimento) + ' anos • ' + paciente.email;

  const anamnese = obterAnamnesePorPaciente(paciente.id) || {};
  document.getElementById('gradeSinaisVitaisPaciente').innerHTML =
    '<div class="sinal-vital"><span class="rotulo-sinal">Temperatura</span><span class="valor-sinal">' + escaparHtml(anamnese.temperatura || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Pulso</span><span class="valor-sinal">' + escaparHtml(anamnese.pulso || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Freq. Respiratória</span><span class="valor-sinal">' + escaparHtml(anamnese.frequenciaRespiratoria || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Pressão Arterial</span><span class="valor-sinal">' + escaparHtml(anamnese.pressaoArterial || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">SpO2</span><span class="valor-sinal">' + escaparHtml(anamnese.saturacao || '—') + '</span></div>' +
    '<div class="sinal-vital"><span class="rotulo-sinal">Glicemia</span><span class="valor-sinal">' + escaparHtml(anamnese.glicemia || '—') + '</span></div>';

  document.getElementById('alergiaPaciente').textContent = anamnese.alergiaMedicamentosa || 'Nenhuma informada.';
  document.getElementById('historicoPaciente').textContent = anamnese.historicoFamiliar || 'Nenhum informado.';

  renderizarVacinasPaciente(paciente.id);
  renderizarMedicamentosPaciente(paciente.id);
}

function renderizarVacinasPaciente(pacienteId) {
  const container = document.getElementById('listaVacinasPaciente');
  const vacinas = obterVacinasPorPaciente(pacienteId);

  if (vacinas.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhuma vacina registrada.</div>';
    return;
  }

  container.innerHTML = vacinas.map(function (v) {
    const reforcos = obterReforcosPorVacina(v.id);
    const pendente = reforcos.find(function (r) { return r.status === 'pendente'; });
    return '<div class="item-lista">' +
      '<div class="item-lista-info">' +
        '<h4>' + escaparHtml(v.nome) + '</h4>' +
        '<p>Aplicada em ' + formatarDataBr(v.dataAplicacao) + (v.dose ? ' • ' + escaparHtml(v.dose) : '') + '</p>' +
        (pendente ? '<p>Próximo reforço: ' + formatarDataHoraBr(pendente.data, pendente.horario) + '</p>' : '') +
      '</div>' +
      (pendente ? '<span class="distintivo distintivo--pendente">Reforço pendente</span>' : '<span class="distintivo distintivo--concluido">Em dia</span>') +
    '</div>';
  }).join('');
}

function renderizarMedicamentosPaciente(pacienteId) {
  const container = document.getElementById('listaMedicamentosPaciente');
  const medicamentos = obterMedicamentosPorPaciente(pacienteId);
  const hoje = obterDataHoraAtualBrasil().data;

  if (medicamentos.length === 0) {
    container.innerHTML = '<div class="mensagem-vazia">Nenhum medicamento cadastrado.</div>';
    return;
  }

  container.innerHTML = medicamentos.map(function (m) {
    const confirmadoHoje = m.ultimaConfirmacaoData === hoje;
    return '<div class="item-lista">' +
      '<div class="item-lista-info"><h4>' + escaparHtml(m.nome) + '</h4><p>' + escaparHtml(m.dosagem) + ' • Horário: ' + m.horario + '</p></div>' +
      '<div class="item-lista-acoes">' +
        '<span class="distintivo distintivo--' + m.via + '">' + (m.via === 'oral' ? 'Oral' : 'Intravenosa') + '</span>' +
        '<span class="distintivo distintivo--' + (confirmadoHoje ? 'administrado' : 'pendente') + '">' + (confirmadoHoje ? 'Administrado hoje' : 'Pendente') + '</span>' +
        (!confirmadoHoje ? '<button type="button" class="botao botao--secundario botao--pequeno" onclick="confirmarMedicamentoPaciente(\'' + m.id + '\')">Marcar administrado</button>' : '') +
      '</div>' +
    '</div>';
  }).join('');
}

function confirmarMedicamentoPaciente(id) {
  const medicamento = obterMedicamentoPorId(id);
  if (!medicamento) return;
  medicamento.ultimaConfirmacaoData = obterDataHoraAtualBrasil().data;
  salvarMedicamento(medicamento);
  mostrarNotificacao('Medicamento confirmado como administrado.', 'sucesso');
  renderizarPainelPaciente();
}
