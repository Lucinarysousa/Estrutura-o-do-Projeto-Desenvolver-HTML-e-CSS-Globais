let fotoPacienteBase64 = '';

document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('abaDadosPaciente').addEventListener('click', function () { mudarAbaPaciente('dados'); });
  document.getElementById('abaAnamnesePaciente').addEventListener('click', function () { mudarAbaPaciente('anamnese'); });

  document.getElementById('fecharModalFormularioPaciente').addEventListener('click', fecharModalFormularioPaciente);
  document.getElementById('botaoCancelarFormularioPaciente').addEventListener('click', fecharModalFormularioPaciente);
  document.getElementById('modalFormularioPaciente').addEventListener('click', function (evento) {
    if (evento.target.id === 'modalFormularioPaciente') fecharModalFormularioPaciente();
  });

  document.getElementById('pacienteCpf').addEventListener('input', function (evento) {
    evento.target.value = formatarCpf(evento.target.value);
  });

  document.getElementById('botaoEscolherFotoPaciente').addEventListener('click', function () {
    document.getElementById('entradaFotoPaciente').click();
  });

  document.getElementById('entradaFotoPaciente').addEventListener('change', function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    lerImagemComoBase64(arquivo, function (base64) {
      fotoPacienteBase64 = base64;
      document.getElementById('previaFotoPaciente').outerHTML = '<img id="previaFotoPaciente" class="avatar avatar-grande" src="' + base64 + '">';
    });
  });

  document.getElementById('formularioPaciente').addEventListener('submit', function (evento) {
    evento.preventDefault();
    salvarFormularioPaciente();
  });

  document.getElementById('botaoNovoPaciente').addEventListener('click', abrirModalNovoPaciente);
});

function mudarAbaPaciente(aba) {
  const abaDados = document.getElementById('abaDadosPaciente');
  const abaAnamnese = document.getElementById('abaAnamnesePaciente');
  const painelDados = document.getElementById('painelDadosPaciente');
  const painelAnamnese = document.getElementById('painelAnamnesePaciente');
  if (aba === 'dados') {
    abaDados.classList.add('aba--ativa');
    abaAnamnese.classList.remove('aba--ativa');
    painelDados.classList.remove('oculto');
    painelAnamnese.classList.add('oculto');
  } else {
    abaAnamnese.classList.add('aba--ativa');
    abaDados.classList.remove('aba--ativa');
    painelAnamnese.classList.remove('oculto');
    painelDados.classList.add('oculto');
  }
}

function abrirModalNovoPaciente() {
  document.getElementById('tituloModalFormularioPaciente').textContent = 'Novo paciente';
  document.getElementById('formularioPaciente').reset();
  document.getElementById('pacienteIdFormulario').value = '';
  document.getElementById('previaFotoPaciente').outerHTML = '<div id="previaFotoPaciente" class="avatar-iniciais avatar-grande">?</div>';
  fotoPacienteBase64 = '';
  document.getElementById('rotuloSenhaOpcional').classList.add('oculto');
  document.getElementById('pacienteSenha').required = true;
  document.getElementById('pacienteRepetirSenha').required = true;
  document.getElementById('erroPacienteCpf').textContent = '';
  document.getElementById('erroPacienteEmail').textContent = '';
  document.getElementById('erroPacienteSenha').textContent = '';
  mudarAbaPaciente('dados');
  document.getElementById('modalFormularioPaciente').classList.remove('oculto');
}

function abrirModalEditarPaciente(id) {
  const paciente = obterPacientePorId(id);
  if (!paciente) return;

  document.getElementById('tituloModalFormularioPaciente').textContent = 'Editar paciente';
  document.getElementById('pacienteIdFormulario').value = paciente.id;
  document.getElementById('pacienteNome').value = paciente.nome;
  document.getElementById('pacienteCpf').value = formatarCpf(paciente.cpf);
  document.getElementById('pacienteEmail').value = paciente.email;
  document.getElementById('pacienteNascimento').value = paciente.dataNascimento;
  document.getElementById('pacienteSenha').value = '';
  document.getElementById('pacienteRepetirSenha').value = '';
  document.getElementById('rotuloSenhaOpcional').classList.remove('oculto');
  document.getElementById('pacienteSenha').required = false;
  document.getElementById('pacienteRepetirSenha').required = false;
  document.getElementById('erroPacienteCpf').textContent = '';
  document.getElementById('erroPacienteEmail').textContent = '';
  document.getElementById('erroPacienteSenha').textContent = '';

  fotoPacienteBase64 = paciente.foto || '';
  document.getElementById('previaFotoPaciente').outerHTML = paciente.foto
    ? '<img id="previaFotoPaciente" class="avatar avatar-grande" src="' + paciente.foto + '">'
    : '<div id="previaFotoPaciente" class="avatar-iniciais avatar-grande">' + gerarIniciais(paciente.nome) + '</div>';

  const anamnese = obterAnamnesePorPaciente(id) || {};
  document.getElementById('anamneseTemperatura').value = anamnese.temperatura || '';
  document.getElementById('anamnesePulso').value = anamnese.pulso || '';
  document.getElementById('anamneseRespiratoria').value = anamnese.frequenciaRespiratoria || '';
  document.getElementById('anamnesePressao').value = anamnese.pressaoArterial || '';
  document.getElementById('anamneseSaturacao').value = anamnese.saturacao || '';
  document.getElementById('anamneseGlicemia').value = anamnese.glicemia || '';
  document.getElementById('anamneseAlergia').value = anamnese.alergiaMedicamentosa || '';
  document.getElementById('anamneseHistorico').value = anamnese.historicoFamiliar || '';

  mudarAbaPaciente('dados');
  document.getElementById('modalFormularioPaciente').classList.remove('oculto');
}

function fecharModalFormularioPaciente() {
  document.getElementById('modalFormularioPaciente').classList.add('oculto');
}

function salvarFormularioPaciente() {
  document.getElementById('erroPacienteCpf').textContent = '';
  document.getElementById('erroPacienteEmail').textContent = '';
  document.getElementById('erroPacienteSenha').textContent = '';

  const idExistente = document.getElementById('pacienteIdFormulario').value;
  const nome = document.getElementById('pacienteNome').value.trim();
  const cpf = document.getElementById('pacienteCpf').value;
  const email = document.getElementById('pacienteEmail').value.trim();
  const dataNascimento = document.getElementById('pacienteNascimento').value;
  const senha = document.getElementById('pacienteSenha').value;
  const repetirSenha = document.getElementById('pacienteRepetirSenha').value;

  let possuiErro = false;

  if (!validarCpf(cpf)) {
    document.getElementById('erroPacienteCpf').textContent = 'CPF inválido.';
    possuiErro = true;
  } else if (cpfJaCadastrado(cpf, idExistente)) {
    document.getElementById('erroPacienteCpf').textContent = 'Este CPF já possui cadastro na plataforma.';
    possuiErro = true;
  }

  if (!validarEmail(email)) {
    document.getElementById('erroPacienteEmail').textContent = 'Email inválido.';
    possuiErro = true;
  } else if (emailJaCadastrado(email, idExistente)) {
    document.getElementById('erroPacienteEmail').textContent = 'Este email já possui cadastro na plataforma.';
    possuiErro = true;
  }

  if (!idExistente || senha || repetirSenha) {
    if (senha.length < 6) {
      document.getElementById('erroPacienteSenha').textContent = 'A senha deve ter ao menos 6 caracteres.';
      possuiErro = true;
    } else if (senha !== repetirSenha) {
      document.getElementById('erroPacienteSenha').textContent = 'As senhas não coincidem.';
      possuiErro = true;
    }
  }

  if (!nome) {
    mostrarNotificacao('Informe o nome completo.', 'erro');
    possuiErro = true;
  }
  if (!dataNascimento) {
    mostrarNotificacao('Informe a data de nascimento.', 'erro');
    possuiErro = true;
  }

  if (possuiErro) return;

  const id = idExistente || gerarId('pac');
  const pacienteAnterior = idExistente ? obterPacientePorId(idExistente) : null;

  salvarPaciente({
    id: id,
    profissionalId: sessaoAtual.id,
    nome: nome,
    cpf: somenteNumeros(cpf),
    foto: fotoPacienteBase64,
    email: email,
    dataNascimento: dataNascimento,
    senha: senha ? senha : (pacienteAnterior ? pacienteAnterior.senha : senha)
  });

  const anamneseExistente = obterAnamnesePorPaciente(id);
  salvarAnamnese({
    id: anamneseExistente ? anamneseExistente.id : gerarId('anam'),
    pacienteId: id,
    temperatura: document.getElementById('anamneseTemperatura').value.trim(),
    pulso: document.getElementById('anamnesePulso').value.trim(),
    frequenciaRespiratoria: document.getElementById('anamneseRespiratoria').value.trim(),
    pressaoArterial: document.getElementById('anamnesePressao').value.trim(),
    saturacao: document.getElementById('anamneseSaturacao').value.trim(),
    glicemia: document.getElementById('anamneseGlicemia').value.trim(),
    alergiaMedicamentosa: document.getElementById('anamneseAlergia').value.trim(),
    historicoFamiliar: document.getElementById('anamneseHistorico').value.trim()
  });

  mostrarNotificacao(idExistente ? 'Paciente atualizado com sucesso.' : 'Paciente cadastrado com sucesso.', 'sucesso');
  fecharModalFormularioPaciente();
  fecharModalInfoPaciente();
  atualizarPainelProfissional();
}
