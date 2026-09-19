import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, { Path as SvgPath } from 'react-native-svg';

import { supabase } from '../lib/supabase';

// ============================================================
// TIPOS
// ============================================================

type Solicitacao = {
  solicitacao_id: string;
  protocolo: string;

  cliente_id: string;
  cliente_nome: string;
  cliente_cpf_cnpj: string | null;

  telefone_contato: string | null;
  email_contato: string | null;

  cidade: string | null;
  empreendimento: string;
  unidade: string;
  comodo: string | null;

  descricao_problema: string;
  disponibilidade_visita: string | null;

  categoria: string | null;
  elemento_construtivo: string | null;
  manifestacao_patologica: string | null;

  item_garantia_id: string | null;

  status_garantia: string | null;
  data_base_garantia: string | null;
  data_limite_garantia: string | null;

  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  dias_restantes: number | null;

  aviso_garantia: string | null;

  status: string;

  quantidade_fotos: number;

  created_at: string;
  updated_at: string;
};

type FotoSolicitacao = {
  id: string;
  solicitacao_id: string;
  caminho_storage: string;
  nome_arquivo: string | null;
  tipo_mime: string | null;
  ordem: number | null;
  url: string;
};

type ItemGarantia = {
  item_garantia_id: string;
  categoria: string;
  elemento_construtivo: string;
  manifestacao_patologica: string;
  tipo_prazo: string;
  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  regra_data_base: string | null;
  observacao: string | null;
  ordem_exibicao: number | null;
};

type ResultadoGarantia = {
  item_garantia_id: string;
  categoria: string;
  elemento_construtivo: string;
  manifestacao_patologica: string;
  regra_data_base: string | null;
  data_base: string | null;
  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  data_limite_garantia: string | null;
  status_garantia: string | null;
  dias_restantes: number | null;
  aviso: string | null;
};

type AgendamentoVistoria = {
  data_vistoria: string | null;
  hora_vistoria: string | null;
  observacao_vistoria: string | null;
  responsavel_vistoria_id: string | null;
  responsavel_vistoria_nome: string | null;
};

type VistoriaTecnica = {
  vistoria_id: string;
  solicitacao_id: string;
  protocolo: string;
  status: string;
  funcionario_id: string;
  funcionario_nome: string;
  problema_constatado: boolean | null;
  parecer_tecnico: string | null;
  servico_necessario: string | null;
  observacoes: string | null;
  iniciada_em: string;
  finalizada_em: string | null;
};

type FotoVistoriaSalva = {
  id: string;
  vistoria_id: string;
  caminho_storage: string;
  nome_arquivo: string | null;
  descricao: string | null;
  created_at: string;
  url: string;
};

type ExecucaoServico = {
  execucao_id: string;
  solicitacao_id: string;
  numero_termo: number | null;
  status?: string;
  responsavel_servico_id: string | null;
  responsavel_servico_nome: string | null;
  solucao_tecnica?: string | null;
  observacoes?: string | null;
  conclusao?: string | null;
  iniciada_em: string | null;
  concluida_em?: string | null;
};

type FotoExecucaoSalva = {
  id: string;
  execucao_id: string;
  caminho_storage: string;
  nome_arquivo: string | null;
  descricao: string | null;
  created_at: string;
  url: string;
};

type EstadoAssinaturasForm03 = {
  modo_assinatura:
    | 'manual_app'
    | 'externa_pdf'
    | null;

  status: string;

  assinatura_cliente_svg: string | null;
  assinatura_cliente_nome: string | null;
  assinado_cliente_em: string | null;

  assinatura_funcionario_svg: string | null;
  assinatura_funcionario_nome: string | null;
  assinado_funcionario_em: string | null;
};

type DadosForm03 = {
  form03_id: string | null;
  form03_status: string | null;

  solicitacao_id: string;
  protocolo: string;
  data_reclamacao: string;

  cliente_id: string;
  solicitante: string;
  telefone: string | null;
  email: string | null;
  disponibilidade: string | null;

  empreendimento: string;
  unidade: string;
  comodo: string | null;

  problema_relatado: string;

  categoria: string | null;
  elemento_construtivo: string | null;
  manifestacao_patologica: string | null;
  status_garantia: string | null;
  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  data_limite_garantia: string | null;

  vistoria_id: string | null;
  responsavel_vistoria: string | null;
  inicio_vistoria: string | null;
  fim_vistoria: string | null;
  problema_constatado: boolean | null;
  parecer_tecnico: string | null;
  servico_necessario: string | null;
  observacoes_vistoria: string | null;
  resultado_vistoria: string | null;

  execucao_id: string | null;
  numero_termo: number | null;
  responsavel_servico: string | null;
  inicio_execucao: string | null;
  data_conclusao: string | null;
  conclusao: string | null;
  solucao_tecnica: string | null;
  observacoes_execucao: string | null;

  fotos_vistoria: any[];
  fotos_execucao: any[];
};

// ============================================================
// TELA
// ============================================================

export default function DetalhesSolicitacaoFuncionarioScreen() {
  const params = useLocalSearchParams();

  const solicitacaoId = String(
    params.solicitacaoId ?? ''
  );

  // ==========================================================
  // SOLICITAÇÃO
  // ==========================================================

  const [
    solicitacao,
    setSolicitacao,
  ] = useState<Solicitacao | null>(null);

  // ==========================================================
  // FOTOS
  // ==========================================================

  const [
    fotos,
    setFotos,
  ] = useState<FotoSolicitacao[]>([]);

  const [
    fotoSelecionada,
    setFotoSelecionada,
  ] = useState<FotoSolicitacao | null>(null);

  // ==========================================================
  // GARANTIA
  // ==========================================================

  const [
    itensGarantia,
    setItensGarantia,
  ] = useState<ItemGarantia[]>([]);

  const [
    categoriaSelecionada,
    setCategoriaSelecionada,
  ] = useState('');

  const [
    elementoSelecionado,
    setElementoSelecionado,
  ] = useState('');

  const [
    itemSelecionadoId,
    setItemSelecionadoId,
  ] = useState('');

  const [
    resultadoGarantia,
    setResultadoGarantia,
  ] = useState<ResultadoGarantia | null>(null);

  // ==========================================================
  // VISTORIA
  // ==========================================================

  const [
    agendamento,
    setAgendamento,
  ] = useState<AgendamentoVistoria | null>(null);

  const [
    dataVistoria,
    setDataVistoria,
  ] = useState('');

  const [
    horaVistoria,
    setHoraVistoria,
  ] = useState('');

  const [
    observacaoVistoria,
    setObservacaoVistoria,
  ] = useState('');

  const [
    salvandoVistoria,
    setSalvandoVistoria,
  ] = useState(false);

  const [
    erroVistoria,
    setErroVistoria,
  ] = useState('');

  const [
    sucessoVistoria,
    setSucessoVistoria,
  ] = useState('');

  const [
    iniciandoVistoria,
    setIniciandoVistoria,
  ] = useState(false);

  const [
    erroInicioVistoria,
    setErroInicioVistoria,
  ] = useState('');

  const [
    vistoriaTecnica,
    setVistoriaTecnica,
  ] = useState<VistoriaTecnica | null>(null);

  const [
    problemaConstatado,
    setProblemaConstatado,
  ] = useState<boolean | null>(null);

  const [
    parecerTecnico,
    setParecerTecnico,
  ] = useState('');

  const [
    servicoNecessario,
    setServicoNecessario,
  ] = useState('');

  const [
    observacoesTecnicas,
    setObservacoesTecnicas,
  ] = useState('');

  const [
    salvandoFormularioVistoria,
    setSalvandoFormularioVistoria,
  ] = useState(false);

  const [
    erroFormularioVistoria,
    setErroFormularioVistoria,
  ] = useState('');

  const [
    sucessoFormularioVistoria,
    setSucessoFormularioVistoria,
  ] = useState('');

  const [
    fotosVistoriaPendentes,
    setFotosVistoriaPendentes,
  ] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const [
    fotosVistoriaSalvas,
    setFotosVistoriaSalvas,
  ] = useState<FotoVistoriaSalva[]>(
    []
  );

  const [
    carregandoFotosVistoria,
    setCarregandoFotosVistoria,
  ] = useState(false);

  const [
    resultadoVistoria,
    setResultadoVistoria,
  ] = useState<
    'aprovada' |
    'nao_aprovada' |
    null
  >(null);

  const [
    justificativaResultado,
    setJustificativaResultado,
  ] = useState('');

  const [
    finalizandoVistoria,
    setFinalizandoVistoria,
  ] = useState(false);

  const [
    erroFinalizacaoVistoria,
    setErroFinalizacaoVistoria,
  ] = useState('');

  const [
    sucessoFinalizacaoVistoria,
    setSucessoFinalizacaoVistoria,
  ] = useState('');

  // ==========================================================
  // EXECUÇÃO DO SERVIÇO
  // ==========================================================

  const [
    execucaoServico,
    setExecucaoServico,
  ] = useState<ExecucaoServico | null>(null);

  const [
    iniciandoExecucao,
    setIniciandoExecucao,
  ] = useState(false);

  const [
    erroExecucao,
    setErroExecucao,
  ] = useState('');

  const [
    sucessoExecucao,
    setSucessoExecucao,
  ] = useState('');

  const [
    solucaoTecnicaExecucao,
    setSolucaoTecnicaExecucao,
  ] = useState('');

  const [
    observacoesExecucao,
    setObservacoesExecucao,
  ] = useState('');

  const [
    salvandoExecucao,
    setSalvandoExecucao,
  ] = useState(false);

  const [
    erroFormularioExecucao,
    setErroFormularioExecucao,
  ] = useState('');

  const [
    sucessoFormularioExecucao,
    setSucessoFormularioExecucao,
  ] = useState('');

  const [
    fotosExecucaoPendentes,
    setFotosExecucaoPendentes,
  ] = useState<
    ImagePicker.ImagePickerAsset[]
  >([]);

  const [
    fotosExecucaoSalvas,
    setFotosExecucaoSalvas,
  ] = useState<FotoExecucaoSalva[]>(
    []
  );

  const [
    carregandoFotosExecucao,
    setCarregandoFotosExecucao,
  ] = useState(false);

  const [
    conclusaoExecucao,
    setConclusaoExecucao,
  ] = useState<
    'total' |
    'improcedente' |
    null
  >(null);

  const [
    finalizandoExecucao,
    setFinalizandoExecucao,
  ] = useState(false);

  const [
    erroFinalizacaoExecucao,
    setErroFinalizacaoExecucao,
  ] = useState('');

  const [
    sucessoFinalizacaoExecucao,
    setSucessoFinalizacaoExecucao,
  ] = useState('');

  const [
    dadosForm03,
    setDadosForm03,
  ] = useState<DadosForm03 | null>(null);

  const [
    carregandoForm03,
    setCarregandoForm03,
  ] = useState(false);

  const [
    erroForm03,
    setErroForm03,
  ] = useState('');

  const [
    gerandoPdfForm03,
    setGerandoPdfForm03,
  ] = useState(false);

  const [
    pdfForm03Gerado,
    setPdfForm03Gerado,
  ] = useState(false);

  const [
    pdfForm03Uri,
    setPdfForm03Uri,
  ] = useState<string | null>(null);

  const [
    modoAssinaturaForm03,
    setModoAssinaturaForm03,
  ] = useState<
    'manual_app' |
    'externa_pdf' |
    null
  >(null);

  const [
    definindoModoAssinatura,
    setDefinindoModoAssinatura,
  ] = useState(false);

  const [
    mensagemAssinaturaForm03,
    setMensagemAssinaturaForm03,
  ] = useState('');

  const [
    estadoAssinaturasForm03,
    setEstadoAssinaturasForm03,
  ] =
    useState<EstadoAssinaturasForm03 | null>(
      null
    );

  const [
    salvandoAssinaturaManual,
    setSalvandoAssinaturaManual,
  ] = useState<
    'cliente' |
    'funcionario' |
    null
  >(null);

  // ==========================================================
  // ESTADOS GERAIS
  // ==========================================================

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    autorizado,
    setAutorizado,
  ] = useState(false);

  const [
    carregandoFotos,
    setCarregandoFotos,
  ] = useState(false);

  const [
    carregandoItens,
    setCarregandoItens,
  ] = useState(false);

  const [
    calculando,
    setCalculando,
  ] = useState(false);

  const [
    confirmando,
    setConfirmando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState('');

  const [
    erroFotos,
    setErroFotos,
  ] = useState('');

  const [
    erroAnalise,
    setErroAnalise,
  ] = useState('');

  const [
    sucessoAnalise,
    setSucessoAnalise,
  ] = useState('');

  // ==========================================================
  // INICIALIZAÇÃO
  // ==========================================================

  useEffect(() => {
    iniciarTela();
  }, [solicitacaoId]);

  async function iniciarTela() {
    if (!solicitacaoId) {
      setErro(
        'Não foi possível identificar a solicitação.'
      );

      setCarregando(false);

      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const permitido =
        await verificarAcesso();

      if (!permitido) {
        return;
      }

      const dadosSolicitacao =
        await carregarSolicitacao();

      const itens =
        await carregarItensGarantia();

      await carregarFotos();

      await carregarAgendamentoVistoria();

      await carregarVistoriaTecnica();

      await carregarExecucaoServico();

      // ======================================================
      // SE JÁ EXISTIR ANÁLISE TÉCNICA
      // ======================================================

      if (
        dadosSolicitacao &&
        dadosSolicitacao.item_garantia_id
      ) {
        setCategoriaSelecionada(
          dadosSolicitacao.categoria ?? ''
        );

        setElementoSelecionado(
          dadosSolicitacao.elemento_construtivo ??
            ''
        );

        setItemSelecionadoId(
          dadosSolicitacao.item_garantia_id
        );

        setResultadoGarantia({
          item_garantia_id:
            dadosSolicitacao.item_garantia_id,

          categoria:
            dadosSolicitacao.categoria ?? '',

          elemento_construtivo:
            dadosSolicitacao.elemento_construtivo ??
            '',

          manifestacao_patologica:
            dadosSolicitacao.manifestacao_patologica ??
            '',

          regra_data_base:
            itens.find(
              (item) =>
                item.item_garantia_id ===
                dadosSolicitacao.item_garantia_id
            )?.regra_data_base ?? null,

          data_base:
            dadosSolicitacao.data_base_garantia,

          prazo_quantidade:
            dadosSolicitacao.prazo_quantidade,

          prazo_unidade:
            dadosSolicitacao.prazo_unidade,

          data_limite_garantia:
            dadosSolicitacao.data_limite_garantia,

          status_garantia:
            dadosSolicitacao.status_garantia,

          dias_restantes:
            dadosSolicitacao.dias_restantes,

          aviso:
            dadosSolicitacao.aviso_garantia,
        });
      }
    } catch (error) {
      console.error(
        'Erro ao iniciar tela:',
        error
      );

      setErro(
        'Não foi possível carregar a solicitação.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // ACESSO
  // ==========================================================

  async function verificarAcesso() {
    try {
      const {
        data: usuarioData,
        error: usuarioError,
      } = await supabase.auth.getUser();

      if (
        usuarioError ||
        !usuarioData.user
      ) {
        router.replace(
          '/login-funcionario'
        );

        return false;
      }

      const {
        data: ehFuncionario,
        error,
      } = await supabase.rpc(
        'sou_funcionario'
      );

      if (
        error ||
        ehFuncionario !== true
      ) {
        await supabase.auth.signOut();

        router.replace(
          '/login-funcionario'
        );

        return false;
      }

      setAutorizado(true);

      return true;
    } catch (error) {
      console.error(
        'Erro ao verificar funcionário:',
        error
      );

      await supabase.auth.signOut();

      router.replace(
        '/login-funcionario'
      );

      return false;
    }
  }

  // ==========================================================
  // CARREGAR SOLICITAÇÃO
  // ==========================================================

  async function carregarSolicitacao() {
    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_solicitacao_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar solicitação:',
          error
        );

        setErro(
          'Não foi possível carregar os dados do chamado.'
        );

        return null;
      }

      const resultado =
        data?.[0] as
          | Solicitacao
          | undefined;

      if (!resultado) {
        setErro(
          'Solicitação não encontrada.'
        );

        return null;
      }

      const dados = {
        ...resultado,

        quantidade_fotos:
          Number(
            resultado.quantidade_fotos
          ) || 0,
      };

      setSolicitacao(dados);

      return dados;
    } catch (error) {
      console.error(
        'Erro ao carregar solicitação:',
        error
      );

      return null;
    }
  }

  // ==========================================================
  // ITENS DE GARANTIA
  // ==========================================================

  async function carregarItensGarantia() {
    try {
      setCarregandoItens(true);
      setErroAnalise('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'listar_itens_garantia_solicitacao',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao carregar itens:',
          error
        );

        setErroAnalise(
          'Não foi possível carregar os itens de garantia desta unidade.'
        );

        return [];
      }

      const itens =
        (data ?? []) as ItemGarantia[];

      setItensGarantia(itens);

      return itens;
    } catch (error) {
      console.error(
        'Erro ao carregar garantia:',
        error
      );

      return [];
    } finally {
      setCarregandoItens(false);
    }
  }

  // ==========================================================
  // FOTOS
  // ==========================================================

  async function carregarFotos() {
    try {
      setCarregandoFotos(true);
      setErroFotos('');

      const {
        data,
        error,
      } = await supabase
        .from('solicitacao_fotos')
        .select(`
          id,
          solicitacao_id,
          caminho_storage,
          nome_arquivo,
          tipo_mime,
          ordem
        `)
        .eq(
          'solicitacao_id',
          solicitacaoId
        )
        .order(
          'ordem',
          {
            ascending: true,
          }
        );

      if (error) {
        setErroFotos(
          'Não foi possível carregar as fotos do chamado.'
        );

        return;
      }

      const registros =
        data ?? [];

      const fotosComUrl:
        FotoSolicitacao[] = [];

      for (const foto of registros) {
        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from('solicitacoes-fotos')
          .createSignedUrl(
            foto.caminho_storage,
            60 * 60
          );

        if (signedError) {
          continue;
        }

        fotosComUrl.push({
          ...foto,
          url: signedData.signedUrl,
        });
      }

      setFotos(fotosComUrl);
    } catch (error) {
      console.error(
        'Erro ao carregar fotos:',
        error
      );

      setErroFotos(
        'Ocorreu um erro ao carregar as fotos.'
      );
    } finally {
      setCarregandoFotos(false);
    }
  }

  // ==========================================================
  // CARREGAR AGENDAMENTO
  // ==========================================================

  async function carregarAgendamentoVistoria() {
    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_agendamento_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar agendamento:',
          error
        );

        return null;
      }

      const registro =
        data?.[0] as
          | AgendamentoVistoria
          | undefined;

      if (
        !registro ||
        !registro.data_vistoria
      ) {
        setAgendamento(null);

        return null;
      }

      setAgendamento(registro);

      setDataVistoria(
        formatarData(
          registro.data_vistoria
        )
      );

      setHoraVistoria(
        registro.hora_vistoria
          ? registro.hora_vistoria.substring(
              0,
              5
            )
          : ''
      );

      setObservacaoVistoria(
        registro.observacao_vistoria ??
          ''
      );

      return registro;
    } catch (error) {
      console.error(
        'Erro ao carregar agendamento:',
        error
      );

      return null;
    }
  }

  // ==========================================================
  // CARREGAR FICHA TÉCNICA DA VISTORIA
  // ==========================================================

  async function carregarVistoriaTecnica() {
    try {
      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar ficha da vistoria:',
          error
        );

        return null;
      }

      const registro =
        data?.[0] as
          | VistoriaTecnica
          | undefined;

      if (!registro) {
        setVistoriaTecnica(null);
        setFotosVistoriaSalvas([]);

        return null;
      }

      setVistoriaTecnica(
        registro
      );

      setProblemaConstatado(
        registro.problema_constatado ??
          null
      );

      setParecerTecnico(
        registro.parecer_tecnico ??
          ''
      );

      setServicoNecessario(
        registro.servico_necessario ??
          ''
      );

      setObservacoesTecnicas(
        registro.observacoes ??
          ''
      );

      await carregarFotosVistoria(
        registro.vistoria_id
      );

      return registro;
    } catch (error) {
      console.error(
        'Erro ao carregar ficha da vistoria:',
        error
      );

      return null;
    }
  }

  // ==========================================================
  // CASCATA DA ANÁLISE
  // ==========================================================

  const categorias =
    useMemo(() => {
      return Array.from(
        new Set(
          itensGarantia
            .map(
              (item) =>
                item.categoria
            )
            .filter(Boolean)
        )
      );
    }, [itensGarantia]);

  const elementos =
    useMemo(() => {
      if (!categoriaSelecionada) {
        return [];
      }

      return Array.from(
        new Set(
          itensGarantia
            .filter(
              (item) =>
                item.categoria ===
                categoriaSelecionada
            )
            .map(
              (item) =>
                item.elemento_construtivo
            )
        )
      );
    }, [
      itensGarantia,
      categoriaSelecionada,
    ]);

  const problemas =
    useMemo(() => {
      if (
        !categoriaSelecionada ||
        !elementoSelecionado
      ) {
        return [];
      }

      return itensGarantia.filter(
        (item) =>
          item.categoria ===
            categoriaSelecionada &&
          item.elemento_construtivo ===
            elementoSelecionado
      );
    }, [
      itensGarantia,
      categoriaSelecionada,
      elementoSelecionado,
    ]);

  // ==========================================================
  // ANÁLISE JÁ CONFIRMADA
  // ==========================================================

  const analiseConfirmada =
    !!solicitacao?.item_garantia_id &&
    solicitacao?.status !== 'aberta';

  const dentroDaGarantia =
    solicitacao?.status_garantia ===
      'dentro_garantia' ||
    solicitacao?.status_garantia ===
      'dentro_da_garantia';

  const foraDaGarantia =
    analiseConfirmada &&
    !dentroDaGarantia;

  // ==========================================================
  // SELEÇÕES
  // ==========================================================

  function selecionarCategoria(
    categoria: string
  ) {
    if (analiseConfirmada) {
      return;
    }

    setCategoriaSelecionada(
      categoria
    );

    setElementoSelecionado('');
    setItemSelecionadoId('');
    setResultadoGarantia(null);
    setErroAnalise('');
    setSucessoAnalise('');
  }

  function selecionarElemento(
    elemento: string
  ) {
    if (analiseConfirmada) {
      return;
    }

    setElementoSelecionado(
      elemento
    );

    setItemSelecionadoId('');
    setResultadoGarantia(null);
    setErroAnalise('');
    setSucessoAnalise('');
  }

  function selecionarProblema(
    itemId: string
  ) {
    if (analiseConfirmada) {
      return;
    }

    setItemSelecionadoId(
      itemId
    );

    setResultadoGarantia(null);
    setErroAnalise('');
    setSucessoAnalise('');
  }

  // ==========================================================
  // CALCULAR GARANTIA
  // ==========================================================

  async function calcularGarantia() {
    if (analiseConfirmada) {
      return;
    }

    if (!itemSelecionadoId) {
      setErroAnalise(
        'Selecione o problema técnico antes de calcular a garantia.'
      );

      return;
    }

    try {
      setCalculando(true);
      setErroAnalise('');
      setSucessoAnalise('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'calcular_garantia_solicitacao_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_item_garantia_id:
            itemSelecionadoId,
        }
      );

      if (error) {
        setErroAnalise(
          error.message
        );

        return;
      }

      const resultado =
        data?.[0] as
          | ResultadoGarantia
          | undefined;

      if (!resultado) {
        setErroAnalise(
          'Não foi possível obter o resultado.'
        );

        return;
      }

      setResultadoGarantia({
        ...resultado,

        prazo_quantidade:
          resultado.prazo_quantidade !==
          null
            ? Number(
                resultado.prazo_quantidade
              )
            : null,

        dias_restantes:
          resultado.dias_restantes !==
          null
            ? Number(
                resultado.dias_restantes
              )
            : null,
      });
    } catch (error) {
      console.error(
        'Erro ao calcular garantia:',
        error
      );

      setErroAnalise(
        'Ocorreu um erro ao calcular a garantia.'
      );
    } finally {
      setCalculando(false);
    }
  }

  // ==========================================================
  // CONFIRMAR ANÁLISE
  // ==========================================================

  async function confirmarAnalise() {
    if (analiseConfirmada) {
      return;
    }

    if (!itemSelecionadoId) {
      setErroAnalise(
        'Selecione o problema técnico.'
      );

      return;
    }

    if (!resultadoGarantia) {
      setErroAnalise(
        'Calcule a garantia antes de confirmar a análise.'
      );

      return;
    }

    try {
      setConfirmando(true);
      setErroAnalise('');
      setSucessoAnalise('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'confirmar_analise_solicitacao_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_item_garantia_id:
            itemSelecionadoId,
        }
      );

      if (error) {
        setErroAnalise(
          error.message
        );

        return;
      }

      if (!data?.length) {
        setErroAnalise(
          'A análise não pôde ser confirmada.'
        );

        return;
      }

      setSucessoAnalise(
        'Análise técnica confirmada com sucesso.'
      );

      await carregarSolicitacao();
    } catch (error) {
      console.error(
        'Erro ao confirmar análise:',
        error
      );

      setErroAnalise(
        'Ocorreu um erro ao confirmar a análise.'
      );
    } finally {
      setConfirmando(false);
    }
  }

  // ==========================================================
  // MÁSCARA DATA
  // ==========================================================

  function alterarDataVistoria(
    texto: string
  ) {
    let valor =
      texto.replace(
        /\D/g,
        ''
      );

    valor =
      valor.substring(0, 8);

    if (valor.length > 4) {
      valor =
        `${valor.substring(
          0,
          2
        )}/${valor.substring(
          2,
          4
        )}/${valor.substring(4)}`;
    } else if (
      valor.length > 2
    ) {
      valor =
        `${valor.substring(
          0,
          2
        )}/${valor.substring(2)}`;
    }

    setDataVistoria(valor);

    setErroVistoria('');
    setSucessoVistoria('');
  }

  // ==========================================================
  // MÁSCARA HORÁRIO
  // ==========================================================

  function alterarHoraVistoria(
    texto: string
  ) {
    let valor =
      texto.replace(
        /\D/g,
        ''
      );

    valor =
      valor.substring(0, 4);

    if (valor.length > 2) {
      valor =
        `${valor.substring(
          0,
          2
        )}:${valor.substring(2)}`;
    }

    setHoraVistoria(valor);

    setErroVistoria('');
    setSucessoVistoria('');
  }

  // ==========================================================
  // CONVERTER DATA PARA ISO
  // ==========================================================

  function converterDataParaISO(
    valor: string
  ) {
    const partes =
      valor.split('/');

    if (
      partes.length !== 3
    ) {
      return null;
    }

    const dia =
      Number(partes[0]);

    const mes =
      Number(partes[1]);

    const ano =
      Number(partes[2]);

    if (
      !dia ||
      !mes ||
      !ano
    ) {
      return null;
    }

    const data =
      new Date(
        ano,
        mes - 1,
        dia
      );

    if (
      data.getFullYear() !== ano ||
      data.getMonth() !== mes - 1 ||
      data.getDate() !== dia
    ) {
      return null;
    }

    const mesTexto =
      String(mes).padStart(
        2,
        '0'
      );

    const diaTexto =
      String(dia).padStart(
        2,
        '0'
      );

    return `${ano}-${mesTexto}-${diaTexto}`;
  }

  // ==========================================================
  // VALIDAR HORA
  // ==========================================================

  function horaValida(
    valor: string
  ) {
    const regex =
      /^([01]\d|2[0-3]):([0-5]\d)$/;

    return regex.test(valor);
  }

  // ==========================================================
  // AGENDAR / REAGENDAR
  // ==========================================================

  async function salvarAgendamentoVistoria() {
    setErroVistoria('');
    setSucessoVistoria('');

    if (!analiseConfirmada) {
      setErroVistoria(
        'Confirme a análise técnica antes de agendar a vistoria.'
      );

      return;
    }

    const dataISO =
      converterDataParaISO(
        dataVistoria
      );

    if (!dataISO) {
      setErroVistoria(
        'Informe uma data válida no formato DD/MM/AAAA.'
      );

      return;
    }

    if (
      !horaValida(
        horaVistoria
      )
    ) {
      setErroVistoria(
        'Informe um horário válido no formato HH:MM.'
      );

      return;
    }

    try {
      setSalvandoVistoria(true);

      const {
        data,
        error,
      } = await supabase.rpc(
        'agendar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_data_vistoria:
            dataISO,

          p_hora_vistoria:
            `${horaVistoria}:00`,

          p_observacao_vistoria:
            observacaoVistoria.trim() ||
            null,
        }
      );

      if (error) {
        console.error(
          'Erro ao agendar vistoria:',
          error
        );

        setErroVistoria(
          error.message ||
            'Não foi possível agendar a vistoria.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroVistoria(
          'Não foi possível salvar o agendamento.'
        );

        return;
      }

      setSucessoVistoria(
        agendamento
          ? 'Vistoria reagendada com sucesso.'
          : 'Vistoria agendada com sucesso.'
      );

      await carregarSolicitacao();

      await carregarAgendamentoVistoria();
    } catch (error) {
      console.error(
        'Erro ao salvar vistoria:',
        error
      );

      setErroVistoria(
        'Ocorreu um erro ao salvar o agendamento.'
      );
    } finally {
      setSalvandoVistoria(false);
    }
  }

  // ==========================================================
  // INICIAR VISTORIA
  // ==========================================================

  async function iniciarVistoria() {
    if (!solicitacao) {
      return;
    }

    try {
      setIniciandoVistoria(true);
      setErroInicioVistoria('');
      setErroVistoria('');
      setSucessoVistoria('');
      setErroFormularioVistoria('');
      setSucessoFormularioVistoria('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'iniciar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao iniciar vistoria:',
          error
        );

        setErroInicioVistoria(
          error.message ||
            'Não foi possível iniciar a vistoria.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroInicioVistoria(
          'Não foi possível iniciar a vistoria.'
        );

        return;
      }

      await carregarSolicitacao();

      await carregarVistoriaTecnica();
    } catch (error) {
      console.error(
        'Erro ao iniciar vistoria:',
        error
      );

      setErroInicioVistoria(
        'Ocorreu um erro ao iniciar a vistoria.'
      );
    } finally {
      setIniciandoVistoria(false);
    }
  }

  // ==========================================================
  // FOTOS DA VISTORIA
  // ==========================================================

  async function carregarFotosVistoria(
    vistoriaId?: string
  ) {
    const id =
      vistoriaId ??
      vistoriaTecnica?.vistoria_id;

    if (!id) {
      setFotosVistoriaSalvas([]);
      return;
    }

    try {
      setCarregandoFotosVistoria(
        true
      );

      const {
        data,
        error,
      } = await supabase
        .from('vistoria_fotos')
        .select(
          'id, vistoria_id, caminho_storage, nome_arquivo, descricao, created_at'
        )
        .eq(
          'vistoria_id',
          id
        )
        .order(
          'created_at',
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          'Erro ao carregar fotos da vistoria:',
          error
        );

        return;
      }

      const fotosComUrl =
        await Promise.all(
          (data ?? []).map(
            async (foto: any) => {
              const {
                data: signedData,
                error:
                  signedError,
              } =
                await supabase.storage
                  .from(
                    'vistorias-fotos'
                  )
                  .createSignedUrl(
                    foto.caminho_storage,
                    60 * 60
                  );

              if (signedError) {
                console.error(
                  'Erro ao gerar URL da foto:',
                  signedError
                );
              }

              return {
                ...foto,
                url:
                  signedData
                    ?.signedUrl ??
                  '',
              } as FotoVistoriaSalva;
            }
          )
        );

      setFotosVistoriaSalvas(
        fotosComUrl
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar fotos da vistoria:',
        error
      );
    } finally {
      setCarregandoFotosVistoria(
        false
      );
    }
  }

  async function selecionarFotosVistoria() {
    setErroFormularioVistoria('');
    setSucessoFormularioVistoria('');

    const quantidadeAtual =
      fotosVistoriaPendentes.length +
      fotosVistoriaSalvas.length;

    if (quantidadeAtual >= 10) {
      setErroFormularioVistoria(
        'A vistoria pode ter no máximo 10 fotos.'
      );

      return;
    }

    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsMultipleSelection:
              true,

            selectionLimit:
              10 -
              quantidadeAtual,

            quality: 0.8,
          }
        );

      if (
        resultado.canceled
      ) {
        return;
      }

      const disponiveis =
        10 -
        quantidadeAtual;

      setFotosVistoriaPendentes(
        (
          atuais
        ) => [
          ...atuais,
          ...resultado.assets.slice(
            0,
            disponiveis
          ),
        ]
      );
    } catch (error) {
      console.error(
        'Erro ao selecionar fotos:',
        error
      );

      setErroFormularioVistoria(
        'Não foi possível selecionar as fotos.'
      );
    }
  }

  function removerFotoVistoriaPendente(
    uri: string
  ) {
    setFotosVistoriaPendentes(
      (atuais) =>
        atuais.filter(
          (foto) =>
            foto.uri !== uri
        )
    );
  }

  function extensaoFoto(
    foto: ImagePicker.ImagePickerAsset
  ) {
    const nome =
      foto.fileName ?? '';

    const extensaoNome =
      nome.includes('.')
        ? nome
            .split('.')
            .pop()
            ?.toLowerCase()
        : null;

    if (extensaoNome) {
      return extensaoNome;
    }

    const mime =
      foto.mimeType ?? '';

    if (
      mime.includes('png')
    ) {
      return 'png';
    }

    if (
      mime.includes('webp')
    ) {
      return 'webp';
    }

    return 'jpg';
  }

  async function enviarFotosVistoria() {
    if (
      fotosVistoriaPendentes.length ===
      0
    ) {
      return true;
    }

    if (!vistoriaTecnica) {
      setErroFormularioVistoria(
        'A ficha da vistoria ainda não foi carregada.'
      );

      return false;
    }

    const {
      data: usuarioData,
      error: usuarioError,
    } =
      await supabase.auth
        .getUser();

    if (
      usuarioError ||
      !usuarioData.user
    ) {
      setErroFormularioVistoria(
        'Não foi possível identificar o funcionário.'
      );

      return false;
    }

    let pendentesRestantes = [
      ...fotosVistoriaPendentes,
    ];

    for (
      let indice = 0;
      indice <
      fotosVistoriaPendentes.length;
      indice++
    ) {
      const foto =
        fotosVistoriaPendentes[
          indice
        ];

      try {
        const resposta =
          await fetch(
            foto.uri
          );

        const blob =
          await resposta.blob();

        const extensao =
          extensaoFoto(
            foto
          );

        const nomeArquivo =
          foto.fileName ??
          `vistoria-${Date.now()}-${indice}.${extensao}`;

        const caminho =
          `${vistoriaTecnica.vistoria_id}/${usuarioData.user.id}/${Date.now()}-${indice}.${extensao}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              'vistorias-fotos'
            )
            .upload(
              caminho,
              blob,
              {
                contentType:
                  foto.mimeType ??
                  `image/${extensao === 'jpg' ? 'jpeg' : extensao}`,

                upsert: false,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              'vistoria_fotos'
            )
            .insert({
              vistoria_id:
                vistoriaTecnica.vistoria_id,

              caminho_storage:
                caminho,

              nome_arquivo:
                nomeArquivo,

              funcionario_id:
                usuarioData.user.id,
            });

        if (insertError) {
          await supabase.storage
            .from(
              'vistorias-fotos'
            )
            .remove([
              caminho,
            ]);

          throw insertError;
        }

        pendentesRestantes =
          pendentesRestantes.filter(
            (item) =>
              item.uri !==
              foto.uri
          );

        setFotosVistoriaPendentes(
          pendentesRestantes
        );
      } catch (error: any) {
        console.error(
          'Erro ao enviar foto da vistoria:',
          error
        );

        setErroFormularioVistoria(
          error?.message ??
            'Não foi possível enviar uma das fotos da vistoria.'
        );

        await carregarFotosVistoria(
          vistoriaTecnica.vistoria_id
        );

        return false;
      }
    }

    await carregarFotosVistoria(
      vistoriaTecnica.vistoria_id
    );

    return true;
  }

  // ==========================================================
  // SALVAR FORMULÁRIO DA VISTORIA
  // ==========================================================

  async function salvarFormularioVistoria() {
    setErroFormularioVistoria('');
    setSucessoFormularioVistoria('');

    if (
      problemaConstatado ===
      null
    ) {
      setErroFormularioVistoria(
        'Informe se o problema relatado foi constatado.'
      );

      return;
    }

    if (
      !parecerTecnico.trim()
    ) {
      setErroFormularioVistoria(
        'Informe o parecer técnico da vistoria.'
      );

      return;
    }

    try {
      setSalvandoFormularioVistoria(
        true
      );

      const {
        data,
        error,
      } = await supabase.rpc(
        'salvar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_problema_constatado:
            problemaConstatado,

          p_parecer_tecnico:
            parecerTecnico.trim(),

          p_servico_necessario:
            servicoNecessario.trim() ||
            null,

          p_observacoes:
            observacoesTecnicas.trim() ||
            null,
        }
      );

      if (error) {
        console.error(
          'Erro ao salvar vistoria:',
          error
        );

        setErroFormularioVistoria(
          error.message ||
            'Não foi possível salvar a vistoria.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroFormularioVistoria(
          'Não foi possível salvar os dados da vistoria.'
        );

        return;
      }

      const fotosEnviadas =
        await enviarFotosVistoria();

      if (!fotosEnviadas) {
        return;
      }

      setSucessoFormularioVistoria(
        fotosVistoriaPendentes.length >
        0
          ? 'Dados e fotos da vistoria salvos com sucesso.'
          : 'Dados da vistoria salvos com sucesso.'
      );

      await carregarVistoriaTecnica();
    } catch (error) {
      console.error(
        'Erro inesperado ao salvar vistoria:',
        error
      );

      setErroFormularioVistoria(
        'Ocorreu um erro ao salvar os dados da vistoria.'
      );
    } finally {
      setSalvandoFormularioVistoria(
        false
      );
    }
  }

  // ==========================================================
  // EXECUÇÃO DO SERVIÇO
  // ==========================================================

  async function carregarExecucaoServico() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from('execucoes_servico')
        .select(
          'id, solicitacao_id, numero_termo, responsavel_servico_id, solucao_tecnica, observacoes, conclusao, iniciada_em, concluida_em'
        )
        .eq(
          'solicitacao_id',
          solicitacaoId
        )
        .maybeSingle();

      if (error) {
        console.error(
          'Erro ao carregar execução do serviço:',
          error
        );

        return null;
      }

      if (!data) {
        setExecucaoServico(null);
        setSolucaoTecnicaExecucao('');
        setObservacoesExecucao('');
        setFotosExecucaoSalvas([]);
        return null;
      }

      let responsavelNome: string | null = null;

      if (data.responsavel_servico_id) {
        const {
          data: perfil,
        } = await supabase
          .from('profiles')
          .select('nome_completo')
          .eq(
            'id',
            data.responsavel_servico_id
          )
          .maybeSingle();

        responsavelNome =
          perfil?.nome_completo ??
          null;
      }

      const registro: ExecucaoServico = {
        execucao_id: data.id,
        solicitacao_id:
          data.solicitacao_id,
        numero_termo:
          data.numero_termo,
        responsavel_servico_id:
          data.responsavel_servico_id,
        responsavel_servico_nome:
          responsavelNome,
        solucao_tecnica:
          data.solucao_tecnica,
        observacoes:
          data.observacoes,
        conclusao:
          data.conclusao,
        iniciada_em:
          data.iniciada_em,
        concluida_em:
          data.concluida_em,
      };

      setExecucaoServico(registro);

      setSolucaoTecnicaExecucao(
        registro.solucao_tecnica ??
          ''
      );

      setObservacoesExecucao(
        registro.observacoes ??
          ''
      );

      if (
        registro.conclusao ===
          'total' ||
        registro.conclusao ===
          'improcedente'
      ) {
        setConclusaoExecucao(
          registro.conclusao
        );
      } else {
        setConclusaoExecucao(
          null
        );
      }

      await carregarFotosExecucao(
        registro.execucao_id
      );

      return registro;
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar execução:',
        error
      );

      return null;
    }
  }

  async function iniciarExecucaoServico() {
    setErroExecucao('');
    setSucessoExecucao('');
    setErroFormularioExecucao('');
    setSucessoFormularioExecucao('');

    try {
      setIniciandoExecucao(true);

      const {
        data,
        error,
      } = await supabase.rpc(
        'iniciar_execucao_servico_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao iniciar execução:',
          error
        );

        setErroExecucao(
          error.message ||
            'Não foi possível iniciar a execução do serviço.'
        );

        return;
      }

      const registro =
        data?.[0];

      if (!registro) {
        setErroExecucao(
          'A execução não retornou confirmação de início.'
        );

        return;
      }

      setExecucaoServico({
        execucao_id:
          registro.execucao_id,
        solicitacao_id:
          registro.solicitacao_id,
        numero_termo:
          Number(
            registro.numero_termo
          ) || null,
        status:
          registro.status,
        responsavel_servico_id:
          registro.responsavel_servico_id,
        responsavel_servico_nome:
          registro.responsavel_servico_nome ??
          null,
        iniciada_em:
          registro.iniciada_em,
      });

      setSucessoExecucao(
        'Execução do serviço iniciada com sucesso.'
      );

      await carregarSolicitacao();
      await carregarExecucaoServico();
    } catch (error) {
      console.error(
        'Erro inesperado ao iniciar execução:',
        error
      );

      setErroExecucao(
        'Ocorreu um erro ao iniciar a execução do serviço.'
      );
    } finally {
      setIniciandoExecucao(false);
    }
  }

  // ==========================================================
  // FOTOS DA EXECUÇÃO DO SERVIÇO
  // ==========================================================

  async function carregarFotosExecucao(
    execucaoId?: string
  ) {
    const id =
      execucaoId ??
      execucaoServico?.execucao_id;

    if (!id) {
      setFotosExecucaoSalvas([]);
      return;
    }

    try {
      setCarregandoFotosExecucao(
        true
      );

      const {
        data,
        error,
      } = await supabase
        .from('execucao_fotos')
        .select(
          'id, execucao_id, caminho_storage, nome_arquivo, descricao, created_at'
        )
        .eq(
          'execucao_id',
          id
        )
        .order(
          'created_at',
          {
            ascending: true,
          }
        );

      if (error) {
        console.error(
          'Erro ao carregar fotos da execução:',
          error
        );

        return;
      }

      const fotosComUrl =
        await Promise.all(
          (data ?? []).map(
            async (foto: any) => {
              const {
                data: signedData,
                error:
                  signedError,
              } =
                await supabase.storage
                  .from(
                    'execucoes-fotos'
                  )
                  .createSignedUrl(
                    foto.caminho_storage,
                    60 * 60
                  );

              if (signedError) {
                console.error(
                  'Erro ao gerar URL da foto da execução:',
                  signedError
                );
              }

              return {
                ...foto,
                url:
                  signedData
                    ?.signedUrl ??
                  '',
              } as FotoExecucaoSalva;
            }
          )
        );

      setFotosExecucaoSalvas(
        fotosComUrl
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar fotos da execução:',
        error
      );
    } finally {
      setCarregandoFotosExecucao(
        false
      );
    }
  }

  async function selecionarFotosExecucao() {
    setErroFormularioExecucao('');
    setSucessoFormularioExecucao('');

    const quantidadeAtual =
      fotosExecucaoPendentes.length +
      fotosExecucaoSalvas.length;

    if (quantidadeAtual >= 10) {
      setErroFormularioExecucao(
        'A execução pode ter no máximo 10 fotos.'
      );

      return;
    }

    try {
      const resultado =
        await ImagePicker.launchImageLibraryAsync(
          {
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsMultipleSelection:
              true,

            selectionLimit:
              10 -
              quantidadeAtual,

            quality: 0.8,
          }
        );

      if (
        resultado.canceled
      ) {
        return;
      }

      const disponiveis =
        10 -
        quantidadeAtual;

      setFotosExecucaoPendentes(
        (
          atuais
        ) => [
          ...atuais,
          ...resultado.assets.slice(
            0,
            disponiveis
          ),
        ]
      );
    } catch (error) {
      console.error(
        'Erro ao selecionar fotos da execução:',
        error
      );

      setErroFormularioExecucao(
        'Não foi possível selecionar as fotos da execução.'
      );
    }
  }

  function removerFotoExecucaoPendente(
    uri: string
  ) {
    setFotosExecucaoPendentes(
      (atuais) =>
        atuais.filter(
          (foto) =>
            foto.uri !== uri
        )
    );
  }

  async function enviarFotosExecucao() {
    if (
      fotosExecucaoPendentes.length ===
      0
    ) {
      return true;
    }

    if (!execucaoServico) {
      setErroFormularioExecucao(
        'A ficha da execução ainda não foi carregada.'
      );

      return false;
    }

    const {
      data: usuarioData,
      error: usuarioError,
    } =
      await supabase.auth
        .getUser();

    if (
      usuarioError ||
      !usuarioData.user
    ) {
      setErroFormularioExecucao(
        'Não foi possível identificar o funcionário.'
      );

      return false;
    }

    let pendentesRestantes = [
      ...fotosExecucaoPendentes,
    ];

    for (
      let indice = 0;
      indice <
      fotosExecucaoPendentes.length;
      indice++
    ) {
      const foto =
        fotosExecucaoPendentes[
          indice
        ];

      try {
        const resposta =
          await fetch(
            foto.uri
          );

        const blob =
          await resposta.blob();

        const extensao =
          extensaoFoto(
            foto
          );

        const nomeArquivo =
          foto.fileName ??
          `execucao-${Date.now()}-${indice}.${extensao}`;

        const caminho =
          `${execucaoServico.execucao_id}/${usuarioData.user.id}/${Date.now()}-${indice}.${extensao}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              'execucoes-fotos'
            )
            .upload(
              caminho,
              blob,
              {
                contentType:
                  foto.mimeType ??
                  `image/${extensao === 'jpg' ? 'jpeg' : extensao}`,

                upsert: false,
              }
            );

        if (uploadError) {
          throw uploadError;
        }

        const {
          error:
            insertError,
        } =
          await supabase
            .from(
              'execucao_fotos'
            )
            .insert({
              execucao_id:
                execucaoServico.execucao_id,

              caminho_storage:
                caminho,

              nome_arquivo:
                nomeArquivo,

              funcionario_id:
                usuarioData.user.id,
            });

        if (insertError) {
          await supabase.storage
            .from(
              'execucoes-fotos'
            )
            .remove([
              caminho,
            ]);

          throw insertError;
        }

        pendentesRestantes =
          pendentesRestantes.filter(
            (item) =>
              item.uri !==
              foto.uri
          );

        setFotosExecucaoPendentes(
          pendentesRestantes
        );
      } catch (error: any) {
        console.error(
          'Erro ao enviar foto da execução:',
          error
        );

        setErroFormularioExecucao(
          error?.message ??
            'Não foi possível enviar uma das fotos da execução.'
        );

        await carregarFotosExecucao(
          execucaoServico.execucao_id
        );

        return false;
      }
    }

    await carregarFotosExecucao(
      execucaoServico.execucao_id
    );

    return true;
  }

  // ==========================================================
  // SALVAR EXECUÇÃO DO SERVIÇO
  // ==========================================================

  async function salvarExecucaoServico() {
    setErroFormularioExecucao('');
    setSucessoFormularioExecucao('');

    if (
      !solucaoTecnicaExecucao.trim()
    ) {
      setErroFormularioExecucao(
        'Informe a solução técnica executada.'
      );

      return;
    }

    try {
      setSalvandoExecucao(true);

      const {
        data,
        error,
      } = await supabase.rpc(
        'salvar_execucao_servico_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_solucao_tecnica:
            solucaoTecnicaExecucao.trim(),

          p_observacoes:
            observacoesExecucao.trim() ||
            null,
        }
      );

      if (error) {
        console.error(
          'Erro ao salvar execução:',
          error
        );

        setErroFormularioExecucao(
          error.message ||
            'Não foi possível salvar a execução do serviço.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroFormularioExecucao(
          'A execução não retornou confirmação de salvamento.'
        );

        return;
      }

      const tinhaFotosPendentes =
        fotosExecucaoPendentes.length >
        0;

      const fotosEnviadas =
        await enviarFotosExecucao();

      if (!fotosEnviadas) {
        return;
      }

      setSucessoFormularioExecucao(
        tinhaFotosPendentes
          ? 'Dados e fotos da execução salvos com sucesso.'
          : 'Dados da execução salvos com sucesso.'
      );

      await carregarExecucaoServico();
    } catch (error) {
      console.error(
        'Erro inesperado ao salvar execução:',
        error
      );

      setErroFormularioExecucao(
        'Ocorreu um erro ao salvar a execução do serviço.'
      );
    } finally {
      setSalvandoExecucao(false);
    }
  }

  // ==========================================================
  // FINALIZAR EXECUÇÃO DO SERVIÇO
  // ==========================================================

  async function finalizarExecucaoServico() {
    setErroFinalizacaoExecucao('');
    setSucessoFinalizacaoExecucao('');

    if (!conclusaoExecucao) {
      setErroFinalizacaoExecucao(
        'Selecione a conclusão do serviço.'
      );

      return;
    }

    if (
      !solucaoTecnicaExecucao.trim()
    ) {
      setErroFinalizacaoExecucao(
        'Preencha a solução técnica antes de finalizar o serviço.'
      );

      return;
    }

    try {
      setFinalizandoExecucao(
        true
      );

      // Salva os dados atuais antes de concluir.
      const {
        error: salvarError,
      } = await supabase.rpc(
        'salvar_execucao_servico_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_solucao_tecnica:
            solucaoTecnicaExecucao.trim(),

          p_observacoes:
            observacoesExecucao.trim() ||
            null,
        }
      );

      if (salvarError) {
        console.error(
          'Erro ao salvar execução antes de finalizar:',
          salvarError
        );

        setErroFinalizacaoExecucao(
          salvarError.message ||
            'Não foi possível salvar os dados da execução.'
        );

        return;
      }

      // Envia fotos que ainda estejam aguardando salvamento.
      const fotosEnviadas =
        await enviarFotosExecucao();

      if (!fotosEnviadas) {
        setErroFinalizacaoExecucao(
          'Não foi possível finalizar porque existem fotos que não foram enviadas.'
        );

        return;
      }

      const {
        data,
        error,
      } = await supabase.rpc(
        'finalizar_execucao_servico_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_conclusao:
            conclusaoExecucao,
        }
      );

      if (error) {
        console.error(
          'Erro ao finalizar execução:',
          error
        );

        setErroFinalizacaoExecucao(
          error.message ||
            'Não foi possível finalizar o serviço.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroFinalizacaoExecucao(
          'O sistema não retornou a confirmação da conclusão do serviço.'
        );

        return;
      }

      setSucessoFinalizacaoExecucao(
        'Serviço finalizado com sucesso.'
      );

      await carregarSolicitacao();
      await carregarExecucaoServico();
    } catch (error) {
      console.error(
        'Erro inesperado ao finalizar execução:',
        error
      );

      setErroFinalizacaoExecucao(
        'Ocorreu um erro ao finalizar o serviço.'
      );
    } finally {
      setFinalizandoExecucao(
        false
      );
    }
  }

  // ==========================================================
  // CARREGAR DADOS DO FORM 03
  // ==========================================================

  async function carregarDadosForm03() {
    setErroForm03('');

    try {
      setCarregandoForm03(true);

      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_dados_form03_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar dados do FORM 03:',
          error
        );

        setErroForm03(
          error.message ||
            'Não foi possível carregar os dados do FORM 03.'
        );

        return;
      }

      const registro =
        data?.[0] as
          | DadosForm03
          | undefined;

      if (!registro) {
        setErroForm03(
          'Nenhum dado foi retornado para o FORM 03.'
        );

        return;
      }

      setDadosForm03(
        registro
      );

      await carregarEstadoAssinaturasForm03();
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar FORM 03:',
        error
      );

      setErroForm03(
        'Ocorreu um erro ao carregar os dados do FORM 03.'
      );
    } finally {
      setCarregandoForm03(false);
    }
  }

  // ==========================================================
  // ASSINATURAS MANUAIS DO FORM 03
  // ==========================================================

  async function carregarEstadoAssinaturasForm03() {
    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          'form03_documentos'
        )
        .select(
          [
            'modo_assinatura',
            'status',
            'assinatura_cliente_svg',
            'assinatura_cliente_nome',
            'assinado_cliente_em',
            'assinatura_funcionario_svg',
            'assinatura_funcionario_nome',
            'assinado_funcionario_em',
          ].join(',')
        )
        .eq(
          'solicitacao_id',
          solicitacaoId
        )
        .maybeSingle();

      if (error) {
        console.error(
          'Erro ao carregar assinaturas do FORM 03:',
          error
        );

        return;
      }

      if (!data) {
        setEstadoAssinaturasForm03(
          null
        );

        return;
      }

      const estado =
        data as unknown as
          EstadoAssinaturasForm03;

      setEstadoAssinaturasForm03(
        estado
      );

      if (
        estado.modo_assinatura
      ) {
        setModoAssinaturaForm03(
          estado.modo_assinatura
        );
      }

    } catch (error) {
      console.error(
        'Erro inesperado ao carregar assinaturas:',
        error
      );
    }
  }

  async function salvarAssinaturaFuncionarioForm03(
    assinaturaSvg: string
  ) {
    setErroForm03('');
    setMensagemAssinaturaForm03('');

    try {
      setSalvandoAssinaturaManual(
        'funcionario'
      );

      const {
        data,
        error,
      } = await supabase.rpc(
        'salvar_assinatura_funcionario_form03',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_assinatura_svg:
            assinaturaSvg,
        }
      );

      if (error) {
        console.error(
          'Erro ao salvar assinatura do responsável:',
          error
        );

        setErroForm03(
          error.message ||
            'Não foi possível salvar a assinatura do responsável.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroForm03(
          'O sistema não confirmou o salvamento da assinatura.'
        );

        return;
      }

      setMensagemAssinaturaForm03(
        'Assinatura do responsável salva com sucesso.'
      );

      await carregarEstadoAssinaturasForm03();
    } catch (error) {
      console.error(
        'Erro inesperado ao salvar assinatura do responsável:',
        error
      );

      setErroForm03(
        'Ocorreu um erro ao salvar a assinatura do responsável.'
      );
    } finally {
      setSalvandoAssinaturaManual(
        null
      );
    }
  }

  // ==========================================================
  // PDF DO FORM 03
  // ==========================================================

  function escaparHtml(
    valor: unknown
  ) {
    return String(
      valor ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );
  }

  async function gerarUrlsFotosForm03() {
    if (!dadosForm03) {
      return [] as string[];
    }

    const fotos = [
      ...(dadosForm03.fotos_vistoria ??
        []).map(
        (foto: any) => ({
          bucket:
            'vistorias-fotos',
          caminho:
            foto.caminho_storage,
        })
      ),

      ...(dadosForm03.fotos_execucao ??
        []).map(
        (foto: any) => ({
          bucket:
            'execucoes-fotos',
          caminho:
            foto.caminho_storage,
        })
      ),
    ].slice(0, 3);

    const urls: string[] = [];

    for (const foto of fotos) {
      if (!foto.caminho) {
        continue;
      }

      const {
        data,
        error,
      } = await supabase.storage
        .from(foto.bucket)
        .createSignedUrl(
          foto.caminho,
          60 * 60
        );

      if (error) {
        console.error(
          'Erro ao gerar URL de foto para o FORM 03:',
          error
        );

        continue;
      }

      if (data?.signedUrl) {
        urls.push(
          data.signedUrl
        );
      }
    }

    return urls;
  }

  async function montarHtmlForm03() {
    if (!dadosForm03) {
      throw new Error(
        'Carregue os dados do FORM 03 antes de gerar o PDF.'
      );
    }

    const logoAsset =
      Asset.fromModule(
        require(
          '../../assets/emafe/logo-horizontal-transparente.png'
        )
      );

    if (!logoAsset.localUri) {
      await logoAsset.downloadAsync();
    }

    const logoForm03Uri =
      logoAsset.localUri ??
      logoAsset.uri;

    const urlsFotos =
      await gerarUrlsFotosForm03();

    const fotosHtml =
      urlsFotos.length > 0
        ? urlsFotos
            .map(
              (
                url,
                indice
              ) => `
                <div class="foto-box">
                  <div class="foto-titulo">
                    REGISTRO FOTOGRÁFICO ${indice + 1}
                  </div>

                  <img
                    src="${escaparHtml(url)}"
                    class="foto"
                  />
                </div>
              `
            )
            .join('')
        : `
            <div class="sem-fotos">
              Nenhum registro fotográfico disponível.
            </div>
          `;

    const procedencia =
      dadosForm03.problema_constatado ===
      true
        ? 'P - Procedente'
        : dadosForm03.problema_constatado ===
            false
          ? 'I - Improcedente'
          : '-';

    const conclusao =
      dadosForm03.conclusao ===
      'total'
        ? 'TOTAL'
        : dadosForm03.conclusao ===
            'improcedente'
          ? 'IMPROCEDENTE'
          : '-';

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />

  <style>
    @page {
      size: A4;
      margin: 12mm;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      color: #1d2c3f;
      font-family: Arial, Helvetica, sans-serif;
      font-size: 10px;
      line-height: 1.35;
    }

    .header {
      width: calc(100% - 2px);
      margin-right: 2px;
      border: 1.5px solid #0B2447;
      padding: 10px 12px;
      margin-bottom: 10px;
      text-align: center;
      overflow: hidden;
      page-break-inside: avoid;
    }

    .logo-form03 {
      display: block;
      width: 180px;
      max-height: 60px;
      object-fit: contain;
      margin: 0 auto 5px auto;
    }

    .titulo {
      margin-top: 5px;
      font-size: 15px;
      font-weight: 800;
    }

    .revisao {
      margin-top: 3px;
      color: #5d6b7b;
      font-size: 9px;
    }

    .section-title {
      margin-top: 10px;
      padding: 6px 8px;
      color: #ffffff;
      background: #0B2447;
      font-size: 10px;
      font-weight: 800;
    }

    .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      border-left: 1px solid #9eabb8;
      border-top: 1px solid #9eabb8;
    }

    .cell {
      min-height: 45px;
      padding: 7px;
      border-right: 1px solid #9eabb8;
      border-bottom: 1px solid #9eabb8;
    }

    .cell-full {
      grid-column: 1 / -1;
    }

    .label {
      margin-bottom: 4px;
      color: #647486;
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
    }

    .value {
      font-size: 10px;
      font-weight: 600;
      white-space: pre-wrap;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th,
    td {
      border: 1px solid #9eabb8;
      padding: 6px;
      vertical-align: top;
      word-break: break-word;
    }

    th {
      color: #0B2447;
      background: #eef3f8;
      font-size: 8px;
    }

    .fotos {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 7px;
      margin-top: 7px;
    }

    .foto-box {
      border: 1px solid #9eabb8;
      padding: 5px;
      page-break-inside: avoid;
    }

    .foto-titulo {
      margin-bottom: 4px;
      color: #647486;
      font-size: 7px;
      font-weight: 800;
    }

    .foto {
      display: block;
      width: 100%;
      height: 150px;
      object-fit: cover;
    }

    .sem-fotos {
      padding: 12px;
      border: 1px solid #9eabb8;
      margin-top: 7px;
      color: #647486;
    }

    .termo {
      margin-top: 10px;
      padding: 9px;
      border: 1px solid #9eabb8;
      font-size: 9px;
      text-align: justify;
    }

    .assinaturas {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 30px;
      margin-top: 38px;
      page-break-inside: avoid;
    }

    .assinatura {
      text-align: center;
    }

    .assinatura-svg {
      width: 100%;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-bottom: 4px;
    }

    .assinatura-svg svg {
      width: 100%;
      height: 70px;
    }

    .linha {
      border-top: 1px solid #1d2c3f;
      padding-top: 5px;
    }

    .data {
      margin-top: 10px;
      color: #647486;
      font-size: 8px;
    }

    .rodape {
      margin-top: 12px;
      color: #7a8795;
      font-size: 7px;
      text-align: center;
    }
  </style>
</head>

<body>
  <div class="header">
    <img
      src="${escaparHtml(
        logoForm03Uri
      )}"
      class="logo-form03"
      alt="EMAFE Engenharia"
    />

    <div class="titulo">
      FORM 03 — TERMO DE VISTORIA E EXECUÇÃO
    </div>

    <div class="revisao">
      Revisão 06 • Protocolo ${escaparHtml(
        dadosForm03.protocolo
      )}
    </div>
  </div>

  <div class="section-title">
    SOLICITAÇÃO
  </div>

  <div class="grid">
    <div class="cell">
      <div class="label">
        Solicitante
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.solicitante
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Data da reclamação
      </div>

      <div class="value">
        ${escaparHtml(
          formatarDataHora(
            dadosForm03.data_reclamacao
          )
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Contato
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.telefone ??
            '-'
        )}
        <br />
        ${escaparHtml(
          dadosForm03.email ??
            '-'
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Horário / disponibilidade
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.disponibilidade ??
            '-'
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Empreendimento
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.empreendimento
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Unidade / Local
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.unidade
        )}
        ${
          dadosForm03.comodo
            ? ` • ${escaparHtml(
                dadosForm03.comodo
              )}`
            : ''
        }
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Problema relatado
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.problema_relatado
        )}
      </div>
    </div>
  </div>

  <div class="section-title">
    VISTORIA
  </div>

  <div class="grid">
    <div class="cell">
      <div class="label">
        Responsável pela vistoria
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.responsavel_vistoria ??
            '-'
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Data da vistoria
      </div>

      <div class="value">
        ${escaparHtml(
          formatarDataHora(
            dadosForm03.inicio_vistoria
          )
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Constatação do problema
      </div>

      <div class="value">
        ${
          dadosForm03.problema_constatado ===
          true
            ? 'SIM'
            : dadosForm03.problema_constatado ===
                false
              ? 'NÃO'
              : '-'
        }
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Resultado
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.resultado_vistoria ===
          'aprovada'
            ? 'Aprovada'
            : dadosForm03.resultado_vistoria ===
                'nao_aprovada'
              ? 'Não aprovada'
              : '-'
        )}
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Parecer técnico
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.parecer_tecnico ??
            '-'
        )}
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Serviço necessário
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.servico_necessario ??
            '-'
        )}
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Observações da vistoria
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.observacoes_vistoria ??
            '-'
        )}
      </div>
    </div>
  </div>

  <div class="section-title">
    GARANTIA
  </div>

  <table>
    <thead>
      <tr>
        <th>Problema</th>
        <th>Descrição da garantia</th>
        <th>Prazo</th>
        <th>Vigência</th>
        <th>P / I</th>
        <th>Observações</th>
      </tr>
    </thead>

    <tbody>
      <tr>
        <td>
          ${escaparHtml(
            dadosForm03.categoria ??
              dadosForm03.manifestacao_patologica ??
              '-'
          )}
        </td>

        <td>
          ${escaparHtml(
            [
              dadosForm03.elemento_construtivo,
              dadosForm03.manifestacao_patologica,
            ]
              .filter(Boolean)
              .join(' - ') ||
              '-'
          )}
        </td>

        <td>
          ${escaparHtml(
            dadosForm03.prazo_quantidade ??
              '-'
          )}
          ${escaparHtml(
            dadosForm03.prazo_unidade ??
              ''
          )}
        </td>

        <td>
          ${escaparHtml(
            formatarData(
              dadosForm03.data_limite_garantia
            )
          )}
        </td>

        <td>
          ${escaparHtml(
            procedencia
          )}
        </td>

        <td>
          ${escaparHtml(
            dadosForm03.observacoes_vistoria ??
              '-'
          )}
        </td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">
    SERVIÇO
  </div>

  <div class="grid">
    <div class="cell">
      <div class="label">
        Nº Termo de Serviço
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.numero_termo ??
            '-'
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Responsável pelo serviço
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.responsavel_servico ??
            '-'
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Data de conclusão
      </div>

      <div class="value">
        ${escaparHtml(
          formatarDataHora(
            dadosForm03.data_conclusao
          )
        )}
      </div>
    </div>

    <div class="cell">
      <div class="label">
        Conclusão
      </div>

      <div class="value">
        ${escaparHtml(
          conclusao
        )}
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Solução técnica
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.solucao_tecnica ??
            '-'
        )}
      </div>
    </div>

    <div class="cell cell-full">
      <div class="label">
        Observações
      </div>

      <div class="value">
        ${escaparHtml(
          dadosForm03.observacoes_execucao ??
            '-'
        )}
      </div>
    </div>
  </div>

  <div class="section-title">
    REGISTROS FOTOGRÁFICOS
  </div>

  <div class="fotos">
    ${fotosHtml}
  </div>

  <div class="section-title">
    TERMO DE RECEBIMENTO DOS SERVIÇOS
  </div>

  <div class="termo">
    Pelo presente termo, aceito os serviços prestados para a correção
    das falhas apontadas, nada mais tendo a reclamar sobre os mesmos.
  </div>

  <div class="assinaturas">
    <div class="assinatura">
      ${
        estadoAssinaturasForm03
          ?.assinatura_cliente_svg
          ? `
            <div class="assinatura-svg">
              ${
                estadoAssinaturasForm03
                  .assinatura_cliente_svg
              }
            </div>
          `
          : ''
      }

      <div class="linha">
        ${escaparHtml(
          estadoAssinaturasForm03
            ?.assinatura_cliente_nome ??
            dadosForm03.solicitante
        )}
      </div>

      <div>
        Nome / Assinatura do Cliente ou seu representante
      </div>

      <div class="data">
        ${
          estadoAssinaturasForm03
            ?.assinado_cliente_em
            ? `Data: ${escaparHtml(
                formatarDataHora(
                  estadoAssinaturasForm03
                    .assinado_cliente_em
                )
              )}`
            : 'Data: _____ / _____ / __________'
        }
      </div>
    </div>

    <div class="assinatura">
      ${
        estadoAssinaturasForm03
          ?.assinatura_funcionario_svg
          ? `
            <div class="assinatura-svg">
              ${
                estadoAssinaturasForm03
                  .assinatura_funcionario_svg
              }
            </div>
          `
          : ''
      }

      <div class="linha">
        ${escaparHtml(
          estadoAssinaturasForm03
            ?.assinatura_funcionario_nome ??
            dadosForm03.responsavel_servico ??
            ''
        )}
      </div>

      <div>
        Assinatura do responsável pela execução dos serviços
      </div>

      <div class="data">
        ${
          estadoAssinaturasForm03
            ?.assinado_funcionario_em
            ? `Data: ${escaparHtml(
                formatarDataHora(
                  estadoAssinaturasForm03
                    .assinado_funcionario_em
                )
              )}`
            : 'Data: _____ / _____ / __________'
        }
      </div>
    </div>
  </div>

  <div class="rodape">
    EMAFE Engenharia • FORM 03 • Revisão 06
  </div>
</body>
</html>
    `;
  }

  async function gerarPdfForm03() {
    setErroForm03('');
    setMensagemAssinaturaForm03('');

    if (!dadosForm03) {
      setErroForm03(
        'Carregue os dados do FORM 03 antes de gerar o PDF.'
      );

      return;
    }

    try {
      setGerandoPdfForm03(true);

      const html =
        await montarHtmlForm03();

      if (
        Platform.OS === 'web'
      ) {
        const janela =
          window.open(
            '',
            '_blank'
          );

        if (!janela) {
          setErroForm03(
            'O navegador bloqueou a janela do PDF. Permita pop-ups para localhost e tente novamente.'
          );

          return;
        }

        janela.document.open();
        janela.document.write(
          html
        );
        janela.document.close();

        setPdfForm03Gerado(
          true
        );

        setMensagemAssinaturaForm03(
          'FORM 03 preparado. Na janela aberta, use Imprimir e escolha “Salvar como PDF”.'
        );

        setTimeout(
          () => {
            try {
              janela.focus();
              janela.print();
            } catch (
              error
            ) {
              console.error(
                'Erro ao abrir impressão:',
                error
              );
            }
          },
          500
        );

        return;
      }

      const resultado =
        await Print.printToFileAsync(
          {
            html,
          }
        );

      setPdfForm03Uri(
        resultado.uri
      );

      setPdfForm03Gerado(
        true
      );

      setMensagemAssinaturaForm03(
        'PDF do FORM 03 gerado com sucesso.'
      );
    } catch (error: any) {
      console.error(
        'Erro ao gerar PDF do FORM 03:',
        error
      );

      setErroForm03(
        error?.message ??
          'Não foi possível gerar o PDF do FORM 03.'
      );
    } finally {
      setGerandoPdfForm03(
        false
      );
    }
  }

  async function compartilharPdfForm03() {
    if (!pdfForm03Uri) {
      return;
    }

    try {
      const disponivel =
        await Sharing
          .isAvailableAsync();

      if (!disponivel) {
        setErroForm03(
          'O compartilhamento de arquivos não está disponível neste dispositivo.'
        );

        return;
      }

      await Sharing.shareAsync(
        pdfForm03Uri,
        {
          mimeType:
            'application/pdf',

          dialogTitle:
            'FORM 03 - EMAFE',
        }
      );
    } catch (error) {
      console.error(
        'Erro ao compartilhar PDF:',
        error
      );

      setErroForm03(
        'Não foi possível compartilhar o PDF.'
      );
    }
  }

  async function definirModoAssinaturaForm03(
    modo:
      | 'manual_app'
      | 'externa_pdf'
  ) {
    setErroForm03('');
    setMensagemAssinaturaForm03('');

    if (!pdfForm03Gerado) {
      setErroForm03(
        'Gere o PDF do FORM 03 antes de escolher a forma de assinatura.'
      );

      return;
    }

    try {
      setDefinindoModoAssinatura(
        true
      );

      const {
        data,
        error,
      } = await supabase.rpc(
        'definir_modo_assinatura_form03_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_modo_assinatura:
            modo,
        }
      );

      if (error) {
        console.error(
          'Erro ao definir modo de assinatura:',
          error
        );

        setErroForm03(
          error.message ||
            'Não foi possível definir o modo de assinatura.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroForm03(
          'O sistema não confirmou o modo de assinatura.'
        );

        return;
      }

      setModoAssinaturaForm03(
        modo
      );

      await carregarEstadoAssinaturasForm03();

      if (
        modo ===
        'manual_app'
      ) {
        setMensagemAssinaturaForm03(
          'Assinatura no aplicativo selecionada. A próxima etapa será coletar a assinatura do cliente e do responsável na tela.'
        );
      } else {
        setMensagemAssinaturaForm03(
          'Assinatura externa selecionada. Use o PDF gerado para assinatura eletrônica e depois envie o arquivo assinado ao protocolo.'
        );
      }
    } catch (error) {
      console.error(
        'Erro inesperado ao definir assinatura:',
        error
      );

      setErroForm03(
        'Ocorreu um erro ao definir o modo de assinatura.'
      );
    } finally {
      setDefinindoModoAssinatura(
        false
      );
    }
  }

  // ==========================================================
  // FINALIZAR VISTORIA
  // ==========================================================

  async function finalizarVistoria() {
    setErroFinalizacaoVistoria('');
    setSucessoFinalizacaoVistoria('');

    if (!resultadoVistoria) {
      setErroFinalizacaoVistoria(
        'Selecione o resultado da vistoria.'
      );

      return;
    }

    if (
      problemaConstatado ===
      null
    ) {
      setErroFinalizacaoVistoria(
        'Informe se o problema relatado foi constatado.'
      );

      return;
    }

    if (
      !parecerTecnico.trim()
    ) {
      setErroFinalizacaoVistoria(
        'Preencha o parecer técnico antes de finalizar.'
      );

      return;
    }

    if (
      resultadoVistoria ===
        'aprovada' &&
      !servicoNecessario.trim()
    ) {
      setErroFinalizacaoVistoria(
        'Informe o serviço necessário antes de aprovar a vistoria.'
      );

      return;
    }

    if (
      resultadoVistoria ===
        'nao_aprovada' &&
      !justificativaResultado.trim()
    ) {
      setErroFinalizacaoVistoria(
        'Informe a justificativa da não aprovação.'
      );

      return;
    }

    try {
      setFinalizandoVistoria(
        true
      );

      // Salva os dados atuais antes de finalizar.
      const {
        error: salvarError,
      } = await supabase.rpc(
        'salvar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_problema_constatado:
            problemaConstatado,

          p_parecer_tecnico:
            parecerTecnico.trim(),

          p_servico_necessario:
            servicoNecessario.trim() ||
            null,

          p_observacoes:
            observacoesTecnicas.trim() ||
            null,
        }
      );

      if (salvarError) {
        console.error(
          'Erro ao salvar antes de finalizar:',
          salvarError
        );

        setErroFinalizacaoVistoria(
          salvarError.message ||
            'Não foi possível salvar os dados da vistoria.'
        );

        return;
      }

      // Envia eventuais fotos que ainda estejam pendentes.
      const fotosEnviadas =
        await enviarFotosVistoria();

      if (!fotosEnviadas) {
        setErroFinalizacaoVistoria(
          'Não foi possível concluir porque existem fotos que não foram enviadas.'
        );

        return;
      }

      const {
        data,
        error,
      } = await supabase.rpc(
        'finalizar_vistoria_funcionario',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_resultado:
            resultadoVistoria,

          p_justificativa_resultado:
            resultadoVistoria ===
              'nao_aprovada'
              ? justificativaResultado.trim()
              : null,
        }
      );

      if (error) {
        console.error(
          'Erro ao finalizar vistoria:',
          error
        );

        setErroFinalizacaoVistoria(
          error.message ||
            'Não foi possível finalizar a vistoria.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroFinalizacaoVistoria(
          'A vistoria não retornou confirmação de finalização.'
        );

        return;
      }

      setSucessoFinalizacaoVistoria(
        resultadoVistoria ===
          'aprovada'
          ? 'Vistoria finalizada e aprovada para execução.'
          : 'Vistoria finalizada como não aprovada.'
      );

      await carregarSolicitacao();
      await carregarVistoriaTecnica();
      await carregarExecucaoServico();
    } catch (error) {
      console.error(
        'Erro inesperado ao finalizar vistoria:',
        error
      );

      setErroFinalizacaoVistoria(
        'Ocorreu um erro ao finalizar a vistoria.'
      );
    } finally {
      setFinalizandoVistoria(
        false
      );
    }
  }

  // ==========================================================
  // FORMATADORES
  // ==========================================================

  function formatarDataHora(
    dataIso:
      | string
      | null
      | undefined
  ) {
    if (!dataIso) {
      return '-';
    }

    const data =
      new Date(dataIso);

    return data.toLocaleString(
      'pt-BR',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    );
  }

  function formatarData(
    data:
      | string
      | null
      | undefined
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (
      partes.length === 3
    ) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return data;
  }

  function formatarHora(
    hora:
      | string
      | null
      | undefined
  ) {
    if (!hora) {
      return '-';
    }

    return hora.substring(
      0,
      5
    );
  }

  function textoStatus(
    status: string
  ) {
    switch (status) {
      case 'aberta':
        return 'Nova';

      case 'em_analise':
        return 'Em análise';

      case 'vistoria_agendada':
        return 'Vistoria agendada';

      case 'em_vistoria':
        return 'Em vistoria';

      case 'em_execucao':
        return 'Em execução';

      case 'concluida':
        return 'Concluída';

      case 'cancelada':
        return 'Cancelada';

      default:
        return status;
    }
  }

  function textoGarantia(
    status:
      | string
      | null
  ) {
    switch (status) {
      case 'dentro_garantia':
      case 'dentro_da_garantia':
        return 'Dentro da garantia';

      case 'fora_garantia':
      case 'fora_da_garantia':
        return 'Fora da garantia';

      case 'nao_se_aplica':
        return 'Não se aplica';

      default:
        return 'Aguardando análise';
    }
  }

  function estiloResultadoGarantia(
    status:
      | string
      | null
  ) {
    switch (status) {
      case 'dentro_garantia':
      case 'dentro_da_garantia':
        return styles.resultadoDentro;

      case 'fora_garantia':
      case 'fora_da_garantia':
        return styles.resultadoFora;

      default:
        return styles.resultadoNeutro;
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (carregando) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <StatusBar
          style="dark"
        />

        <View
          style={
            styles.loadingContainer
          }
        >
          <ActivityIndicator
            size="large"
            color="#0B2447"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Carregando chamado...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!autorizado) {
    return null;
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar style="dark" />

      {/* ======================================================
          FOTO AMPLIADA
      ====================================================== */}

      <Modal
        visible={
          !!fotoSelecionada
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFotoSelecionada(
            null
          )
        }
      >
        <View
          style={
            styles.modalOverlay
          }
        >
          <TouchableOpacity
            style={
              styles.modalClose
            }
            onPress={() =>
              setFotoSelecionada(
                null
              )
            }
          >
            <Ionicons
              name="close"
              size={28}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {fotoSelecionada ? (
            <Image
              source={{
                uri:
                  fotoSelecionada.url,
              }}
              style={
                styles.modalImage
              }
              resizeMode="contain"
            />
          ) : null}
        </View>
      </Modal>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        <View
          style={styles.content}
        >
          {/* ==================================================
              TOPO
          ================================================== */}

          <View
            style={styles.topBar}
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.replace(
                  '/solicitacoes-funcionario'
                )
              }
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color="#0B2447"
              />

              <Text
                style={
                  styles.backText
                }
              >
                Solicitações
              </Text>
            </TouchableOpacity>

            <Image
              source={require('../../assets/emafe/logo-horizontal-transparente.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* ==================================================
              ERRO GERAL
          ================================================== */}

          {erro ? (
            <View
              style={
                styles.messageError
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color="#9A3232"
              />

              <Text
                style={
                  styles.messageErrorText
                }
              >
                {erro}
              </Text>
            </View>
          ) : null}

          {solicitacao ? (
            <>
              {/* ==============================================
                  PROTOCOLO
              ============================================== */}

              <View
                style={
                  styles.protocolCard
                }
              >
                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.protocolLabel
                    }
                  >
                    PROTOCOLO
                  </Text>

                  <Text
                    style={
                      styles.protocolNumber
                    }
                  >
                    {
                      solicitacao.protocolo
                    }
                  </Text>

                  <Text
                    style={
                      styles.protocolDate
                    }
                  >
                    Aberto em{' '}
                    {formatarDataHora(
                      solicitacao.created_at
                    )}
                  </Text>
                </View>

                <View
                  style={
                    styles.statusBadge
                  }
                >
                  <Text
                    style={
                      styles.statusText
                    }
                  >
                    {textoStatus(
                      solicitacao.status
                    )}
                  </Text>
                </View>
              </View>

              {/* ==============================================
                  CLIENTE + IMÓVEL
              ============================================== */}

              <View
                style={
                  styles.twoColumns
                }
              >
                <View
                  style={
                    styles.columnCard
                  }
                >
                  <View
                    style={
                      styles.cardTitleRow
                    }
                  >
                    <Ionicons
                      name="person-outline"
                      size={21}
                      color="#0B2447"
                    />

                    <Text
                      style={
                        styles.cardHeaderTitle
                      }
                    >
                      Cliente
                    </Text>
                  </View>

                  <InfoItem
                    label="Nome"
                    value={
                      solicitacao.cliente_nome
                    }
                  />

                  <InfoItem
                    label="CPF/CNPJ"
                    value={
                      solicitacao.cliente_cpf_cnpj ||
                      '-'
                    }
                  />

                  <InfoItem
                    label="Telefone"
                    value={
                      solicitacao.telefone_contato ||
                      '-'
                    }
                  />

                  <InfoItem
                    label="E-mail"
                    value={
                      solicitacao.email_contato ||
                      '-'
                    }
                  />
                </View>

                <View
                  style={
                    styles.columnCard
                  }
                >
                  <View
                    style={
                      styles.cardTitleRow
                    }
                  >
                    <Ionicons
                      name="home-outline"
                      size={21}
                      color="#0B2447"
                    />

                    <Text
                      style={
                        styles.cardHeaderTitle
                      }
                    >
                      Imóvel
                    </Text>
                  </View>

                  <InfoItem
                    label="Cidade"
                    value={
                      solicitacao.cidade ||
                      '-'
                    }
                  />

                  <InfoItem
                    label="Empreendimento"
                    value={
                      solicitacao.empreendimento
                    }
                  />

                  <InfoItem
                    label="Unidade"
                    value={
                      solicitacao.unidade
                    }
                  />

                  <InfoItem
                    label="Local do problema"
                    value={
                      solicitacao.comodo ||
                      '-'
                    }
                  />
                </View>
              </View>

              {/* ==============================================
                  PROBLEMA
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Problema relatado
              </Text>

              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.descriptionText
                  }
                >
                  {
                    solicitacao
                      .descricao_problema
                  }
                </Text>
              </View>

              {/* ==============================================
                  DISPONIBILIDADE
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Disponibilidade para visita
              </Text>

              <View
                style={styles.card}
              >
                <View
                  style={
                    styles.inlineInfo
                  }
                >
                  <Ionicons
                    name="time-outline"
                    size={20}
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.descriptionText
                    }
                  >
                    {
                      solicitacao.disponibilidade_visita ||
                      'Não informado'
                    }
                  </Text>
                </View>
              </View>

              {/* ==============================================
                  FOTOS
              ============================================== */}

              <View
                style={
                  styles.sectionHeader
                }
              >
                <Text
                  style={
                    styles.sectionTitleSemMargem
                  }
                >
                  Fotos enviadas
                </Text>

                <Text
                  style={
                    styles.photoCount
                  }
                >
                  {fotos.length}{' '}
                  {fotos.length === 1
                    ? 'foto'
                    : 'fotos'}
                </Text>
              </View>

              {carregandoFotos ? (
                <View
                  style={
                    styles.loadingInline
                  }
                >
                  <ActivityIndicator
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.loadingInlineText
                    }
                  >
                    Carregando fotos...
                  </Text>
                </View>
              ) : null}

              {erroFotos ? (
                <View
                  style={
                    styles.messageError
                  }
                >
                  <Text
                    style={
                      styles.messageErrorText
                    }
                  >
                    {erroFotos}
                  </Text>
                </View>
              ) : null}

              <View
                style={
                  styles.photoGrid
                }
              >
                {fotos.map(
                  (
                    foto,
                    indice
                  ) => (
                    <TouchableOpacity
                      key={foto.id}
                      style={
                        styles.photoContainer
                      }
                      onPress={() =>
                        setFotoSelecionada(
                          foto
                        )
                      }
                    >
                      <Image
                        source={{
                          uri:
                            foto.url,
                        }}
                        style={
                          styles.photo
                        }
                      />

                      <View
                        style={
                          styles.photoOverlay
                        }
                      >
                        <Text
                          style={
                            styles.photoNumber
                          }
                        >
                          Foto{' '}
                          {indice + 1}
                        </Text>

                        <Ionicons
                          name="expand-outline"
                          size={17}
                          color="#FFFFFF"
                        />
                      </View>
                    </TouchableOpacity>
                  )
                )}
              </View>

              {/* ==============================================
                  ANÁLISE TÉCNICA
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Análise técnica
              </Text>

              <View
                style={
                  styles.analysisCard
                }
              >
                <View
                  style={
                    styles.analysisIntro
                  }
                >
                  <Ionicons
                    name="construct-outline"
                    size={22}
                    color="#0B2447"
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.analysisIntroTitle
                      }
                    >
                      Classificação técnica
                    </Text>

                    <Text
                      style={
                        styles.analysisIntroText
                      }
                    >
                      {analiseConfirmada
                        ? 'A análise técnica deste protocolo já foi confirmada.'
                        : 'Classifique o problema utilizando o modelo de garantia vinculado ao imóvel.'}
                    </Text>
                  </View>
                </View>

                {carregandoItens ? (
                  <View
                    style={
                      styles.loadingInline
                    }
                  >
                    <ActivityIndicator
                      color="#0B2447"
                    />

                    <Text
                      style={
                        styles.loadingInlineText
                      }
                    >
                      Carregando opções...
                    </Text>
                  </View>
                ) : null}

                {/* CATEGORIA */}

                <Text
                  style={
                    styles.fieldNumber
                  }
                >
                  1. Categoria
                </Text>

                <View
                  style={
                    styles.optionGrid
                  }
                >
                  {categorias.map(
                    (categoria) => {
                      const ativo =
                        categoriaSelecionada ===
                        categoria;

                      return (
                        <TouchableOpacity
                          key={
                            categoria
                          }
                          disabled={
                            analiseConfirmada
                          }
                          onPress={() =>
                            selecionarCategoria(
                              categoria
                            )
                          }
                          style={[
                            styles.optionButton,

                            ativo &&
                              styles.optionButtonActive,

                            analiseConfirmada &&
                              !ativo &&
                              styles.optionDisabled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionText,

                              ativo &&
                                styles.optionTextActive,
                            ]}
                          >
                            {
                              categoria
                            }
                          </Text>

                          {ativo ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={17}
                              color="#FFFFFF"
                            />
                          ) : null}
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                {/* ELEMENTO */}

                {categoriaSelecionada ? (
                  <>
                    <Text
                      style={
                        styles.fieldNumber
                      }
                    >
                      2. Elemento construtivo
                    </Text>

                    <View
                      style={
                        styles.optionGrid
                      }
                    >
                      {elementos.map(
                        (
                          elemento
                        ) => {
                          const ativo =
                            elementoSelecionado ===
                            elemento;

                          return (
                            <TouchableOpacity
                              key={
                                elemento
                              }
                              disabled={
                                analiseConfirmada
                              }
                              onPress={() =>
                                selecionarElemento(
                                  elemento
                                )
                              }
                              style={[
                                styles.optionButton,

                                ativo &&
                                  styles.optionButtonActive,

                                analiseConfirmada &&
                                  !ativo &&
                                  styles.optionDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.optionText,

                                  ativo &&
                                    styles.optionTextActive,
                                ]}
                              >
                                {
                                  elemento
                                }
                              </Text>

                              {ativo ? (
                                <Ionicons
                                  name="checkmark-circle"
                                  size={17}
                                  color="#FFFFFF"
                                />
                              ) : null}
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </>
                ) : null}

                {/* PROBLEMA */}

                {elementoSelecionado ? (
                  <>
                    <Text
                      style={
                        styles.fieldNumber
                      }
                    >
                      3. Problema técnico
                    </Text>

                    <View
                      style={
                        styles.problemList
                      }
                    >
                      {problemas.map(
                        (item) => {
                          const ativo =
                            itemSelecionadoId ===
                            item.item_garantia_id;

                          return (
                            <TouchableOpacity
                              key={
                                item.item_garantia_id
                              }
                              disabled={
                                analiseConfirmada
                              }
                              onPress={() =>
                                selecionarProblema(
                                  item.item_garantia_id
                                )
                              }
                              style={[
                                styles.problemCard,

                                ativo &&
                                  styles.problemCardActive,

                                analiseConfirmada &&
                                  !ativo &&
                                  styles.optionDisabled,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.problemTitle,

                                  ativo &&
                                    styles.problemTitleActive,
                                ]}
                              >
                                {
                                  item.manifestacao_patologica
                                }
                              </Text>

                              <Ionicons
                                name={
                                  ativo
                                    ? 'radio-button-on'
                                    : 'radio-button-off'
                                }
                                size={20}
                                color={
                                  ativo
                                    ? '#FFFFFF'
                                    : '#8995A5'
                                }
                              />
                            </TouchableOpacity>
                          );
                        }
                      )}
                    </View>
                  </>
                ) : null}

                {/* CALCULAR */}

                {!analiseConfirmada ? (
                  <TouchableOpacity
                    style={[
                      styles.calculateButton,

                      (!itemSelecionadoId ||
                        calculando) &&
                        styles.buttonDisabled,
                    ]}
                    disabled={
                      !itemSelecionadoId ||
                      calculando
                    }
                    onPress={
                      calcularGarantia
                    }
                  >
                    {calculando ? (
                      <ActivityIndicator
                        size="small"
                        color="#FFFFFF"
                      />
                    ) : (
                      <Ionicons
                        name="calculator-outline"
                        size={20}
                        color="#FFFFFF"
                      />
                    )}

                    <Text
                      style={
                        styles.calculateButtonText
                      }
                    >
                      {calculando
                        ? 'Calculando...'
                        : 'Calcular garantia'}
                    </Text>
                  </TouchableOpacity>
                ) : null}

                {erroAnalise ? (
                  <View
                    style={
                      styles.messageError
                    }
                  >
                    <Text
                      style={
                        styles.messageErrorText
                      }
                    >
                      {erroAnalise}
                    </Text>
                  </View>
                ) : null}

                {sucessoAnalise ? (
                  <View
                    style={
                      styles.messageSuccess
                    }
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#287A46"
                    />

                    <Text
                      style={
                        styles.messageSuccessText
                      }
                    >
                      {sucessoAnalise}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* ==============================================
                  RESULTADO GARANTIA
              ============================================== */}

              {resultadoGarantia ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Resultado da garantia
                  </Text>

                  <View
                    style={[
                      styles.warrantyResultCard,

                      estiloResultadoGarantia(
                        resultadoGarantia.status_garantia
                      ),
                    ]}
                  >
                    <View
                      style={
                        styles.warrantyResultHeader
                      }
                    >
                      <View
                        style={
                          styles.warrantyIcon
                        }
                      >
                        <Ionicons
                          name="shield-checkmark-outline"
                          size={24}
                          color="#0B2447"
                        />
                      </View>

                      <View>
                        <Text
                          style={
                            styles.warrantySmallLabel
                          }
                        >
                          RESULTADO
                        </Text>

                        <Text
                          style={
                            styles.warrantyResultTitle
                          }
                        >
                          {textoGarantia(
                            resultadoGarantia.status_garantia
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.warrantyInfoGrid
                      }
                    >
                      <WarrantyInfo
                        label="Data-base"
                        value={
                          formatarData(
                            resultadoGarantia.data_base
                          )
                        }
                      />

                      <WarrantyInfo
                        label="Prazo"
                        value={
                          resultadoGarantia.prazo_quantidade !==
                          null
                            ? `${resultadoGarantia.prazo_quantidade} ${
                                resultadoGarantia.prazo_unidade ??
                                ''
                              }`
                            : '-'
                        }
                      />

                      <WarrantyInfo
                        label="Data limite"
                        value={
                          formatarData(
                            resultadoGarantia.data_limite_garantia
                          )
                        }
                      />

                      <WarrantyInfo
                        label="Dias restantes"
                        value={
                          resultadoGarantia.dias_restantes !==
                          null
                            ? String(
                                resultadoGarantia.dias_restantes
                              )
                            : '-'
                        }
                      />
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.confirmButton,

                        analiseConfirmada &&
                          styles.confirmedButton,

                        confirmando &&
                          styles.buttonDisabled,
                      ]}
                      disabled={
                        analiseConfirmada ||
                        confirmando
                      }
                      onPress={
                        confirmarAnalise
                      }
                    >
                      <Ionicons
                        name={
                          analiseConfirmada
                            ? 'checkmark-circle'
                            : 'checkmark-circle-outline'
                        }
                        size={21}
                        color="#FFFFFF"
                      />

                      <Text
                        style={
                          styles.confirmButtonText
                        }
                      >
                        {analiseConfirmada
                          ? 'Análise confirmada'
                          : confirmando
                          ? 'Confirmando...'
                          : 'Confirmar análise'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              ) : null}

              {/* =================================================
                  VISTORIA
              ================================================= */}

              {analiseConfirmada &&
              dentroDaGarantia ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Vistoria
                  </Text>

                  <View
                    style={
                      styles.vistoriaCard
                    }
                  >
                    {/* ===========================================
                        DISPONIBILIDADE DO CLIENTE
                    =========================================== */}

                    <View
                      style={
                        styles.disponibilidadeClienteBox
                      }
                    >
                      <View
                        style={
                          styles.disponibilidadeClienteHeader
                        }
                      >
                        <View
                          style={
                            styles.disponibilidadeIcon
                          }
                        >
                          <Ionicons
                            name="time-outline"
                            size={22}
                            color="#0B2447"
                          />
                        </View>

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.disponibilidadeClienteLabel
                            }
                          >
                            DISPONIBILIDADE INFORMADA PELO CLIENTE
                          </Text>

                          <Text
                            style={
                              styles.disponibilidadeClienteTexto
                            }
                          >
                            {solicitacao.disponibilidade_visita ||
                              'O cliente não informou uma disponibilidade específica.'}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={
                          styles.disponibilidadeAviso
                        }
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={17}
                          color="#0B5EA8"
                        />

                        <Text
                          style={
                            styles.disponibilidadeAvisoTexto
                          }
                        >
                          Utilize a disponibilidade informada pelo cliente como referência para definir a data e o horário da vistoria.
                        </Text>
                      </View>
                    </View>

                    {/* ===========================================
                        AGENDAMENTO ATUAL
                    =========================================== */}

                    {agendamento ? (
                      <View
                        style={
                          styles.agendamentoAtual
                        }
                      >
                        <View
                          style={
                            styles.agendamentoTituloLinha
                          }
                        >
                          <View
                            style={
                              styles.agendamentoCheckIcon
                            }
                          >
                            <Ionicons
                              name="checkmark"
                              size={18}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.agendamentoTitulo
                              }
                            >
                              Vistoria agendada
                            </Text>

                            <Text
                              style={
                                styles.agendamentoSubtitulo
                              }
                            >
                              Este agendamento já está registrado no protocolo.
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.agendamentoInfoGrid
                          }
                        >
                          <WarrantyInfo
                            label="Data"
                            value={
                              formatarData(
                                agendamento.data_vistoria
                              )
                            }
                          />

                          <WarrantyInfo
                            label="Horário"
                            value={
                              formatarHora(
                                agendamento.hora_vistoria
                              )
                            }
                          />

                          <WarrantyInfo
                            label="Responsável"
                            value={
                              agendamento.responsavel_vistoria_nome ||
                              '-'
                            }
                          />
                        </View>

                        {agendamento.observacao_vistoria ? (
                          <View
                            style={
                              styles.observacaoAtual
                            }
                          >
                            <Text
                              style={
                                styles.inputLabel
                              }
                            >
                              OBSERVAÇÃO DO AGENDAMENTO
                            </Text>

                            <Text
                              style={
                                styles.observacaoAtualText
                              }
                            >
                              {
                                agendamento.observacao_vistoria
                              }
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* ===========================================
                        INICIAR VISTORIA
                    =========================================== */}

                    {solicitacao.status ===
                    'vistoria_agendada' ? (
                      <View
                        style={
                          styles.iniciarVistoriaBox
                        }
                      >
                        <View
                          style={
                            styles.iniciarVistoriaHeader
                          }
                        >
                          <Ionicons
                            name="clipboard-outline"
                            size={22}
                            color="#0B2447"
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.iniciarVistoriaTitle
                              }
                            >
                              Realizar vistoria
                            </Text>

                            <Text
                              style={
                                styles.iniciarVistoriaText
                              }
                            >
                              Quando a equipe estiver no imóvel, inicie a vistoria para registrar a avaliação técnica.
                            </Text>
                          </View>
                        </View>

                        {erroInicioVistoria ? (
                          <View
                            style={
                              styles.messageError
                            }
                          >
                            <Ionicons
                              name="alert-circle-outline"
                              size={19}
                              color="#9A3232"
                            />

                            <Text
                              style={
                                styles.messageErrorText
                              }
                            >
                              {
                                erroInicioVistoria
                              }
                            </Text>
                          </View>
                        ) : null}

                        <TouchableOpacity
                          style={[
                            styles.iniciarVistoriaButton,

                            iniciandoVistoria &&
                              styles.buttonDisabled,
                          ]}
                          disabled={
                            iniciandoVistoria
                          }
                          onPress={
                            iniciarVistoria
                          }
                        >
                          {iniciandoVistoria ? (
                            <ActivityIndicator
                              size="small"
                              color="#FFFFFF"
                            />
                          ) : (
                            <Ionicons
                              name="play-circle-outline"
                              size={22}
                              color="#FFFFFF"
                            />
                          )}

                          <Text
                            style={
                              styles.iniciarVistoriaButtonText
                            }
                          >
                            {iniciandoVistoria
                              ? 'Iniciando...'
                              : 'Iniciar vistoria'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}

                    {/* ===========================================
                        FORMULÁRIO DA VISTORIA EM ANDAMENTO
                    =========================================== */}

                    {solicitacao.status ===
                    'em_vistoria' ? (
                      <View
                        style={
                          styles.formularioVistoriaBox
                        }
                      >
                        <View
                          style={
                            styles.formularioVistoriaHeader
                          }
                        >
                          <View
                            style={
                              styles.formularioVistoriaIcon
                            }
                          >
                            <Ionicons
                              name="clipboard-outline"
                              size={22}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.formularioVistoriaTitle
                              }
                            >
                              Vistoria em andamento
                            </Text>

                            <Text
                              style={
                                styles.formularioVistoriaText
                              }
                            >
                              Registre abaixo o que foi constatado durante a visita técnica.
                            </Text>

                            {vistoriaTecnica ? (
                              <Text
                                style={
                                  styles.formularioVistoriaMeta
                                }
                              >
                                Iniciada em{' '}
                                {formatarDataHora(
                                  vistoriaTecnica.iniciada_em
                                )}
                                {' • '}
                                {
                                  vistoriaTecnica.funcionario_nome
                                }
                              </Text>
                            ) : null}
                          </View>
                        </View>

                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          O PROBLEMA RELATADO FOI CONSTATADO?
                        </Text>

                        <View
                          style={
                            styles.constatacaoRow
                          }
                        >
                          <TouchableOpacity
                            style={[
                              styles.constatacaoButton,

                              problemaConstatado ===
                                true &&
                                styles.constatacaoButtonActive,
                            ]}
                            onPress={() => {
                              setProblemaConstatado(
                                true
                              );

                              setErroFormularioVistoria(
                                ''
                              );

                              setSucessoFormularioVistoria(
                                ''
                              );
                            }}
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={19}
                              color={
                                problemaConstatado ===
                                true
                                  ? '#FFFFFF'
                                  : '#287A46'
                              }
                            />

                            <Text
                              style={[
                                styles.constatacaoButtonText,

                                problemaConstatado ===
                                  true &&
                                  styles.constatacaoButtonTextActive,
                              ]}
                            >
                              Sim
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.constatacaoButton,

                              problemaConstatado ===
                                false &&
                                styles.constatacaoButtonActive,
                            ]}
                            onPress={() => {
                              setProblemaConstatado(
                                false
                              );

                              setErroFormularioVistoria(
                                ''
                              );

                              setSucessoFormularioVistoria(
                                ''
                              );
                            }}
                          >
                            <Ionicons
                              name="close-circle-outline"
                              size={19}
                              color={
                                problemaConstatado ===
                                false
                                  ? '#FFFFFF'
                                  : '#9A3232'
                              }
                            />

                            <Text
                              style={[
                                styles.constatacaoButtonText,

                                problemaConstatado ===
                                  false &&
                                  styles.constatacaoButtonTextActive,
                              ]}
                            >
                              Não
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          PARECER TÉCNICO *
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            styles.textArea,
                          ]}
                          value={
                            parecerTecnico
                          }
                          placeholder="Descreva o que foi encontrado durante a vistoria."
                          placeholderTextColor="#9AA6B4"
                          multiline
                          numberOfLines={5}
                          textAlignVertical="top"
                          onChangeText={(
                            texto
                          ) => {
                            setParecerTecnico(
                              texto
                            );

                            setErroFormularioVistoria(
                              ''
                            );

                            setSucessoFormularioVistoria(
                              ''
                            );
                          }}
                        />

                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          SERVIÇO NECESSÁRIO
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            styles.textArea,
                          ]}
                          value={
                            servicoNecessario
                          }
                          placeholder="Descreva o serviço ou intervenção necessária."
                          placeholderTextColor="#9AA6B4"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          onChangeText={(
                            texto
                          ) => {
                            setServicoNecessario(
                              texto
                            );

                            setErroFormularioVistoria(
                              ''
                            );

                            setSucessoFormularioVistoria(
                              ''
                            );
                          }}
                        />

                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          OBSERVAÇÕES DA VISTORIA
                        </Text>

                        <TextInput
                          style={[
                            styles.input,
                            styles.textArea,
                          ]}
                          value={
                            observacoesTecnicas
                          }
                          placeholder="Inclua informações adicionais, se necessário."
                          placeholderTextColor="#9AA6B4"
                          multiline
                          numberOfLines={4}
                          textAlignVertical="top"
                          onChangeText={(
                            texto
                          ) => {
                            setObservacoesTecnicas(
                              texto
                            );

                            setErroFormularioVistoria(
                              ''
                            );

                            setSucessoFormularioVistoria(
                              ''
                            );
                          }}
                        />

                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          FOTOS DA VISTORIA
                        </Text>

                        <Text
                          style={
                            styles.fotosVistoriaAjuda
                          }
                        >
                          Adicione fotos do que foi constatado no imóvel. Você pode selecionar até 10 imagens.
                        </Text>

                        <TouchableOpacity
                          style={
                            styles.adicionarFotosVistoriaButton
                          }
                          onPress={
                            selecionarFotosVistoria
                          }
                          disabled={
                            salvandoFormularioVistoria
                          }
                        >
                          <Ionicons
                            name="images-outline"
                            size={20}
                            color="#0B5EA8"
                          />

                          <Text
                            style={
                              styles.adicionarFotosVistoriaButtonText
                            }
                          >
                            + Adicionar fotos
                          </Text>
                        </TouchableOpacity>

                        {fotosVistoriaPendentes.length >
                        0 ? (
                          <View
                            style={
                              styles.fotosVistoriaSection
                            }
                          >
                            <Text
                              style={
                                styles.fotosVistoriaSubtitulo
                              }
                            >
                              Fotos aguardando salvamento
                            </Text>

                            <View
                              style={
                                styles.fotosVistoriaGrid
                              }
                            >
                              {fotosVistoriaPendentes.map(
                                (
                                  foto,
                                  indice
                                ) => (
                                  <View
                                    key={`${foto.uri}-${indice}`}
                                    style={
                                      styles.fotoVistoriaCard
                                    }
                                  >
                                    <Image
                                      source={{
                                        uri:
                                          foto.uri,
                                      }}
                                      style={
                                        styles.fotoVistoriaImagem
                                      }
                                      resizeMode="cover"
                                    />

                                    <TouchableOpacity
                                      style={
                                        styles.removerFotoVistoriaButton
                                      }
                                      onPress={() =>
                                        removerFotoVistoriaPendente(
                                          foto.uri
                                        )
                                      }
                                    >
                                      <Ionicons
                                        name="close"
                                        size={17}
                                        color="#FFFFFF"
                                      />
                                    </TouchableOpacity>

                                    <View
                                      style={
                                        styles.fotoVistoriaPendenteBadge
                                      }
                                    >
                                      <Text
                                        style={
                                          styles.fotoVistoriaPendenteText
                                        }
                                      >
                                        Aguardando salvar
                                      </Text>
                                    </View>
                                  </View>
                                )
                              )}
                            </View>
                          </View>
                        ) : null}

                        {carregandoFotosVistoria ? (
                          <View
                            style={
                              styles.fotosVistoriaLoading
                            }
                          >
                            <ActivityIndicator
                              size="small"
                              color="#0B5EA8"
                            />

                            <Text
                              style={
                                styles.fotosVistoriaLoadingText
                              }
                            >
                              Carregando fotos...
                            </Text>
                          </View>
                        ) : null}

                        {!carregandoFotosVistoria &&
                        fotosVistoriaSalvas.length >
                          0 ? (
                          <View
                            style={
                              styles.fotosVistoriaSection
                            }
                          >
                            <Text
                              style={
                                styles.fotosVistoriaSubtitulo
                              }
                            >
                              Fotos já salvas
                            </Text>

                            <View
                              style={
                                styles.fotosVistoriaGrid
                              }
                            >
                              {fotosVistoriaSalvas.map(
                                (
                                  foto
                                ) => (
                                  <View
                                    key={
                                      foto.id
                                    }
                                    style={
                                      styles.fotoVistoriaCard
                                    }
                                  >
                                    {foto.url ? (
                                      <Image
                                        source={{
                                          uri:
                                            foto.url,
                                        }}
                                        style={
                                          styles.fotoVistoriaImagem
                                        }
                                        resizeMode="cover"
                                      />
                                    ) : (
                                      <View
                                        style={
                                          styles.fotoVistoriaSemImagem
                                        }
                                      >
                                        <Ionicons
                                          name="image-outline"
                                          size={26}
                                          color="#8995A5"
                                        />
                                      </View>
                                    )}

                                    <View
                                      style={
                                        styles.fotoVistoriaSalvaBadge
                                      }
                                    >
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={13}
                                        color="#287A46"
                                      />

                                      <Text
                                        style={
                                          styles.fotoVistoriaSalvaText
                                        }
                                      >
                                        Salva
                                      </Text>
                                    </View>
                                  </View>
                                )
                              )}
                            </View>
                          </View>
                        ) : null}

                        {erroFormularioVistoria ? (
                          <View
                            style={
                              styles.messageError
                            }
                          >
                            <Ionicons
                              name="alert-circle-outline"
                              size={19}
                              color="#9A3232"
                            />

                            <Text
                              style={
                                styles.messageErrorText
                              }
                            >
                              {
                                erroFormularioVistoria
                              }
                            </Text>
                          </View>
                        ) : null}

                        {sucessoFormularioVistoria ? (
                          <View
                            style={
                              styles.messageSuccess
                            }
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color="#287A46"
                            />

                            <Text
                              style={
                                styles.messageSuccessText
                              }
                            >
                              {
                                sucessoFormularioVistoria
                              }
                            </Text>
                          </View>
                        ) : null}

                        <TouchableOpacity
                          style={[
                            styles.salvarFormularioVistoriaButton,

                            salvandoFormularioVistoria &&
                              styles.buttonDisabled,
                          ]}
                          disabled={
                            salvandoFormularioVistoria
                          }
                          onPress={
                            salvarFormularioVistoria
                          }
                        >
                          {salvandoFormularioVistoria ? (
                            <ActivityIndicator
                              size="small"
                              color="#FFFFFF"
                            />
                          ) : (
                            <Ionicons
                              name="save-outline"
                              size={20}
                              color="#FFFFFF"
                            />
                          )}

                          <Text
                            style={
                              styles.salvarFormularioVistoriaButtonText
                            }
                          >
                            {salvandoFormularioVistoria
                              ? 'Salvando...'
                              : fotosVistoriaPendentes.length >
                                  0
                                ? 'Salvar vistoria e fotos'
                                : 'Salvar vistoria'}
                          </Text>
                        </TouchableOpacity>

                        <View
                          style={
                            styles.finalizarVistoriaBox
                          }
                        >
                          <View
                            style={
                              styles.finalizarVistoriaHeader
                            }
                          >
                            <Ionicons
                              name="flag-outline"
                              size={22}
                              color="#0B2447"
                            />

                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <Text
                                style={
                                  styles.finalizarVistoriaTitle
                                }
                              >
                                Finalizar vistoria
                              </Text>

                              <Text
                                style={
                                  styles.finalizarVistoriaText
                                }
                              >
                                Selecione o resultado final. Ao finalizar, os dados atuais e as fotos pendentes também serão salvos.
                              </Text>
                            </View>
                          </View>

                          <Text
                            style={
                              styles.inputLabel
                            }
                          >
                            RESULTADO DA VISTORIA
                          </Text>

                          <View
                            style={
                              styles.resultadoVistoriaRow
                            }
                          >
                            <TouchableOpacity
                              style={[
                                styles.resultadoVistoriaButton,

                                resultadoVistoria ===
                                  'aprovada' &&
                                  styles.resultadoVistoriaButtonAprovada,
                              ]}
                              onPress={() => {
                                setResultadoVistoria(
                                  'aprovada'
                                );

                                setJustificativaResultado(
                                  ''
                                );

                                setErroFinalizacaoVistoria(
                                  ''
                                );
                              }}
                            >
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={20}
                                color={
                                  resultadoVistoria ===
                                  'aprovada'
                                    ? '#FFFFFF'
                                    : '#287A46'
                                }
                              />

                              <Text
                                style={[
                                  styles.resultadoVistoriaButtonText,

                                  resultadoVistoria ===
                                    'aprovada' &&
                                    styles.resultadoVistoriaButtonTextActive,
                                ]}
                              >
                                Aprovada para execução
                              </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[
                                styles.resultadoVistoriaButton,

                                resultadoVistoria ===
                                  'nao_aprovada' &&
                                  styles.resultadoVistoriaButtonNaoAprovada,
                              ]}
                              onPress={() => {
                                setResultadoVistoria(
                                  'nao_aprovada'
                                );

                                setErroFinalizacaoVistoria(
                                  ''
                                );
                              }}
                            >
                              <Ionicons
                                name="close-circle-outline"
                                size={20}
                                color={
                                  resultadoVistoria ===
                                  'nao_aprovada'
                                    ? '#FFFFFF'
                                    : '#9A3232'
                                }
                              />

                              <Text
                                style={[
                                  styles.resultadoVistoriaButtonText,

                                  resultadoVistoria ===
                                    'nao_aprovada' &&
                                    styles.resultadoVistoriaButtonTextActive,
                                ]}
                              >
                                Não aprovada
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {resultadoVistoria ===
                          'nao_aprovada' ? (
                            <>
                              <Text
                                style={
                                  styles.inputLabel
                                }
                              >
                                JUSTIFICATIVA *
                              </Text>

                              <TextInput
                                style={[
                                  styles.input,
                                  styles.textArea,
                                ]}
                                value={
                                  justificativaResultado
                                }
                                placeholder="Informe o motivo da não aprovação da vistoria."
                                placeholderTextColor="#9AA6B4"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                onChangeText={(
                                  texto
                                ) => {
                                  setJustificativaResultado(
                                    texto
                                  );

                                  setErroFinalizacaoVistoria(
                                    ''
                                  );
                                }}
                              />
                            </>
                          ) : null}

                          {erroFinalizacaoVistoria ? (
                            <View
                              style={
                                styles.messageError
                              }
                            >
                              <Ionicons
                                name="alert-circle-outline"
                                size={19}
                                color="#9A3232"
                              />

                              <Text
                                style={
                                  styles.messageErrorText
                                }
                              >
                                {
                                  erroFinalizacaoVistoria
                                }
                              </Text>
                            </View>
                          ) : null}

                          <TouchableOpacity
                            style={[
                              styles.finalizarVistoriaButton,

                              finalizandoVistoria &&
                                styles.buttonDisabled,
                            ]}
                            disabled={
                              finalizandoVistoria
                            }
                            onPress={
                              finalizarVistoria
                            }
                          >
                            {finalizandoVistoria ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Ionicons
                                name="checkmark-done-outline"
                                size={21}
                                color="#FFFFFF"
                              />
                            )}

                            <Text
                              style={
                                styles.finalizarVistoriaButtonText
                              }
                            >
                              {finalizandoVistoria
                                ? 'Finalizando...'
                                : 'Finalizar vistoria'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}

                    {solicitacao.status ===
                      'aprovada' ||
                    solicitacao.status ===
                      'nao_aprovada' ? (
                      <View
                        style={[
                          styles.vistoriaFinalizadaBox,

                          solicitacao.status ===
                            'aprovada'
                            ? styles.vistoriaFinalizadaAprovada
                            : styles.vistoriaFinalizadaNaoAprovada,
                        ]}
                      >
                        <Ionicons
                          name={
                            solicitacao.status ===
                            'aprovada'
                              ? 'checkmark-circle'
                              : 'close-circle'
                          }
                          size={24}
                          color={
                            solicitacao.status ===
                            'aprovada'
                              ? '#287A46'
                              : '#9A3232'
                          }
                        />

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.vistoriaFinalizadaTitle
                            }
                          >
                            {solicitacao.status ===
                            'aprovada'
                              ? 'Vistoria aprovada para execução'
                              : 'Vistoria não aprovada'}
                          </Text>

                          <Text
                            style={
                              styles.vistoriaFinalizadaText
                            }
                          >
                            {solicitacao.status ===
                            'aprovada'
                              ? 'A vistoria foi encerrada e o chamado está pronto para seguir para a próxima etapa.'
                              : 'A vistoria foi encerrada e o chamado não seguirá para execução.'}
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {solicitacao.status ===
                      'aprovada' ||
                    solicitacao.status ===
                      'em_execucao' ||
                    solicitacao.status ===
                      'concluida' ? (
                      <View
                        style={
                          styles.execucaoServicoBox
                        }
                      >
                        <View
                          style={
                            styles.execucaoServicoHeader
                          }
                        >
                          <View
                            style={
                              styles.execucaoServicoIcon
                            }
                          >
                            <Ionicons
                              name="construct-outline"
                              size={22}
                              color="#FFFFFF"
                            />
                          </View>

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.execucaoServicoTitle
                              }
                            >
                              Execução do serviço
                            </Text>

                            <Text
                              style={
                                styles.execucaoServicoText
                              }
                            >
                              {solicitacao.status ===
                              'aprovada'
                                ? 'A vistoria foi aprovada. Inicie a execução quando a equipe começar o serviço no imóvel.'
                                : solicitacao.status ===
                                    'em_execucao'
                                  ? 'O atendimento está em execução.'
                                  : 'O serviço foi concluído.'}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={
                            styles.execucaoServicoInfoGrid
                          }
                        >
                          <View
                            style={
                              styles.execucaoServicoInfoCard
                            }
                          >
                            <Text
                              style={
                                styles.execucaoServicoInfoLabel
                              }
                            >
                              Nº DO TERMO DE SERVIÇO
                            </Text>

                            <Text
                              style={
                                styles.execucaoServicoInfoValue
                              }
                            >
                              {execucaoServico?.numero_termo
                                ? String(
                                    execucaoServico.numero_termo
                                  )
                                : 'Será gerado ao iniciar'}
                            </Text>
                          </View>

                          {execucaoServico?.responsavel_servico_nome ? (
                            <View
                              style={
                                styles.execucaoServicoInfoCard
                              }
                            >
                              <Text
                                style={
                                  styles.execucaoServicoInfoLabel
                                }
                              >
                                RESPONSÁVEL
                              </Text>

                              <Text
                                style={
                                  styles.execucaoServicoInfoValue
                                }
                              >
                                {
                                  execucaoServico.responsavel_servico_nome
                                }
                              </Text>
                            </View>
                          ) : null}

                          {execucaoServico?.iniciada_em ? (
                            <View
                              style={
                                styles.execucaoServicoInfoCard
                              }
                            >
                              <Text
                                style={
                                  styles.execucaoServicoInfoLabel
                                }
                              >
                                INÍCIO
                              </Text>

                              <Text
                                style={
                                  styles.execucaoServicoInfoValue
                                }
                              >
                                {formatarDataHora(
                                  execucaoServico.iniciada_em
                                )}
                              </Text>
                            </View>
                          ) : null}
                        </View>

                        {erroExecucao ? (
                          <View
                            style={
                              styles.messageError
                            }
                          >
                            <Ionicons
                              name="alert-circle-outline"
                              size={19}
                              color="#9A3232"
                            />

                            <Text
                              style={
                                styles.messageErrorText
                              }
                            >
                              {erroExecucao}
                            </Text>
                          </View>
                        ) : null}

                        {sucessoExecucao ? (
                          <View
                            style={
                              styles.messageSuccess
                            }
                          >
                            <Ionicons
                              name="checkmark-circle-outline"
                              size={20}
                              color="#287A46"
                            />

                            <Text
                              style={
                                styles.messageSuccessText
                              }
                            >
                              {sucessoExecucao}
                            </Text>
                          </View>
                        ) : null}

                        {solicitacao.status ===
                        'aprovada' ? (
                          <TouchableOpacity
                            style={[
                              styles.iniciarExecucaoButton,

                              iniciandoExecucao &&
                                styles.buttonDisabled,
                            ]}
                            disabled={
                              iniciandoExecucao
                            }
                            onPress={
                              iniciarExecucaoServico
                            }
                          >
                            {iniciandoExecucao ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Ionicons
                                name="play-circle-outline"
                                size={21}
                                color="#FFFFFF"
                              />
                            )}

                            <Text
                              style={
                                styles.iniciarExecucaoButtonText
                              }
                            >
                              {iniciandoExecucao
                                ? 'Iniciando...'
                                : 'Iniciar execução do serviço'}
                            </Text>
                          </TouchableOpacity>
                        ) : solicitacao.status ===
                          'em_execucao' ? (
                          <>
                            <View
                              style={
                                styles.execucaoEmAndamentoBox
                              }
                            >
                              <Ionicons
                                name="hammer-outline"
                                size={20}
                                color="#0B5EA8"
                              />

                              <Text
                                style={
                                  styles.execucaoEmAndamentoText
                                }
                              >
                                Execução em andamento
                              </Text>
                            </View>

                            <View
                              style={
                                styles.formularioExecucaoBox
                              }
                            >
                              <View
                                style={
                                  styles.formularioExecucaoHeader
                                }
                              >
                                <Ionicons
                                  name="build-outline"
                                  size={22}
                                  color="#0B2447"
                                />

                                <View
                                  style={{
                                    flex: 1,
                                  }}
                                >
                                  <Text
                                    style={
                                      styles.formularioExecucaoTitle
                                    }
                                  >
                                    Registro da execução
                                  </Text>

                                  <Text
                                    style={
                                      styles.formularioExecucaoText
                                    }
                                  >
                                    Registre a solução aplicada no imóvel e as observações do serviço.
                                  </Text>
                                </View>
                              </View>

                              <Text
                                style={
                                  styles.inputLabel
                                }
                              >
                                SOLUÇÃO TÉCNICA *
                              </Text>

                              <TextInput
                                style={[
                                  styles.input,
                                  styles.textArea,
                                ]}
                                value={
                                  solucaoTecnicaExecucao
                                }
                                placeholder="Descreva o serviço executado e a solução aplicada."
                                placeholderTextColor="#9AA6B4"
                                multiline
                                numberOfLines={5}
                                textAlignVertical="top"
                                onChangeText={(
                                  texto
                                ) => {
                                  setSolucaoTecnicaExecucao(
                                    texto
                                  );

                                  setErroFormularioExecucao(
                                    ''
                                  );

                                  setSucessoFormularioExecucao(
                                    ''
                                  );
                                }}
                              />

                              <Text
                                style={
                                  styles.inputLabel
                                }
                              >
                                OBSERVAÇÕES DA EXECUÇÃO
                              </Text>

                              <TextInput
                                style={[
                                  styles.input,
                                  styles.textArea,
                                ]}
                                value={
                                  observacoesExecucao
                                }
                                placeholder="Inclua informações adicionais sobre a execução, se necessário."
                                placeholderTextColor="#9AA6B4"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                                onChangeText={(
                                  texto
                                ) => {
                                  setObservacoesExecucao(
                                    texto
                                  );

                                  setErroFormularioExecucao(
                                    ''
                                  );

                                  setSucessoFormularioExecucao(
                                    ''
                                  );
                                }}
                              />

                              <Text
                                style={
                                  styles.inputLabel
                                }
                              >
                                FOTOS DA EXECUÇÃO
                              </Text>

                              <Text
                                style={
                                  styles.fotosExecucaoAjuda
                                }
                              >
                                Adicione fotos do serviço executado no imóvel. Você pode selecionar até 10 imagens.
                              </Text>

                              <TouchableOpacity
                                style={
                                  styles.adicionarFotosExecucaoButton
                                }
                                onPress={
                                  selecionarFotosExecucao
                                }
                                disabled={
                                  salvandoExecucao
                                }
                              >
                                <Ionicons
                                  name="images-outline"
                                  size={20}
                                  color="#0B5EA8"
                                />

                                <Text
                                  style={
                                    styles.adicionarFotosExecucaoButtonText
                                  }
                                >
                                  + Adicionar fotos
                                </Text>
                              </TouchableOpacity>

                              {fotosExecucaoPendentes.length >
                              0 ? (
                                <View
                                  style={
                                    styles.fotosExecucaoSection
                                  }
                                >
                                  <Text
                                    style={
                                      styles.fotosExecucaoSubtitulo
                                    }
                                  >
                                    Fotos aguardando salvamento
                                  </Text>

                                  <View
                                    style={
                                      styles.fotosExecucaoGrid
                                    }
                                  >
                                    {fotosExecucaoPendentes.map(
                                      (
                                        foto,
                                        indice
                                      ) => (
                                        <View
                                          key={`${foto.uri}-${indice}`}
                                          style={
                                            styles.fotoExecucaoCard
                                          }
                                        >
                                          <Image
                                            source={{
                                              uri:
                                                foto.uri,
                                            }}
                                            style={
                                              styles.fotoExecucaoImagem
                                            }
                                            resizeMode="cover"
                                          />

                                          <TouchableOpacity
                                            style={
                                              styles.removerFotoExecucaoButton
                                            }
                                            onPress={() =>
                                              removerFotoExecucaoPendente(
                                                foto.uri
                                              )
                                            }
                                          >
                                            <Ionicons
                                              name="close"
                                              size={17}
                                              color="#FFFFFF"
                                            />
                                          </TouchableOpacity>

                                          <View
                                            style={
                                              styles.fotoExecucaoPendenteBadge
                                            }
                                          >
                                            <Text
                                              style={
                                                styles.fotoExecucaoPendenteText
                                              }
                                            >
                                              Aguardando salvar
                                            </Text>
                                          </View>
                                        </View>
                                      )
                                    )}
                                  </View>
                                </View>
                              ) : null}

                              {carregandoFotosExecucao ? (
                                <View
                                  style={
                                    styles.fotosExecucaoLoading
                                  }
                                >
                                  <ActivityIndicator
                                    size="small"
                                    color="#0B5EA8"
                                  />

                                  <Text
                                    style={
                                      styles.fotosExecucaoLoadingText
                                    }
                                  >
                                    Carregando fotos...
                                  </Text>
                                </View>
                              ) : null}

                              {!carregandoFotosExecucao &&
                              fotosExecucaoSalvas.length >
                                0 ? (
                                <View
                                  style={
                                    styles.fotosExecucaoSection
                                  }
                                >
                                  <Text
                                    style={
                                      styles.fotosExecucaoSubtitulo
                                    }
                                  >
                                    Fotos já salvas
                                  </Text>

                                  <View
                                    style={
                                      styles.fotosExecucaoGrid
                                    }
                                  >
                                    {fotosExecucaoSalvas.map(
                                      (
                                        foto
                                      ) => (
                                        <View
                                          key={
                                            foto.id
                                          }
                                          style={
                                            styles.fotoExecucaoCard
                                          }
                                        >
                                          {foto.url ? (
                                            <Image
                                              source={{
                                                uri:
                                                  foto.url,
                                              }}
                                              style={
                                                styles.fotoExecucaoImagem
                                              }
                                              resizeMode="cover"
                                            />
                                          ) : (
                                            <View
                                              style={
                                                styles.fotoExecucaoSemImagem
                                              }
                                            >
                                              <Ionicons
                                                name="image-outline"
                                                size={26}
                                                color="#8995A5"
                                              />
                                            </View>
                                          )}

                                          <View
                                            style={
                                              styles.fotoExecucaoSalvaBadge
                                            }
                                          >
                                            <Ionicons
                                              name="checkmark-circle"
                                              size={13}
                                              color="#287A46"
                                            />

                                            <Text
                                              style={
                                                styles.fotoExecucaoSalvaText
                                              }
                                            >
                                              Salva
                                            </Text>
                                          </View>
                                        </View>
                                      )
                                    )}
                                  </View>
                                </View>
                              ) : null}

                              {erroFormularioExecucao ? (
                                <View
                                  style={
                                    styles.messageError
                                  }
                                >
                                  <Ionicons
                                    name="alert-circle-outline"
                                    size={19}
                                    color="#9A3232"
                                  />

                                  <Text
                                    style={
                                      styles.messageErrorText
                                    }
                                  >
                                    {
                                      erroFormularioExecucao
                                    }
                                  </Text>
                                </View>
                              ) : null}

                              {sucessoFormularioExecucao ? (
                                <View
                                  style={
                                    styles.messageSuccess
                                  }
                                >
                                  <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#287A46"
                                  />

                                  <Text
                                    style={
                                      styles.messageSuccessText
                                    }
                                  >
                                    {
                                      sucessoFormularioExecucao
                                    }
                                  </Text>
                                </View>
                              ) : null}

                              <TouchableOpacity
                                style={[
                                  styles.salvarExecucaoButton,

                                  salvandoExecucao &&
                                    styles.buttonDisabled,
                                ]}
                                disabled={
                                  salvandoExecucao
                                }
                                onPress={
                                  salvarExecucaoServico
                                }
                              >
                                {salvandoExecucao ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                  />
                                ) : (
                                  <Ionicons
                                    name="save-outline"
                                    size={20}
                                    color="#FFFFFF"
                                  />
                                )}

                                <Text
                                  style={
                                    styles.salvarExecucaoButtonText
                                  }
                                >
                                  {salvandoExecucao
                                    ? 'Salvando...'
                                    : fotosExecucaoPendentes.length >
                                        0
                                      ? 'Salvar execução e fotos'
                                      : 'Salvar execução'}
                                </Text>
                              </TouchableOpacity>

                              <View
                                style={
                                  styles.finalizarExecucaoBox
                                }
                              >
                                <View
                                  style={
                                    styles.finalizarExecucaoHeader
                                  }
                                >
                                  <Ionicons
                                    name="flag-outline"
                                    size={22}
                                    color="#0B2447"
                                  />

                                  <View
                                    style={{
                                      flex: 1,
                                    }}
                                  >
                                    <Text
                                      style={
                                        styles.finalizarExecucaoTitle
                                      }
                                    >
                                      Finalizar serviço
                                    </Text>

                                    <Text
                                      style={
                                        styles.finalizarExecucaoText
                                      }
                                    >
                                      Confirme a conclusão do serviço. A data e o horário de conclusão serão registrados automaticamente.
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  style={
                                    styles.inputLabel
                                  }
                                >
                                  CONCLUSÃO
                                </Text>

                                <View
                                  style={
                                    styles.conclusaoExecucaoRow
                                  }
                                >
                                  <TouchableOpacity
                                    style={[
                                      styles.conclusaoExecucaoButton,

                                      conclusaoExecucao ===
                                        'total' &&
                                        styles.conclusaoExecucaoButtonTotal,
                                    ]}
                                    onPress={() => {
                                      setConclusaoExecucao(
                                        'total'
                                      );

                                      setErroFinalizacaoExecucao(
                                        ''
                                      );
                                    }}
                                  >
                                    <Ionicons
                                      name="checkmark-circle-outline"
                                      size={20}
                                      color={
                                        conclusaoExecucao ===
                                        'total'
                                          ? '#FFFFFF'
                                          : '#287A46'
                                      }
                                    />

                                    <Text
                                      style={[
                                        styles.conclusaoExecucaoButtonText,

                                        conclusaoExecucao ===
                                          'total' &&
                                          styles.conclusaoExecucaoButtonTextActive,
                                      ]}
                                    >
                                      Total
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={[
                                      styles.conclusaoExecucaoButton,

                                      conclusaoExecucao ===
                                        'improcedente' &&
                                        styles.conclusaoExecucaoButtonImprocedente,
                                    ]}
                                    onPress={() => {
                                      setConclusaoExecucao(
                                        'improcedente'
                                      );

                                      setErroFinalizacaoExecucao(
                                        ''
                                      );
                                    }}
                                  >
                                    <Ionicons
                                      name="close-circle-outline"
                                      size={20}
                                      color={
                                        conclusaoExecucao ===
                                        'improcedente'
                                          ? '#FFFFFF'
                                          : '#9A3232'
                                      }
                                    />

                                    <Text
                                      style={[
                                        styles.conclusaoExecucaoButtonText,

                                        conclusaoExecucao ===
                                          'improcedente' &&
                                          styles.conclusaoExecucaoButtonTextActive,
                                      ]}
                                    >
                                      Improcedente
                                    </Text>
                                  </TouchableOpacity>
                                </View>

                                {erroFinalizacaoExecucao ? (
                                  <View
                                    style={
                                      styles.messageError
                                    }
                                  >
                                    <Ionicons
                                      name="alert-circle-outline"
                                      size={19}
                                      color="#9A3232"
                                    />

                                    <Text
                                      style={
                                        styles.messageErrorText
                                      }
                                    >
                                      {
                                        erroFinalizacaoExecucao
                                      }
                                    </Text>
                                  </View>
                                ) : null}

                                {sucessoFinalizacaoExecucao ? (
                                  <View
                                    style={
                                      styles.messageSuccess
                                    }
                                  >
                                    <Ionicons
                                      name="checkmark-circle-outline"
                                      size={20}
                                      color="#287A46"
                                    />

                                    <Text
                                      style={
                                        styles.messageSuccessText
                                      }
                                    >
                                      {
                                        sucessoFinalizacaoExecucao
                                      }
                                    </Text>
                                  </View>
                                ) : null}

                                <TouchableOpacity
                                  style={[
                                    styles.finalizarExecucaoButton,

                                    finalizandoExecucao &&
                                      styles.buttonDisabled,
                                  ]}
                                  disabled={
                                    finalizandoExecucao
                                  }
                                  onPress={
                                    finalizarExecucaoServico
                                  }
                                >
                                  {finalizandoExecucao ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#FFFFFF"
                                    />
                                  ) : (
                                    <Ionicons
                                      name="checkmark-done-outline"
                                      size={21}
                                      color="#FFFFFF"
                                    />
                                  )}

                                  <Text
                                    style={
                                      styles.finalizarExecucaoButtonText
                                    }
                                  >
                                    {finalizandoExecucao
                                      ? 'Finalizando...'
                                      : 'Finalizar serviço'}
                                  </Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          </>
                        ) : (
                          <View
                            style={
                              styles.execucaoConcluidaBox
                            }
                          >
                            <Ionicons
                              name="checkmark-circle"
                              size={26}
                              color="#287A46"
                            />

                            <View
                              style={{
                                flex: 1,
                              }}
                            >
                              <Text
                                style={
                                  styles.execucaoConcluidaTitle
                                }
                              >
                                Serviço concluído
                              </Text>

                              <Text
                                style={
                                  styles.execucaoConcluidaText
                                }
                              >
                                A execução foi encerrada e o chamado foi concluído.
                              </Text>

                              {execucaoServico?.conclusao ? (
                                <Text
                                  style={
                                    styles.execucaoConcluidaInfo
                                  }
                                >
                                  Conclusão:{' '}
                                  {execucaoServico.conclusao ===
                                  'total'
                                    ? 'Total'
                                    : 'Improcedente'}
                                </Text>
                              ) : null}

                              {execucaoServico?.concluida_em ? (
                                <Text
                                  style={
                                    styles.execucaoConcluidaInfo
                                  }
                                >
                                  Data da conclusão:{' '}
                                  {formatarDataHora(
                                    execucaoServico.concluida_em
                                  )}
                                </Text>
                              ) : null}
                            </View>
                          </View>
                        )}

                        {solicitacao.status ===
                        'concluida' ? (
                          <View
                            style={
                              styles.form03Box
                            }
                          >
                            <View
                              style={
                                styles.form03Header
                              }
                            >
                              <View
                                style={
                                  styles.form03Icon
                                }
                              >
                                <Ionicons
                                  name="document-text-outline"
                                  size={22}
                                  color="#FFFFFF"
                                />
                              </View>

                              <View
                                style={{
                                  flex: 1,
                                }}
                              >
                                <Text
                                  style={
                                    styles.form03Title
                                  }
                                >
                                  FORM 03 — Termo de Vistoria e Execução
                                </Text>

                                <Text
                                  style={
                                    styles.form03Text
                                  }
                                >
                                  Confira os dados que serão usados para gerar o documento antes de criar o PDF.
                                </Text>
                              </View>
                            </View>

                            {!dadosForm03 ? (
                              <TouchableOpacity
                                style={[
                                  styles.form03Button,

                                  carregandoForm03 &&
                                    styles.buttonDisabled,
                                ]}
                                disabled={
                                  carregandoForm03
                                }
                                onPress={
                                  carregarDadosForm03
                                }
                              >
                                {carregandoForm03 ? (
                                  <ActivityIndicator
                                    size="small"
                                    color="#FFFFFF"
                                  />
                                ) : (
                                  <Ionicons
                                    name="search-outline"
                                    size={20}
                                    color="#FFFFFF"
                                  />
                                )}

                                <Text
                                  style={
                                    styles.form03ButtonText
                                  }
                                >
                                  {carregandoForm03
                                    ? 'Carregando...'
                                    : 'Conferir dados do FORM 03'}
                                </Text>
                              </TouchableOpacity>
                            ) : (
                              <>
                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      PROTOCOLO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.protocolo
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      SOLICITANTE
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.solicitante
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      EMPREENDIMENTO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.empreendimento
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      UNIDADE
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.unidade
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      RESPONSÁVEL PELA VISTORIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.responsavel_vistoria ??
                                        '-'
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      Nº DO TERMO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.numero_termo ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      RESPONSÁVEL PELO SERVIÇO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {
                                        dadosForm03.responsavel_servico ??
                                        '-'
                                      }
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      CONCLUSÃO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.conclusao ===
                                      'total'
                                        ? 'Total'
                                        : dadosForm03.conclusao ===
                                            'improcedente'
                                          ? 'Improcedente'
                                          : '-'}
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  style={
                                    styles.form03SectionTitle
                                  }
                                >
                                  Dados da solicitação
                                </Text>

                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      DATA DA RECLAMAÇÃO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarDataHora(
                                        dadosForm03.data_reclamacao
                                      )}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      CONTATO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.telefone ??
                                        '-'}
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03SubValue
                                      }
                                    >
                                      {dadosForm03.email ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      DISPONIBILIDADE
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.disponibilidade ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      LOCAL / CÔMODO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.comodo ??
                                        '-'}
                                    </Text>
                                  </View>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    PROBLEMA RELATADO
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {
                                      dadosForm03.problema_relatado
                                    }
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.form03SectionTitle
                                  }
                                >
                                  Vistoria
                                </Text>

                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      DATA DA VISTORIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarDataHora(
                                        dadosForm03.inicio_vistoria
                                      )}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      CONSTATAÇÃO DO PROBLEMA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.problema_constatado ===
                                      true
                                        ? 'Sim'
                                        : dadosForm03.problema_constatado ===
                                            false
                                          ? 'Não'
                                          : '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      RESULTADO DA VISTORIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.resultado_vistoria ===
                                      'aprovada'
                                        ? 'Aprovada'
                                        : dadosForm03.resultado_vistoria ===
                                            'nao_aprovada'
                                          ? 'Não aprovada'
                                          : '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      FIM DA VISTORIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarDataHora(
                                        dadosForm03.fim_vistoria
                                      )}
                                    </Text>
                                  </View>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    PARECER TÉCNICO
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {dadosForm03.parecer_tecnico ??
                                      '-'}
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    SERVIÇO NECESSÁRIO
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {dadosForm03.servico_necessario ??
                                      '-'}
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    OBSERVAÇÕES DA VISTORIA
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {dadosForm03.observacoes_vistoria ??
                                      '-'}
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.form03SectionTitle
                                  }
                                >
                                  Garantia
                                </Text>

                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      PROBLEMA / CATEGORIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.categoria ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      ELEMENTO CONSTRUTIVO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.elemento_construtivo ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      MANIFESTAÇÃO PATOLÓGICA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.manifestacao_patologica ??
                                        '-'}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      STATUS DA GARANTIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {textoGarantia(
                                        dadosForm03.status_garantia
                                      )}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      PRAZO DA GARANTIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.prazo_quantidade ??
                                        '-'}{' '}
                                      {dadosForm03.prazo_unidade ??
                                        ''}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      VIGÊNCIA ATÉ
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarData(
                                        dadosForm03.data_limite_garantia
                                      )}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      PROCEDÊNCIA
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {dadosForm03.problema_constatado ===
                                      true
                                        ? 'Procedente'
                                        : dadosForm03.problema_constatado ===
                                            false
                                          ? 'Improcedente'
                                          : '-'}
                                    </Text>
                                  </View>
                                </View>

                                <Text
                                  style={
                                    styles.form03SectionTitle
                                  }
                                >
                                  Execução do serviço
                                </Text>

                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      INÍCIO DA EXECUÇÃO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarDataHora(
                                        dadosForm03.inicio_execucao
                                      )}
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03InfoCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      DATA DA CONCLUSÃO
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03Value
                                      }
                                    >
                                      {formatarDataHora(
                                        dadosForm03.data_conclusao
                                      )}
                                    </Text>
                                  </View>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    SOLUÇÃO TÉCNICA
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {
                                      dadosForm03.solucao_tecnica ??
                                      '-'
                                    }
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.form03WideCard
                                  }
                                >
                                  <Text
                                    style={
                                      styles.form03Label
                                    }
                                  >
                                    OBSERVAÇÕES DA EXECUÇÃO
                                  </Text>

                                  <Text
                                    style={
                                      styles.form03Value
                                    }
                                  >
                                    {dadosForm03.observacoes_execucao ??
                                      '-'}
                                  </Text>
                                </View>

                                <Text
                                  style={
                                    styles.form03SectionTitle
                                  }
                                >
                                  Registros e assinaturas
                                </Text>

                                <View
                                  style={
                                    styles.form03FotosResumo
                                  }
                                >
                                  <Ionicons
                                    name="images-outline"
                                    size={18}
                                    color="#0B5EA8"
                                  />

                                  <Text
                                    style={
                                      styles.form03FotosResumoText
                                    }
                                  >
                                    {
                                      dadosForm03.fotos_vistoria
                                        ?.length ??
                                      0
                                    }{' '}
                                    foto(s) da vistoria •{' '}
                                    {
                                      dadosForm03.fotos_execucao
                                        ?.length ??
                                      0
                                    }{' '}
                                    foto(s) da execução
                                  </Text>
                                </View>

                                <View
                                  style={
                                    styles.form03Grid
                                  }
                                >
                                  <View
                                    style={
                                      styles.form03SignatureCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      ASSINATURA DO CLIENTE
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03PendingText
                                      }
                                    >
                                      Pendente
                                    </Text>
                                  </View>

                                  <View
                                    style={
                                      styles.form03SignatureCard
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03Label
                                      }
                                    >
                                      ASSINATURA DO RESPONSÁVEL
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03PendingText
                                      }
                                    >
                                      Pendente
                                    </Text>
                                  </View>
                                </View>

                                <View
                                  style={
                                    styles.messageSuccess
                                  }
                                >
                                  <Ionicons
                                    name="checkmark-circle-outline"
                                    size={20}
                                    color="#287A46"
                                  />

                                  <Text
                                    style={
                                      styles.messageSuccessText
                                    }
                                  >
                                    Dados do FORM 03 carregados com sucesso.
                                  </Text>
                                </View>

                                <TouchableOpacity
                                  style={
                                    styles.form03SecondaryButton
                                  }
                                  onPress={
                                    carregarDadosForm03
                                  }
                                  disabled={
                                    carregandoForm03
                                  }
                                >
                                  <Ionicons
                                    name="refresh-outline"
                                    size={18}
                                    color="#0B5EA8"
                                  />

                                  <Text
                                    style={
                                      styles.form03SecondaryButtonText
                                    }
                                  >
                                    Atualizar dados
                                  </Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[
                                    styles.form03GerarPdfButton,

                                    gerandoPdfForm03 &&
                                      styles.buttonDisabled,
                                  ]}
                                  onPress={
                                    gerarPdfForm03
                                  }
                                  disabled={
                                    gerandoPdfForm03
                                  }
                                >
                                  {gerandoPdfForm03 ? (
                                    <ActivityIndicator
                                      size="small"
                                      color="#FFFFFF"
                                    />
                                  ) : (
                                    <Ionicons
                                      name="document-text-outline"
                                      size={21}
                                      color="#FFFFFF"
                                    />
                                  )}

                                  <Text
                                    style={
                                      styles.form03GerarPdfButtonText
                                    }
                                  >
                                    {gerandoPdfForm03
                                      ? 'Gerando PDF...'
                                      : 'Gerar PDF do FORM 03'}
                                  </Text>
                                </TouchableOpacity>

                                {pdfForm03Uri &&
                                Platform.OS !==
                                  'web' ? (
                                  <TouchableOpacity
                                    style={
                                      styles.form03SecondaryButton
                                    }
                                    onPress={
                                      compartilharPdfForm03
                                    }
                                  >
                                    <Ionicons
                                      name="share-outline"
                                      size={18}
                                      color="#0B5EA8"
                                    />

                                    <Text
                                      style={
                                        styles.form03SecondaryButtonText
                                      }
                                    >
                                      Compartilhar / salvar PDF
                                    </Text>
                                  </TouchableOpacity>
                                ) : null}

                                {pdfForm03Gerado ? (
                                  <View
                                    style={
                                      styles.form03AssinaturaBox
                                    }
                                  >
                                    <Text
                                      style={
                                        styles.form03AssinaturaTitle
                                      }
                                    >
                                      Assinaturas do FORM 03
                                    </Text>

                                    <Text
                                      style={
                                        styles.form03AssinaturaText
                                      }
                                    >
                                      As assinaturas serão realizadas manualmente no aplicativo EMAFE.
                                    </Text>

                                    <TouchableOpacity
                                      style={[
                                        styles.form03ModoButton,

                                        modoAssinaturaForm03 ===
                                          'manual_app' &&
                                          styles.form03ModoButtonActive,
                                      ]}
                                      disabled={
                                        definindoModoAssinatura
                                      }
                                      onPress={() =>
                                        definirModoAssinaturaForm03(
                                          'manual_app'
                                        )
                                      }
                                    >
                                      <Ionicons
                                        name="create-outline"
                                        size={21}
                                        color={
                                          modoAssinaturaForm03 ===
                                          'manual_app'
                                            ? '#FFFFFF'
                                            : '#0B2447'
                                        }
                                      />

                                      <View
                                        style={{
                                          flex: 1,
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.form03ModoButtonTitle,

                                            modoAssinaturaForm03 ===
                                              'manual_app' &&
                                              styles.form03ModoButtonTitleActive,
                                          ]}
                                        >
                                          Assinar no aplicativo
                                        </Text>

                                        <Text
                                          style={[
                                            styles.form03ModoButtonText,

                                            modoAssinaturaForm03 ===
                                              'manual_app' &&
                                              styles.form03ModoButtonTextActive,
                                          ]}
                                        >
                                          Cliente e responsável assinam manualmente na tela do EMAFE.
                                        </Text>
                                      </View>
                                    </TouchableOpacity>

                                    {definindoModoAssinatura ? (
                                      <View
                                        style={
                                          styles.form03ModoLoading
                                        }
                                      >
                                        <ActivityIndicator
                                          size="small"
                                          color="#0B5EA8"
                                        />

                                        <Text
                                          style={
                                            styles.form03ModoLoadingText
                                          }
                                        >
                                          Salvando escolha...
                                        </Text>
                                      </View>
                                    ) : null}

                                    {modoAssinaturaForm03 ===
                                    'manual_app' ? (
                                      <View
                                        style={
                                          styles.assinaturasManuaisBox
                                        }
                                      >
                                        <Text
                                          style={
                                            styles.assinaturasManuaisTitle
                                          }
                                        >
                                          Assinaturas do FORM 03
                                        </Text>

                                        <Text
                                          style={
                                            styles.assinaturasManuaisText
                                          }
                                        >
                                          Cada pessoa assina na sua própria área. O cliente assina na Área do Cliente e o responsável pela execução assina aqui na Área do Funcionário.
                                        </Text>

                                        <View
                                          style={
                                            styles.assinaturaManualCard
                                          }
                                        >
                                          <Text
                                            style={
                                              styles.assinaturaManualCardTitle
                                            }
                                          >
                                            Assinatura do cliente
                                          </Text>

                                          {estadoAssinaturasForm03
                                            ?.assinatura_cliente_svg ? (
                                            <View
                                              style={
                                                styles.assinaturaSalvaBox
                                              }
                                            >
                                              <Ionicons
                                                name="checkmark-circle"
                                                size={22}
                                                color="#287A46"
                                              />

                                              <View
                                                style={{
                                                  flex: 1,
                                                }}
                                              >
                                                <Text
                                                  style={
                                                    styles.assinaturaSalvaTitle
                                                  }
                                                >
                                                  Cliente já assinou
                                                </Text>

                                                <Text
                                                  style={
                                                    styles.assinaturaSalvaText
                                                  }
                                                >
                                                  {estadoAssinaturasForm03
                                                    .assinatura_cliente_nome ??
                                                    'Assinatura registrada na Área do Cliente'}
                                                </Text>
                                              </View>
                                            </View>
                                          ) : (
                                            <View
                                              style={
                                                styles.assinaturaPendenteBox
                                              }
                                            >
                                              <Ionicons
                                                name="time-outline"
                                                size={22}
                                                color="#9A6A00"
                                              />

                                              <View
                                                style={{
                                                  flex: 1,
                                                }}
                                              >
                                                <Text
                                                  style={
                                                    styles.assinaturaPendenteTitle
                                                  }
                                                >
                                                  Aguardando o cliente
                                                </Text>

                                                <Text
                                                  style={
                                                    styles.assinaturaPendenteText
                                                  }
                                                >
                                                  O cliente deve abrir este protocolo na Área do Cliente e assinar o FORM 03 por lá.
                                                </Text>
                                              </View>
                                            </View>
                                          )}
                                        </View>

                                        <View
                                          style={
                                            styles.assinaturaManualCard
                                          }
                                        >
                                          <Text
                                            style={
                                              styles.assinaturaManualCardTitle
                                            }
                                          >
                                            Assinatura do responsável pela execução
                                          </Text>

                                          {estadoAssinaturasForm03
                                            ?.assinatura_funcionario_svg ? (
                                            <View
                                              style={
                                                styles.assinaturaSalvaBox
                                              }
                                            >
                                              <Ionicons
                                                name="checkmark-circle"
                                                size={22}
                                                color="#287A46"
                                              />

                                              <View
                                                style={{
                                                  flex: 1,
                                                }}
                                              >
                                                <Text
                                                  style={
                                                    styles.assinaturaSalvaTitle
                                                  }
                                                >
                                                  Sua assinatura foi salva
                                                </Text>

                                                <Text
                                                  style={
                                                    styles.assinaturaSalvaText
                                                  }
                                                >
                                                  {estadoAssinaturasForm03
                                                    .assinatura_funcionario_nome}
                                                </Text>
                                              </View>
                                            </View>
                                          ) : (
                                            <>
                                              <Text
                                                style={
                                                  styles.assinaturaResponsavelNome
                                                }
                                              >
                                                Responsável:{' '}
                                                {dadosForm03.responsavel_servico ??
                                                  '-'}
                                              </Text>

                                              <SignaturePad
                                                titulo="Assine com o dedo, mouse ou caneta"
                                                salvando={
                                                  salvandoAssinaturaManual ===
                                                  'funcionario'
                                                }
                                                onSave={
                                                  salvarAssinaturaFuncionarioForm03
                                                }
                                              />
                                            </>
                                          )}
                                        </View>

                                        {estadoAssinaturasForm03
                                          ?.assinatura_cliente_svg &&
                                        estadoAssinaturasForm03
                                          ?.assinatura_funcionario_svg ? (
                                          <View
                                            style={
                                              styles.messageSuccess
                                            }
                                          >
                                            <Ionicons
                                              name="checkmark-done-circle-outline"
                                              size={21}
                                              color="#287A46"
                                            />

                                            <Text
                                              style={
                                                styles.messageSuccessText
                                              }
                                            >
                                              As duas assinaturas foram coletadas. Agora o FORM 03 pode ser gerado com as assinaturas.
                                            </Text>
                                          </View>
                                        ) : null}
                                      </View>
                                    ) : null}
                                  </View>
                                ) : null}

                                {mensagemAssinaturaForm03 ? (
                                  <View
                                    style={
                                      styles.messageSuccess
                                    }
                                  >
                                    <Ionicons
                                      name="checkmark-circle-outline"
                                      size={20}
                                      color="#287A46"
                                    />

                                    <Text
                                      style={
                                        styles.messageSuccessText
                                      }
                                    >
                                      {
                                        mensagemAssinaturaForm03
                                      }
                                    </Text>
                                  </View>
                                ) : null}
                              </>
                            )}

                            {erroForm03 ? (
                              <View
                                style={
                                  styles.messageError
                                }
                              >
                                <Ionicons
                                  name="alert-circle-outline"
                                  size={19}
                                  color="#9A3232"
                                />

                                <Text
                                  style={
                                    styles.messageErrorText
                                  }
                                >
                                  {
                                    erroForm03
                                  }
                                </Text>
                              </View>
                            ) : null}
                          </View>
                        ) : null}
                      </View>
                    ) : null}

                    {/* ===========================================
                        DEFINIR DATA E HORÁRIO
                    =========================================== */}

                    {[
                      'em_analise',
                      'vistoria_agendada',
                    ].includes(
                      solicitacao.status
                    ) ? (
                      <>
                    <View
                      style={
                        styles.definirAgendamentoHeader
                      }
                    >
                      <Ionicons
                        name={
                          agendamento
                            ? 'refresh-outline'
                            : 'calendar-outline'
                        }
                        size={21}
                        color="#0B2447"
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.definirAgendamentoTitulo
                          }
                        >
                          {agendamento
                            ? 'Reagendar vistoria'
                            : 'Definir data e horário'}
                        </Text>

                        <Text
                          style={
                            styles.definirAgendamentoTexto
                          }
                        >
                          {agendamento
                            ? 'Altere os dados abaixo somente se for necessário mudar o agendamento.'
                            : 'Escolha uma data e um horário compatíveis com a disponibilidade do cliente.'}
                        </Text>
                      </View>
                    </View>

                    {/* DATA E HORÁRIO */}

                    <View
                      style={
                        styles.inputRow
                      }
                    >
                      <View
                        style={
                          styles.inputColumn
                        }
                      >
                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          DATA DA VISTORIA
                        </Text>

                        <View
                          style={
                            styles.inputComIcone
                          }
                        >
                          <Ionicons
                            name="calendar-outline"
                            size={18}
                            color="#697789"
                          />

                          <TextInput
                            style={
                              styles.inputInterno
                            }
                            value={
                              dataVistoria
                            }
                            placeholder="DD/MM/AAAA"
                            placeholderTextColor="#9AA6B4"
                            keyboardType="numeric"
                            maxLength={10}
                            onChangeText={
                              alterarDataVistoria
                            }
                          />
                        </View>
                      </View>

                      <View
                        style={
                          styles.inputColumn
                        }
                      >
                        <Text
                          style={
                            styles.inputLabel
                          }
                        >
                          HORÁRIO
                        </Text>

                        <View
                          style={
                            styles.inputComIcone
                          }
                        >
                          <Ionicons
                            name="time-outline"
                            size={18}
                            color="#697789"
                          />

                          <TextInput
                            style={
                              styles.inputInterno
                            }
                            value={
                              horaVistoria
                            }
                            placeholder="HH:MM"
                            placeholderTextColor="#9AA6B4"
                            keyboardType="numeric"
                            maxLength={5}
                            onChangeText={
                              alterarHoraVistoria
                            }
                          />
                        </View>
                      </View>
                    </View>

                    {/* OBSERVAÇÃO */}

                    <Text
                      style={
                        styles.inputLabel
                      }
                    >
                      OBSERVAÇÃO
                    </Text>

                    <TextInput
                      style={[
                        styles.input,
                        styles.textArea,
                      ]}
                      value={
                        observacaoVistoria
                      }
                      placeholder="Ex.: Entrar em contato com o cliente 30 minutos antes da chegada."
                      placeholderTextColor="#9AA6B4"
                      multiline
                      numberOfLines={4}
                      textAlignVertical="top"
                      onChangeText={(
                        texto
                      ) => {
                        setObservacaoVistoria(
                          texto
                        );

                        setErroVistoria('');
                        setSucessoVistoria('');
                      }}
                    />

                    {/* ERRO */}

                    {erroVistoria ? (
                      <View
                        style={
                          styles.messageError
                        }
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={19}
                          color="#9A3232"
                        />

                        <Text
                          style={
                            styles.messageErrorText
                          }
                        >
                          {erroVistoria}
                        </Text>
                      </View>
                    ) : null}

                    {/* SUCESSO */}

                    {sucessoVistoria ? (
                      <View
                        style={
                          styles.messageSuccess
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="#287A46"
                        />

                        <Text
                          style={
                            styles.messageSuccessText
                          }
                        >
                          {sucessoVistoria}
                        </Text>
                      </View>
                    ) : null}

                    {/* BOTÃO */}

                    <TouchableOpacity
                      style={[
                        styles.agendarButton,

                        salvandoVistoria &&
                          styles.buttonDisabled,
                      ]}
                      disabled={
                        salvandoVistoria
                      }
                      onPress={
                        salvarAgendamentoVistoria
                      }
                    >
                      {salvandoVistoria ? (
                        <ActivityIndicator
                          size="small"
                          color="#FFFFFF"
                        />
                      ) : (
                        <Ionicons
                          name={
                            agendamento
                              ? 'refresh-outline'
                              : 'calendar-outline'
                          }
                          size={20}
                          color="#FFFFFF"
                        />
                      )}

                      <Text
                        style={
                          styles.agendarButtonText
                        }
                      >
                        {salvandoVistoria
                          ? 'Salvando...'
                          : agendamento
                          ? 'Confirmar novo agendamento'
                          : 'Agendar vistoria'}
                      </Text>
                    </TouchableOpacity>
                      </>
                    ) : null}
                  </View>
                </>
              ) : null}

              {foraDaGarantia ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Vistoria
                  </Text>

                  <View
                    style={
                      styles.foraGarantiaBox
                    }
                  >
                    <Ionicons
                      name="alert-circle-outline"
                      size={24}
                      color="#9A3232"
                    />

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.foraGarantiaTitulo
                        }
                      >
                        Atendimento fora da garantia
                      </Text>

                      <Text
                        style={
                          styles.foraGarantiaTexto
                        }
                      >
                        Este item não possui cobertura de garantia vigente. O agendamento de vistoria de garantia não está disponível para este chamado.
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* ==============================================
                  ANDAMENTO
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Andamento
              </Text>

              <View
                style={
                  styles.timelineCard
                }
              >
                <TimelineItem
                  title="Solicitação aberta"
                  subtitle={
                    formatarDataHora(
                      solicitacao.created_at
                    )
                  }
                  icon="checkmark"
                />

                {solicitacao.status !==
                'aberta' ? (
                  <TimelineItem
                    title="Em análise"
                    subtitle="Análise técnica registrada"
                    icon="search-outline"
                  />
                ) : null}

                {agendamento ? (
                  <TimelineItem
                    title="Vistoria agendada"
                    subtitle={`${formatarData(
                      agendamento.data_vistoria
                    )} às ${formatarHora(
                      agendamento.hora_vistoria
                    )}`}
                    icon="calendar-outline"
                  />
                ) : null}
              </View>

              <Text
                style={
                  styles.updateText
                }
              >
                Última atualização:{' '}
                {formatarDataHora(
                  solicitacao.updated_at
                )}
              </Text>
            </>
          ) : null}

          <Text
            style={
              styles.footer
            }
          >
            EMAFE Engenharia • Área interna
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// COMPONENTES
// ============================================================

function InfoItem({
  label,
  value,
}: {
  label: string;
  value:
    | string
    | number;
}) {
  return (
    <View
      style={
        styles.infoItem
      }
    >
      <Text
        style={
          styles.infoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.infoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function WarrantyInfo({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={
        styles.warrantyInfo
      }
    >
      <Text
        style={
          styles.warrantyInfoLabel
        }
      >
        {label}
      </Text>

      <Text
        style={
          styles.warrantyInfoValue
        }
      >
        {value}
      </Text>
    </View>
  );
}

function TimelineItem({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: any;
}) {
  return (
    <View
      style={
        styles.timelineItem
      }
    >
      <View
        style={
          styles.timelineIcon
        }
      >
        <Ionicons
          name={icon}
          size={17}
          color="#FFFFFF"
        />
      </View>

      <View
        style={{
          flex: 1,
        }}
      >
        <Text
          style={
            styles.timelineTitle
          }
        >
          {title}
        </Text>

        <Text
          style={
            styles.timelineDate
          }
        >
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// CAMPO DE ASSINATURA MANUAL
// ============================================================

function SignaturePad({
  titulo,
  onSave,
  salvando,
}: {
  titulo: string;
  onSave: (
    assinaturaSvg: string
  ) => void;
  salvando: boolean;
}) {
  const larguraSvg = 600;
  const alturaSvg = 180;

  const [
    caminhos,
    setCaminhos,
  ] = useState<string[]>([]);

  const [
    caminhoAtual,
    setCaminhoAtual,
  ] = useState('');

  const [
    tamanho,
    setTamanho,
  ] = useState({
    width: 1,
    height: 1,
  });

  const caminhoRef =
    useRef('');

  function converterPonto(
    x: number,
    y: number
  ) {
    return {
      x:
        (x /
          Math.max(
            tamanho.width,
            1
          )) *
        larguraSvg,

      y:
        (y /
          Math.max(
            tamanho.height,
            1
          )) *
        alturaSvg,
    };
  }

  const panResponder =
    useMemo(
      () =>
        PanResponder.create({
          onStartShouldSetPanResponder:
            () => true,

          onMoveShouldSetPanResponder:
            () => true,

          onPanResponderGrant: (
            evento
          ) => {
            const {
              locationX,
              locationY,
            } =
              evento.nativeEvent;

            const ponto =
              converterPonto(
                locationX,
                locationY
              );

            const novo =
              `M ${ponto.x.toFixed(
                2
              )} ${ponto.y.toFixed(
                2
              )}`;

            caminhoRef.current =
              novo;

            setCaminhoAtual(
              novo
            );
          },

          onPanResponderMove: (
            evento
          ) => {
            const {
              locationX,
              locationY,
            } =
              evento.nativeEvent;

            const ponto =
              converterPonto(
                locationX,
                locationY
              );

            caminhoRef.current +=
              ` L ${ponto.x.toFixed(
                2
              )} ${ponto.y.toFixed(
                2
              )}`;

            setCaminhoAtual(
              caminhoRef.current
            );
          },

          onPanResponderRelease:
            () => {
              const caminhoFinal =
                caminhoRef.current;

              if (
                caminhoFinal
              ) {
                setCaminhos(
                  (atuais) => [
                    ...atuais,
                    caminhoFinal,
                  ]
                );
              }

              caminhoRef.current =
                '';

              setCaminhoAtual(
                ''
              );
            },

          onPanResponderTerminate:
            () => {
              const caminhoFinal =
                caminhoRef.current;

              if (
                caminhoFinal
              ) {
                setCaminhos(
                  (atuais) => [
                    ...atuais,
                    caminhoFinal,
                  ]
                );
              }

              caminhoRef.current =
                '';

              setCaminhoAtual(
                ''
              );
            },
        }),
      [
        tamanho.width,
        tamanho.height,
      ]
    );

  function limpar() {
    setCaminhos([]);
    setCaminhoAtual('');
    caminhoRef.current = '';
  }

  function salvar() {
    const todos = [
      ...caminhos,
      ...(caminhoAtual
        ? [caminhoAtual]
        : []),
    ];

    if (
      todos.length === 0
    ) {
      return;
    }

    const paths =
      todos
        .map(
          (caminho) =>
            `<path d="${caminho}" fill="none" stroke="#0B2447" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />`
        )
        .join('');

    const assinatura =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${larguraSvg} ${alturaSvg}" preserveAspectRatio="xMidYMid meet">${paths}</svg>`;

    onSave(
      assinatura
    );
  }

  const possuiAssinatura =
    caminhos.length > 0 ||
    caminhoAtual.length > 0;

  return (
    <View
      style={
        styles.signaturePadContainer
      }
    >
      <Text
        style={
          styles.signaturePadTitle
        }
      >
        {titulo}
      </Text>

      <Text
        style={
          styles.signaturePadHelp
        }
      >
        Desenhe sua assinatura dentro do quadro.
      </Text>

      <View
        style={
          styles.signaturePadArea
        }
        onLayout={(
          evento
        ) => {
          const {
            width,
            height,
          } =
            evento.nativeEvent
              .layout;

          setTamanho({
            width,
            height,
          });
        }}
        {...panResponder.panHandlers}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${larguraSvg} ${alturaSvg}`}
        >
          {caminhos.map(
            (
              caminho,
              index
            ) => (
              <SvgPath
                key={`${index}-${caminho.length}`}
                d={caminho}
                fill="none"
                stroke="#0B2447"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )
          )}

          {caminhoAtual ? (
            <SvgPath
              d={
                caminhoAtual
              }
              fill="none"
              stroke="#0B2447"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </Svg>
      </View>

      <View
        style={
          styles.signaturePadActions
        }
      >
        <TouchableOpacity
          style={
            styles.signatureClearButton
          }
          onPress={limpar}
          disabled={
            salvando
          }
        >
          <Ionicons
            name="trash-outline"
            size={17}
            color="#9A3232"
          />

          <Text
            style={
              styles.signatureClearButtonText
            }
          >
            Limpar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.signatureSaveButton,

            (!possuiAssinatura ||
              salvando) &&
              styles.buttonDisabled,
          ]}
          onPress={salvar}
          disabled={
            !possuiAssinatura ||
            salvando
          }
        >
          {salvando ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="checkmark-outline"
              size={18}
              color="#FFFFFF"
            />
          )}

          <Text
            style={
              styles.signatureSaveButtonText
            }
          >
            {salvando
              ? 'Salvando...'
              : 'Salvar assinatura'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor:
      '#F5F7FA',
  },

  scrollContent: {
    flexGrow: 1,
  },

  content: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 50,
  },

  // ==========================================================
  // TOPO
  // ==========================================================

  topBar: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },

  backText: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '700',
  },

  logo: {
    width: 190,
    height: 65,
  },

  // ==========================================================
  // PROTOCOLO
  // ==========================================================

  protocolCard: {
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 16,
    padding: 22,
    marginTop: 22,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    gap: 15,
  },

  protocolLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '800',
  },

  protocolNumber: {
    color: '#0B2447',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 5,
  },

  protocolDate: {
    color: '#8995A5',
    fontSize: 10,
    marginTop: 6,
  },

  statusBadge: {
    backgroundColor:
      '#FFF4D9',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 8,
  },

  statusText: {
    color: '#24364B',
    fontSize: 10,
    fontWeight: '800',
  },

  // ==========================================================
  // CARDS
  // ==========================================================

  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 20,
  },

  columnCard: {
    flexGrow: 1,
    flexBasis: 350,
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 15,
    padding: 18,
  },

  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  cardHeaderTitle: {
    color: '#0B2447',
    fontSize: 15,
    fontWeight: '800',
  },

  infoItem: {
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor:
      '#EEF1F4',
  },

  infoLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '700',
  },

  infoValue: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },

  sectionTitle: {
    color: '#0B2447',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 27,
    marginBottom: 10,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginTop: 27,
    marginBottom: 10,
  },

  sectionTitleSemMargem: {
    color: '#0B2447',
    fontSize: 17,
    fontWeight: '800',
  },

  card: {
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 15,
    padding: 17,
  },

  inlineInfo: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 10,
  },

  descriptionText: {
    flex: 1,
    color: '#42566D',
    fontSize: 13,
    lineHeight: 21,
  },

  // ==========================================================
  // FOTOS
  // ==========================================================

  photoCount: {
    color: '#8995A5',
    fontSize: 10,
  },

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  photoContainer: {
    width: 180,
    height: 180,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor:
      '#E9EEF4',
  },

  photo: {
    width: '100%',
    height: '100%',
  },

  photoOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor:
      'rgba(11,36,71,0.70)',
    paddingHorizontal: 9,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
  },

  photoNumber: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // ==========================================================
  // ANÁLISE
  // ==========================================================

  analysisCard: {
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 16,
    padding: 20,
  },

  analysisIntro: {
    backgroundColor:
      '#F4F7FA',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 10,
    marginBottom: 20,
  },

  analysisIntroTitle: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '800',
  },

  analysisIntroText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  fieldNumber: {
    color: '#24364B',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 18,
    marginBottom: 10,
  },

  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  optionButton: {
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    backgroundColor:
      '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  optionButtonActive: {
    backgroundColor:
      '#0B2447',
    borderColor:
      '#0B2447',
  },

  optionDisabled: {
    opacity: 0.4,
  },

  optionText: {
    color: '#42566D',
    fontSize: 11,
    fontWeight: '600',
  },

  optionTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  problemList: {
    gap: 8,
  },

  problemCard: {
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    backgroundColor:
      '#F8FAFC',
    borderRadius: 12,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    gap: 10,
  },

  problemCardActive: {
    backgroundColor:
      '#0B2447',
    borderColor:
      '#0B2447',
  },

  problemTitle: {
    flex: 1,
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
  },

  problemTitleActive: {
    color: '#FFFFFF',
  },

  calculateButton: {
    minHeight: 54,
    backgroundColor:
      '#0B5EA8',
    borderRadius: 13,
    marginTop: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
  },

  calculateButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  buttonDisabled: {
    opacity: 0.5,
  },

  // ==========================================================
  // GARANTIA
  // ==========================================================

  warrantyResultCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 19,
  },

  resultadoDentro: {
    backgroundColor:
      '#F0F8F2',
    borderColor:
      '#A8D1B4',
  },

  resultadoFora: {
    backgroundColor:
      '#FFF2F2',
    borderColor:
      '#E1AAAA',
  },

  resultadoNeutro: {
    backgroundColor:
      '#FFFFFF',
    borderColor:
      '#D8DEE7',
  },

  warrantyResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 18,
  },

  warrantyIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor:
      '#FFFFFF',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  warrantySmallLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '800',
  },

  warrantyResultTitle: {
    color: '#0B2447',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 3,
  },

  warrantyInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  warrantyInfo: {
    flexGrow: 1,
    flexBasis: 150,
    backgroundColor:
      '#FFFFFF',
    borderRadius: 11,
    padding: 12,
  },

  warrantyInfoLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '700',
  },

  warrantyInfoValue: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  confirmButton: {
    minHeight: 56,
    backgroundColor:
      '#0B2447',
    borderRadius: 13,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
  },

  confirmedButton: {
    backgroundColor:
      '#287A46',
  },

  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ==========================================================
  // VISTORIA
  // ==========================================================

  vistoriaCard: {
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 16,
    padding: 20,
  },

  // DISPONIBILIDADE

  disponibilidadeClienteBox: {
    backgroundColor:
      '#EEF5FC',
    borderWidth: 1,
    borderColor:
      '#C6D9EB',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  disponibilidadeClienteHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 12,
  },

  disponibilidadeIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      '#FFFFFF',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  disponibilidadeClienteLabel: {
    color: '#697789',
    fontSize: 9,
    fontWeight: '800',
  },

  disponibilidadeClienteTexto: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 21,
    marginTop: 5,
  },

  disponibilidadeAviso: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 7,
    backgroundColor:
      '#FFFFFF',
    borderRadius: 10,
    padding: 11,
    marginTop: 13,
  },

  disponibilidadeAvisoTexto: {
    flex: 1,
    color: '#52667D',
    fontSize: 10,
    lineHeight: 16,
  },

  // AGENDAMENTO SALVO

  agendamentoAtual: {
    backgroundColor:
      '#F0F8F2',
    borderWidth: 1,
    borderColor:
      '#B7DCC2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },

  agendamentoTituloLinha: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },

  agendamentoCheckIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor:
      '#287A46',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  agendamentoTitulo: {
    color: '#287A46',
    fontSize: 14,
    fontWeight: '800',
  },

  agendamentoSubtitulo: {
    color: '#697789',
    fontSize: 10,
    marginTop: 3,
  },

  agendamentoInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  observacaoAtual: {
    backgroundColor:
      '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },

  observacaoAtualText: {
    color: '#42566D',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },

  // FORA DA GARANTIA

  foraGarantiaBox: {
    backgroundColor:
      '#FCEEEE',
    borderWidth: 1,
    borderColor:
      '#D29A9A',
    borderRadius: 14,
    padding: 16,
    marginTop: 8,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  foraGarantiaTitulo: {
    color: '#9A3232',
    fontSize: 14,
    fontWeight: '800',
  },

  foraGarantiaTexto: {
    color: '#7A4A4A',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  // FORMULÁRIO DA VISTORIA

  formularioVistoriaBox: {
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      '#CCD7E3',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
  },

  formularioVistoriaHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 11,
    marginBottom: 18,
  },

  formularioVistoriaIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor:
      '#0B2447',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  formularioVistoriaTitle: {
    color: '#0B2447',
    fontSize: 15,
    fontWeight: '800',
  },

  formularioVistoriaText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  formularioVistoriaMeta: {
    color: '#8995A5',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 6,
  },

  constatacaoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },

  constatacaoButton: {
    minWidth: 110,
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor:
      '#CCD7E3',
    backgroundColor:
      '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 7,
    paddingHorizontal: 18,
  },

  constatacaoButtonActive: {
    backgroundColor:
      '#0B2447',
    borderColor:
      '#0B2447',
  },

  constatacaoButtonText: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
  },

  constatacaoButtonTextActive: {
    color: '#FFFFFF',
  },

  fotosVistoriaAjuda: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: -2,
    marginBottom: 10,
  },

  adicionarFotosVistoriaButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFCBDA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  adicionarFotosVistoriaButtonText: {
    color: '#0B5EA8',
    fontSize: 12,
    fontWeight: '800',
  },

  fotosVistoriaSection: {
    marginBottom: 16,
  },

  fotosVistoriaSubtitulo: {
    color: '#42566D',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 9,
  },

  fotosVistoriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  fotoVistoriaCard: {
    width: 145,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAF0F6',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    position: 'relative',
  },

  fotoVistoriaImagem: {
    width: '100%',
    height: '100%',
  },

  fotoVistoriaSemImagem: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removerFotoVistoriaButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(154, 50, 50, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fotoVistoriaPendenteBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    backgroundColor: 'rgba(11, 36, 71, 0.90)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  fotoVistoriaPendenteText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },

  fotoVistoriaSalvaBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 246, 238, 0.94)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  fotoVistoriaSalvaText: {
    color: '#287A46',
    fontSize: 8,
    fontWeight: '800',
  },

  fotosVistoriaLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },

  fotosVistoriaLoadingText: {
    color: '#697789',
    fontSize: 10,
  },

  execucaoServicoBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CCD7E3',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
  },

  execucaoServicoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 16,
  },

  execucaoServicoIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  execucaoServicoTitle: {
    color: '#0B2447',
    fontSize: 15,
    fontWeight: '800',
  },

  execucaoServicoText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  execucaoServicoInfoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },

  execucaoServicoInfoCard: {
    flexGrow: 1,
    flexBasis: 190,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    padding: 13,
  },

  execucaoServicoInfoLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '800',
  },

  execucaoServicoInfoValue: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 5,
  },

  iniciarExecucaoButton: {
    minHeight: 55,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },

  iniciarExecucaoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  formularioExecucaoBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCD7E3',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
  },

  formularioExecucaoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 17,
  },

  formularioExecucaoTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  formularioExecucaoText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  fotosExecucaoAjuda: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: -2,
    marginBottom: 10,
  },

  adicionarFotosExecucaoButton: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFCBDA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingHorizontal: 16,
    marginBottom: 14,
  },

  adicionarFotosExecucaoButtonText: {
    color: '#0B5EA8',
    fontSize: 12,
    fontWeight: '800',
  },

  fotosExecucaoSection: {
    marginBottom: 16,
  },

  fotosExecucaoSubtitulo: {
    color: '#42566D',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 9,
  },

  fotosExecucaoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  fotoExecucaoCard: {
    width: 145,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAF0F6',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    position: 'relative',
  },

  fotoExecucaoImagem: {
    width: '100%',
    height: '100%',
  },

  fotoExecucaoSemImagem: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  removerFotoExecucaoButton: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(154, 50, 50, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  fotoExecucaoPendenteBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    backgroundColor: 'rgba(11, 36, 71, 0.90)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  fotoExecucaoPendenteText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },

  fotoExecucaoSalvaBadge: {
    position: 'absolute',
    left: 7,
    bottom: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(234, 246, 238, 0.94)',
    borderRadius: 8,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },

  fotoExecucaoSalvaText: {
    color: '#287A46',
    fontSize: 8,
    fontWeight: '800',
  },

  fotosExecucaoLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 14,
  },

  fotosExecucaoLoadingText: {
    color: '#697789',
    fontSize: 10,
  },

  salvarExecucaoButton: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  salvarExecucaoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  finalizarExecucaoBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CCD7E3',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
  },

  finalizarExecucaoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },

  finalizarExecucaoTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  finalizarExecucaoText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  conclusaoExecucaoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  conclusaoExecucaoButton: {
    flexGrow: 1,
    flexBasis: 180,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCD7E3',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },

  conclusaoExecucaoButtonTotal: {
    backgroundColor: '#287A46',
    borderColor: '#287A46',
  },

  conclusaoExecucaoButtonImprocedente: {
    backgroundColor: '#9A3232',
    borderColor: '#9A3232',
  },

  conclusaoExecucaoButtonText: {
    color: '#24364B',
    fontSize: 11,
    fontWeight: '800',
  },

  conclusaoExecucaoButtonTextActive: {
    color: '#FFFFFF',
  },

  finalizarExecucaoButton: {
    minHeight: 55,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  finalizarExecucaoButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  execucaoConcluidaBox: {
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: '#AED7BA',
    borderRadius: 14,
    padding: 16,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  execucaoConcluidaTitle: {
    color: '#287A46',
    fontSize: 14,
    fontWeight: '800',
  },

  execucaoConcluidaText: {
    color: '#567362',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  execucaoConcluidaInfo: {
    color: '#42566D',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },

  form03Box: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CCD7E3',
    borderRadius: 16,
    padding: 18,
    marginTop: 18,
  },

  form03Header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 11,
    marginBottom: 16,
  },

  form03Icon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  form03Title: {
    color: '#0B2447',
    fontSize: 15,
    fontWeight: '800',
  },

  form03Text: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  form03Button: {
    minHeight: 54,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  form03ButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  form03Grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },

  form03InfoCard: {
    flexGrow: 1,
    flexBasis: 235,
    minHeight: 78,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    padding: 12,
  },

  form03WideCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  form03Label: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 6,
  },

  form03Value: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },

  form03SubValue: {
    color: '#697789',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 4,
  },

  form03SectionTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 20,
    marginBottom: 10,
  },

  form03SignatureCard: {
    flexGrow: 1,
    flexBasis: 235,
    minHeight: 72,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#E8D29A',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },

  form03PendingText: {
    color: '#9A6A00',
    fontSize: 12,
    fontWeight: '800',
  },

  form03FotosResumo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: '#EAF0F6',
    borderRadius: 11,
    padding: 12,
    marginTop: 10,
    marginBottom: 12,
  },

  form03FotosResumoText: {
    color: '#42566D',
    fontSize: 11,
    fontWeight: '700',
  },

  form03SecondaryButton: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFCBDA',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 10,
  },

  form03SecondaryButtonText: {
    color: '#0B5EA8',
    fontSize: 11,
    fontWeight: '800',
  },

  form03GerarPdfButton: {
    minHeight: 56,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },

  form03GerarPdfButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  form03AssinaturaBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 14,
    padding: 15,
    marginTop: 14,
  },

  form03AssinaturaTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  form03AssinaturaText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
    marginBottom: 12,
  },

  form03ModoButton: {
    minHeight: 72,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCD7E3',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    padding: 13,
    marginTop: 9,
  },

  form03ModoButtonActive: {
    backgroundColor: '#0B2447',
    borderColor: '#0B2447',
  },

  form03ModoButtonTitle: {
    color: '#0B2447',
    fontSize: 12,
    fontWeight: '800',
  },

  form03ModoButtonTitleActive: {
    color: '#FFFFFF',
  },

  form03ModoButtonText: {
    color: '#697789',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  form03ModoButtonTextActive: {
    color: '#DDE7F2',
  },

  form03ModoLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 12,
  },

  form03ModoLoadingText: {
    color: '#697789',
    fontSize: 10,
  },

  assinaturasManuaisBox: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },

  assinaturasManuaisTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  assinaturasManuaisText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
  },

  assinaturaManualCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 13,
    padding: 14,
    marginTop: 10,
  },

  assinaturaManualCardTitle: {
    color: '#0B2447',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 12,
  },

  assinaturaResponsavelNome: {
    color: '#42566D',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
  },

  assinaturaSalvaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 12,
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: '#AED7BA',
    borderRadius: 11,
  },

  assinaturaPendenteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    padding: 12,
    backgroundColor: '#FFF8E6',
    borderWidth: 1,
    borderColor: '#E8D29A',
    borderRadius: 11,
  },

  assinaturaPendenteTitle: {
    color: '#9A6A00',
    fontSize: 11,
    fontWeight: '800',
  },

  assinaturaPendenteText: {
    color: '#7A6540',
    fontSize: 10,
    lineHeight: 15,
    marginTop: 3,
  },

  assinaturaSalvaTitle: {
    color: '#287A46',
    fontSize: 11,
    fontWeight: '800',
  },

  assinaturaSalvaText: {
    color: '#567362',
    fontSize: 10,
    marginTop: 3,
  },

  signaturePadContainer: {
    marginTop: 4,
  },

  signaturePadTitle: {
    color: '#24364B',
    fontSize: 11,
    fontWeight: '800',
  },

  signaturePadHelp: {
    color: '#8995A5',
    fontSize: 10,
    marginTop: 3,
    marginBottom: 8,
  },

  signaturePadArea: {
    height: 180,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#9EABB8',
    borderRadius: 10,
    overflow: 'hidden',
  },

  signaturePadActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },

  signatureClearButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D9B0B0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
  },

  signatureClearButtonText: {
    color: '#9A3232',
    fontSize: 10,
    fontWeight: '800',
  },

  signatureSaveButton: {
    minHeight: 42,
    borderRadius: 10,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 15,
  },

  signatureSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  execucaoEmAndamentoBox: {
    minHeight: 52,
    borderRadius: 12,
    backgroundColor: '#EAF2FB',
    borderWidth: 1,
    borderColor: '#B9D0EA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  execucaoEmAndamentoText: {
    color: '#0B5EA8',
    fontSize: 12,
    fontWeight: '800',
  },

  finalizarVistoriaBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCD7E3',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
  },

  finalizarVistoriaHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },

  finalizarVistoriaTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  finalizarVistoriaText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 3,
  },

  resultadoVistoriaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },

  resultadoVistoriaButton: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCD7E3',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
  },

  resultadoVistoriaButtonAprovada: {
    backgroundColor: '#287A46',
    borderColor: '#287A46',
  },

  resultadoVistoriaButtonNaoAprovada: {
    backgroundColor: '#9A3232',
    borderColor: '#9A3232',
  },

  resultadoVistoriaButtonText: {
    color: '#24364B',
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },

  resultadoVistoriaButtonTextActive: {
    color: '#FFFFFF',
  },

  finalizarVistoriaButton: {
    minHeight: 55,
    borderRadius: 13,
    backgroundColor: '#0B2447',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },

  finalizarVistoriaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  vistoriaFinalizadaBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    marginBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },

  vistoriaFinalizadaAprovada: {
    backgroundColor: '#EAF6EE',
    borderColor: '#AED7BA',
  },

  vistoriaFinalizadaNaoAprovada: {
    backgroundColor: '#FCEEEE',
    borderColor: '#D29A9A',
  },

  vistoriaFinalizadaTitle: {
    color: '#24364B',
    fontSize: 14,
    fontWeight: '800',
  },

  vistoriaFinalizadaText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  salvarFormularioVistoriaButton: {
    minHeight: 54,
    backgroundColor:
      '#0B2447',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
    marginTop: 8,
  },

  salvarFormularioVistoriaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // INICIAR VISTORIA

  iniciarVistoriaBox: {
    backgroundColor:
      '#F4F7FA',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 14,
    padding: 16,
    marginTop: 18,
    marginBottom: 18,
  },

  iniciarVistoriaHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 10,
  },

  iniciarVistoriaTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
  },

  iniciarVistoriaText: {
    color: '#697789',
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },

  iniciarVistoriaButton: {
    minHeight: 54,
    backgroundColor:
      '#0B2447',
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'center',
    gap: 8,
    marginTop: 16,
  },

  iniciarVistoriaButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // DEFINIR AGENDAMENTO

  definirAgendamentoHeader: {
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 10,
    marginTop: 5,
    marginBottom: 8,
  },

  definirAgendamentoTitulo: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '800',
  },

  definirAgendamentoTexto: {
    color: '#697789',
    fontSize: 10,
    lineHeight: 16,
    marginTop: 3,
  },

  // INPUTS

  inputRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  inputColumn: {
    flexGrow: 1,
    flexBasis: 200,
  },

  inputLabel: {
    color: '#697789',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 10,
  },

  input: {
    width: '100%',
    minHeight: 48,
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 11,
    paddingHorizontal: 13,
    color: '#24364B',
    fontSize: 12,
  },

  inputComIcone: {
    minHeight: 48,
    backgroundColor:
      '#F8FAFC',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 11,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    gap: 8,
  },

  inputInterno: {
    flex: 1,
    height: 46,
    color: '#24364B',
    fontSize: 12,
    borderWidth: 0,
    backgroundColor:
      'transparent',
  },

  textArea: {
    minHeight: 100,
    paddingTop: 13,
  },

  // BOTÃO AGENDAR

  agendarButton: {
    minHeight: 54,
    backgroundColor:
      '#0B5EA8',
    borderRadius: 13,
    flexDirection: 'row',
    justifyContent:
      'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 18,
  },

  agendarButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ==========================================================
  // MENSAGENS
  // ==========================================================

  messageError: {
    backgroundColor:
      '#FCEEEE',
    borderRadius: 11,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 8,
  },

  messageErrorText: {
    flex: 1,
    color: '#9A3232',
    fontSize: 11,
    lineHeight: 17,
  },

  messageSuccess: {
    backgroundColor:
      '#EAF6EE',
    borderRadius: 11,
    padding: 12,
    marginTop: 12,
    flexDirection: 'row',
    alignItems:
      'flex-start',
    gap: 8,
  },

  messageSuccessText: {
    flex: 1,
    color: '#287A46',
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 17,
  },

  // ==========================================================
  // ANDAMENTO
  // ==========================================================

  timelineCard: {
    backgroundColor:
      '#FFFFFF',
    borderWidth: 1,
    borderColor:
      '#D8DEE7',
    borderRadius: 15,
    padding: 17,
    gap: 16,
  },

  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  timelineIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      '#0B2447',
    alignItems: 'center',
    justifyContent:
      'center',
  },

  timelineTitle: {
    color: '#24364B',
    fontSize: 12,
    fontWeight: '700',
  },

  timelineDate: {
    color: '#8995A5',
    fontSize: 10,
    marginTop: 3,
  },

  updateText: {
    color: '#8995A5',
    fontSize: 10,
    textAlign: 'right',
    marginTop: 15,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent:
      'center',
  },

  loadingText: {
    color: '#697789',
    fontSize: 11,
    marginTop: 8,
  },

  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
  },

  loadingInlineText: {
    color: '#697789',
    fontSize: 11,
  },

  // ==========================================================
  // MODAL
  // ==========================================================

  modalOverlay: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.94)',
    alignItems: 'center',
    justifyContent:
      'center',
    padding: 20,
  },

  modalClose: {
    position: 'absolute',
    top: 35,
    right: 25,
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor:
      'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent:
      'center',
    zIndex: 5,
  },

  modalImage: {
    width: '100%',
    height: '82%',
  },

  // ==========================================================
  // RODAPÉ
  // ==========================================================

  footer: {
    color: '#8995A5',
    fontSize: 10,
    textAlign: 'center',
    marginTop: 35,
  },
});