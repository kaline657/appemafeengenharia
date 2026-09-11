import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  router,
  useLocalSearchParams,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

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
                      'em_execucao' ? (
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
                                : 'O atendimento está em execução.'}
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
                        ) : (
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
                        )}
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