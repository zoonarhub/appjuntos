// ============================================================
// MOCK DATA – Coordena Rio CRM
// Dados simulados realistas para o Estado do Rio de Janeiro
// ============================================================

export const MUNICIPIOS_RJ = [
  'Rio de Janeiro', 'Niterói', 'Duque de Caxias', 'Nova Iguaçu', 'São Gonçalo',
  'Belford Roxo', 'Campos dos Goytacazes', 'Petrópolis', 'Volta Redonda', 'Magé',
  'Itaboraí', 'Mesquita', 'Nilópolis', 'Queimados', 'São João de Meriti',
  'Macaé', 'Angra dos Reis', 'Cabo Frio', 'Teresópolis', 'Nova Friburgo',
];

export const BAIRROS_RJ = [
  'Campo Grande', 'Bangu', 'Santa Cruz', 'Realengo', 'Padre Miguel', 'Senador Camará',
  'Cosmos', 'Inhoaíba', 'Sepetiba', 'Guaratiba', 'Copacabana', 'Ipanema',
  'Leblon', 'Botafogo', 'Flamengo', 'Barra da Tijuca', 'Recreio', 'Jacarepaguá',
  'Tijuca', 'Vila Isabel', 'Maracanã', 'Méier', 'Engenho Novo', 'Ramos',
  'Penha', 'Irajá', 'Madureira', 'Turiaçu', 'Rocha Miranda', 'Anchieta',
];

export const ZONAS_ELEITORAIS = [
  { zona: '01', municipio: 'Rio de Janeiro', secoes: 342 },
  { zona: '02', municipio: 'Rio de Janeiro', secoes: 287 },
  { zona: '07', municipio: 'Rio de Janeiro', secoes: 198 },
  { zona: '08', municipio: 'Rio de Janeiro', secoes: 412 },
  { zona: '11', municipio: 'Rio de Janeiro', secoes: 265 },
  { zona: '15', municipio: 'Rio de Janeiro', secoes: 318 },
  { zona: '22', municipio: 'Niterói', secoes: 156 },
  { zona: '44', municipio: 'Duque de Caxias', secoes: 203 },
  { zona: '51', municipio: 'Nova Iguaçu', secoes: 271 },
  { zona: '62', municipio: 'São Gonçalo', secoes: 189 },
];

const NOMES = [
  'Ana Carolina', 'Bruno Santos', 'Carla Mendes', 'Diego Ferreira', 'Elaine Costa',
  'Fabio Alves', 'Gabriela Lima', 'Henrique Rocha', 'Isabela Nunes', 'João Paulo',
  'Kátia Souza', 'Leonardo Martins', 'Mariana Barbosa', 'Nilson Pereira', 'Olivia Castro',
  'Pedro Henrique', 'Renata Oliveira', 'Sérgio Nascimento', 'Tatiana Gomes', 'Ulisses Rezende',
  'Vanessa Cardoso', 'Wagner Moraes', 'Xênia Correia', 'Yuri Pinto', 'Zara Machado',
  'André Silveira', 'Beatriz Leal', 'Caio Ribeiro', 'Débora Aragão', 'Eduardo Monteiro',
  'Fernanda Queiroz', 'Gustavo Borges', 'Helena Vasconcelos', 'Igor Freitas', 'Júlia Campos',
  'Kevin Andrade', 'Lara Moreira', 'Marcelo Teixeira', 'Nathalia Pires', 'Orlando Batista',
  'Patrícia Cunha', 'Rafael Assis', 'Simone Nogueira', 'Tiago Brito', 'Ursula Figueiredo',
  'Victor Cavalcante', 'Wanda Esteves', 'Alexandre Dantas', 'Bianca Fonseca', 'Cristiano Duarte',
];

const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira',
  'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Lopes',
  'Sousa', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha', 'Dias', 'Nascimento', 'Andrade',
  'Moreira', 'Nunes', 'Marques', 'Machado', 'Mendes', 'Freitas',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDate(daysBack: number = 365): string {
  const date = new Date();
  date.setDate(date.getDate() - randomInt(0, daysBack));
  return date.toLocaleDateString('pt-BR');
}

function randomPhone(): string {
  return `(21) 9${randomInt(1000, 9999)}-${randomInt(1000, 9999)}`;
}

function randomCPF(): string {
  const n = () => randomInt(0, 9);
  return `${n()}${n()}${n()}.${n()}${n()}${n()}.${n()}${n()}${n()}-${n()}${n()}`;
}

function initials(name: string): string {
  const parts = name.split(' ');
  return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
}

// ============================================================
// COORDENADORES
// ============================================================
export interface Coordenador {
  id: string;
  nome: string;
  tipo: string;
  regiao: string;
  municipio: string;
  bairro: string;
  telefone: string;
  email: string;
  meta: number;
  votos: number;
  equipe: number;
  liderancas: number;
  status: 'ativo' | 'inativo';
  iniciaisAvatar: string;
  dataCadastro: string;
  link: string;
  lat: number;
  lng: number;
}

const TIPOS_COORD = ['Coordenador Geral', 'Coordenador Regional', 'Coordenador Local'];
const REGIOES = ['Zona Oeste', 'Zona Norte', 'Zona Sul', 'Centro', 'Baixada', 'Niterói', 'Serra', 'Interior'];

export const coordenadores: Coordenador[] = Array.from({ length: 52 }, (_, i) => {
  const nome = `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`;
  const meta = randomInt(200, 1500);
  const votos = randomInt(50, meta);
  const bairro = randomItem(BAIRROS_RJ);
  const regiao = randomItem(REGIOES);
  return {
    id: `coord-${i + 1}`,
    nome,
    tipo: i === 0 ? 'Coordenador Geral' : randomItem(TIPOS_COORD),
    regiao,
    municipio: randomItem(MUNICIPIOS_RJ),
    bairro,
    telefone: randomPhone(),
    email: `${nome.split(' ')[0].toLowerCase()}@coordenaRJ.com`,
    meta,
    votos,
    equipe: randomInt(5, 80),
    liderancas: randomInt(2, 20),
    status: Math.random() > 0.1 ? 'ativo' : 'inativo',
    iniciaisAvatar: initials(nome),
    dataCadastro: randomDate(400),
    link: `coord${i + 1}rj`,
    lat: -22.9 + (Math.random() - 0.5) * 2,
    lng: -43.2 + (Math.random() - 0.5) * 2,
  };
});

// ============================================================
// ELEITORES
// ============================================================
export interface Eleitor {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  whatsapp: string;
  email: string;
  municipio: string;
  bairro: string;
  zona: string;
  secao: string;
  confirmouVoto: 'sim' | 'nao' | 'indeciso' | 'outro_candidato';
  prioridade: 'alta' | 'media' | 'baixa';
  influencia: number;
  votosFamilia: number;
  contatos: number;
  ultimoContato: string;
  proximoContato: string;
  coordenadorId: string;
  status: 'ativo' | 'inativo';
  dataCadastro: string;
  observacoes: string;
  lat: number;
  lng: number;
  tags: string[];
  sexo: 'M' | 'F';
  idade: number;
}

const TAGS_ELEITOR = ['Família grande', 'Líder comunitário', 'Funcionário público', 'Empresário', 'Jovem', 'Idoso', 'Influenciador', 'Voluntário'];
const CONFIRMOU_VOTO_OPTIONS: Array<Eleitor['confirmouVoto']> = ['sim', 'sim', 'sim', 'indeciso', 'indeciso', 'nao', 'outro_candidato'];

export const eleitores: Eleitor[] = Array.from({ length: 487 }, (_, i) => {
  const nome = `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`;
  const coord = randomItem(coordenadores);
  const zonaObj = randomItem(ZONAS_ELEITORAIS);
  return {
    id: `el-${i + 1}`,
    nome,
    cpf: randomCPF(),
    telefone: randomPhone(),
    whatsapp: randomPhone(),
    email: `${nome.split(' ')[0].toLowerCase()}${randomInt(1, 99)}@email.com`,
    municipio: coord.municipio,
    bairro: randomItem(BAIRROS_RJ),
    zona: zonaObj.zona,
    secao: `${randomInt(1, 999).toString().padStart(3, '0')}`,
    confirmouVoto: randomItem(CONFIRMOU_VOTO_OPTIONS),
    prioridade: randomItem(['alta', 'alta', 'media', 'media', 'media', 'baixa']),
    influencia: randomInt(1, 10),
    votosFamilia: randomInt(1, 12),
    contatos: randomInt(0, 15),
    ultimoContato: randomDate(60),
    proximoContato: randomDate(-30),
    coordenadorId: coord.id,
    status: Math.random() > 0.05 ? 'ativo' : 'inativo',
    dataCadastro: randomDate(300),
    observacoes: '',
    lat: -22.9 + (Math.random() - 0.5) * 2.5,
    lng: -43.2 + (Math.random() - 0.5) * 2.5,
    tags: Array.from({ length: randomInt(0, 3) }, () => randomItem(TAGS_ELEITOR)),
    sexo: Math.random() > 0.45 ? 'M' : 'F',
    idade: randomInt(18, 80),
  };
});

// ============================================================
// NÚCLEOS
// ============================================================
export interface Nucleo {
  id: string;
  nome: string;
  regiao: string;
  bairro: string;
  municipio: string;
  responsavel: string;
  equipe: number;
  participantes: number;
  meta: number;
  eventos: number;
  projetos: number;
  status: 'ativo' | 'inativo' | 'planejamento';
  dataCriacao: string;
  descricao: string;
  lat: number;
  lng: number;
}

const NUCLEOS_NOMES = [
  'Núcleo Campo Grande', 'Núcleo Bangu', 'Núcleo Santa Cruz', 'Núcleo Realengo',
  'Núcleo Padre Miguel', 'Núcleo Cosmos', 'Núcleo Inhoaíba', 'Núcleo Sepetiba',
  'Núcleo Tijuca', 'Núcleo Madureira', 'Núcleo Penha', 'Núcleo Ramos',
  'Núcleo Barra da Tijuca', 'Núcleo Recreio', 'Núcleo Niterói Centro',
  'Núcleo São Gonçalo Norte', 'Núcleo Caxias Sul', 'Núcleo Nova Iguaçu Leste',
  'Núcleo Petrópolis Serra', 'Núcleo Cabo Frio', 'Núcleo Belford Roxo',
  'Núcleo Mesquita', 'Núcleo Nilópolis', 'Núcleo Queimados',
];

export const nucleos: Nucleo[] = NUCLEOS_NOMES.map((nome, i) => {
  const bairro = nome.replace('Núcleo ', '').split(' ')[0];
  return {
    id: `nuc-${i + 1}`,
    nome,
    regiao: randomItem(REGIOES),
    bairro,
    municipio: randomItem(MUNICIPIOS_RJ),
    responsavel: `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`,
    equipe: randomInt(3, 25),
    participantes: randomInt(20, 350),
    meta: randomInt(100, 800),
    eventos: randomInt(2, 20),
    projetos: randomInt(1, 8),
    status: randomItem(['ativo', 'ativo', 'ativo', 'planejamento', 'inativo']),
    dataCriacao: randomDate(500),
    descricao: `Núcleo de base territorial para articulação eleitoral e projetos sociais na região de ${bairro}.`,
    lat: -22.9 + (Math.random() - 0.5) * 2,
    lng: -43.2 + (Math.random() - 0.5) * 2,
  };
});

// ============================================================
// PROJETOS
// ============================================================
export interface Projeto {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  responsavel: string;
  nucleo: string;
  regiao: string;
  alunos: number;
  turmas: number;
  professores: number;
  aulas: number;
  dataInicio: string;
  dataTermino: string;
  status: 'ativo' | 'encerrado' | 'planejamento' | 'suspenso';
}

const PROJETOS_NOMES = [
  { nome: 'Curso de Informática', cat: 'Tecnologia' },
  { nome: 'Jiu-Jitsu Infantil', cat: 'Esporte' },
  { nome: 'Inglês Básico', cat: 'Idioma' },
  { nome: 'Robótica Criativa', cat: 'Tecnologia' },
  { nome: 'Capoeira para Jovens', cat: 'Cultura' },
  { nome: 'Música e Violão', cat: 'Cultura' },
  { nome: 'Reforço Escolar', cat: 'Educação' },
  { nome: 'Dança Contemporânea', cat: 'Cultura' },
  { nome: 'Corte e Costura', cat: 'Profissionalizante' },
  { nome: 'Culinária Básica', cat: 'Profissionalizante' },
  { nome: 'Empreendedorismo Jovem', cat: 'Negócios' },
  { nome: 'Teatro Comunitário', cat: 'Cultura' },
  { nome: 'Xadrez e Raciocínio Lógico', cat: 'Educação' },
  { nome: 'Natação para Idosos', cat: 'Esporte' },
  { nome: 'Horta Comunitária', cat: 'Meio Ambiente' },
];

export const projetos: Projeto[] = PROJETOS_NOMES.map((p, i) => {
  const nucleo = randomItem(nucleos);
  return {
    id: `proj-${i + 1}`,
    nome: p.nome,
    descricao: `Projeto ${p.nome} voltado para a comunidade local, promovendo desenvolvimento social e integração.`,
    categoria: p.cat,
    responsavel: `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`,
    nucleo: nucleo.nome,
    regiao: nucleo.regiao,
    alunos: randomInt(15, 120),
    turmas: randomInt(1, 6),
    professores: randomInt(1, 4),
    aulas: randomInt(10, 60),
    dataInicio: randomDate(200),
    dataTermino: randomDate(-30),
    status: randomItem(['ativo', 'ativo', 'ativo', 'planejamento', 'encerrado']),
  };
});

// ============================================================
// EVENTOS
// ============================================================
export interface Evento {
  id: string;
  nome: string;
  tipo: string;
  data: string;
  hora: string;
  local: string;
  municipio: string;
  responsavel: string;
  participantes: number;
  custo: number;
  status: 'realizado' | 'agendado' | 'cancelado';
  descricao: string;
}

const TIPOS_EVENTO = ['Reunião', 'Carreata', 'Caminhada', 'Panfletagem', 'Curso', 'Ação Social', 'Debate', 'Comício'];

export const eventos: Evento[] = Array.from({ length: 38 }, (_, i) => {
  const tipo = randomItem(TIPOS_EVENTO);
  const bairro = randomItem(BAIRROS_RJ);
  return {
    id: `ev-${i + 1}`,
    nome: `${tipo} ${bairro}`,
    tipo,
    data: randomDate(90),
    hora: `${randomInt(8, 19).toString().padStart(2, '0')}:00`,
    local: `${bairro}, Rio de Janeiro`,
    municipio: randomItem(MUNICIPIOS_RJ),
    responsavel: `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`,
    participantes: randomInt(10, 500),
    custo: randomInt(0, 15000),
    status: randomItem(['realizado', 'realizado', 'agendado', 'agendado', 'cancelado']),
    descricao: `${tipo} realizado na região de ${bairro} para mobilização eleitoral.`,
  };
});

// ============================================================
// VISITAS
// ============================================================
export interface Visita {
  id: string;
  endereco: string;
  bairro: string;
  responsavel: string;
  data: string;
  hora: string;
  resultado: 'positivo' | 'negativo' | 'pendente' | 'reagendado';
  observacoes: string;
  proximaVisita: string;
  lat: number;
  lng: number;
}

export const visitas: Visita[] = Array.from({ length: 64 }, (_, i) => {
  const bairro = randomItem(BAIRROS_RJ);
  return {
    id: `vis-${i + 1}`,
    endereco: `Rua ${randomItem(SOBRENOMES)}, ${randomInt(10, 999)}, ${bairro}`,
    bairro,
    responsavel: `${randomItem(NOMES)} ${randomItem(SOBRENOMES)}`,
    data: randomDate(60),
    hora: `${randomInt(8, 19).toString().padStart(2, '0')}:${randomItem(['00', '30'])}`,
    resultado: randomItem(['positivo', 'positivo', 'negativo', 'pendente', 'reagendado']),
    observacoes: randomItem([
      'Morador receptivo, confirmou apoio.',
      'Não encontrou o responsável.',
      'Família indecisa, retornar na próxima semana.',
      'Apoio confirmado para toda a família.',
      'Demonstrou interesse nos projetos sociais.',
    ]),
    proximaVisita: randomDate(-15),
    lat: -22.9 + (Math.random() - 0.5) * 1.5,
    lng: -43.2 + (Math.random() - 0.5) * 1.5,
  };
});

// ============================================================
// METAS
// ============================================================
export interface Meta {
  id: string;
  coordenador: string;
  tipo: string;
  meta: number;
  atual: number;
  percentual: number;
  regiao: string;
  prazo: string;
}

export const metas: Meta[] = coordenadores.slice(0, 20).map((c, i) => ({
  id: `meta-${i + 1}`,
  coordenador: c.nome,
  tipo: 'Votos',
  meta: c.meta,
  atual: c.votos,
  percentual: Math.round((c.votos / c.meta) * 100),
  regiao: c.regiao,
  prazo: '05/10/2026',
}));

// ============================================================
// DASHBOARD STATS
// ============================================================
export const dashboardStats = {
  totalCoordenadores: coordenadores.length,
  totalLiderancas: coordenadores.reduce((s, c) => s + c.liderancas, 0),
  totalEleitores: eleitores.length,
  totalNucleos: nucleos.length,
  totalProjetos: projetos.length,
  totalAulas: projetos.reduce((s, p) => s + p.aulas, 0),
  totalAlunos: projetos.reduce((s, p) => s + p.alunos, 0),
  totalProfessores: projetos.reduce((s, p) => s + p.professores, 0),
  totalRegioes: REGIOES.length,
  totalZonas: ZONAS_ELEITORAIS.length,
  totalSecoes: ZONAS_ELEITORAIS.reduce((s, z) => s + z.secoes, 0),
  totalVisitas: visitas.length,
  totalEventos: eventos.length,
  metaVotos: 85000,
  projecaoVotos: 61420,
  percentualAtingido: 72,

  // Gráficos
  evolucaoMensal: [
    { mes: 'Jan', eleitores: 42, eventos: 3, visitas: 8 },
    { mes: 'Fev', eleitores: 78, eventos: 5, visitas: 12 },
    { mes: 'Mar', eleitores: 95, eventos: 6, visitas: 18 },
    { mes: 'Abr', eleitores: 134, eventos: 8, visitas: 24 },
    { mes: 'Mai', eleitores: 187, eventos: 11, visitas: 31 },
    { mes: 'Jun', eleitores: 243, eventos: 14, visitas: 38 },
    { mes: 'Jul', eleitores: 312, eventos: 17, visitas: 45 },
  ],

  confirmacaoVotos: [
    { name: 'Confirmou Voto', value: 312, color: '#10B981' },
    { name: 'Indeciso', value: 118, color: '#F59E0B' },
    { name: 'Não confirmou', value: 42, color: '#EF4444' },
    { name: 'Outro candidato', value: 15, color: '#6B7280' },
  ],

  porRegiao: [
    { regiao: 'Zona Oeste', eleitores: 142, coordenadores: 18 },
    { regiao: 'Zona Norte', eleitores: 98, coordenadores: 12 },
    { regiao: 'Baixada', eleitores: 87, coordenadores: 10 },
    { regiao: 'Zona Sul', eleitores: 64, coordenadores: 7 },
    { regiao: 'Centro', eleitores: 43, coordenadores: 5 },
    { regiao: 'Niterói', eleitores: 32, coordenadores: 4 },
    { regiao: 'Serra', eleitores: 21, coordenadores: 3 },
  ],

  funil: [
    { etapa: 'Contatos', valor: 8420 },
    { etapa: 'Cadastrados', valor: 4870 },
    { etapa: 'Engajados', valor: 2340 },
    { etapa: 'Confirmados', valor: 1120 },
    { etapa: 'Mobilizados', valor: 487 },
  ],

  rankingCoordenadores: coordenadores
    .sort((a, b) => b.votos - a.votos)
    .slice(0, 10)
    .map((c, i) => ({ ...c, posicao: i + 1 })),
};

// ============================================================
// COMUNICAÇÃO
// ============================================================
export const campanhasComunicacao = [
  { id: 'com-1', nome: 'Boas-vindas Eleitores', tipo: 'WhatsApp', enviados: 342, abertos: 287, convertidos: 94, status: 'ativo', data: '12/06/2026' },
  { id: 'com-2', nome: 'Confirmação de Voto', tipo: 'SMS', enviados: 856, abertos: 712, convertidos: 203, status: 'ativo', data: '18/06/2026' },
  { id: 'com-3', nome: 'Convite Evento Bangu', tipo: 'Email', enviados: 215, abertos: 148, convertidos: 62, status: 'encerrado', data: '22/06/2026' },
  { id: 'com-4', nome: 'Lembrete Reunião Núcleo', tipo: 'WhatsApp', enviados: 128, abertos: 119, convertidos: 87, status: 'agendado', data: '01/07/2026' },
];

// ============================================================
// AUDITORIA
// ============================================================
export const logsAuditoria = Array.from({ length: 40 }, (_, i) => {
  const acoes = [
    { acao: 'Cadastrou eleitor', modulo: 'Eleitores' },
    { acao: 'Atualizou coordenador', modulo: 'Pessoas' },
    { acao: 'Criou evento', modulo: 'Eventos' },
    { acao: 'Importou base TSE', modulo: 'TSE/TRE' },
    { acao: 'Exportou relatório', modulo: 'BI' },
    { acao: 'Deletou registro', modulo: 'Eleitores' },
    { acao: 'Alterou permissão', modulo: 'Configurações' },
    { acao: 'Login realizado', modulo: 'Sistema' },
    { acao: 'Registrou visita', modulo: 'Visitas' },
    { acao: 'Criou núcleo', modulo: 'Núcleos' },
  ];
  const ac = randomItem(acoes);
  const usuario = randomItem(coordenadores);
  return {
    id: `log-${i + 1}`,
    usuario: usuario.nome,
    acao: ac.acao,
    modulo: ac.modulo,
    data: randomDate(30),
    hora: `${randomInt(7, 22).toString().padStart(2, '0')}:${randomInt(0, 59).toString().padStart(2, '0')}`,
    ip: `177.${randomInt(1, 255)}.${randomInt(1, 255)}.${randomInt(1, 255)}`,
  };
});
