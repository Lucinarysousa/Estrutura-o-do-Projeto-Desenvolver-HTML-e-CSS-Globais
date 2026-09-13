function somenteNumeros(texto) {
  return (texto || '').toString().replace(/\D/g, '');
}

function validarCpf(cpfEntrada) {
  const cpf = somenteNumeros(cpfEntrada);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpf[i], 10) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpf[i], 10) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(cpf[10], 10)) return false;

  return true;
}

function formatarCpf(cpfEntrada) {
  const cpf = somenteNumeros(cpfEntrada);
  if (cpf.length !== 11) return cpfEntrada || '';
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

function validarEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || '').trim());
}

function calcularIdade(dataNascimentoIso) {
  if (!dataNascimentoIso) return null;
  const hoje = new Date();
  const nascimento = new Date(dataNascimentoIso + 'T00:00:00');
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const diferencaMes = hoje.getMonth() - nascimento.getMonth();
  if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) {
    idade--;
  }
  return idade;
}

function formatarDataBr(dataIso) {
  if (!dataIso) return '';
  const partes = dataIso.split('-');
  if (partes.length !== 3) return dataIso;
  return partes[2] + '/' + partes[1] + '/' + partes[0];
}

function formatarDataHoraBr(dataIso, horario) {
  return formatarDataBr(dataIso) + (horario ? ' às ' + horario : '');
}

function obterDataHoraBrasilDeInstante(instante) {
  const data = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(instante);
  const hora = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(instante);
  return { data: data, hora: hora };
}

function obterDataHoraAtualBrasil() {
  return obterDataHoraBrasilDeInstante(new Date());
}

function gerarIniciais(nome) {
  if (!nome) return '?';
  return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map(function (parte) {
    return parte[0].toUpperCase();
  }).join('');
}

function lerImagemComoBase64(arquivo, retorno) {
  const leitor = new FileReader();
  leitor.onload = function () {
    retorno(leitor.result);
  };
  leitor.readAsDataURL(arquivo);
}

function garantirAreaNotificacoes() {
  let area = document.getElementById('areaNotificacoes');
  if (!area) {
    area = document.createElement('div');
    area.id = 'areaNotificacoes';
    area.className = 'area-notificacoes';
    document.body.appendChild(area);
  }
  return area;
}

function mostrarNotificacao(mensagem, tipo) {
  const area = garantirAreaNotificacoes();
  const item = document.createElement('div');
  item.className = 'notificacao notificacao--' + (tipo || 'info');
  item.textContent = mensagem;
  area.appendChild(item);
  setTimeout(function () {
    item.remove();
  }, 3800);
}

function renderizarAvatar(foto, nome, classeExtra) {
  if (foto) {
    return '<img class="avatar ' + (classeExtra || '') + '" src="' + foto + '" alt="Foto de ' + nome + '">';
  }
  return '<div class="avatar-iniciais ' + (classeExtra || '') + '">' + gerarIniciais(nome) + '</div>';
}

function garantirModalConfirmacao() {
  if (document.getElementById('modalConfirmacaoGenerica')) return;
  const sobreposicao = document.createElement('div');
  sobreposicao.id = 'modalConfirmacaoGenerica';
  sobreposicao.className = 'sobreposicao-modal oculto';
  sobreposicao.innerHTML =
    '<div class="caixa-modal caixa-modal--estreita">' +
      '<div class="cabecalho-modal"><h2>Confirmar ação</h2></div>' +
      '<p id="mensagemConfirmacaoGenerica" style="margin-bottom:20px;color:var(--texto-secundario);font-size:14px;line-height:1.5;"></p>' +
      '<div class="rodape-formulario">' +
        '<button type="button" class="botao botao--secundario" id="botaoCancelarConfirmacaoGenerica">Cancelar</button>' +
        '<button type="button" class="botao botao--perigo" id="botaoConfirmarConfirmacaoGenerica">Confirmar</button>' +
      '</div>' +
    '</div>';
  document.body.appendChild(sobreposicao);
}

function confirmarAcao(mensagem, aoConfirmar) {
  garantirModalConfirmacao();
  const modal = document.getElementById('modalConfirmacaoGenerica');
  document.getElementById('mensagemConfirmacaoGenerica').textContent = mensagem;
  modal.classList.remove('oculto');

  const botaoConfirmar = document.getElementById('botaoConfirmarConfirmacaoGenerica');
  const botaoCancelar = document.getElementById('botaoCancelarConfirmacaoGenerica');
  const novoConfirmar = botaoConfirmar.cloneNode(true);
  botaoConfirmar.parentNode.replaceChild(novoConfirmar, botaoConfirmar);
  const novoCancelar = botaoCancelar.cloneNode(true);
  botaoCancelar.parentNode.replaceChild(novoCancelar, botaoCancelar);

  novoConfirmar.addEventListener('click', function () {
    modal.classList.add('oculto');
    aoConfirmar();
  });
  novoCancelar.addEventListener('click', function () {
    modal.classList.add('oculto');
  });
}

function escaparHtml(texto) {
  if (texto === undefined || texto === null) return '';
  return texto.toString()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inicializarMenuResponsivo() {
  const areaUsuario = document.querySelector('.cabecalho-usuario');
  const navegacao = document.querySelector('.cabecalho-navegacao');
  if (!areaUsuario || !navegacao || document.querySelector('.botao-hamburguer')) return;

  const botaoMenu = document.createElement('button');
  botaoMenu.type = 'button';
  botaoMenu.className = 'botao-hamburguer';
  botaoMenu.setAttribute('aria-label', 'Abrir menu');
  botaoMenu.innerHTML = '<span></span><span></span><span></span>';
  areaUsuario.insertBefore(botaoMenu, navegacao);

  function fecharMenuResponsivo() {
    navegacao.classList.remove('cabecalho-navegacao--aberta');
    botaoMenu.classList.remove('botao-hamburguer--aberto');
  }

  botaoMenu.addEventListener('click', function (evento) {
    evento.stopPropagation();
    navegacao.classList.toggle('cabecalho-navegacao--aberta');
    botaoMenu.classList.toggle('botao-hamburguer--aberto');
  });

  navegacao.addEventListener('click', function (evento) {
    if (evento.target.closest('a, button')) {
      fecharMenuResponsivo();
    }
  });

  document.addEventListener('click', function (evento) {
    if (!areaUsuario.contains(evento.target)) {
      fecharMenuResponsivo();
    }
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth > 640) {
      fecharMenuResponsivo();
    }
  });
}

document.addEventListener('DOMContentLoaded', inicializarMenuResponsivo);
