let contextoAtualAlarmes = null;
let filaAlarmes = [];
let idsEmFilaAlarmes = new Set();
let exibindoAlarme = false;
let snoozeReforcos = {};
let contextoAudioAlarme = null;
let intervaloSomAlarme = null;

function iniciarMotorAlarmes(escopo) {
  contextoAtualAlarmes = escopo;
  verificarAlarmes();
  setInterval(verificarAlarmes, 20000);
}

function obterIdsPacientesEscopo() {
  if (!contextoAtualAlarmes) return [];
  if (contextoAtualAlarmes.tipo === 'profissional') {
    return obterPacientesPorProfissional(contextoAtualAlarmes.id).map(function (p) { return p.id; });
  }
  return [contextoAtualAlarmes.id];
}

function adicionarNaFilaAlarme(item) {
  const chave = item.tipo + '-' + item.id;
  if (idsEmFilaAlarmes.has(chave)) return;
  idsEmFilaAlarmes.add(chave);
  filaAlarmes.push(item);
}

function verificarAlarmes() {
  const agora = obterDataHoraAtualBrasil();
  const idsPacientes = obterIdsPacientesEscopo();
  if (idsPacientes.length === 0) return;

  obterMedicamentos().filter(function (medicamento) {
    return idsPacientes.indexOf(medicamento.pacienteId) !== -1;
  }).forEach(function (medicamento) {
    const dataInicioOk = !medicamento.dataInicio || medicamento.dataInicio <= agora.data;
    const dataFimOk = !medicamento.dataFim || medicamento.dataFim >= agora.data;
    const horarioChegou = medicamento.horario <= agora.hora;
    const jaConfirmadoHoje = medicamento.ultimaConfirmacaoData === agora.data;
    if (dataInicioOk && dataFimOk && horarioChegou && !jaConfirmadoHoje) {
      adicionarNaFilaAlarme({ tipo: 'medicamento', id: medicamento.id });
    }
  });

  obterReforcos().filter(function (reforco) {
    return idsPacientes.indexOf(reforco.pacienteId) !== -1 && reforco.status === 'pendente';
  }).forEach(function (reforco) {
    const suspensoAte = snoozeReforcos[reforco.id] || 0;
    if (Date.now() < suspensoAte) return;
    const dataHoraChegou = reforco.data < agora.data || (reforco.data === agora.data && reforco.horario <= agora.hora);
    if (dataHoraChegou) {
      adicionarNaFilaAlarme({ tipo: 'reforco', id: reforco.id });
    }
  });

  processarFilaAlarmes();
}

function processarFilaAlarmes() {
  if (!exibindoAlarme && filaAlarmes.length > 0) {
    mostrarProximoAlarme();
  }
}

function garantirModalAlarme() {
  if (document.getElementById('sobreposicaoAlarme')) return;
  const sobreposicao = document.createElement('div');
  sobreposicao.id = 'sobreposicaoAlarme';
  sobreposicao.className = 'sobreposicao-modal oculto';
  sobreposicao.innerHTML =
    '<div class="caixa-modal caixa-modal--estreita caixa-alarme">' +
      '<span class="icone-alarme">⏰</span>' +
      '<h2 id="tituloAlarme" style="text-align:center;margin-bottom:10px;"></h2>' +
      '<div id="corpoAlarme" style="text-align:center;margin-bottom:18px;color:var(--texto-secundario);font-size:14px;line-height:1.6;"></div>' +
      '<div id="acoesAlarme" style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;"></div>' +
    '</div>';
  document.body.appendChild(sobreposicao);
}

function mostrarProximoAlarme() {
  garantirModalAlarme();
  const item = filaAlarmes.shift();
  const titulo = document.getElementById('tituloAlarme');
  const corpo = document.getElementById('corpoAlarme');
  const acoes = document.getElementById('acoesAlarme');
  acoes.innerHTML = '';

  if (item.tipo === 'medicamento') {
    const medicamento = obterMedicamentoPorId(item.id);
    if (!medicamento) {
      idsEmFilaAlarmes.delete('medicamento-' + item.id);
      processarFilaAlarmes();
      return;
    }
    const paciente = obterPacientePorId(medicamento.pacienteId);
    titulo.textContent = 'Hora do medicamento';
    corpo.innerHTML = '<strong>' + escaparHtml(medicamento.nome) + '</strong><br>' +
      'Paciente: ' + escaparHtml(paciente ? paciente.nome : '') + '<br>' +
      'Via: ' + (medicamento.via === 'oral' ? 'Oral' : 'Intravenosa') + ' • Dosagem: ' + escaparHtml(medicamento.dosagem) + '<br>' +
      'Horário: ' + medicamento.horario;
    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.className = 'botao botao--primario';
    botaoConfirmar.textContent = 'Confirmar administração';
    botaoConfirmar.onclick = function () { confirmarMedicamentoAlarme(item.id); };
    acoes.appendChild(botaoConfirmar);
  } else {
    const reforco = obterReforcoPorId(item.id);
    if (!reforco) {
      idsEmFilaAlarmes.delete('reforco-' + item.id);
      processarFilaAlarmes();
      return;
    }
    const vacina = obterVacinaPorId(reforco.vacinaId);
    const paciente = obterPacientePorId(reforco.pacienteId);
    titulo.textContent = 'Reforço de vacina agendado';
    corpo.innerHTML = '<strong>' + escaparHtml(vacina ? vacina.nome : '') + '</strong><br>' +
      'Paciente: ' + escaparHtml(paciente ? paciente.nome : '') + '<br>' +
      'Agendado para ' + formatarDataHoraBr(reforco.data, reforco.horario);
    const botaoConfirmar = document.createElement('button');
    botaoConfirmar.className = 'botao botao--primario';
    botaoConfirmar.textContent = 'Confirmar aplicação';
    botaoConfirmar.onclick = function () { confirmarReforcoAlarme(item.id); };
    const botaoAdiar = document.createElement('button');
    botaoAdiar.className = 'botao botao--secundario';
    botaoAdiar.textContent = 'Lembrar em 30 min';
    botaoAdiar.onclick = function () { adiarReforcoAlarme(item.id); };
    acoes.appendChild(botaoConfirmar);
    acoes.appendChild(botaoAdiar);
  }

  exibindoAlarme = true;
  document.getElementById('sobreposicaoAlarme').classList.remove('oculto');
  iniciarSomAlarme();
}

function fecharAlarmeAtual() {
  pararSomAlarme();
  const sobreposicao = document.getElementById('sobreposicaoAlarme');
  if (sobreposicao) sobreposicao.classList.add('oculto');
  exibindoAlarme = false;
  document.dispatchEvent(new CustomEvent('bemEstarAtualizarPainel'));
  setTimeout(processarFilaAlarmes, 400);
}

function confirmarMedicamentoAlarme(id) {
  const medicamento = obterMedicamentoPorId(id);
  if (medicamento) {
    medicamento.ultimaConfirmacaoData = obterDataHoraAtualBrasil().data;
    salvarMedicamento(medicamento);
    mostrarNotificacao('Medicamento confirmado como administrado.', 'sucesso');
  }
  idsEmFilaAlarmes.delete('medicamento-' + id);
  fecharAlarmeAtual();
}

function confirmarReforcoAlarme(id) {
  const reforco = obterReforcoPorId(id);
  if (reforco) {
    reforco.status = 'concluido';
    salvarReforco(reforco);
    mostrarNotificacao('Reforço de vacina confirmado.', 'sucesso');
  }
  idsEmFilaAlarmes.delete('reforco-' + id);
  fecharAlarmeAtual();
}

function adiarReforcoAlarme(id) {
  snoozeReforcos[id] = Date.now() + 30 * 60000;
  idsEmFilaAlarmes.delete('reforco-' + id);
  mostrarNotificacao('Lembrete adiado por 30 minutos.', 'info');
  fecharAlarmeAtual();
}

function tocarBipeAlarme() {
  try {
    if (!contextoAudioAlarme) {
      contextoAudioAlarme = new (window.AudioContext || window.webkitAudioContext)();
    }
    const oscilador = contextoAudioAlarme.createOscillator();
    const ganho = contextoAudioAlarme.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.value = 880;
    ganho.gain.value = 0.16;
    oscilador.connect(ganho);
    ganho.connect(contextoAudioAlarme.destination);
    oscilador.start();
    oscilador.stop(contextoAudioAlarme.currentTime + 0.35);
  } catch (erro) {
    /* ambiente sem suporte a áudio */
  }
}

function iniciarSomAlarme() {
  tocarBipeAlarme();
  intervaloSomAlarme = setInterval(tocarBipeAlarme, 1200);
}

function pararSomAlarme() {
  if (intervaloSomAlarme) {
    clearInterval(intervaloSomAlarme);
    intervaloSomAlarme = null;
  }
}
