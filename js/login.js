let fotoCadastroBase64 = '';

document.addEventListener('DOMContentLoaded', function () {
  const sessao = obterSessao();
  if (sessao && sessao.tipo === 'profissional' && obterProfissionalPorId(sessao.id)) {
    window.location.href = 'profissional/dashboard.html';
    return;
  }
  if (sessao && sessao.tipo === 'paciente' && obterPacientePorId(sessao.id)) {
    window.location.href = 'paciente/dashboard.html';
    return;
  }

  const abaEntrar = document.getElementById('abaEntrar');
  const abaCadastrar = document.getElementById('abaCadastrar');
  const formularioEntrar = document.getElementById('formularioEntrar');
  const formularioCadastrar = document.getElementById('formularioCadastrar');

  abaEntrar.addEventListener('click', function () {
    abaEntrar.classList.add('aba-login--ativa');
    abaCadastrar.classList.remove('aba-login--ativa');
    formularioEntrar.classList.remove('oculto');
    formularioCadastrar.classList.add('oculto');
  });

  abaCadastrar.addEventListener('click', function () {
    abaCadastrar.classList.add('aba-login--ativa');
    abaEntrar.classList.remove('aba-login--ativa');
    formularioCadastrar.classList.remove('oculto');
    formularioEntrar.classList.add('oculto');
  });

  const cadastroCpf = document.getElementById('cadastroCpf');
  cadastroCpf.addEventListener('input', function () {
    cadastroCpf.value = formatarCpf(cadastroCpf.value);
  });

  const botaoEscolherFoto = document.getElementById('botaoEscolherFoto');
  const entradaFotoCadastro = document.getElementById('entradaFotoCadastro');
  const previaFotoCadastro = document.getElementById('previaFotoCadastro');

  botaoEscolherFoto.addEventListener('click', function () {
    entradaFotoCadastro.click();
  });

  entradaFotoCadastro.addEventListener('change', function () {
    const arquivo = entradaFotoCadastro.files[0];
    if (!arquivo) return;
    lerImagemComoBase64(arquivo, function (base64) {
      fotoCadastroBase64 = base64;
      previaFotoCadastro.outerHTML = '<img id="previaFotoCadastro" class="avatar avatar-grande" src="' + base64 + '">';
    });
  });

  formularioEntrar.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const email = document.getElementById('entrarEmail').value;
    const senha = document.getElementById('entrarSenha').value;
    const resultado = autenticar(email, senha);
    if (!resultado) {
      mostrarNotificacao('Email ou senha inválidos.', 'erro');
      return;
    }
    definirSessao(resultado.tipo, resultado.dados.id);
    mostrarNotificacao('Bem-vindo(a), ' + resultado.dados.nome + '!', 'sucesso');
    setTimeout(function () {
      window.location.href = resultado.tipo === 'profissional' ? 'profissional/dashboard.html' : 'paciente/dashboard.html';
    }, 500);
  });

  formularioCadastrar.addEventListener('submit', function (evento) {
    evento.preventDefault();

    document.getElementById('erroCadastroCpf').textContent = '';
    document.getElementById('erroCadastroEmail').textContent = '';
    document.getElementById('erroCadastroSenha').textContent = '';

    const nome = document.getElementById('cadastroNome').value.trim();
    const cpf = document.getElementById('cadastroCpf').value;
    const email = document.getElementById('cadastroEmail').value.trim();
    const dataNascimento = document.getElementById('cadastroNascimento').value;
    const coren = document.getElementById('cadastroCoren').value.trim();
    const senha = document.getElementById('cadastroSenha').value;
    const repetirSenha = document.getElementById('cadastroRepetirSenha').value;

    let possuiErro = false;

    if (!validarCpf(cpf)) {
      document.getElementById('erroCadastroCpf').textContent = 'CPF inválido.';
      possuiErro = true;
    } else if (cpfJaCadastrado(cpf)) {
      document.getElementById('erroCadastroCpf').textContent = 'Este CPF já possui cadastro na plataforma.';
      possuiErro = true;
    }

    if (!validarEmail(email)) {
      document.getElementById('erroCadastroEmail').textContent = 'Email inválido.';
      possuiErro = true;
    } else if (emailJaCadastrado(email)) {
      document.getElementById('erroCadastroEmail').textContent = 'Este email já possui cadastro na plataforma.';
      possuiErro = true;
    }

    if (senha.length < 6) {
      document.getElementById('erroCadastroSenha').textContent = 'A senha deve ter ao menos 6 caracteres.';
      possuiErro = true;
    } else if (senha !== repetirSenha) {
      document.getElementById('erroCadastroSenha').textContent = 'As senhas não coincidem.';
      possuiErro = true;
    }

    if (!nome) {
      mostrarNotificacao('Informe o nome completo.', 'erro');
      possuiErro = true;
    }

    if (!dataNascimento) {
      mostrarNotificacao('Informe a data de nascimento.', 'erro');
      possuiErro = true;
    } else if (calcularIdade(dataNascimento) < 18) {
      mostrarNotificacao('O profissional deve ser maior de idade.', 'erro');
      possuiErro = true;
    }

    if (!coren) {
      mostrarNotificacao('Informe o número do COREN.', 'erro');
      possuiErro = true;
    }

    if (possuiErro) return;

    const idProfissional = gerarId('prof');
    salvarProfissional({
      id: idProfissional,
      nome: nome,
      cpf: somenteNumeros(cpf),
      foto: fotoCadastroBase64,
      email: email,
      dataNascimento: dataNascimento,
      coren: coren,
      senha: senha
    });

    definirSessao('profissional', idProfissional);
    mostrarNotificacao('Cadastro realizado com sucesso!', 'sucesso');
    setTimeout(function () {
      window.location.href = 'profissional/dashboard.html';
    }, 500);
  });

  const botaoUsuariosExemplo = document.getElementById('botaoUsuariosExemplo');
  const modalExemplos = document.getElementById('modalExemplos');
  const listaCredenciaisExemplo = document.getElementById('listaCredenciaisExemplo');
  const fecharModalExemplos = document.getElementById('fecharModalExemplos');

  botaoUsuariosExemplo.addEventListener('click', function () {
    listaCredenciaisExemplo.innerHTML = obterCredenciaisExemplo().map(function (credencial) {
      return '<div class="credencial-exemplo">' +
        '<h4>' + escaparHtml(credencial.papel) + '</h4>' +
        '<p>Nome: ' + escaparHtml(credencial.nome) + '<br>' +
        'Email: <strong>' + escaparHtml(credencial.email) + '</strong><br>' +
        'Senha: <strong>' + escaparHtml(credencial.senha) + '</strong></p>' +
        '</div>';
    }).join('');
    modalExemplos.classList.remove('oculto');
  });

  fecharModalExemplos.addEventListener('click', function () {
    modalExemplos.classList.add('oculto');
  });

  modalExemplos.addEventListener('click', function (evento) {
    if (evento.target === modalExemplos) {
      modalExemplos.classList.add('oculto');
    }
  });
});
