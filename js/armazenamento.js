const CHAVE_PROFISSIONAIS = 'bemEstarProfissionais';
const CHAVE_PACIENTES = 'bemEstarPacientes';
const CHAVE_ANAMNESES = 'bemEstarAnamneses';
const CHAVE_VACINAS = 'bemEstarVacinas';
const CHAVE_REFORCOS = 'bemEstarReforcos';
const CHAVE_MEDICAMENTOS = 'bemEstarMedicamentos';
const CHAVE_SESSAO = 'bemEstarSessao';
const CHAVE_SEMENTE = 'bemEstarSementeAplicada';

function obterLista(chave) {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? JSON.parse(bruto) : [];
  } catch (erro) {
    return [];
  }
}

function salvarListaCompleta(chave, lista) {
  localStorage.setItem(chave, JSON.stringify(lista));
}

function gerarId(prefixo) {
  return prefixo + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

function obterProfissionais() {
  return obterLista(CHAVE_PROFISSIONAIS);
}

function obterProfissionalPorId(id) {
  return obterProfissionais().find(function (item) { return item.id === id; }) || null;
}

function cpfJaCadastrado(cpf, ignorarId) {
  const cpfLimpo = somenteNumeros(cpf);
  const emProfissionais = obterProfissionais().some(function (item) {
    return somenteNumeros(item.cpf) === cpfLimpo && item.id !== ignorarId;
  });
  const emPacientes = obterPacientes().some(function (item) {
    return somenteNumeros(item.cpf) === cpfLimpo && item.id !== ignorarId;
  });
  return emProfissionais || emPacientes;
}

function emailJaCadastrado(email, ignorarId) {
  const emailLimpo = (email || '').trim().toLowerCase();
  const emProfissionais = obterProfissionais().some(function (item) {
    return item.email.toLowerCase() === emailLimpo && item.id !== ignorarId;
  });
  const emPacientes = obterPacientes().some(function (item) {
    return item.email.toLowerCase() === emailLimpo && item.id !== ignorarId;
  });
  return emProfissionais || emPacientes;
}

function salvarProfissional(profissional) {
  const lista = obterProfissionais();
  const indice = lista.findIndex(function (item) { return item.id === profissional.id; });
  if (indice === -1) {
    lista.push(profissional);
  } else {
    lista[indice] = profissional;
  }
  salvarListaCompleta(CHAVE_PROFISSIONAIS, lista);
}

function excluirProfissional(id) {
  const pacientesDoProfissional = obterPacientesPorProfissional(id);
  pacientesDoProfissional.forEach(function (paciente) {
    excluirPaciente(paciente.id);
  });
  const lista = obterProfissionais().filter(function (item) { return item.id !== id; });
  salvarListaCompleta(CHAVE_PROFISSIONAIS, lista);
}

function obterPacientes() {
  return obterLista(CHAVE_PACIENTES);
}

function obterPacientesPorProfissional(profissionalId) {
  return obterPacientes().filter(function (item) { return item.profissionalId === profissionalId; });
}

function obterPacientePorId(id) {
  return obterPacientes().find(function (item) { return item.id === id; }) || null;
}

function salvarPaciente(paciente) {
  const lista = obterPacientes();
  const indice = lista.findIndex(function (item) { return item.id === paciente.id; });
  if (indice === -1) {
    lista.push(paciente);
  } else {
    lista[indice] = paciente;
  }
  salvarListaCompleta(CHAVE_PACIENTES, lista);
}

function excluirPaciente(id) {
  const vacinas = obterVacinasPorPaciente(id);
  vacinas.forEach(function (vacina) { excluirVacina(vacina.id); });

  const medicamentos = obterMedicamentosPorPaciente(id);
  const idsMedicamentos = medicamentos.map(function (item) { return item.id; });
  salvarListaCompleta(CHAVE_MEDICAMENTOS, obterLista(CHAVE_MEDICAMENTOS).filter(function (item) {
    return idsMedicamentos.indexOf(item.id) === -1;
  }));

  salvarListaCompleta(CHAVE_ANAMNESES, obterLista(CHAVE_ANAMNESES).filter(function (item) {
    return item.pacienteId !== id;
  }));

  salvarListaCompleta(CHAVE_PACIENTES, obterPacientes().filter(function (item) {
    return item.id !== id;
  }));
}

function obterAnamnesePorPaciente(pacienteId) {
  return obterLista(CHAVE_ANAMNESES).find(function (item) { return item.pacienteId === pacienteId; }) || null;
}

function salvarAnamnese(anamnese) {
  const lista = obterLista(CHAVE_ANAMNESES);
  const indice = lista.findIndex(function (item) { return item.pacienteId === anamnese.pacienteId; });
  if (indice === -1) {
    lista.push(anamnese);
  } else {
    lista[indice] = anamnese;
  }
  salvarListaCompleta(CHAVE_ANAMNESES, lista);
}

function obterVacinas() {
  return obterLista(CHAVE_VACINAS);
}

function obterVacinasPorPaciente(pacienteId) {
  return obterVacinas().filter(function (item) { return item.pacienteId === pacienteId; });
}

function obterVacinaPorId(id) {
  return obterVacinas().find(function (item) { return item.id === id; }) || null;
}

function salvarVacina(vacina) {
  const lista = obterVacinas();
  const indice = lista.findIndex(function (item) { return item.id === vacina.id; });
  if (indice === -1) {
    lista.push(vacina);
  } else {
    lista[indice] = vacina;
  }
  salvarListaCompleta(CHAVE_VACINAS, lista);
}

function excluirVacina(id) {
  salvarListaCompleta(CHAVE_REFORCOS, obterReforcos().filter(function (item) {
    return item.vacinaId !== id;
  }));
  salvarListaCompleta(CHAVE_VACINAS, obterVacinas().filter(function (item) {
    return item.id !== id;
  }));
}

function obterReforcos() {
  return obterLista(CHAVE_REFORCOS);
}

function obterReforcosPorPaciente(pacienteId) {
  return obterReforcos().filter(function (item) { return item.pacienteId === pacienteId; });
}

function obterReforcosPorVacina(vacinaId) {
  return obterReforcos().filter(function (item) { return item.vacinaId === vacinaId; });
}

function obterReforcoPorId(id) {
  return obterReforcos().find(function (item) { return item.id === id; }) || null;
}

function salvarReforco(reforco) {
  const lista = obterReforcos();
  const indice = lista.findIndex(function (item) { return item.id === reforco.id; });
  if (indice === -1) {
    lista.push(reforco);
  } else {
    lista[indice] = reforco;
  }
  salvarListaCompleta(CHAVE_REFORCOS, lista);
}

function excluirReforco(id) {
  salvarListaCompleta(CHAVE_REFORCOS, obterReforcos().filter(function (item) {
    return item.id !== id;
  }));
}

function obterMedicamentos() {
  return obterLista(CHAVE_MEDICAMENTOS);
}

function obterMedicamentosPorPaciente(pacienteId) {
  return obterMedicamentos().filter(function (item) { return item.pacienteId === pacienteId; });
}

function obterMedicamentoPorId(id) {
  return obterMedicamentos().find(function (item) { return item.id === id; }) || null;
}

function salvarMedicamento(medicamento) {
  const lista = obterMedicamentos();
  const indice = lista.findIndex(function (item) { return item.id === medicamento.id; });
  if (indice === -1) {
    lista.push(medicamento);
  } else {
    lista[indice] = medicamento;
  }
  salvarListaCompleta(CHAVE_MEDICAMENTOS, lista);
}

function excluirMedicamento(id) {
  salvarListaCompleta(CHAVE_MEDICAMENTOS, obterMedicamentos().filter(function (item) {
    return item.id !== id;
  }));
}

function obterCredenciaisExemplo() {
  return [
    { papel: 'Profissional (Técnico de Enfermagem)', nome: 'Maria Aparecida Souza', email: 'profissional@exemplo.com', senha: '123456' },
    { papel: 'Paciente 1', nome: 'João da Silva', email: 'paciente1@exemplo.com', senha: '123456' },
    { papel: 'Paciente 2', nome: 'Ana Beatriz Lima', email: 'paciente2@exemplo.com', senha: '123456' }
  ];
}

function aplicarSementeInicial() {
  if (localStorage.getItem(CHAVE_SEMENTE)) {
    return;
  }

  const idProfissional = 'prof-exemplo-001';
  const idPaciente1 = 'pac-exemplo-001';
  const idPaciente2 = 'pac-exemplo-002';

  salvarProfissional({
    id: idProfissional,
    nome: 'Maria Aparecida Souza',
    cpf: '12345678900',
    foto: '',
    email: 'profissional@exemplo.com',
    dataNascimento: '1985-04-12',
    coren: 'COREN-SP-123456',
    senha: '123456'
  });

  salvarPaciente({
    id: idPaciente1,
    profissionalId: idProfissional,
    nome: 'João da Silva',
    cpf: '98765432100',
    foto: '',
    email: 'paciente1@exemplo.com',
    dataNascimento: '1950-01-20',
    senha: '123456'
  });

  salvarPaciente({
    id: idPaciente2,
    profissionalId: idProfissional,
    nome: 'Ana Beatriz Lima',
    cpf: '11122233344',
    foto: '',
    email: 'paciente2@exemplo.com',
    dataNascimento: '1978-09-05',
    senha: '123456'
  });

  salvarAnamnese({
    id: gerarId('anam'),
    pacienteId: idPaciente1,
    temperatura: '36.5',
    pulso: '78',
    frequenciaRespiratoria: '18',
    pressaoArterial: '130/85',
    saturacao: '97',
    glicemia: '110',
    alergiaMedicamentosa: 'Dipirona',
    historicoFamiliar: 'Pai hipertenso, mãe diabética.'
  });

  salvarAnamnese({
    id: gerarId('anam'),
    pacienteId: idPaciente2,
    temperatura: '36.8',
    pulso: '82',
    frequenciaRespiratoria: '17',
    pressaoArterial: '118/76',
    saturacao: '98',
    glicemia: '95',
    alergiaMedicamentosa: 'Nenhuma conhecida',
    historicoFamiliar: 'Avó com histórico de AVC.'
  });

  const vacinaTetano = { id: gerarId('vac'), pacienteId: idPaciente1, nome: 'Difteria e Tétano (dT)', dataAplicacao: '2023-03-10', dose: 'Dose única', observacoes: 'Aplicada na unidade básica de saúde.' };
  const vacinaGripe = { id: gerarId('vac'), pacienteId: idPaciente1, nome: 'Influenza (Gripe)', dataAplicacao: '2024-04-05', dose: 'Anual', observacoes: '' };
  const vacinaCovid = { id: gerarId('vac'), pacienteId: idPaciente2, nome: 'COVID-19', dataAplicacao: '2023-11-20', dose: '2ª dose de reforço', observacoes: '' };
  salvarVacina(vacinaTetano);
  salvarVacina(vacinaGripe);
  salvarVacina(vacinaCovid);

  const instanteDemonstrativo = new Date(Date.now() + 2 * 60000);
  const momentoDemonstrativo = obterDataHoraBrasilDeInstante(instanteDemonstrativo);
  const dataDemonstrativa = momentoDemonstrativo.data;
  const horaDemonstrativa = momentoDemonstrativo.hora;

  salvarReforco({
    id: gerarId('ref'),
    vacinaId: vacinaTetano.id,
    pacienteId: idPaciente1,
    data: dataDemonstrativa,
    horario: horaDemonstrativa,
    status: 'pendente'
  });

  salvarReforco({
    id: gerarId('ref'),
    vacinaId: vacinaGripe.id,
    pacienteId: idPaciente1,
    data: '2025-04-05',
    horario: '09:00',
    status: 'concluido'
  });

  salvarMedicamento({
    id: gerarId('med'),
    pacienteId: idPaciente1,
    nome: 'Losartana 50mg',
    via: 'oral',
    dosagem: '1 comprimido',
    horario: horaDemonstrativa,
    frequencia: '1x ao dia',
    dataInicio: dataDemonstrativa,
    dataFim: '',
    ultimaConfirmacaoData: ''
  });

  salvarMedicamento({
    id: gerarId('med'),
    pacienteId: idPaciente2,
    nome: 'Soro Fisiológico 0,9%',
    via: 'intravenosa',
    dosagem: '500ml',
    horario: '14:00',
    frequencia: '8/8 horas',
    dataInicio: '2025-01-01',
    dataFim: '',
    ultimaConfirmacaoData: ''
  });

  localStorage.setItem(CHAVE_SEMENTE, 'true');
}

aplicarSementeInicial();
