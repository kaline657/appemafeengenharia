
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Aba = 'clientes' | 'funcionarios' | 'empreendimentos' | 'garantias';

type LinhaCliente = {
  pre_cadastro_id: string;
  nome_completo: string;
  cpf_cnpj: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  acesso_ativado: boolean;
  unidade_id: string | null;
  unidade_identificacao: string | null;
  empreendimento_id: string | null;
  empreendimento_nome: string | null;
};

type UnidadeVinculada = {
  unidade_id: string;
  unidade_identificacao: string;
  empreendimento_id: string;
  empreendimento_nome: string;
};

type Cliente = {
  pre_cadastro_id: string;
  nome_completo: string;
  cpf_cnpj: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  acesso_ativado: boolean;
  unidades: UnidadeVinculada[];
};

type FuncionarioPreCadastro = {
  pre_cadastro_id: string;
  nome_completo: string;
  cpf_cnpj: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  acesso_ativado: boolean;
};

type UnidadeDisponivel = {
  unidade_id: string;
  identificacao: string;
  empreendimento_id: string;
  empreendimento_nome: string;
  cidade: string | null;
  proprietario_informado: string | null;
  status_casa: string | null;
  status_entrega: string | null;
  data_habite_se: string | null;
  data_entrega_chaves: string | null;
  ativo: boolean;
};

type Empreendimento = {
  id: string;
  nome: string;
  codigo: string | null;
  cidade: string | null;
  endereco: string | null;
  ativo: boolean;
  quantidade_unidades: number;
};

type UnidadeCadastro = {
  id: string;
  empreendimento_id: string;
  identificacao: string;
  modelo_garantia_id: string | null;
  data_habite_se: string | null;
  data_entrega_chaves: string | null;
  data_entrega_obra: string | null;
  data_assinatura_contrato: string | null;
  ativo: boolean;
};

type ModeloGarantia = {
  id: string;
  nome: string;
  versao: string | null;
  descricao: string | null;
  ativo: boolean;
  quantidade_itens: number;
  quantidade_unidades: number;
};

type ItemGarantia = {
  id: string;
  categoria: string;
  elemento_construtivo: string;
  manifestacao_patologica: string | null;
  tipo_prazo: string;
  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  regra_data_base: string;
  observacao: string | null;
  ativo: boolean;
};

type Catalogo = {
  empreendimentos: Empreendimento[];
  unidades: UnidadeCadastro[];
  modelos: ModeloGarantia[];
  itens: ItemGarantia[];
};

const CATALOGO_VAZIO: Catalogo = {
  empreendimentos: [],
  unidades: [],
  modelos: [],
  itens: [],
};

const REGRAS_DATA = [
  { valor: 'habite_se', nome: 'Data do Habite-se' },
  { valor: 'entrega_chaves', nome: 'Entrega das chaves' },
  { valor: 'entrega_obra', nome: 'Entrega da obra' },
  {
    valor: 'primeiro_habite_se_ou_entrega_obra',
    nome: 'Primeira data: Habite-se ou entrega da obra',
  },
  {
    valor: 'entrega_chaves_e_contrato',
    nome: 'Entrega das chaves e assinatura do contrato',
  },
  { valor: 'conclusao_servico', nome: 'Conclusão do serviço' },
  { valor: 'ato_entrega', nome: 'No ato da entrega' },
];

function Campo({
  titulo,
  valor,
  alterar,
  placeholder,
  teclado = 'default',
  multiline = false,
}: {
  titulo: string;
  valor: string;
  alterar: (valor: string) => void;
  placeholder?: string;
  teclado?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  multiline?: boolean;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{titulo}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={valor}
        onChangeText={alterar}
        placeholder={placeholder}
        placeholderTextColor="#8995A5"
        keyboardType={teclado}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

function BotaoOpcao({
  titulo,
  selecionado,
  onPress,
  descricao,
  disabled = false,
}: {
  titulo: string;
  selecionado: boolean;
  onPress: () => void;
  descricao?: string;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.opcao,
        selecionado && styles.opcaoSelecionada,
        disabled && styles.desabilitado,
      ]}
    >
      <Ionicons
        name={selecionado ? 'radio-button-on' : 'radio-button-off'}
        size={19}
        color={selecionado ? '#0B5EA8' : '#8995A5'}
      />
      <View style={{ flex: 1 }}>
        <Text style={styles.opcaoTitulo}>{titulo}</Text>
        {descricao ? (
          <Text style={styles.opcaoDescricao}>{descricao}</Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

function BotaoSalvar({
  titulo,
  onPress,
  salvando,
}: {
  titulo: string;
  onPress: () => void;
  salvando: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.botaoSalvar, salvando && styles.desabilitado]}
      disabled={salvando}
      onPress={onPress}
    >
      {salvando ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <Ionicons name="save-outline" size={18} color="#FFFFFF" />
      )}
      <Text style={styles.botaoSalvarTexto}>
        {salvando ? 'Salvando...' : titulo}
      </Text>
    </TouchableOpacity>
  );
}

function converterDataParaISO(valor: string) {
  const texto = valor.trim();

  if (!texto) return null;

  let ano: number;
  let mes: number;
  let dia: number;

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    const partes = texto.split('/').map(Number);
    dia = partes[0];
    mes = partes[1];
    ano = partes[2];
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const partes = texto.split('-').map(Number);
    ano = partes[0];
    mes = partes[1];
    dia = partes[2];
  } else {
    return null;
  }

  const data = new Date(Date.UTC(ano, mes - 1, dia));

  if (
    data.getUTCFullYear() !== ano ||
    data.getUTCMonth() !== mes - 1 ||
    data.getUTCDate() !== dia
  ) {
    return null;
  }

  return `${String(ano).padStart(4, '0')}-${String(mes).padStart(
    2,
    '0'
  )}-${String(dia).padStart(2, '0')}`;
}

function dataValida(valor: string) {
  if (!valor.trim()) return true;

  return converterDataParaISO(valor) !== null;
}

function formatarDataBrasileira(valor: string | null) {
  if (!valor) return '-';

  const match = valor.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) return valor;

  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatarDocumento(valor: string) {
  const numeros = valor.replace(/\D/g, '');

  if (numeros.length === 11) {
    return numeros.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      '$1.$2.$3-$4'
    );
  }

  if (numeros.length === 14) {
    return numeros.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5'
    );
  }

  return valor;
}

export default function ClientesImoveisFuncionarioScreen() {
  const [aba, setAba] = useState<Aba>('clientes');
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // CLIENTES - cadastro original preservado
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [unidades, setUnidades] = useState<UnidadeDisponivel[]>([]);
  const [busca, setBusca] = useState('');

  // FUNCIONÁRIOS
  const [funcionarios, setFuncionarios] = useState<FuncionarioPreCadastro[]>([]);
  const [buscaFuncionario, setBuscaFuncionario] = useState('');
  const [mostrarFormularioFuncionario, setMostrarFormularioFuncionario] =
    useState(false);
  const [editandoFuncionarioId, setEditandoFuncionarioId] =
    useState<string | null>(null);
  const [funcionarioNome, setFuncionarioNome] = useState('');
  const [funcionarioCpf, setFuncionarioCpf] = useState('');
  const [funcionarioEmail, setFuncionarioEmail] = useState('');
  const [funcionarioTelefone, setFuncionarioTelefone] = useState('');
  const [mostrarFormularioCliente, setMostrarFormularioCliente] =
    useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nomeCompleto, setNomeCompleto] = useState('');
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [telefone, setTelefone] = useState('');
  const [unidadeSelecionadaId, setUnidadeSelecionadaId] = useState('');
  const [buscaUnidade, setBuscaUnidade] = useState('');

  // EMPREENDIMENTOS E UNIDADES
  const [catalogo, setCatalogo] = useState<Catalogo>(CATALOGO_VAZIO);
  const [empreendimentoSelecionadoId, setEmpreendimentoSelecionadoId] =
    useState('');
  const [formEmpreendimento, setFormEmpreendimento] = useState(false);
  const [formUnidade, setFormUnidade] = useState(false);
  const [novoEmpNome, setNovoEmpNome] = useState('');
  const [novoEmpCodigo, setNovoEmpCodigo] = useState('');
  const [novoEmpCidade, setNovoEmpCidade] = useState('');
  const [novoEmpEndereco, setNovoEmpEndereco] = useState('');

  const [novaUnidadeIdentificacao, setNovaUnidadeIdentificacao] =
    useState('');
  const [novaUnidadeModeloId, setNovaUnidadeModeloId] = useState('');
  const [dataHabiteSe, setDataHabiteSe] = useState('');
  const [dataChaves, setDataChaves] = useState('');
  const [dataObra, setDataObra] = useState('');
  const [dataContrato, setDataContrato] = useState('');

  // MODELOS E ITENS DE GARANTIA
  const [modeloSelecionadoId, setModeloSelecionadoId] = useState('');
  const [formModelo, setFormModelo] = useState(false);
  const [formItem, setFormItem] = useState(false);
  const [novoModeloNome, setNovoModeloNome] = useState('');
  const [novoModeloVersao, setNovoModeloVersao] = useState('');
  const [novoModeloDescricao, setNovoModeloDescricao] = useState('');

  const [itemCategoria, setItemCategoria] = useState('');
  const [itemElemento, setItemElemento] = useState('');
  const [itemManifestacao, setItemManifestacao] = useState('');
  const [itemTipoPrazo, setItemTipoPrazo] = useState<'tempo' | 'ato_entrega'>(
    'tempo'
  );
  const [itemQuantidade, setItemQuantidade] = useState('1');
  const [itemUnidadePrazo, setItemUnidadePrazo] = useState('anos');
  const [itemRegraData, setItemRegraData] = useState('habite_se');
  const [itemObservacao, setItemObservacao] = useState('');

  useEffect(() => {
    iniciar();
  }, []);

  async function iniciar() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } = await supabase.auth.getUser();

      if (error || !data.user) {
        router.replace('/login-funcionario');
        return;
      }

      await Promise.all([
        carregarClientes(),
        carregarFuncionarios(),
        carregarCatalogo(),
      ]);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao carregar a tela.');
    } finally {
      setCarregando(false);
    }
  }

  async function carregarClientes() {
    const [clientesResultado, unidadesResultado] = await Promise.all([
      supabase.rpc('listar_clientes_imoveis_funcionario'),
      supabase.rpc('listar_unidades_funcionario'),
    ]);

    if (clientesResultado.error) {
      throw new Error(clientesResultado.error.message);
    }

    if (unidadesResultado.error) {
      throw new Error(unidadesResultado.error.message);
    }

    const mapa = new Map<string, Cliente>();

    for (const linha of (clientesResultado.data ?? []) as LinhaCliente[]) {
      let cliente = mapa.get(linha.pre_cadastro_id);

      if (!cliente) {
        cliente = {
          pre_cadastro_id: linha.pre_cadastro_id,
          nome_completo: linha.nome_completo,
          cpf_cnpj: linha.cpf_cnpj,
          email: linha.email,
          telefone: linha.telefone,
          ativo: linha.ativo,
          acesso_ativado: linha.acesso_ativado,
          unidades: [],
        };
        mapa.set(linha.pre_cadastro_id, cliente);
      }

      if (
        linha.unidade_id &&
        linha.unidade_identificacao &&
        linha.empreendimento_id &&
        linha.empreendimento_nome &&
        !cliente.unidades.some(
          (unidade) => unidade.unidade_id === linha.unidade_id
        )
      ) {
        cliente.unidades.push({
          unidade_id: linha.unidade_id,
          unidade_identificacao: linha.unidade_identificacao,
          empreendimento_id: linha.empreendimento_id,
          empreendimento_nome: linha.empreendimento_nome,
        });
      }
    }

    setClientes(Array.from(mapa.values()));
    setUnidades(
      (unidadesResultado.data ?? []) as UnidadeDisponivel[]
    );
  }

  async function carregarFuncionarios() {
    const { data, error } = await supabase.rpc(
      'listar_funcionarios_pre_cadastro_funcionario'
    );

    if (error) {
      throw new Error(error.message);
    }

    setFuncionarios(
      (data ?? []) as FuncionarioPreCadastro[]
    );
  }

  async function carregarCatalogo(modeloId?: string) {
    const { data, error } = await supabase.rpc(
      'gerenciar_cadastro_empreendimentos_garantias_funcionario',
      {
        p_acao: 'listar',
        p_dados: modeloId ? { modelo_id: modeloId } : {},
      }
    );

    if (error) {
      throw new Error(error.message);
    }

    const resultado = data as Partial<Catalogo> | null;

    setCatalogo({
      empreendimentos: resultado?.empreendimentos ?? [],
      unidades: resultado?.unidades ?? [],
      modelos: resultado?.modelos ?? [],
      itens: resultado?.itens ?? [],
    });
  }

  async function atualizar() {
    try {
      setAtualizando(true);
      setErro('');
      setSucesso('');

      if (aba === 'clientes') {
        await carregarClientes();
      } else if (aba === 'funcionarios') {
        await carregarFuncionarios();
      } else {
        await carregarCatalogo(
          aba === 'garantias' && modeloSelecionadoId
            ? modeloSelecionadoId
            : undefined
        );
      }
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível atualizar.');
    } finally {
      setAtualizando(false);
    }
  }

  function trocarAba(novaAba: Aba) {
    setAba(novaAba);
    setErro('');
    setSucesso('');
  }

  async function executarCadastro(
    acao: string,
    dados: Record<string, unknown>
  ): Promise<string | null> {
    try {
      setSalvando(true);
      setErro('');
      setSucesso('');

      const { data, error } = await supabase.rpc(
        'gerenciar_cadastro_empreendimentos_garantias_funcionario',
        {
          p_acao: acao,
          p_dados: dados,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const resultado = data as {
        id?: string;
        mensagem?: string;
      } | null;

      setSucesso(resultado?.mensagem || 'Cadastro salvo com sucesso.');

      return resultado?.id ?? '';
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar.');
      return null;
    } finally {
      setSalvando(false);
    }
  }

  // FUNCIONÁRIOS

  const funcionariosFiltrados = useMemo(() => {
    const termo = buscaFuncionario.trim().toLowerCase();

    if (!termo) return funcionarios;

    const numeros = termo.replace(/\D/g, '');

    return funcionarios.filter((funcionario) => {
      return (
        funcionario.nome_completo.toLowerCase().includes(termo) ||
        funcionario.email.toLowerCase().includes(termo) ||
        (!!numeros &&
          funcionario.cpf_cnpj.replace(/\D/g, '').includes(numeros)) ||
        (!!numeros &&
          (funcionario.telefone ?? '')
            .replace(/\D/g, '')
            .includes(numeros))
      );
    });
  }, [funcionarios, buscaFuncionario]);

  function limparFuncionario() {
    setEditandoFuncionarioId(null);
    setFuncionarioNome('');
    setFuncionarioCpf('');
    setFuncionarioEmail('');
    setFuncionarioTelefone('');
  }

  function abrirNovoFuncionario() {
    limparFuncionario();
    setErro('');
    setSucesso('');
    setMostrarFormularioFuncionario(true);
  }

  function abrirEdicaoFuncionario(
    funcionario: FuncionarioPreCadastro
  ) {
    if (funcionario.acesso_ativado) {
      setErro(
        'O acesso deste funcionário já foi ativado. Este pré-cadastro não pode mais ser editado.'
      );
      return;
    }

    setEditandoFuncionarioId(funcionario.pre_cadastro_id);
    setFuncionarioNome(funcionario.nome_completo);
    setFuncionarioCpf(funcionario.cpf_cnpj);
    setFuncionarioEmail(funcionario.email);
    setFuncionarioTelefone(funcionario.telefone ?? '');
    setErro('');
    setSucesso('');
    setMostrarFormularioFuncionario(true);
  }

  async function salvarFuncionario() {
    setErro('');
    setSucesso('');

    const documento = funcionarioCpf.replace(/\D/g, '');
    const emailNormalizado =
      funcionarioEmail.trim().toLowerCase();

    if (!funcionarioNome.trim()) {
      setErro('Informe o nome completo do funcionário.');
      return;
    }

    if (documento.length !== 11) {
      setErro('Informe um CPF com 11 dígitos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    try {
      setSalvando(true);

      const { data, error } = await supabase.rpc(
        'salvar_funcionario_pre_cadastro_funcionario',
        {
          p_pre_cadastro_id: editandoFuncionarioId,
          p_nome_completo: funcionarioNome.trim(),
          p_cpf_cnpj: documento,
          p_email: emailNormalizado,
          p_telefone: funcionarioTelefone.trim() || null,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const resultado = data as {
        mensagem?: string;
      } | null;

      setSucesso(
        resultado?.mensagem ??
          'Funcionário salvo com sucesso.'
      );

      setMostrarFormularioFuncionario(false);
      limparFuncionario();
      await carregarFuncionarios();
    } catch (e: any) {
      setErro(
        e?.message ??
          'Não foi possível salvar o funcionário.'
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirFuncionario(
    funcionario: FuncionarioPreCadastro
  ) {
    if (funcionario.acesso_ativado) {
      setErro(
        'Não é possível excluir este funcionário porque o acesso já foi ativado.'
      );
      return;
    }

    const confirmou = await confirmarExclusao(
      'Excluir funcionário',
      `Tem certeza que deseja excluir "${funcionario.nome_completo}" do pré-cadastro? Esta ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
      setExcluindoId(funcionario.pre_cadastro_id);
      setErro('');
      setSucesso('');

      const { data, error } = await supabase.rpc(
        'excluir_funcionario_pre_cadastro_funcionario',
        {
          p_pre_cadastro_id: funcionario.pre_cadastro_id,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const resultado = data as {
        mensagem?: string;
      } | null;

      setSucesso(
        resultado?.mensagem ??
          'Funcionário excluído com sucesso.'
      );

      if (
        editandoFuncionarioId ===
        funcionario.pre_cadastro_id
      ) {
        setMostrarFormularioFuncionario(false);
        limparFuncionario();
      }

      await carregarFuncionarios();
    } catch (e: any) {
      setErro(
        e?.message ??
          'Não foi possível excluir o funcionário.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  // CLIENTES

  const clientesFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return clientes;

    const numeros = termo.replace(/\D/g, '');

    return clientes.filter((cliente) => {
      const unidadesTexto = cliente.unidades
        .map(
          (unidade) =>
            `${unidade.empreendimento_nome} ${unidade.unidade_identificacao}`
        )
        .join(' ')
        .toLowerCase();

      return (
        cliente.nome_completo.toLowerCase().includes(termo) ||
        cliente.email.toLowerCase().includes(termo) ||
        unidadesTexto.includes(termo) ||
        (!!numeros &&
          cliente.cpf_cnpj.replace(/\D/g, '').includes(numeros)) ||
        (!!numeros &&
          (cliente.telefone ?? '').replace(/\D/g, '').includes(numeros))
      );
    });
  }, [clientes, busca]);

  const unidadesFiltradas = useMemo(() => {
    const termo = buscaUnidade.trim().toLowerCase();

    if (!termo) return [];

    return unidades
      .filter(
        (unidade) =>
          unidade.identificacao.toLowerCase().includes(termo) ||
          unidade.empreendimento_nome.toLowerCase().includes(termo) ||
          (unidade.cidade ?? '').toLowerCase().includes(termo) ||
          (unidade.proprietario_informado ?? '')
            .toLowerCase()
            .includes(termo)
      )
      .slice(0, 12);
  }, [unidades, buscaUnidade]);

  function limparCliente() {
    setEditandoId(null);
    setNomeCompleto('');
    setCpfCnpj('');
    setEmail('');
    setTelefone('');
    setUnidadeSelecionadaId('');
    setBuscaUnidade('');
  }

  function abrirNovoCliente() {
    limparCliente();
    setErro('');
    setSucesso('');
    setMostrarFormularioCliente(true);
  }

  function abrirEdicaoCliente(cliente: Cliente) {
    setEditandoId(cliente.pre_cadastro_id);
    setNomeCompleto(cliente.nome_completo);
    setCpfCnpj(cliente.cpf_cnpj);
    setEmail(cliente.email);
    setTelefone(cliente.telefone ?? '');
    setUnidadeSelecionadaId(cliente.unidades[0]?.unidade_id ?? '');
    setBuscaUnidade('');
    setErro('');
    setSucesso('');
    setMostrarFormularioCliente(true);
  }

  async function salvarCliente() {
    setErro('');
    setSucesso('');

    const documento = cpfCnpj.replace(/\D/g, '');
    const emailNormalizado = email.trim().toLowerCase();

    if (!nomeCompleto.trim()) {
      setErro('Informe o nome completo do cliente.');
      return;
    }

    if (![11, 14].includes(documento.length)) {
      setErro('Informe um CPF ou CNPJ com 11 ou 14 dígitos.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNormalizado)) {
      setErro('Informe um e-mail válido.');
      return;
    }

    if (!unidadeSelecionadaId) {
      setErro('Selecione uma unidade para o cliente.');
      return;
    }

    try {
      setSalvando(true);

      const { error } = await supabase.rpc(
        'salvar_cliente_imovel_funcionario',
        {
          p_pre_cadastro_id: editandoId,
          p_nome_completo: nomeCompleto.trim(),
          p_cpf_cnpj: documento,
          p_email: emailNormalizado,
          p_telefone: telefone.trim() || null,
          p_unidade_id: unidadeSelecionadaId,
        }
      );

      if (error) throw new Error(error.message);

      await carregarClientes();

      setSucesso(
        editandoId
          ? 'Cliente atualizado e unidade vinculada com sucesso.'
          : 'Cliente cadastrado. O acesso pode ser ativado pelo Primeiro acesso.'
      );

      setMostrarFormularioCliente(false);
      limparCliente();
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível salvar o cliente.');
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao(
    titulo: string,
    mensagem: string
  ): Promise<boolean> {
    if (Platform.OS === 'web') {
      return globalThis.confirm?.(`${titulo}\n\n${mensagem}`) ?? false;
    }

    return new Promise((resolve) => {
      Alert.alert(
        titulo,
        mensagem,
        [
          {
            text: 'Cancelar',
            style: 'cancel',
            onPress: () => resolve(false),
          },
          {
            text: 'Excluir',
            style: 'destructive',
            onPress: () => resolve(true),
          },
        ],
        {
          cancelable: true,
          onDismiss: () => resolve(false),
        }
      );
    });
  }

  async function excluirEmpreendimento(emp: Empreendimento) {
    const confirmou = await confirmarExclusao(
      'Excluir empreendimento',
      `Tem certeza que deseja excluir "${emp.nome}"? Esta ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
      setExcluindoId(emp.id);
      setErro('');
      setSucesso('');

      const { data, error } = await supabase.rpc(
        'excluir_empreendimento_funcionario',
        {
          p_empreendimento_id: emp.id,
        }
      );

      if (error) throw new Error(error.message);

      const resultado = data as {
        sucesso?: boolean;
        mensagem?: string;
      } | null;

      setSucesso(
        resultado?.mensagem ??
          'Empreendimento excluído com sucesso.'
      );

      if (empreendimentoSelecionadoId === emp.id) {
        setEmpreendimentoSelecionadoId('');
        setFormUnidade(false);
      }

      await Promise.all([
        carregarCatalogo(),
        carregarClientes(),
      ]);
    } catch (e: any) {
      setErro(
        e?.message ??
          'Não foi possível excluir o empreendimento.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  async function excluirModeloGarantia(modelo: ModeloGarantia) {
    const confirmou = await confirmarExclusao(
      'Excluir modelo de garantia',
      `Tem certeza que deseja excluir "${modelo.nome}"? Esta ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
      setExcluindoId(modelo.id);
      setErro('');
      setSucesso('');

      const { data, error } = await supabase.rpc(
        'excluir_modelo_garantia_funcionario',
        {
          p_modelo_id: modelo.id,
        }
      );

      if (error) throw new Error(error.message);

      const resultado = data as {
        sucesso?: boolean;
        mensagem?: string;
      } | null;

      setSucesso(
        resultado?.mensagem ??
          'Modelo de garantia excluído com sucesso.'
      );

      if (modeloSelecionadoId === modelo.id) {
        setModeloSelecionadoId('');
        setFormItem(false);
      }

      await carregarCatalogo();
    } catch (e: any) {
      setErro(
        e?.message ??
          'Não foi possível excluir o modelo de garantia.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  async function excluirCliente(cliente: Cliente) {
    const confirmou = await confirmarExclusao(
      'Excluir cliente',
      `Tem certeza que deseja excluir "${cliente.nome_completo}"? O vínculo de pré-cadastro com a unidade também será removido. Esta ação não poderá ser desfeita.`
    );

    if (!confirmou) return;

    try {
      setExcluindoId(cliente.pre_cadastro_id);
      setErro('');
      setSucesso('');

      const { data, error } = await supabase.rpc(
        'excluir_cliente_pre_cadastro_funcionario',
        {
          p_pre_cadastro_id: cliente.pre_cadastro_id,
        }
      );

      if (error) {
        throw new Error(error.message);
      }

      const resultado = data as {
        sucesso?: boolean;
        mensagem?: string;
      } | null;

      setSucesso(
        resultado?.mensagem ??
          'Cliente excluído com sucesso.'
      );

      if (editandoId === cliente.pre_cadastro_id) {
        setMostrarFormularioCliente(false);
        limparCliente();
      }

      await carregarClientes();
    } catch (e: any) {
      setErro(
        e?.message ??
          'Não foi possível excluir o cliente.'
      );
    } finally {
      setExcluindoId(null);
    }
  }

  // EMPREENDIMENTOS

  async function salvarEmpreendimento() {
    if (!novoEmpNome.trim()) {
      setErro('Informe o nome do empreendimento.');
      return;
    }

    const id = await executarCadastro('criar_empreendimento', {
      nome: novoEmpNome.trim(),
      codigo: novoEmpCodigo.trim() || null,
      cidade: novoEmpCidade.trim() || null,
      endereco: novoEmpEndereco.trim() || null,
    });

    if (id === null) return;

    setNovoEmpNome('');
    setNovoEmpCodigo('');
    setNovoEmpCidade('');
    setNovoEmpEndereco('');
    setFormEmpreendimento(false);
    setEmpreendimentoSelecionadoId(id);

    try {
      await carregarCatalogo();
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao atualizar empreendimentos.');
    }
  }

  async function salvarUnidade() {
    if (!empreendimentoSelecionadoId) {
      setErro('Selecione o empreendimento.');
      return;
    }

    if (!novaUnidadeIdentificacao.trim()) {
      setErro('Informe a identificação da unidade.');
      return;
    }

    const datas = [
      dataHabiteSe,
      dataChaves,
      dataObra,
      dataContrato,
    ];

    if (datas.some((data) => !dataValida(data))) {
      setErro('Informe datas válidas no formato DD/MM/AAAA.');
      return;
    }

    const id = await executarCadastro('criar_unidade', {
      empreendimento_id: empreendimentoSelecionadoId,
      identificacao: novaUnidadeIdentificacao.trim(),
      modelo_id: novaUnidadeModeloId || null,
      data_habite_se: dataHabiteSe.trim()
        ? converterDataParaISO(dataHabiteSe)
        : null,
      data_entrega_chaves: dataChaves.trim()
        ? converterDataParaISO(dataChaves)
        : null,
      data_entrega_obra: dataObra.trim()
        ? converterDataParaISO(dataObra)
        : null,
      data_assinatura_contrato: dataContrato.trim()
        ? converterDataParaISO(dataContrato)
        : null,
    });

    if (id === null) return;

    setNovaUnidadeIdentificacao('');
    setNovaUnidadeModeloId('');
    setDataHabiteSe('');
    setDataChaves('');
    setDataObra('');
    setDataContrato('');
    setFormUnidade(false);

    try {
      await Promise.all([carregarCatalogo(), carregarClientes()]);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao atualizar as unidades.');
    }
  }

  // GARANTIAS

  async function selecionarModelo(id: string) {
    setModeloSelecionadoId(id);
    setFormItem(false);
    setErro('');
    setSucesso('');

    try {
      setAtualizando(true);
      await carregarCatalogo(id);
    } catch (e: any) {
      setErro(e?.message ?? 'Não foi possível carregar os itens.');
    } finally {
      setAtualizando(false);
    }
  }

  async function salvarModelo() {
    if (!novoModeloNome.trim()) {
      setErro('Informe o nome do modelo de garantia.');
      return;
    }

    const id = await executarCadastro('criar_modelo', {
      nome: novoModeloNome.trim(),
      versao: novoModeloVersao.trim() || null,
      descricao: novoModeloDescricao.trim() || null,
    });

    if (id === null) return;

    setNovoModeloNome('');
    setNovoModeloVersao('');
    setNovoModeloDescricao('');
    setFormModelo(false);
    setModeloSelecionadoId(id);

    try {
      await carregarCatalogo(id);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao atualizar os modelos.');
    }
  }

  async function salvarItem() {
    if (!modeloSelecionadoId) {
      setErro('Selecione um modelo de garantia.');
      return;
    }

    if (!itemCategoria.trim() || !itemElemento.trim()) {
      setErro('Informe a categoria e o elemento construtivo.');
      return;
    }

    const quantidade = Number(itemQuantidade);

    if (
      itemTipoPrazo === 'tempo' &&
      (!Number.isInteger(quantidade) ||
        quantidade < 1 ||
        quantidade > 100)
    ) {
      setErro('Informe um prazo inteiro entre 1 e 100.');
      return;
    }

    if (
      itemTipoPrazo === 'tempo' &&
      itemRegraData === 'ato_entrega'
    ) {
      setErro('Selecione uma data-base válida para o prazo.');
      return;
    }

    const id = await executarCadastro('criar_item', {
      modelo_id: modeloSelecionadoId,
      categoria: itemCategoria.trim(),
      elemento_construtivo: itemElemento.trim(),
      manifestacao_patologica: itemManifestacao.trim() || null,
      tipo_prazo: itemTipoPrazo,
      prazo_quantidade:
        itemTipoPrazo === 'tempo' ? quantidade : null,
      prazo_unidade:
        itemTipoPrazo === 'tempo' ? itemUnidadePrazo : null,
      regra_data_base:
        itemTipoPrazo === 'ato_entrega'
          ? 'ato_entrega'
          : itemRegraData,
      observacao: itemObservacao.trim() || null,
    });

    if (id === null) return;

    setItemCategoria('');
    setItemElemento('');
    setItemManifestacao('');
    setItemTipoPrazo('tempo');
    setItemQuantidade('1');
    setItemUnidadePrazo('anos');
    setItemRegraData('habite_se');
    setItemObservacao('');
    setFormItem(false);

    try {
      await carregarCatalogo(modeloSelecionadoId);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao atualizar os itens.');
    }
  }

  async function vincularModelo(unidadeId: string) {
    if (!modeloSelecionadoId) return;

    const id = await executarCadastro('vincular_modelo', {
      unidade_id: unidadeId,
      modelo_id: modeloSelecionadoId,
    });

    if (id === null) return;

    try {
      await carregarCatalogo(modeloSelecionadoId);
    } catch (e: any) {
      setErro(e?.message ?? 'Erro ao atualizar os vínculos.');
    }
  }

  const empreendimentoSelecionado =
    catalogo.empreendimentos.find(
      (emp) => emp.id === empreendimentoSelecionadoId
    );

  const unidadesDoEmpreendimento = catalogo.unidades.filter(
    (unidade) =>
      unidade.empreendimento_id === empreendimentoSelecionadoId
  );

  const modeloSelecionado = catalogo.modelos.find(
    (modelo) => modelo.id === modeloSelecionadoId
  );

  const unidadesSemModelo = catalogo.unidades.filter(
    (unidade) => unidade.ativo && !unidade.modelo_garantia_id
  );

  function nomeEmpreendimento(id: string) {
    return (
      catalogo.empreendimentos.find((emp) => emp.id === id)?.nome ??
      'Empreendimento'
    );
  }

  function nomeModelo(id: string | null) {
    if (!id) return 'Sem garantia vinculada';

    return (
      catalogo.modelos.find((modelo) => modelo.id === id)?.nome ??
      'Modelo de garantia'
    );
  }

  // TELA CLIENTES

  function renderClientes() {
    return (
      <>
        <View style={styles.cabecalhoSecao}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloSecao}>Clientes e imóveis</Text>
            <Text style={styles.subtitulo}>
              Cadastre clientes, vincule suas unidades e acompanhe
              a ativação do acesso ao aplicativo EMAFE.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAzul}
            onPress={abrirNovoCliente}
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.botaoAzulTexto}>
              Cadastrar cliente
            </Text>
          </TouchableOpacity>
        </View>

        {mostrarFormularioCliente ? (
          <View style={styles.cartao}>
            <View style={styles.cabecalhoFormulario}>
              <Text style={styles.tituloFormulario}>
                {editandoId ? 'Editar cliente' : 'Novo cliente'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setMostrarFormularioCliente(false);
                  limparCliente();
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#697789"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.textoAuxiliar}>
              O cliente usará este CPF/CNPJ e este e-mail
              no Primeiro acesso.
            </Text>

            <Campo
              titulo="NOME COMPLETO *"
              valor={nomeCompleto}
              alterar={setNomeCompleto}
              placeholder="Nome do cliente"
            />

            <Campo
              titulo="CPF/CNPJ *"
              valor={cpfCnpj}
              alterar={setCpfCnpj}
              placeholder="Somente números"
              teclado="numeric"
            />

            <Campo
              titulo="TELEFONE"
              valor={telefone}
              alterar={setTelefone}
              placeholder="Telefone do cliente"
              teclado="phone-pad"
            />

            <Campo
              titulo="E-MAIL *"
              valor={email}
              alterar={setEmail}
              placeholder="E-mail cadastrado"
              teclado="email-address"
            />

            <Text style={styles.tituloMenor}>
              UNIDADE DO CLIENTE *
            </Text>

            {unidadeSelecionadaId ? (
              <View style={styles.caixaSelecionada}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>
                    UNIDADE SELECIONADA
                  </Text>
                  <Text style={styles.textoForte}>
                    {unidades.find(
                      (u) =>
                        u.unidade_id === unidadeSelecionadaId
                    )?.empreendimento_nome ?? 'Empreendimento'}
                  </Text>
                  <Text style={styles.textoAuxiliar}>
                    Unidade{' '}
                    {unidades.find(
                      (u) =>
                        u.unidade_id === unidadeSelecionadaId
                    )?.identificacao ?? ''}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.botaoContorno}
                  onPress={() => {
                    setUnidadeSelecionadaId('');
                    setBuscaUnidade('');
                  }}
                >
                  <Text style={styles.botaoContornoTexto}>
                    Trocar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Campo
                  titulo="BUSCAR EMPREENDIMENTO OU UNIDADE"
                  valor={buscaUnidade}
                  alterar={setBuscaUnidade}
                  placeholder="Digite o nome ou número da unidade"
                />

                {unidadesFiltradas.map((unidade) => (
                  <TouchableOpacity
                    key={unidade.unidade_id}
                    style={styles.opcao}
                    onPress={() => {
                      setUnidadeSelecionadaId(
                        unidade.unidade_id
                      );
                      setBuscaUnidade('');
                    }}
                  >
                    <Ionicons
                      name="home-outline"
                      size={20}
                      color="#0B2447"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.opcaoTitulo}>
                        {unidade.empreendimento_nome}
                      </Text>
                      <Text style={styles.opcaoDescricao}>
                        Unidade {unidade.identificacao}
                        {unidade.cidade
                          ? ` • ${unidade.cidade}`
                          : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {buscaUnidade.trim() &&
                unidadesFiltradas.length === 0 ? (
                  <Text style={styles.textoAuxiliar}>
                    Nenhuma unidade encontrada.
                  </Text>
                ) : null}
              </>
            )}

            <View style={styles.acoes}>
              <TouchableOpacity
                style={styles.botaoContorno}
                onPress={() => {
                  setMostrarFormularioCliente(false);
                  limparCliente();
                }}
              >
                <Text style={styles.botaoContornoTexto}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <BotaoSalvar
                titulo="Salvar cliente"
                salvando={salvando}
                onPress={salvarCliente}
              />
            </View>
          </View>
        ) : null}

        <View style={styles.cabecalhoLista}>
          <View>
            <Text style={styles.tituloMenor}>
              Clientes cadastrados
            </Text>
            <Text style={styles.textoAuxiliar}>
              {clientes.length}{' '}
              {clientes.length === 1
                ? 'cliente'
                : 'clientes'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAtualizar}
            onPress={atualizar}
            disabled={atualizando}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#0B5EA8"
            />
            <Text style={styles.botaoContornoTexto}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.inputBusca}
          value={busca}
          onChangeText={setBusca}
          placeholder="Buscar nome, CPF/CNPJ, e-mail ou unidade"
          placeholderTextColor="#8995A5"
        />

        {clientesFiltrados.length === 0 ? (
          <View style={styles.cartaoVazio}>
            <Ionicons
              name="people-outline"
              size={30}
              color="#8995A5"
            />
            <Text style={styles.textoAuxiliar}>
              Nenhum cliente encontrado.
            </Text>
          </View>
        ) : (
          clientesFiltrados.map((cliente) => (
            <View
              key={cliente.pre_cadastro_id}
              style={styles.cartao}
            >
              <View style={styles.cabecalhoLista}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.textoForte}>
                    {cliente.nome_completo}
                  </Text>
                  <Text style={styles.textoAuxiliar}>
                    {formatarDocumento(cliente.cpf_cnpj)}
                  </Text>
                </View>

                <View
                  style={[
                    styles.selo,
                    cliente.acesso_ativado
                      ? styles.seloVerde
                      : styles.seloAmarelo,
                  ]}
                >
                  <Text
                    style={[
                      styles.seloTexto,
                      {
                        color: cliente.acesso_ativado
                          ? '#287A46'
                          : '#9A6A15',
                      },
                    ]}
                  >
                    {cliente.acesso_ativado
                      ? 'Acesso ativo'
                      : 'Aguardando ativação'}
                  </Text>
                </View>
              </View>

              <Text style={styles.rotulo}>
                E-MAIL
              </Text>
              <Text style={styles.textoNormal}>
                {cliente.email}
              </Text>

              <Text style={styles.rotulo}>
                TELEFONE
              </Text>
              <Text style={styles.textoNormal}>
                {cliente.telefone || '-'}
              </Text>

              <Text style={styles.rotulo}>
                IMÓVEIS VINCULADOS
              </Text>

              {cliente.unidades.length === 0 ? (
                <Text style={styles.textoAuxiliar}>
                  Nenhuma unidade vinculada.
                </Text>
              ) : (
                cliente.unidades.map((unidade) => (
                  <View
                    key={unidade.unidade_id}
                    style={styles.faixaAzul}
                  >
                    <Ionicons
                      name="home-outline"
                      size={18}
                      color="#0B2447"
                    />
                    <Text style={styles.textoNormal}>
                      {unidade.empreendimento_nome} • Unidade{' '}
                      {unidade.unidade_identificacao}
                    </Text>
                  </View>
                ))
              )}

              <View style={styles.acoesCliente}>
                <TouchableOpacity
                  style={[
                    styles.botaoContornoLargo,
                    styles.botaoEditarCliente,
                  ]}
                  onPress={() => abrirEdicaoCliente(cliente)}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color="#0B5EA8"
                  />
                  <Text style={styles.botaoContornoTexto}>
                    Editar dados / vincular outra unidade
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoExcluirCliente}
                  disabled={excluindoId === cliente.pre_cadastro_id}
                  onPress={() => excluirCliente(cliente)}
                >
                  {excluindoId === cliente.pre_cadastro_id ? (
                    <ActivityIndicator size="small" color="#A52828" />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color="#A52828"
                    />
                  )}

                  <Text style={styles.botaoExcluirTexto}>
                    {excluindoId === cliente.pre_cadastro_id
                      ? 'Excluindo...'
                      : 'Excluir cliente'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={styles.aviso}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color="#0B5EA8"
          />
          <Text style={styles.avisoTexto}>
            Para ativar o acesso, o cliente abre
            “Primeiro acesso” no aplicativo e informa
            o mesmo CPF/CNPJ e e-mail cadastrados.
            A senha é criada pelo próprio cliente.
          </Text>
        </View>
      </>
    );
  }

  // TELA EMPREENDIMENTOS

  function renderFuncionarios() {
    return (
      <>
        <View style={styles.cabecalhoSecao}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloSecao}>
              Funcionários
            </Text>
            <Text style={styles.subtitulo}>
              Pré-cadastre os funcionários que poderão acessar a Área do Funcionário da EMAFE.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAzul}
            onPress={abrirNovoFuncionario}
          >
            <Ionicons
              name="person-add-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.botaoAzulTexto}>
              Cadastrar funcionário
            </Text>
          </TouchableOpacity>
        </View>

        {mostrarFormularioFuncionario ? (
          <View style={styles.cartao}>
            <View style={styles.cabecalhoFormulario}>
              <Text style={styles.tituloFormulario}>
                {editandoFuncionarioId
                  ? 'Editar funcionário'
                  : 'Novo funcionário'}
              </Text>

              <TouchableOpacity
                onPress={() => {
                  setMostrarFormularioFuncionario(false);
                  limparFuncionario();
                }}
              >
                <Ionicons
                  name="close"
                  size={24}
                  color="#697789"
                />
              </TouchableOpacity>
            </View>

            <Text style={styles.textoAuxiliar}>
              O funcionário usará este CPF e este e-mail no Primeiro acesso. Após a ativação, o perfil será criado como funcionário.
            </Text>

            <Campo
              titulo="NOME COMPLETO *"
              valor={funcionarioNome}
              alterar={setFuncionarioNome}
              placeholder="Nome do funcionário"
            />

            <Campo
              titulo="CPF *"
              valor={funcionarioCpf}
              alterar={setFuncionarioCpf}
              placeholder="Somente números"
              teclado="numeric"
            />

            <Campo
              titulo="TELEFONE"
              valor={funcionarioTelefone}
              alterar={setFuncionarioTelefone}
              placeholder="Telefone do funcionário"
              teclado="phone-pad"
            />

            <Campo
              titulo="E-MAIL *"
              valor={funcionarioEmail}
              alterar={setFuncionarioEmail}
              placeholder="E-mail cadastrado"
              teclado="email-address"
            />

            <BotaoSalvar
              titulo={
                editandoFuncionarioId
                  ? 'Salvar alterações'
                  : 'Cadastrar funcionário'
              }
              salvando={salvando}
              onPress={salvarFuncionario}
            />
          </View>
        ) : null}

        <View style={styles.cabecalhoLista}>
          <View>
            <Text style={styles.tituloMenor}>
              Funcionários cadastrados
            </Text>
            <Text style={styles.textoAuxiliar}>
              {funcionarios.length} funcionário(s)
            </Text>
          </View>

          <TouchableOpacity
            onPress={atualizar}
            style={styles.botaoAtualizar}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#0B5EA8"
            />
            <Text style={styles.botaoContornoTexto}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.busca}
          value={buscaFuncionario}
          onChangeText={setBuscaFuncionario}
          placeholder="Buscar nome, CPF, e-mail ou telefone"
          placeholderTextColor="#8995A5"
        />

        {funcionariosFiltrados.length === 0 ? (
          <View style={styles.cartao}>
            <Text style={styles.textoAuxiliar}>
              Nenhum funcionário encontrado.
            </Text>
          </View>
        ) : (
          funcionariosFiltrados.map((funcionario) => (
            <View
              key={funcionario.pre_cadastro_id}
              style={styles.cartao}
            >
              <View style={styles.linhaTopoCliente}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.nomeCliente}>
                    {funcionario.nome_completo}
                  </Text>
                  <Text style={styles.textoAuxiliar}>
                    {formatarDocumento(
                      funcionario.cpf_cnpj
                    )}
                  </Text>
                </View>

                <View
                  style={[
                    styles.status,
                    funcionario.acesso_ativado
                      ? styles.statusAtivo
                      : styles.statusPendente,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusTexto,
                      funcionario.acesso_ativado
                        ? styles.statusAtivoTexto
                        : styles.statusPendenteTexto,
                    ]}
                  >
                    {funcionario.acesso_ativado
                      ? 'Acesso ativado'
                      : 'Aguardando ativação'}
                  </Text>
                </View>
              </View>

              <Text style={styles.label}>E-MAIL</Text>
              <Text style={styles.textoForte}>
                {funcionario.email}
              </Text>

              <Text style={styles.label}>TELEFONE</Text>
              <Text style={styles.textoForte}>
                {funcionario.telefone || '-'}
              </Text>

              {!funcionario.acesso_ativado ? (
                <View style={styles.acoesCliente}>
                  <TouchableOpacity
                    style={[
                      styles.botaoContornoLargo,
                      styles.botaoEditarCliente,
                    ]}
                    onPress={() =>
                      abrirEdicaoFuncionario(funcionario)
                    }
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color="#0B5EA8"
                    />
                    <Text style={styles.botaoContornoTexto}>
                      Editar funcionário
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.botaoExcluirCliente}
                    disabled={
                      excluindoId ===
                      funcionario.pre_cadastro_id
                    }
                    onPress={() =>
                      excluirFuncionario(funcionario)
                    }
                  >
                    {excluindoId ===
                    funcionario.pre_cadastro_id ? (
                      <ActivityIndicator
                        size="small"
                        color="#A52828"
                      />
                    ) : (
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#A52828"
                      />
                    )}

                    <Text style={styles.botaoExcluirTexto}>
                      {excluindoId ===
                      funcionario.pre_cadastro_id
                        ? 'Excluindo...'
                        : 'Excluir funcionário'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <Text style={styles.textoAuxiliar}>
                  Este funcionário já concluiu o primeiro acesso e possui perfil ativo no sistema.
                </Text>
              )}
            </View>
          ))
        )}
      </>
    );
  }

  function renderEmpreendimentos() {
    return (
      <>
        <View style={styles.cabecalhoSecao}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloSecao}>
              Empreendimentos
            </Text>
            <Text style={styles.subtitulo}>
              Cadastre empreendimentos, suas unidades e
              associe o modelo de garantia de cada casa.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAzul}
            onPress={() => {
              setFormEmpreendimento(!formEmpreendimento);
              setFormUnidade(false);
              setErro('');
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.botaoAzulTexto}>
              Novo empreendimento
            </Text>
          </TouchableOpacity>
        </View>

        {formEmpreendimento ? (
          <View style={styles.cartao}>
            <Text style={styles.tituloFormulario}>
              Cadastrar empreendimento
            </Text>

            <Campo
              titulo="NOME DO EMPREENDIMENTO *"
              valor={novoEmpNome}
              alterar={setNovoEmpNome}
              placeholder="Ex.: Residencial EMAFE"
            />

            <Campo
              titulo="CÓDIGO"
              valor={novoEmpCodigo}
              alterar={setNovoEmpCodigo}
              placeholder="Código interno, se houver"
            />

            <Campo
              titulo="CIDADE"
              valor={novoEmpCidade}
              alterar={setNovoEmpCidade}
              placeholder="Cidade do empreendimento"
            />

            <Campo
              titulo="ENDEREÇO"
              valor={novoEmpEndereco}
              alterar={setNovoEmpEndereco}
              placeholder="Endereço do empreendimento"
            />

            <BotaoSalvar
              titulo="Salvar empreendimento"
              salvando={salvando}
              onPress={salvarEmpreendimento}
            />
          </View>
        ) : null}

        <View style={styles.cabecalhoLista}>
          <View>
            <Text style={styles.tituloMenor}>
              Empreendimentos cadastrados
            </Text>
            <Text style={styles.textoAuxiliar}>
              {catalogo.empreendimentos.length} cadastrados
            </Text>
          </View>

          <TouchableOpacity
            onPress={atualizar}
            style={styles.botaoAtualizar}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#0B5EA8"
            />
            <Text style={styles.botaoContornoTexto}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        {catalogo.empreendimentos.map((emp) => (
          <BotaoOpcao
            key={emp.id}
            titulo={emp.nome}
            descricao={`${emp.cidade || 'Cidade não informada'} • ${
              emp.quantidade_unidades
            } unidade(s)`}
            selecionado={
              empreendimentoSelecionadoId === emp.id
            }
            onPress={() => {
              setEmpreendimentoSelecionadoId(emp.id);
              setFormUnidade(false);
              setErro('');
              setSucesso('');
            }}
          />
        ))}

        {empreendimentoSelecionado ? (
          <View style={styles.cartaoDestaque}>
            <View style={styles.cabecalhoLista}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloFormulario}>
                  {empreendimentoSelecionado.nome}
                </Text>
                <Text style={styles.textoAuxiliar}>
                  {empreendimentoSelecionado.cidade || ''}
                </Text>
              </View>

              <View style={styles.acoesCabecalho}>
                <TouchableOpacity
                  style={styles.botaoExcluir}
                  disabled={excluindoId === empreendimentoSelecionado.id}
                  onPress={() =>
                    excluirEmpreendimento(empreendimentoSelecionado)
                  }
                >
                  {excluindoId === empreendimentoSelecionado.id ? (
                    <ActivityIndicator size="small" color="#A52828" />
                  ) : (
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color="#A52828"
                    />
                  )}
                  <Text style={styles.botaoExcluirTexto}>
                    {excluindoId === empreendimentoSelecionado.id
                      ? 'Excluindo...'
                      : 'Excluir'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.botaoAzul}
                  onPress={() => setFormUnidade(!formUnidade)}
                >
                  <Ionicons
                    name="home-outline"
                    size={17}
                    color="#FFFFFF"
                  />
                  <Text style={styles.botaoAzulTexto}>
                    Nova unidade
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {formUnidade ? (
              <View style={styles.formularioInterno}>
                <Text style={styles.tituloMenor}>
                  Cadastrar unidade
                </Text>

                <Campo
                  titulo="IDENTIFICAÇÃO DA UNIDADE *"
                  valor={novaUnidadeIdentificacao}
                  alterar={setNovaUnidadeIdentificacao}
                  placeholder="Ex.: Casa 01, 1A, 8B"
                />

                <Text style={styles.label}>
                  MODELO DE GARANTIA
                </Text>
                <Text style={styles.textoAuxiliar}>
                  Você pode deixar sem modelo e vincular
                  depois na aba Garantias.
                </Text>

                <BotaoOpcao
                  titulo="Sem modelo por enquanto"
                  selecionado={!novaUnidadeModeloId}
                  onPress={() => setNovaUnidadeModeloId('')}
                />

                {catalogo.modelos
                  .filter(
                    (modelo) =>
                      modelo.ativo &&
                      modelo.quantidade_itens > 0
                  )
                  .map((modelo) => (
                    <BotaoOpcao
                      key={modelo.id}
                      titulo={modelo.nome}
                      descricao={`${modelo.quantidade_itens} itens`}
                      selecionado={
                        novaUnidadeModeloId === modelo.id
                      }
                      onPress={() =>
                        setNovaUnidadeModeloId(modelo.id)
                      }
                    />
                  ))}

                <Text style={styles.tituloMenor}>
                  Datas da unidade
                </Text>
                <Text style={styles.textoAuxiliar}>
                  Preencha somente as datas confirmadas.
                  Formato: DD/MM/AAAA.
                </Text>

                <Campo
                  titulo="DATA DO HABITE-SE"
                  valor={dataHabiteSe}
                  alterar={setDataHabiteSe}
                  placeholder="10/08/2026"
                  teclado="numeric"
                />

                <Campo
                  titulo="DATA DA ENTREGA DAS CHAVES"
                  valor={dataChaves}
                  alterar={setDataChaves}
                  placeholder="DD/MM/AAAA"
                  teclado="numeric"
                />

                <Campo
                  titulo="DATA DA ENTREGA DA OBRA"
                  valor={dataObra}
                  alterar={setDataObra}
                  placeholder="DD/MM/AAAA"
                  teclado="numeric"
                />

                <Campo
                  titulo="DATA DA ASSINATURA DO CONTRATO"
                  valor={dataContrato}
                  alterar={setDataContrato}
                  placeholder="DD/MM/AAAA"
                  teclado="numeric"
                />

                <BotaoSalvar
                  titulo="Salvar unidade"
                  salvando={salvando}
                  onPress={salvarUnidade}
                />
              </View>
            ) : null}

            <Text style={styles.tituloMenor}>
              Unidades deste empreendimento
            </Text>

            {unidadesDoEmpreendimento.length === 0 ? (
              <Text style={styles.textoAuxiliar}>
                Nenhuma unidade cadastrada.
              </Text>
            ) : (
              unidadesDoEmpreendimento.map((unidade) => (
                <View
                  key={unidade.id}
                  style={styles.linhaUnidade}
                >
                  <Ionicons
                    name="home-outline"
                    size={19}
                    color="#0B2447"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.textoForte}>
                      Unidade {unidade.identificacao}
                    </Text>
                    <Text style={styles.textoAuxiliar}>
                      {nomeModelo(
                        unidade.modelo_garantia_id
                      )}
                    </Text>
                    {unidade.data_habite_se ? (
                      <Text style={styles.textoAuxiliar}>
                        Habite-se: {formatarDataBrasileira(
                          unidade.data_habite_se
                        )}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View style={styles.aviso}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#0B5EA8"
            />
            <Text style={styles.avisoTexto}>
              Selecione um empreendimento acima para
              visualizar e cadastrar suas unidades.
            </Text>
          </View>
        )}
      </>
    );
  }

  // TELA GARANTIAS

  function renderGarantias() {
    return (
      <>
        <View style={styles.cabecalhoSecao}>
          <View style={{ flex: 1 }}>
            <Text style={styles.tituloSecao}>
              Garantias
            </Text>
            <Text style={styles.subtitulo}>
              Crie modelos de garantia, cadastre seus itens
              e vincule os modelos às unidades.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.botaoAzul}
            onPress={() => {
              setFormModelo(!formModelo);
              setFormItem(false);
              setErro('');
            }}
          >
            <Ionicons
              name="add-circle-outline"
              size={18}
              color="#FFFFFF"
            />
            <Text style={styles.botaoAzulTexto}>
              Novo modelo
            </Text>
          </TouchableOpacity>
        </View>

        {formModelo ? (
          <View style={styles.cartao}>
            <Text style={styles.tituloFormulario}>
              Criar modelo de garantia
            </Text>

            <Campo
              titulo="NOME DO MODELO *"
              valor={novoModeloNome}
              alterar={setNovoModeloNome}
              placeholder="Ex.: Garantia Residencial 2026"
            />

            <Campo
              titulo="VERSÃO"
              valor={novoModeloVersao}
              alterar={setNovoModeloVersao}
              placeholder="Ex.: 1.0"
            />

            <Campo
              titulo="DESCRIÇÃO"
              valor={novoModeloDescricao}
              alterar={setNovoModeloDescricao}
              placeholder="Observações sobre este modelo"
              multiline
            />

            <BotaoSalvar
              titulo="Criar modelo"
              salvando={salvando}
              onPress={salvarModelo}
            />
          </View>
        ) : null}

        <View style={styles.cabecalhoLista}>
          <View>
            <Text style={styles.tituloMenor}>
              Modelos cadastrados
            </Text>
            <Text style={styles.textoAuxiliar}>
              {catalogo.modelos.length} modelos
            </Text>
          </View>

          <TouchableOpacity
            onPress={atualizar}
            style={styles.botaoAtualizar}
          >
            <Ionicons
              name="refresh-outline"
              size={18}
              color="#0B5EA8"
            />
            <Text style={styles.botaoContornoTexto}>
              Atualizar
            </Text>
          </TouchableOpacity>
        </View>

        {catalogo.modelos.map((modelo) => (
          <BotaoOpcao
            key={modelo.id}
            titulo={modelo.nome}
            descricao={`${modelo.quantidade_itens} itens • ${modelo.quantidade_unidades} unidades vinculadas`}
            selecionado={modeloSelecionadoId === modelo.id}
            onPress={() => selecionarModelo(modelo.id)}
          />
        ))}

        {modeloSelecionado ? (
          <View style={styles.cartaoDestaque}>
            <View style={styles.cabecalhoLista}>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloFormulario}>
                  {modeloSelecionado.nome}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.botaoExcluir}
                disabled={excluindoId === modeloSelecionado.id}
                onPress={() =>
                  excluirModeloGarantia(modeloSelecionado)
                }
              >
                {excluindoId === modeloSelecionado.id ? (
                  <ActivityIndicator size="small" color="#A52828" />
                ) : (
                  <Ionicons
                    name="trash-outline"
                    size={17}
                    color="#A52828"
                  />
                )}
                <Text style={styles.botaoExcluirTexto}>
                  {excluindoId === modeloSelecionado.id
                    ? 'Excluindo...'
                    : 'Excluir'}
                </Text>
              </TouchableOpacity>
            </View>

            {modeloSelecionado.descricao ? (
              <Text style={styles.textoAuxiliar}>
                {modeloSelecionado.descricao}
              </Text>
            ) : null}

            <Text style={styles.textoAuxiliar}>
              {modeloSelecionado.quantidade_itens} itens •{' '}
              {modeloSelecionado.quantidade_unidades} unidades
              vinculadas
            </Text>

            {modeloSelecionado.quantidade_unidades > 0 ? (
              <View style={styles.aviso}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#0B5EA8"
                />
                <Text style={styles.avisoTexto}>
                  Este modelo já está vinculado a unidades.
                  Para preservar as garantias existentes,
                  não é permitido acrescentar itens nele.
                  Crie um novo modelo para regras diferentes.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.botaoAzul}
                onPress={() => setFormItem(!formItem)}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.botaoAzulTexto}>
                  Adicionar item de garantia
                </Text>
              </TouchableOpacity>
            )}

            {formItem &&
            modeloSelecionado.quantidade_unidades === 0 ? (
              <View style={styles.formularioInterno}>
                <Text style={styles.tituloMenor}>
                  Novo item de garantia
                </Text>

                <Campo
                  titulo="CATEGORIA *"
                  valor={itemCategoria}
                  alterar={setItemCategoria}
                  placeholder="Ex.: Pintura"
                />

                <Campo
                  titulo="ELEMENTO CONSTRUTIVO *"
                  valor={itemElemento}
                  alterar={setItemElemento}
                  placeholder="Ex.: Pintura interna"
                />

                <Campo
                  titulo="MANIFESTAÇÃO / DEFEITO COBERTO"
                  valor={itemManifestacao}
                  alterar={setItemManifestacao}
                  placeholder="Ex.: Descascamento"
                  multiline
                />

                <Text style={styles.label}>
                  TIPO DE GARANTIA
                </Text>

                <BotaoOpcao
                  titulo="Prazo em dias, meses ou anos"
                  selecionado={itemTipoPrazo === 'tempo'}
                  onPress={() => {
                    setItemTipoPrazo('tempo');
                    if (itemRegraData === 'ato_entrega') {
                      setItemRegraData('habite_se');
                    }
                  }}
                />

                <BotaoOpcao
                  titulo="Somente no ato da entrega"
                  selecionado={
                    itemTipoPrazo === 'ato_entrega'
                  }
                  onPress={() =>
                    setItemTipoPrazo('ato_entrega')
                  }
                />

                {itemTipoPrazo === 'tempo' ? (
                  <>
                    <Campo
                      titulo="QUANTIDADE DO PRAZO *"
                      valor={itemQuantidade}
                      alterar={setItemQuantidade}
                      placeholder="Ex.: 5"
                      teclado="numeric"
                    />

                    <Text style={styles.label}>
                      UNIDADE DO PRAZO
                    </Text>

                    {[
                      { valor: 'dias', nome: 'Dias' },
                      { valor: 'meses', nome: 'Meses' },
                      { valor: 'anos', nome: 'Anos' },
                    ].map((opcao) => (
                      <BotaoOpcao
                        key={opcao.valor}
                        titulo={opcao.nome}
                        selecionado={
                          itemUnidadePrazo === opcao.valor
                        }
                        onPress={() =>
                          setItemUnidadePrazo(opcao.valor)
                        }
                      />
                    ))}

                    <Text style={styles.label}>
                      DATA DE INÍCIO DA GARANTIA
                    </Text>

                    {REGRAS_DATA.filter(
                      (regra) =>
                        regra.valor !== 'ato_entrega'
                    ).map((regra) => (
                      <BotaoOpcao
                        key={regra.valor}
                        titulo={regra.nome}
                        selecionado={
                          itemRegraData === regra.valor
                        }
                        onPress={() =>
                          setItemRegraData(regra.valor)
                        }
                      />
                    ))}
                  </>
                ) : null}

                <Campo
                  titulo="OBSERVAÇÕES"
                  valor={itemObservacao}
                  alterar={setItemObservacao}
                  placeholder="Condições e observações da garantia"
                  multiline
                />

                <BotaoSalvar
                  titulo="Salvar item de garantia"
                  salvando={salvando}
                  onPress={salvarItem}
                />
              </View>
            ) : null}

            <Text style={styles.tituloMenor}>
              Itens deste modelo
            </Text>

            {atualizando ? (
              <ActivityIndicator color="#0B5EA8" />
            ) : catalogo.itens.length === 0 ? (
              <Text style={styles.textoAuxiliar}>
                Nenhum item cadastrado neste modelo.
              </Text>
            ) : (
              catalogo.itens.map((item) => (
                <View
                  key={item.id}
                  style={styles.cartaoItem}
                >
                  <Text style={styles.rotulo}>
                    {item.categoria}
                  </Text>

                  <Text style={styles.textoForte}>
                    {item.elemento_construtivo}
                  </Text>

                  {item.manifestacao_patologica ? (
                    <Text style={styles.textoNormal}>
                      {item.manifestacao_patologica}
                    </Text>
                  ) : null}

                  <Text style={styles.textoAzul}>
                    {item.tipo_prazo === 'ato_entrega'
                      ? 'Garantia no ato da entrega'
                      : `${item.prazo_quantidade} ${item.prazo_unidade}`}
                  </Text>

                  <Text style={styles.textoAuxiliar}>
                    {REGRAS_DATA.find(
                      (regra) =>
                        regra.valor === item.regra_data_base
                    )?.nome ?? item.regra_data_base}
                  </Text>

                  {item.observacao ? (
                    <Text style={styles.textoAuxiliar}>
                      {item.observacao}
                    </Text>
                  ) : null}
                </View>
              ))
            )}

            {modeloSelecionado.quantidade_itens > 0 ? (
              <>
                <Text style={styles.tituloMenor}>
                  Vincular modelo a unidades
                </Text>

                <Text style={styles.textoAuxiliar}>
                  Apenas unidades que ainda não possuem
                  modelo de garantia podem ser vinculadas.
                </Text>

                {unidadesSemModelo.length === 0 ? (
                  <Text style={styles.textoAuxiliar}>
                    Não há unidades sem modelo.
                  </Text>
                ) : (
                  unidadesSemModelo.map((unidade) => (
                    <View
                      key={unidade.id}
                      style={styles.linhaUnidade}
                    >
                      <Ionicons
                        name="home-outline"
                        size={19}
                        color="#0B2447"
                      />

                      <View style={{ flex: 1 }}>
                        <Text style={styles.textoForte}>
                          {nomeEmpreendimento(
                            unidade.empreendimento_id
                          )}
                        </Text>
                        <Text style={styles.textoAuxiliar}>
                          Unidade {unidade.identificacao}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={[
                          styles.botaoAzul,
                          salvando && styles.desabilitado,
                        ]}
                        disabled={salvando}
                        onPress={() =>
                          vincularModelo(unidade.id)
                        }
                      >
                        <Text style={styles.botaoAzulTexto}>
                          Vincular
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            ) : null}
          </View>
        ) : (
          <View style={styles.aviso}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color="#0B5EA8"
            />
            <Text style={styles.avisoTexto}>
              Selecione um modelo acima para consultar
              seus itens e vincular unidades.
            </Text>
          </View>
        )}

        <View style={styles.aviso}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#0B5EA8"
          />
          <Text style={styles.avisoTexto}>
            As garantias já cadastradas são preservadas.
            Para um empreendimento com regras diferentes,
            crie um novo modelo e cadastre seus itens.
          </Text>
        </View>
      </>
    );
  }

  if (carregando) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.carregamento}>
          <ActivityIndicator
            size="large"
            color="#0B2447"
          />
          <Text style={styles.textoAuxiliar}>
            Carregando clientes, empreendimentos e garantias...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.conteudoScroll}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.conteudo}>
          <TouchableOpacity
            style={styles.voltar}
            onPress={() => router.back()}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#0B2447"
            />
            <Text style={styles.voltarTexto}>
              Voltar
            </Text>
          </TouchableOpacity>

          <Text style={styles.tituloPagina}>
            Gestão de clientes e imóveis
          </Text>

          <Text style={styles.subtitulo}>
            Gerencie clientes, empreendimentos, unidades
            e modelos de garantia da EMAFE.
          </Text>

          <View style={styles.abas}>
            <TouchableOpacity
              style={[
                styles.aba,
                aba === 'clientes' && styles.abaAtiva,
              ]}
              onPress={() => trocarAba('clientes')}
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={
                  aba === 'clientes'
                    ? '#FFFFFF'
                    : '#0B2447'
                }
              />
              <Text
                style={[
                  styles.abaTexto,
                  aba === 'clientes' && styles.abaTextoAtivo,
                ]}
              >
                Clientes e imóveis
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.aba,
                aba === 'funcionarios' &&
                  styles.abaAtiva,
              ]}
              onPress={() =>
                trocarAba('funcionarios')
              }
            >
              <Ionicons
                name="people-outline"
                size={18}
                color={
                  aba === 'funcionarios'
                    ? '#FFFFFF'
                    : '#0B2447'
                }
              />
              <Text
                style={[
                  styles.abaTexto,
                  aba === 'funcionarios' &&
                    styles.abaTextoAtivo,
                ]}
              >
                Funcionários
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.aba,
                aba === 'empreendimentos' &&
                  styles.abaAtiva,
              ]}
              onPress={() =>
                trocarAba('empreendimentos')
              }
            >
              <Ionicons
                name="business-outline"
                size={18}
                color={
                  aba === 'empreendimentos'
                    ? '#FFFFFF'
                    : '#0B2447'
                }
              />
              <Text
                style={[
                  styles.abaTexto,
                  aba === 'empreendimentos' &&
                    styles.abaTextoAtivo,
                ]}
              >
                Empreendimentos
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.aba,
                aba === 'garantias' && styles.abaAtiva,
              ]}
              onPress={() => trocarAba('garantias')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={
                  aba === 'garantias'
                    ? '#FFFFFF'
                    : '#0B2447'
                }
              />
              <Text
                style={[
                  styles.abaTexto,
                  aba === 'garantias' &&
                    styles.abaTextoAtivo,
                ]}
              >
                Garantias
              </Text>
            </TouchableOpacity>
          </View>

          {erro ? (
            <View style={styles.caixaErro}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#9A3232"
              />
              <Text style={styles.textoErro}>
                {erro}
              </Text>
            </View>
          ) : null}

          {sucesso ? (
            <View style={styles.caixaSucesso}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#287A46"
              />
              <Text style={styles.textoSucesso}>
                {sucesso}
              </Text>
            </View>
          ) : null}

          {aba === 'clientes' && renderClientes()}
          {aba === 'funcionarios' && renderFuncionarios()}
          {aba === 'empreendimentos' &&
            renderEmpreendimentos()}
          {aba === 'garantias' && renderGarantias()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  conteudoScroll: {
    flexGrow: 1,
  },
  conteudo: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 60,
  },
  voltar: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    minHeight: 40,
    gap: 4,
  },
  voltarTexto: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '700',
  },
  tituloPagina: {
    color: '#0B2447',
    fontSize: 27,
    fontWeight: '800',
    marginTop: 14,
  },
  subtitulo: {
    color: '#697789',
    fontSize: 13,
    lineHeight: 20,
    marginTop: 7,
    marginBottom: 20,
  },
  abas: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  aba: {
    flexGrow: 1,
    flexBasis: 160,
    minHeight: 49,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 10,
  },
  abaAtiva: {
    backgroundColor: '#0B2447',
    borderColor: '#0B2447',
  },
  abaTexto: {
    color: '#0B2447',
    fontSize: 11,
    fontWeight: '800',
  },
  abaTextoAtivo: {
    color: '#FFFFFF',
  },
  cabecalhoSecao: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  tituloSecao: {
    color: '#0B2447',
    fontSize: 23,
    fontWeight: '800',
  },
  tituloMenor: {
    color: '#0B2447',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 16,
    marginBottom: 10,
  },
  tituloFormulario: {
    color: '#0B2447',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 12,
  },
  cabecalhoFormulario: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cabecalhoLista: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  cartao: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 15,
    padding: 17,
    marginBottom: 15,
  },
  cartaoDestaque: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#AFC8DF',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    marginBottom: 16,
  },
  formularioInterno: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 16,
  },
  campo: {
    marginBottom: 14,
  },
  label: {
    color: '#24364B',
    fontSize: 11,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    minHeight: 50,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 13,
    color: '#16283D',
    fontSize: 13,
  },
  inputMultiline: {
    minHeight: 90,
    paddingTop: 12,
  },
  inputBusca: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#16283D',
    fontSize: 12,
    marginBottom: 17,
  },
  busca: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    color: '#16283D',
    fontSize: 12,
    marginBottom: 17,
  },
  linhaTopoCliente: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  nomeCliente: {
    color: '#0B2447',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  status: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  statusAtivo: {
    backgroundColor: '#E8F6ED',
  },
  statusPendente: {
    backgroundColor: '#FFF4D8',
  },
  statusTexto: {
    fontSize: 9,
    fontWeight: '800',
  },
  statusAtivoTexto: {
    color: '#287A46',
  },
  statusPendenteTexto: {
    color: '#9A6A00',
  },
  botaoAzul: {
    minHeight: 44,
    borderRadius: 11,
    backgroundColor: '#0B2447',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  botaoAzulTexto: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  botaoSalvar: {
    minHeight: 46,
    borderRadius: 11,
    backgroundColor: '#287A46',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  botaoSalvarTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  botaoContorno: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8C9DA',
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  botaoContornoLargo: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#B8C9DA',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 7,
    marginTop: 15,
  },
  botaoContornoTexto: {
    color: '#0B5EA8',
    fontSize: 11,
    fontWeight: '800',
  },
  botaoAtualizar: {
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  acoesCabecalho: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  botaoExcluir: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2B8B8',
    backgroundColor: '#FFF7F7',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  botaoExcluirTexto: {
    color: '#A52828',
    fontSize: 11,
    fontWeight: '800',
  },
  acoesCliente: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  botaoEditarCliente: {
    flexGrow: 1,
    marginTop: 0,
  },
  botaoExcluirCliente: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2B8B8',
    backgroundColor: '#FFF7F7',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  opcao: {
    minHeight: 57,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  opcaoSelecionada: {
    borderColor: '#0B5EA8',
    backgroundColor: '#EEF4F9',
  },
  opcaoTitulo: {
    color: '#0B2447',
    fontSize: 12,
    fontWeight: '800',
  },
  opcaoDescricao: {
    color: '#697789',
    fontSize: 11,
    marginTop: 4,
  },
  caixaSelecionada: {
    borderWidth: 1,
    borderColor: '#AFC8DF',
    borderRadius: 11,
    backgroundColor: '#EEF4F9',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  acoes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 12,
  },
  textoForte: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },
  textoNormal: {
    color: '#24364B',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },
  textoAuxiliar: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 5,
    marginBottom: 7,
  },
  textoAzul: {
    color: '#0B5EA8',
    fontSize: 12,
    fontWeight: '800',
    marginTop: 8,
  },
  rotulo: {
    color: '#8995A5',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 14,
  },
  selo: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  seloVerde: {
    backgroundColor: '#EAF7EF',
  },
  seloAmarelo: {
    backgroundColor: '#FFF5DC',
  },
  seloTexto: {
    fontSize: 10,
    fontWeight: '800',
  },
  faixaAzul: {
    backgroundColor: '#EEF4F9',
    borderRadius: 10,
    padding: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 7,
  },
  linhaUnidade: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5EAF0',
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cartaoItem: {
    borderWidth: 1,
    borderColor: '#E0E6EE',
    borderRadius: 11,
    backgroundColor: '#F8FAFC',
    padding: 13,
    marginBottom: 10,
  },
  aviso: {
    backgroundColor: '#EAF0F6',
    borderRadius: 13,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginTop: 18,
  },
  avisoTexto: {
    flex: 1,
    color: '#42566D',
    fontSize: 11,
    lineHeight: 18,
  },
  caixaErro: {
    backgroundColor: '#FCEEEE',
    borderWidth: 1,
    borderColor: '#D29A9A',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 16,
  },
  textoErro: {
    flex: 1,
    color: '#9A3232',
    fontSize: 12,
    lineHeight: 18,
  },
  caixaSucesso: {
    backgroundColor: '#EAF7EF',
    borderWidth: 1,
    borderColor: '#A8D8B9',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    marginBottom: 16,
  },
  textoSucesso: {
    flex: 1,
    color: '#287A46',
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  cartaoVazio: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 14,
    padding: 30,
    alignItems: 'center',
  },
  carregamento: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 25,
  },
  desabilitado: {
    opacity: 0.6,
  },
});
