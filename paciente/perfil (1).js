let sessaoPerfilPaciente = null;
let fotoPerfilPacienteBase64 = '';

document.addEventListener('DOMContentLoaded', function () {
  sessaoPerfilPaciente = exigirSessao('paciente', '../index.html');
  if (!sessaoPerfilPaciente) return;

  const paciente = obterPacientePorId(sessaoPerfilPaciente.id);
  fotoPerfilPacienteBase64 = paciente.foto || '';

  document.getElementById('perfilPacienteNome').value = paciente.nome;
  document.getElementById('perfilPacienteCpf').value = formatarCpf(paciente.cpf);
  document.getElementById('perfilPacienteEmail').value = paciente.email;
  document.getElementById('perfilPacienteNascimento').value = paciente.dataNascimento;
  document.getElementById('previaFotoPerfilPaciente').outerHTML = paciente.foto
    ? '<img id="previaFotoPerfilPaciente" class="avatar avatar-grande" src="' + paciente.foto + '">'
    : '<div id="previaFotoPerfilPaciente" class="avatar-iniciais avatar-grande">' + gerarIniciais(paciente.nome) + '</div>';

  iniciarMotorAlarmes({ tipo: 'paciente', id: sessaoPerfilPaciente.id });

  document.getElementById('botaoSair').addEventListener('click', function () {
    sair('../index.html');
  });

  document.getElementById('botaoEscolherFotoPerfilPaciente').addEventListener('click', function () {
    document.getElementById('entradaFotoPerfilPaciente').click();
  });

  document.getElementById('entradaFotoPerfilPaciente').addEventListener('change', function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    lerImagemComoBase64(arquivo, function (base64) {
      fotoPerfilPacienteBase64 = base64;
      document.getElementById('previaFotoPerfilPaciente').outerHTML = '<img id="previaFotoPerfilPaciente" class="avatar avatar-grande" src="' + base64 + '">';
    });
  });

  document.getElementById('formularioPerfilPaciente').addEventListener('submit', function (evento) {
    evento.preventDefault();
    salvarPerfilPaciente();
  });
});

function salvarPerfilPaciente() {
  document.getElementById('erroPerfilPacienteEmail').textContent = '';
  document.getElementById('erroPerfilPacienteSenha').textContent = '';

  const paciente = obterPacientePorId(sessaoPerfilPaciente.id);
  const nome = document.getElementById('perfilPacienteNome').value.trim();
  const email = document.getElementById('perfilPacienteEmail').value.trim();
  const dataNascimento = document.getElementById('perfilPacienteNascimento').value;
  const novaSenha = document.getElementById('perfilPacienteNovaSenha').value;
  const confirmarSenha = document.getElementById('perfilPacienteConfirmarSenha').value;

  let possuiErro = false;

  if (!validarEmail(email)) {
    document.getElementById('erroPerfilPacienteEmail').textContent = 'Email inválido.';
    possuiErro = true;
  } else if (emailJaCadastrado(email, paciente.id)) {
    document.getElementById('erroPerfilPacienteEmail').textContent = 'Este email já possui cadastro na plataforma.';
    possuiErro = true;
  }

  if (novaSenha || confirmarSenha) {
    if (novaSenha.length < 6) {
      document.getElementById('erroPerfilPacienteSenha').textContent = 'A senha deve ter ao menos 6 caracteres.';
      possuiErro = true;
    } else if (novaSenha !== confirmarSenha) {
      document.getElementById('erroPerfilPacienteSenha').textContent = 'As senhas não coincidem.';
      possuiErro = true;
    }
  }

  if (!nome) {
    mostrarNotificacao('Informe o nome completo.', 'erro');
    possuiErro = true;
  }

  if (possuiErro) return;

  salvarPaciente({
    id: paciente.id,
    profissionalId: paciente.profissionalId,
    nome: nome,
    cpf: paciente.cpf,
    foto: fotoPerfilPacienteBase64,
    email: email,
    dataNascimento: dataNascimento,
    senha: novaSenha ? novaSenha : paciente.senha
  });

  mostrarNotificacao('Dados atualizados com sucesso.', 'sucesso');
  document.getElementById('perfilPacienteNovaSenha').value = '';
  document.getElementById('perfilPacienteConfirmarSenha').value = '';
}
