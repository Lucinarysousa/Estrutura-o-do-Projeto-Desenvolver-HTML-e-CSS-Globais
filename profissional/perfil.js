let sessaoPerfil = null;
let fotoPerfilBase64 = '';

document.addEventListener('DOMContentLoaded', function () {
  sessaoPerfil = exigirSessao('profissional', '../index.html');
  if (!sessaoPerfil) return;

  const profissional = obterProfissionalPorId(sessaoPerfil.id);
  fotoPerfilBase64 = profissional.foto || '';

  document.getElementById('perfilNome').value = profissional.nome;
  document.getElementById('perfilCpf').value = formatarCpf(profissional.cpf);
  document.getElementById('perfilEmail').value = profissional.email;
  document.getElementById('perfilNascimento').value = profissional.dataNascimento;
  document.getElementById('perfilCoren').value = profissional.coren;
  document.getElementById('previaFotoPerfil').outerHTML = profissional.foto
    ? '<img id="previaFotoPerfil" class="avatar avatar-grande" src="' + profissional.foto + '">'
    : '<div id="previaFotoPerfil" class="avatar-iniciais avatar-grande">' + gerarIniciais(profissional.nome) + '</div>';

  iniciarMotorAlarmes({ tipo: 'profissional', id: sessaoPerfil.id });

  document.getElementById('botaoSair').addEventListener('click', function () {
    sair('../index.html');
  });

  document.getElementById('botaoEscolherFotoPerfil').addEventListener('click', function () {
    document.getElementById('entradaFotoPerfil').click();
  });

  document.getElementById('entradaFotoPerfil').addEventListener('change', function (evento) {
    const arquivo = evento.target.files[0];
    if (!arquivo) return;
    lerImagemComoBase64(arquivo, function (base64) {
      fotoPerfilBase64 = base64;
      document.getElementById('previaFotoPerfil').outerHTML = '<img id="previaFotoPerfil" class="avatar avatar-grande" src="' + base64 + '">';
    });
  });

  document.getElementById('formularioPerfil').addEventListener('submit', function (evento) {
    evento.preventDefault();
    salvarPerfilProfissional();
  });

  document.getElementById('botaoExcluirConta').addEventListener('click', function () {
    confirmarAcao('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.', function () {
      excluirProfissional(sessaoPerfil.id);
      encerrarSessao();
      mostrarNotificacao('Conta excluída.', 'sucesso');
      setTimeout(function () { window.location.href = '../index.html'; }, 400);
    });
  });
});

function salvarPerfilProfissional() {
  document.getElementById('erroPerfilEmail').textContent = '';
  document.getElementById('erroPerfilSenha').textContent = '';

  const profissional = obterProfissionalPorId(sessaoPerfil.id);
  const nome = document.getElementById('perfilNome').value.trim();
  const email = document.getElementById('perfilEmail').value.trim();
  const dataNascimento = document.getElementById('perfilNascimento').value;
  const coren = document.getElementById('perfilCoren').value.trim();
  const novaSenha = document.getElementById('perfilNovaSenha').value;
  const confirmarSenha = document.getElementById('perfilConfirmarSenha').value;

  let possuiErro = false;

  if (!validarEmail(email)) {
    document.getElementById('erroPerfilEmail').textContent = 'Email inválido.';
    possuiErro = true;
  } else if (emailJaCadastrado(email, profissional.id)) {
    document.getElementById('erroPerfilEmail').textContent = 'Este email já possui cadastro na plataforma.';
    possuiErro = true;
  }

  if (novaSenha || confirmarSenha) {
    if (novaSenha.length < 6) {
      document.getElementById('erroPerfilSenha').textContent = 'A senha deve ter ao menos 6 caracteres.';
      possuiErro = true;
    } else if (novaSenha !== confirmarSenha) {
      document.getElementById('erroPerfilSenha').textContent = 'As senhas não coincidem.';
      possuiErro = true;
    }
  }

  if (!nome) {
    mostrarNotificacao('Informe o nome completo.', 'erro');
    possuiErro = true;
  }
  if (!coren) {
    mostrarNotificacao('Informe o número do COREN.', 'erro');
    possuiErro = true;
  }

  if (possuiErro) return;

  salvarProfissional({
    id: profissional.id,
    nome: nome,
    cpf: profissional.cpf,
    foto: fotoPerfilBase64,
    email: email,
    dataNascimento: dataNascimento,
    coren: coren,
    senha: novaSenha ? novaSenha : profissional.senha
  });

  mostrarNotificacao('Dados atualizados com sucesso.', 'sucesso');
  document.getElementById('perfilNovaSenha').value = '';
  document.getElementById('perfilConfirmarSenha').value = '';
}
