import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import Svg, {
  Path as SvgPath,
} from 'react-native-svg';

import { supabase } from '../lib/supabase';

type Solicitacao = {
  solicitacao_id: string;
  protocolo: string;

  cidade?: string | null;
  empreendimento: string;
  unidade: string;

  descricao_problema: string;

  comodo?: string | null;
  telefone_contato?: string | null;
  email_contato?: string | null;
  disponibilidade_visita?: string | null;

  status: string;

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

type AgendamentoVistoria = {
  agendamento_id: string;
  solicitacao_id: string;
  data_vistoria: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  eh_agendamento_atual: boolean;
  agendado_em: string;
  agendado_por_tipo: string | null;
  agendado_por_nome: string | null;
  cancelado_em: string | null;
  cancelado_por_tipo: string | null;
  cancelado_por_nome: string | null;
  motivo_cancelamento: string | null;
};

type HorarioVistoriaDisponivel = {
  data_vistoria: string;
  dia_semana: number;
  nome_dia: string;
  horario_vistoria_id: string;
  hora_inicio: string;
  hora_fim: string;
};

type DiaCalendarioAgenda = {
  iso: string;
  dia: number;
  pertenceAoMes: boolean;
  disponivel: boolean;
};

type AgendaCalendarPickerProps = {
  horarios: HorarioVistoriaDisponivel[];
  dataSelecionada: string;
  horarioSelecionadoId: string;
  onSelecionarData: (data: string) => void;
  onSelecionarHorario: (
    horario: HorarioVistoriaDisponivel
  ) => void;
};

function AgendaCalendarPicker({
  horarios,
  dataSelecionada,
  horarioSelecionadoId,
  onSelecionarData,
  onSelecionarHorario,
}: AgendaCalendarPickerProps) {
  const [
    mesCalendario,
    setMesCalendario,
  ] = useState<Date | null>(null);

  function dataIsoParaLocal(
    iso: string
  ) {
    const [
      ano,
      mes,
      dia,
    ] = iso
      .split('-')
      .map(Number);

    return new Date(
      ano,
      mes - 1,
      dia
    );
  }

  function dataLocalParaIso(
    data: Date
  ) {
    const ano =
      data.getFullYear();

    const mes =
      String(
        data.getMonth() + 1
      ).padStart(2, '0');

    const dia =
      String(
        data.getDate()
      ).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  function formatarDataAgenda(
    iso: string
  ) {
    if (!iso) {
      return '-';
    }

    return dataIsoParaLocal(
      iso
    ).toLocaleDateString(
      'pt-BR',
      {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    );
  }

  function formatarHoraAgenda(
    hora: string
  ) {
    return hora
      ? hora.substring(0, 5)
      : '-';
  }

  useEffect(() => {
    if (
      horarios.length === 0
    ) {
      setMesCalendario(
        null
      );

      return;
    }

    const referencia =
      dataSelecionada ||
      horarios[0].data_vistoria;

    const data =
      dataIsoParaLocal(
        referencia
      );

    setMesCalendario(
      new Date(
        data.getFullYear(),
        data.getMonth(),
        1
      )
    );
  }, [
    horarios,
  ]);

  const datasComHorario =
    useMemo(
      () =>
        new Set(
          horarios.map(
            (item) =>
              item.data_vistoria
          )
        ),
      [horarios]
    );

  const horariosDaData =
    useMemo(
      () =>
        horarios.filter(
          (item) =>
            item.data_vistoria ===
            dataSelecionada
        ),
      [
        horarios,
        dataSelecionada,
      ]
    );

  const limiteMesAnterior =
    useMemo(() => {
      if (
        horarios.length ===
        0
      ) {
        return null;
      }

      const data =
        dataIsoParaLocal(
          horarios[0]
            .data_vistoria
        );

      return new Date(
        data.getFullYear(),
        data.getMonth(),
        1
      );
    }, [horarios]);

  const limiteMesPosterior =
    useMemo(() => {
      if (
        horarios.length ===
        0
      ) {
        return null;
      }

      const data =
        dataIsoParaLocal(
          horarios[
            horarios.length - 1
          ].data_vistoria
        );

      return new Date(
        data.getFullYear(),
        data.getMonth(),
        1
      );
    }, [horarios]);

  const diasDoCalendario =
    useMemo<
      DiaCalendarioAgenda[]
    >(() => {
      if (!mesCalendario) {
        return [];
      }

      const ano =
        mesCalendario.getFullYear();

      const mes =
        mesCalendario.getMonth();

      const primeiroDiaMes =
        new Date(
          ano,
          mes,
          1
        );

      const inicioGrade =
        new Date(
          ano,
          mes,
          1 -
            primeiroDiaMes.getDay()
        );

      const dias:
        DiaCalendarioAgenda[] =
          [];

      for (
        let indice = 0;
        indice < 42;
        indice++
      ) {
        const data =
          new Date(
            inicioGrade
          );

        data.setDate(
          inicioGrade.getDate() +
            indice
        );

        const iso =
          dataLocalParaIso(
            data
          );

        dias.push({
          iso,
          dia:
            data.getDate(),

          pertenceAoMes:
            data.getMonth() ===
              mes &&
            data.getFullYear() ===
              ano,

          disponivel:
            datasComHorario.has(
              iso
            ),
        });
      }

      return dias;
    }, [
      mesCalendario,
      datasComHorario,
    ]);

  const tituloMesCalendario =
    useMemo(() => {
      if (!mesCalendario) {
        return '';
      }

      const texto =
        mesCalendario
          .toLocaleDateString(
            'pt-BR',
            {
              month: 'long',
              year: 'numeric',
            }
          );

      return (
        texto.charAt(0)
          .toUpperCase() +
        texto.slice(1)
      );
    }, [mesCalendario]);

  function compararMeses(
    primeiro: Date,
    segundo: Date
  ) {
    return (
      primeiro.getFullYear() *
        12 +
      primeiro.getMonth() -
      (
        segundo.getFullYear() *
          12 +
        segundo.getMonth()
      )
    );
  }

  const podeVoltarMes =
    !!mesCalendario &&
    !!limiteMesAnterior &&
    compararMeses(
      mesCalendario,
      limiteMesAnterior
    ) > 0;

  const podeAvancarMes =
    !!mesCalendario &&
    !!limiteMesPosterior &&
    compararMeses(
      mesCalendario,
      limiteMesPosterior
    ) < 0;

  function mudarMes(
    quantidade: number
  ) {
    if (!mesCalendario) {
      return;
    }

    setMesCalendario(
      new Date(
        mesCalendario.getFullYear(),
        mesCalendario.getMonth() +
          quantidade,
        1
      )
    );
  }

  if (
    horarios.length === 0 ||
    !mesCalendario
  ) {
    return (
      <View
        style={
          styles.agendaHintBox
        }
      >
        <Ionicons
          name="calendar-outline"
          size={19}
          color="#0B5EA8"
        />

        <Text
          style={
            styles.agendaHintText
          }
        >
          Não há horários disponíveis no período consultado.
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        style={
          styles.calendarCard
        }
      >
        <View
          style={
            styles.calendarHeader
          }
        >
          <TouchableOpacity
            style={[
              styles.calendarArrowButton,

              !podeVoltarMes &&
                styles.calendarArrowButtonDisabled,
            ]}
            disabled={
              !podeVoltarMes
            }
            onPress={() =>
              mudarMes(-1)
            }
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={
                podeVoltarMes
                  ? '#0B2447'
                  : '#B7C0CB'
              }
            />
          </TouchableOpacity>

          <Text
            style={
              styles.calendarMonthTitle
            }
          >
            {tituloMesCalendario}
          </Text>

          <TouchableOpacity
            style={[
              styles.calendarArrowButton,

              !podeAvancarMes &&
                styles.calendarArrowButtonDisabled,
            ]}
            disabled={
              !podeAvancarMes
            }
            onPress={() =>
              mudarMes(1)
            }
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={
                podeAvancarMes
                  ? '#0B2447'
                  : '#B7C0CB'
              }
            />
          </TouchableOpacity>
        </View>

        <View
          style={
            styles.calendarWeekRow
          }
        >
          {[
            'DOM',
            'SEG',
            'TER',
            'QUA',
            'QUI',
            'SEX',
            'SÁB',
          ].map(
            (diaSemana) => (
              <Text
                key={
                  diaSemana
                }
                style={
                  styles.calendarWeekText
                }
              >
                {diaSemana}
              </Text>
            )
          )}
        </View>

        <View
          style={
            styles.calendarGrid
          }
        >
          {diasDoCalendario.map(
            (dia) => {
              const selecionado =
                dataSelecionada ===
                dia.iso;

              const podeSelecionar =
                dia.pertenceAoMes &&
                dia.disponivel;

              return (
                <View
                  key={
                    dia.iso
                  }
                  style={
                    styles.calendarDayWrapper
                  }
                >
                  <TouchableOpacity
                    style={[
                      styles.calendarDay,

                      !dia.pertenceAoMes &&
                        styles.calendarDayOutside,

                      dia.pertenceAoMes &&
                        !dia.disponivel &&
                        styles.calendarDayUnavailable,

                      podeSelecionar &&
                        styles.calendarDayAvailable,

                      selecionado &&
                        styles.calendarDaySelected,
                    ]}
                    disabled={
                      !podeSelecionar
                    }
                    onPress={() =>
                      onSelecionarData(
                        dia.iso
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.calendarDayText,

                        !dia.pertenceAoMes &&
                          styles.calendarDayTextOutside,

                        dia.pertenceAoMes &&
                          !dia.disponivel &&
                          styles.calendarDayTextUnavailable,

                        podeSelecionar &&
                          styles.calendarDayTextAvailable,

                        selecionado &&
                          styles.calendarDayTextSelected,
                      ]}
                    >
                      {dia.dia}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            }
          )}
        </View>

        <View
          style={
            styles.calendarLegend
          }
        >
          <View
            style={
              styles.calendarLegendItem
            }
          >
            <View
              style={
                styles.calendarLegendAvailable
              }
            />

            <Text
              style={
                styles.calendarLegendText
              }
            >
              Data disponível
            </Text>
          </View>

          <View
            style={
              styles.calendarLegendItem
            }
          >
            <View
              style={
                styles.calendarLegendUnavailable
              }
            />

            <Text
              style={
                styles.calendarLegendText
              }
            >
              Indisponível
            </Text>
          </View>
        </View>
      </View>

      {dataSelecionada ? (
        <View
          style={
            styles.timeSelectionCard
          }
        >
          <View
            style={
              styles.timeSelectionHeader
            }
          >
            <Ionicons
              name="time-outline"
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
                  styles.timeSelectionTitle
                }
              >
                Escolha o horário
              </Text>

              <Text
                style={
                  styles.timeSelectionDate
                }
              >
                {formatarDataAgenda(
                  dataSelecionada
                )}
              </Text>
            </View>
          </View>

          <View
            style={
              styles.timeButtonsContainer
            }
          >
            {horariosDaData.map(
              (horario) => {
                const selecionado =
                  horarioSelecionadoId ===
                  horario.horario_vistoria_id;

                return (
                  <TouchableOpacity
                    key={
                      horario.horario_vistoria_id
                    }
                    style={[
                      styles.timeButton,

                      selecionado &&
                        styles.timeButtonSelected,
                    ]}
                    onPress={() =>
                      onSelecionarHorario(
                        horario
                      )
                    }
                  >
                    <Ionicons
                      name={
                        selecionado
                          ? 'checkmark-circle'
                          : 'time-outline'
                      }
                      size={20}
                      color={
                        selecionado
                          ? '#FFFFFF'
                          : '#0B2447'
                      }
                    />

                    <Text
                      style={[
                        styles.timeButtonText,

                        selecionado &&
                          styles.timeButtonTextSelected,
                      ]}
                    >
                      {formatarHoraAgenda(
                        horario.hora_inicio
                      )}{' '}
                      às{' '}
                      {formatarHoraAgenda(
                        horario.hora_fim
                      )}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </View>
      ) : (
        <View
          style={
            styles.agendaHintBox
          }
        >
          <Ionicons
            name="calendar-outline"
            size={19}
            color="#0B5EA8"
          />

          <Text
            style={
              styles.agendaHintText
            }
          >
            Toque em uma data disponível para ver os horários livres.
          </Text>
        </View>
      )}
    </>
  );
}

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

type AgendamentoExecucaoCliente = {
  proposta_id: string;
  solicitacao_id: string;

  data_proposta: string;
  hora_proposta: string;

  data_confirmada: string | null;
  hora_confirmada: string | null;

  status:
    | 'aguardando_cliente'
    | 'confirmada'
    | 'reagendamento_solicitado'
    | 'cancelada'
    | string;

  motivo_reagendamento: string | null;

  respondido_em: string | null;
  created_at: string;
};

type FotoAusenciaCliente = {
  foto_id: string;
  caminho_storage: string;
  nome_arquivo: string | null;
  descricao: string | null;
  created_at: string;
  url: string;
};

type ResultadoVistoriaCliente = {
  solicitacao_id: string;
  resultado:
    | 'aprovada'
    | 'nao_aprovada'
    | 'cliente_ausente'
    | string;
  justificativa_resultado: string | null;
  parecer_tecnico: string | null;
  finalizada_em: string | null;
};


type Form03Cliente = {
  form03_id: string;
  protocolo: string;

  modo_assinatura:
    | 'manual_app'
    | 'externa_pdf'
    | null;

  status: string;

  cliente_nome: string;

  assinatura_cliente_ok: boolean;
  assinatura_cliente_nome: string | null;
  assinado_cliente_em: string | null;

  assinatura_funcionario_ok: boolean;
  assinado_funcionario_em: string | null;
};

export default function DetalhesSolicitacaoScreen() {
  const params = useLocalSearchParams();

  const solicitacaoId = String(
    params.solicitacaoId ?? ''
  );

  const [solicitacao, setSolicitacao] =
    useState<Solicitacao | null>(null);

  const [fotos, setFotos] =
    useState<FotoSolicitacao[]>([]);

  const [fotoSelecionada, setFotoSelecionada] =
    useState<FotoSolicitacao | null>(null);

  const [carregando, setCarregando] =
    useState(true);

  const [
    carregandoFotos,
    setCarregandoFotos,
  ] = useState(false);

  const [erro, setErro] =
    useState('');

  const [erroFotos, setErroFotos] =
    useState('');

  const [
    agendamento,
    setAgendamento,
  ] = useState<AgendamentoVistoria | null>(
    null
  );

  const [
    carregandoAgendamento,
    setCarregandoAgendamento,
  ] = useState(false);

  const [
    erroAgendamento,
    setErroAgendamento,
  ] = useState('');

  const [
    historicoVistoria,
    setHistoricoVistoria,
  ] = useState<AgendamentoVistoria[]>([]);

  const [
    horariosVistoria,
    setHorariosVistoria,
  ] = useState<HorarioVistoriaDisponivel[]>([]);

  const [
    carregandoAgenda,
    setCarregandoAgenda,
  ] = useState(false);

  const [
    mostrarReagendamento,
    setMostrarReagendamento,
  ] = useState(false);

  const [
    mostrarCancelamento,
    setMostrarCancelamento,
  ] = useState(false);

  const [
    dataVistoriaSelecionada,
    setDataVistoriaSelecionada,
  ] = useState('');

  const [
    horarioVistoriaSelecionadoId,
    setHorarioVistoriaSelecionadoId,
  ] = useState('');

  const [
    motivoCancelamento,
    setMotivoCancelamento,
  ] = useState('');

  const [
    processandoVistoria,
    setProcessandoVistoria,
  ] = useState(false);

  const [
    mensagemVistoria,
    setMensagemVistoria,
  ] = useState('');

  // ==========================================================
  // AGENDAMENTO DA EXECUÇÃO
  // ==========================================================

  const [
    agendamentoExecucao,
    setAgendamentoExecucao,
  ] = useState<AgendamentoExecucaoCliente | null>(
    null
  );

  const [
    carregandoAgendamentoExecucao,
    setCarregandoAgendamentoExecucao,
  ] = useState(false);

  const [
    erroAgendamentoExecucao,
    setErroAgendamentoExecucao,
  ] = useState('');

  const [
    mensagemAgendamentoExecucao,
    setMensagemAgendamentoExecucao,
  ] = useState('');

  const [
    processandoAgendamentoExecucao,
    setProcessandoAgendamentoExecucao,
  ] = useState(false);

  const [
    mostrarReagendamentoExecucao,
    setMostrarReagendamentoExecucao,
  ] = useState(false);

  const [
    horariosExecucao,
    setHorariosExecucao,
  ] = useState<HorarioVistoriaDisponivel[]>([]);

  const [
    carregandoHorariosExecucao,
    setCarregandoHorariosExecucao,
  ] = useState(false);

  const [
    dataExecucaoSelecionada,
    setDataExecucaoSelecionada,
  ] = useState('');

  const [
    horarioExecucaoSelecionadoId,
    setHorarioExecucaoSelecionadoId,
  ] = useState('');

  const [
    resultadoVistoriaCliente,
    setResultadoVistoriaCliente,
  ] = useState<ResultadoVistoriaCliente | null>(
    null
  );

  const [
    carregandoResultadoVistoria,
    setCarregandoResultadoVistoria,
  ] = useState(false);

  const [
    erroResultadoVistoria,
    setErroResultadoVistoria,
  ] = useState('');

  const [
    fotosAusenciaCliente,
    setFotosAusenciaCliente,
  ] = useState<FotoAusenciaCliente[]>([]);

  const [
    carregandoFotosAusencia,
    setCarregandoFotosAusencia,
  ] = useState(false);

  const [
    erroFotosAusencia,
    setErroFotosAusencia,
  ] = useState('');

  const [
    fotoAusenciaSelecionada,
    setFotoAusenciaSelecionada,
  ] = useState<FotoAusenciaCliente | null>(
    null
  );

  const [
    form03Cliente,
    setForm03Cliente,
  ] = useState<Form03Cliente | null>(
    null
  );

  const [
    carregandoForm03Cliente,
    setCarregandoForm03Cliente,
  ] = useState(false);

  const [
    erroForm03Cliente,
    setErroForm03Cliente,
  ] = useState('');

  const [
    nomeAssinanteCliente,
    setNomeAssinanteCliente,
  ] = useState('');

  const [
    salvandoAssinaturaCliente,
    setSalvandoAssinaturaCliente,
  ] = useState(false);

  const [
    sucessoAssinaturaCliente,
    setSucessoAssinaturaCliente,
  ] = useState('');

  useEffect(() => {
    if (!solicitacaoId) {
      setErro(
        'Não foi possível identificar a solicitação.'
      );

      setCarregando(false);

      return;
    }

    carregarDados();
  }, [solicitacaoId]);

  async function carregarDados() {
    await carregarSolicitacao();
    await carregarFotos();
    await carregarAgendamentoVistoria();
    await carregarResultadoVistoriaCliente();
    await carregarAgendamentoExecucaoCliente();
    await carregarForm03Cliente();
  }

  useEffect(() => {
    if (
      solicitacao?.status ===
      'encerrada_ausencia'
    ) {
      carregarFotosAusenciaCliente();
    } else {
      setFotosAusenciaCliente([]);
      setErroFotosAusencia('');
    }
  }, [solicitacao?.status]);

  async function carregarSolicitacao() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } =
        await supabase.rpc(
          'buscar_minha_solicitacao_cliente',
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
          'Não foi possível carregar a solicitação.'
        );

        return;
      }

      const resultado =
        data?.[0] as
          | Solicitacao
          | undefined;

      if (!resultado) {
        setErro(
          'Solicitação não encontrada.'
        );

        return;
      }

      setSolicitacao(resultado);
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao carregar a solicitação.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarFotos() {
    try {
      setCarregandoFotos(true);
      setErroFotos('');

      const { data, error } =
        await supabase
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
        console.error(
          'Erro ao buscar fotos:',
          error
        );

        setErroFotos(
          'Não foi possível carregar as fotos deste chamado.'
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
        } =
          await supabase.storage
            .from(
              'solicitacoes-fotos'
            )
            .createSignedUrl(
              foto.caminho_storage,
              60 * 60
            );

        if (signedError) {
          console.error(
            'Erro ao criar URL da foto:',
            signedError
          );

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

  async function carregarAgendamentoVistoria() {
    try {
      setCarregandoAgendamento(true);
      setErroAgendamento('');

      const { data, error } =
        await supabase.rpc(
          'buscar_historico_vistoria',
          {
            p_solicitacao_id:
              solicitacaoId,
          }
        );

      if (error) {
        console.error(
          'Erro ao buscar histórico da vistoria:',
          error
        );

        setErroAgendamento(
          'Não foi possível carregar os dados da vistoria.'
        );

        return;
      }

      const historico =
        (data ?? []) as
          AgendamentoVistoria[];

      setHistoricoVistoria(
        historico
      );

      const atual =
        historico.find(
          (item) =>
            item.eh_agendamento_atual
        );

      setAgendamento(
        atual ?? null
      );
    } catch (error) {
      console.error(
        'Erro ao carregar agendamento:',
        error
      );

      setErroAgendamento(
        'Ocorreu um erro ao carregar os dados da vistoria.'
      );
    } finally {
      setCarregandoAgendamento(false);
    }
  }

  async function carregarHorariosVistoria() {
    try {
      setCarregandoAgenda(true);

      const { data, error } =
        await supabase.rpc(
          'listar_horarios_vistoria_disponiveis',
          {
            p_data_inicio: null,
            p_quantidade_dias: 60,
          }
        );

      if (error) {
        console.error(
          'Erro ao carregar horários disponíveis:',
          error
        );

        setErroAgendamento(
          'Não foi possível carregar os horários disponíveis.'
        );

        return;
      }

      setHorariosVistoria(
        (data ?? []) as
          HorarioVistoriaDisponivel[]
      );
    } finally {
      setCarregandoAgenda(false);
    }
  }

  async function abrirReagendamento() {
    setMensagemVistoria('');
    setMostrarCancelamento(false);
    setMostrarReagendamento(true);
    setDataVistoriaSelecionada('');
    setHorarioVistoriaSelecionadoId('');
    await carregarHorariosVistoria();
  }

  async function confirmarReagendamento() {
    if (
      !dataVistoriaSelecionada ||
      !horarioVistoriaSelecionadoId
    ) {
      setErroAgendamento(
        'Escolha uma nova data e um novo horário.'
      );
      return;
    }

    try {
      setProcessandoVistoria(true);
      setErroAgendamento('');
      setMensagemVistoria('');

      const { error } =
        await supabase.rpc(
          agendamento
            ? 'reagendar_vistoria_cliente'
            : 'reservar_horario_vistoria_cliente',
          agendamento
            ? {
                p_solicitacao_id:
                  solicitacaoId,
                p_nova_data:
                  dataVistoriaSelecionada,
                p_novo_horario_vistoria_id:
                  horarioVistoriaSelecionadoId,
              }
            : {
                p_solicitacao_id:
                  solicitacaoId,
                p_data_vistoria:
                  dataVistoriaSelecionada,
                p_horario_vistoria_id:
                  horarioVistoriaSelecionadoId,
              }
        );

      if (error) {
        setErroAgendamento(
          error.message ||
            'Não foi possível atualizar a vistoria.'
        );
        await carregarHorariosVistoria();
        return;
      }

      setMostrarReagendamento(false);
      setMensagemVistoria(
        agendamento
          ? 'Vistoria reagendada com sucesso.'
          : 'Vistoria agendada com sucesso.'
      );

      await carregarAgendamentoVistoria();
    } finally {
      setProcessandoVistoria(false);
    }
  }

  async function cancelarVistoriaCliente() {
    if (!motivoCancelamento.trim()) {
      setErroAgendamento(
        'Informe o motivo do cancelamento.'
      );
      return;
    }

    try {
      setProcessandoVistoria(true);
      setErroAgendamento('');
      setMensagemVistoria('');

      const { error } =
        await supabase.rpc(
          'cancelar_vistoria_cliente',
          {
            p_solicitacao_id:
              solicitacaoId,
            p_motivo:
              motivoCancelamento.trim(),
          }
        );

      if (error) {
        setErroAgendamento(
          error.message ||
            'Não foi possível cancelar a vistoria.'
        );
        return;
      }

      setMostrarCancelamento(false);
      setMotivoCancelamento('');
      setMensagemVistoria(
        'Vistoria cancelada. O horário foi liberado e você pode agendar uma nova data.'
      );

      await carregarAgendamentoVistoria();
    } finally {
      setProcessandoVistoria(false);
    }
  }

  const datasDisponiveis =
    useMemo(() => {
      const mapa = new Map<
        string,
        HorarioVistoriaDisponivel[]
      >();

      horariosVistoria.forEach(
        (item) => {
          const lista =
            mapa.get(
              item.data_vistoria
            ) ?? [];

          lista.push(item);

          mapa.set(
            item.data_vistoria,
            lista
          );
        }
      );

      return Array.from(
        mapa.entries()
      );
    }, [horariosVistoria]);

  function formatarData(
    dataIso:
      | string
      | null
      | undefined
  ) {
    if (!dataIso) {
      return '-';
    }

    const partes =
      dataIso.split('-');

    if (partes.length === 3) {
      return `${partes[2]}/${partes[1]}/${partes[0]}`;
    }

    return dataIso;
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

    return hora.substring(0, 5);
  }

  function formatarDataHora(
    dataIso: string
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

  async function carregarAgendamentoExecucaoCliente() {
    try {
      setCarregandoAgendamentoExecucao(
        true
      );

      setErroAgendamentoExecucao('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_agendamento_execucao_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar agendamento da execução:',
          error
        );

        setErroAgendamentoExecucao(
          error.message ||
            'Não foi possível carregar o agendamento da execução.'
        );

        return;
      }

      const registro =
        data?.[0] as
          | AgendamentoExecucaoCliente
          | undefined;

      setAgendamentoExecucao(
        registro ?? null
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao buscar agendamento da execução:',
        error
      );

      setErroAgendamentoExecucao(
        'Ocorreu um erro ao carregar o agendamento da execução.'
      );
    } finally {
      setCarregandoAgendamentoExecucao(
        false
      );
    }
  }

  async function carregarHorariosExecucaoCliente() {
    try {
      setCarregandoHorariosExecucao(
        true
      );

      setErroAgendamentoExecucao('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'listar_horarios_execucao_disponiveis',
        {
          p_data_inicio:
            null,

          p_quantidade_dias:
            60,
        }
      );

      if (error) {
        console.error(
          'Erro ao carregar horários da execução:',
          error
        );

        setErroAgendamentoExecucao(
          error.message ||
            'Não foi possível carregar os horários disponíveis.'
        );

        return;
      }

      setHorariosExecucao(
        (data ?? []).map(
          (item: any) => ({
            data_vistoria:
              item.data_execucao,
            dia_semana:
              item.dia_semana,
            nome_dia:
              item.nome_dia,
            horario_vistoria_id:
              item.horario_execucao_id,
            hora_inicio:
              item.hora_inicio,
            hora_fim:
              item.hora_fim,
          })
        ) as HorarioVistoriaDisponivel[]
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar horários da execução:',
        error
      );

      setErroAgendamentoExecucao(
        'Ocorreu um erro ao carregar os horários disponíveis.'
      );
    } finally {
      setCarregandoHorariosExecucao(
        false
      );
    }
  }

  async function confirmarAgendamentoExecucaoCliente() {
    try {
      setProcessandoAgendamentoExecucao(
        true
      );

      setErroAgendamentoExecucao('');
      setMensagemAgendamentoExecucao('');

      const {
        error,
      } = await supabase.rpc(
        'confirmar_agendamento_execucao_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao confirmar agendamento da execução:',
          error
        );

        setErroAgendamentoExecucao(
          error.message ||
            'Não foi possível confirmar o agendamento.'
        );

        return;
      }

      setMostrarReagendamentoExecucao(
        false
      );

      setMensagemAgendamentoExecucao(
        'Agendamento da execução confirmado com sucesso.'
      );

      await carregarAgendamentoExecucaoCliente();
    } catch (error) {
      console.error(
        'Erro inesperado ao confirmar agendamento da execução:',
        error
      );

      setErroAgendamentoExecucao(
        'Ocorreu um erro ao confirmar o agendamento.'
      );
    } finally {
      setProcessandoAgendamentoExecucao(
        false
      );
    }
  }

  async function abrirReagendamentoExecucaoCliente() {
    setErroAgendamentoExecucao('');
    setMensagemAgendamentoExecucao('');

    setDataExecucaoSelecionada('');
    setHorarioExecucaoSelecionadoId('');

    setMostrarReagendamentoExecucao(
      true
    );

    await carregarHorariosExecucaoCliente();
  }

  async function confirmarReagendamentoExecucaoCliente() {
    if (
      !dataExecucaoSelecionada ||
      !horarioExecucaoSelecionadoId
    ) {
      setErroAgendamentoExecucao(
        'Escolha uma nova data e um novo horário.'
      );

      return;
    }

    try {
      setProcessandoAgendamentoExecucao(
        true
      );

      setErroAgendamentoExecucao('');
      setMensagemAgendamentoExecucao('');

      const {
        error,
      } = await supabase.rpc(
        'reagendar_execucao_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_nova_data:
            dataExecucaoSelecionada,

          p_horario_execucao_id:
            horarioExecucaoSelecionadoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao reagendar execução:',
          error
        );

        setErroAgendamentoExecucao(
          error.message ||
            'Não foi possível reagendar a execução.'
        );

        await carregarHorariosExecucaoCliente();

        return;
      }

      setMostrarReagendamentoExecucao(
        false
      );

      setDataExecucaoSelecionada('');
      setHorarioExecucaoSelecionadoId('');

      setMensagemAgendamentoExecucao(
        'Nova data da execução selecionada e confirmada com sucesso.'
      );

      await carregarAgendamentoExecucaoCliente();
    } catch (error) {
      console.error(
        'Erro inesperado ao reagendar execução:',
        error
      );

      setErroAgendamentoExecucao(
        'Ocorreu um erro ao reagendar a execução.'
      );
    } finally {
      setProcessandoAgendamentoExecucao(
        false
      );
    }
  }

  async function carregarResultadoVistoriaCliente() {
    try {
      setCarregandoResultadoVistoria(true);
      setErroResultadoVistoria('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_resultado_vistoria_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar resultado da vistoria:',
          error
        );

        setErroResultadoVistoria(
          'Não foi possível carregar o resultado da vistoria.'
        );

        return;
      }

      setResultadoVistoriaCliente(
        (data?.[0] as
          | ResultadoVistoriaCliente
          | undefined) ??
          null
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar resultado da vistoria:',
        error
      );

      setErroResultadoVistoria(
        'Ocorreu um erro ao carregar o resultado da vistoria.'
      );
    } finally {
      setCarregandoResultadoVistoria(false);
    }
  }


  async function carregarFotosAusenciaCliente() {
    try {
      setCarregandoFotosAusencia(true);
      setErroFotosAusencia('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_fotos_ausencia_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar fotos da ausência:',
          error
        );

        setErroFotosAusencia(
          'Não foi possível carregar a comprovação da visita.'
        );

        return;
      }

      const fotosComUrl:
        FotoAusenciaCliente[] = [];

      for (const foto of data ?? []) {
        const {
          data: signedData,
          error: signedError,
        } = await supabase.storage
          .from('vistorias-fotos')
          .createSignedUrl(
            foto.caminho_storage,
            60 * 60
          );

        if (signedError) {
          console.error(
            'Erro ao abrir foto da ausência:',
            signedError
          );

          continue;
        }

        fotosComUrl.push({
          ...foto,
          url: signedData.signedUrl,
        } as FotoAusenciaCliente);
      }

      setFotosAusenciaCliente(
        fotosComUrl
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao carregar comprovação da visita:',
        error
      );

      setErroFotosAusencia(
        'Ocorreu um erro ao carregar a comprovação da visita.'
      );
    } finally {
      setCarregandoFotosAusencia(false);
    }
  }


  async function carregarForm03Cliente() {
    try {
      setCarregandoForm03Cliente(
        true
      );

      setErroForm03Cliente('');

      const {
        data,
        error,
      } = await supabase.rpc(
        'buscar_form03_cliente',
        {
          p_solicitacao_id:
            solicitacaoId,
        }
      );

      if (error) {
        console.error(
          'Erro ao buscar FORM 03 do cliente:',
          error
        );

        setErroForm03Cliente(
          error.message ||
            'Não foi possível verificar o FORM 03.'
        );

        return;
      }

      const registro =
        data?.[0] as
          | Form03Cliente
          | undefined;

      if (!registro) {
        setForm03Cliente(null);
        return;
      }

      setForm03Cliente(
        registro
      );

      setNomeAssinanteCliente(
        registro.assinatura_cliente_nome ??
          registro.cliente_nome ??
          ''
      );
    } catch (error) {
      console.error(
        'Erro inesperado ao buscar FORM 03:',
        error
      );

      setErroForm03Cliente(
        'Ocorreu um erro ao verificar o FORM 03.'
      );
    } finally {
      setCarregandoForm03Cliente(
        false
      );
    }
  }

  async function salvarAssinaturaCliente(
    assinaturaSvg: string
  ) {
    setErroForm03Cliente('');
    setSucessoAssinaturaCliente('');

    if (
      !nomeAssinanteCliente.trim()
    ) {
      setErroForm03Cliente(
        'Informe o nome do cliente ou representante.'
      );

      return;
    }

    try {
      setSalvandoAssinaturaCliente(
        true
      );

      const {
        data,
        error,
      } = await supabase.rpc(
        'salvar_assinatura_cliente_form03',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_assinatura_svg:
            assinaturaSvg,

          p_nome_assinante:
            nomeAssinanteCliente.trim(),
        }
      );

      if (error) {
        console.error(
          'Erro ao salvar assinatura do cliente:',
          error
        );

        setErroForm03Cliente(
          error.message ||
            'Não foi possível salvar sua assinatura.'
        );

        return;
      }

      if (
        !data ||
        data.length === 0
      ) {
        setErroForm03Cliente(
          'O sistema não confirmou sua assinatura.'
        );

        return;
      }

      setSucessoAssinaturaCliente(
        'Assinatura registrada com sucesso.'
      );

      await carregarForm03Cliente();
    } catch (error) {
      console.error(
        'Erro inesperado ao salvar assinatura:',
        error
      );

      setErroForm03Cliente(
        'Ocorreu um erro ao salvar sua assinatura.'
      );
    } finally {
      setSalvandoAssinaturaCliente(
        false
      );
    }
  }

  function textoStatus(
    status: string
  ) {
    switch (status) {
      case 'aberta':
        return 'Aberta';

      case 'em_analise':
        return 'Em análise';

      case 'vistoria_agendada':
        return 'Vistoria agendada';

      case 'em_vistoria':
        return 'Em vistoria';

      case 'aprovada':
        return 'Aprovada';

      case 'nao_aprovada':
        return 'Não aprovada';

      case 'em_execucao':
        return 'Em execução';

      case 'concluida':
        return 'Concluída';

      case 'cancelada':
        return 'Cancelada';

      case 'encerrada_ausencia':
        return 'Encerrada por ausência';

      default:
        return status;
    }
  }

  function statusJaPassouDaAnalise(
    status: string
  ) {
    return status !== 'aberta';
  }

  function statusJaChegouNaVistoria(
    status: string
  ) {
    return [
      'vistoria_agendada',
      'em_vistoria',
      'aprovada',
      'nao_aprovada',
      'encerrada_ausencia',
      'em_execucao',
      'concluida',
    ].includes(status);
  }

  function textoProximaEtapa(
    status: string
  ) {
    switch (status) {
      case 'aberta':
        return 'A equipe da EMAFE analisará sua solicitação. As atualizações aparecerão nesta tela.';

      case 'em_analise':
        return 'Sua solicitação está em análise. A data e o horário da vistoria podem ser consultados e alterados nesta tela.';

      case 'vistoria_agendada':
        return 'Sua vistoria está agendada. Se necessário, você pode reagendar ou cancelar antes do início da vistoria.';

      case 'em_vistoria':
        return 'A vistoria técnica está em andamento. As próximas atualizações serão registradas neste protocolo.';

      case 'aprovada':
        return 'A vistoria foi aprovada. Confira abaixo o agendamento proposto para a execução do serviço.';

      case 'nao_aprovada':
        return 'A vistoria foi finalizada como não aprovada. Consulte abaixo o resultado e a justificativa registrada pela equipe técnica.';

      case 'em_execucao':
        return 'O atendimento está em execução. Você poderá acompanhar a conclusão por esta tela.';

      case 'concluida':
        return 'O atendimento foi concluído. Este protocolo permanece disponível para consulta.';

      case 'encerrada_ausencia':
        return 'Este chamado foi encerrado porque não havia responsável presente no imóvel no horário da vistoria. Para um novo atendimento, abra uma nova solicitação.';

      default:
        return 'Acompanhe esta tela para consultar as próximas atualizações do atendimento.';
    }
  }

  if (carregando) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar style="dark" />

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
            Carregando solicitação...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar style="dark" />

      {/* MODAL DA FOTO */}

      <Modal
        visible={
          !!fotoSelecionada
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFotoSelecionada(null)
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() =>
              setFotoSelecionada(null)
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

          {fotoSelecionada ? (
            <Text
              style={
                styles.modalCaption
              }
            >
              Foto{' '}
              {
                fotoSelecionada.ordem
              }
            </Text>
          ) : null}
        </View>
      </Modal>

      <Modal
        visible={
          !!fotoAusenciaSelecionada
        }
        transparent
        animationType="fade"
        onRequestClose={() =>
          setFotoAusenciaSelecionada(
            null
          )
        }
      >
        <View
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalClose}
            onPress={() =>
              setFotoAusenciaSelecionada(
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

          {fotoAusenciaSelecionada ? (
            <Image
              source={{
                uri:
                  fotoAusenciaSelecionada.url,
              }}
              style={
                styles.modalImage
              }
              resizeMode="contain"
            />
          ) : null}

          <Text
            style={
              styles.modalCaption
            }
          >
            Comprovação da visita
          </Text>
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
        <View style={styles.content}>
          {/* VOLTAR */}

          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace(
                '/dashboard-cliente'
              )
            }
          >
            <Text
              style={styles.backText}
            >
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          {/* LOGO */}

          <Image
            source={require('../../assets/emafe/logo-horizontal-transparente.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Acompanhar solicitação
          </Text>

          {/* ERRO */}

          {erro ? (
            <View
              style={styles.errorBox}
            >
              <Ionicons
                name="alert-circle-outline"
                size={19}
                color="#9A3232"
              />

              <Text
                style={
                  styles.errorText
                }
              >
                {erro}
              </Text>
            </View>
          ) : null}

          {solicitacao ? (
            <>
              {/* PROTOCOLO */}

              <View
                style={
                  styles.protocolCard
                }
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

              {/* IMÓVEL */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Imóvel
              </Text>

              <View
                style={styles.card}
              >
                <Text
                  style={
                    styles.cardTitle
                  }
                >
                  {
                    solicitacao.empreendimento
                  }
                </Text>

                <Text
                  style={
                    styles.cardText
                  }
                >
                  Unidade{' '}
                  {
                    solicitacao.unidade
                  }
                </Text>

                {solicitacao.cidade ? (
                  <Text
                    style={
                      styles.cardText
                    }
                  >
                    {
                      solicitacao.cidade
                    }
                  </Text>
                ) : null}
              </View>

              {/* LOCAL DO PROBLEMA */}

              {solicitacao.comodo ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Local do problema
                  </Text>

                  <View
                    style={styles.card}
                  >
                    <View
                      style={
                        styles.infoRow
                      }
                    >
                      <Ionicons
                        name="location-outline"
                        size={20}
                        color="#0B2447"
                      />

                      <Text
                        style={
                          styles.infoRowText
                        }
                      >
                        {
                          solicitacao.comodo
                        }
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* PROBLEMA RELATADO */}

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

              {/* FOTOS */}

              <View
                style={
                  styles.sectionTitleRow
                }
              >
                <Text
                  style={
                    styles.sectionTitleInline
                  }
                >
                  Fotos enviadas
                </Text>

                {!carregandoFotos &&
                fotos.length > 0 ? (
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
                ) : null}
              </View>

              {carregandoFotos ? (
                <View
                  style={
                    styles.photosLoading
                  }
                >
                  <ActivityIndicator
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.photosLoadingText
                    }
                  >
                    Carregando fotos...
                  </Text>
                </View>
              ) : null}

              {erroFotos ? (
                <View
                  style={
                    styles.photoErrorBox
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={19}
                    color="#9A3232"
                  />

                  <Text
                    style={
                      styles.photoErrorText
                    }
                  >
                    {erroFotos}
                  </Text>
                </View>
              ) : null}

              {!carregandoFotos &&
              !erroFotos &&
              fotos.length === 0 ? (
                <View
                  style={
                    styles.noPhotosCard
                  }
                >
                  <Ionicons
                    name="images-outline"
                    size={25}
                    color="#8995A5"
                  />

                  <Text
                    style={
                      styles.noPhotosText
                    }
                  >
                    Nenhuma foto foi
                    encontrada para esta
                    solicitação.
                  </Text>
                </View>
              ) : null}

              {fotos.length > 0 ? (
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
                        activeOpacity={
                          0.85
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
                          <View
                            style={
                              styles.photoNumber
                            }
                          >
                            <Text
                              style={
                                styles.photoNumberText
                              }
                            >
                              {indice + 1}
                            </Text>
                          </View>

                          <Ionicons
                            name="expand-outline"
                            size={18}
                            color="#FFFFFF"
                          />
                        </View>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              ) : null}

              {/* DADOS PARA CONTATO */}

              {(solicitacao.telefone_contato ||
                solicitacao.email_contato) ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Dados para contato
                  </Text>

                  <View
                    style={styles.card}
                  >
                    {solicitacao.telefone_contato ? (
                      <View
                        style={
                          styles.contactRow
                        }
                      >
                        <Ionicons
                          name="call-outline"
                          size={19}
                          color="#697789"
                        />

                        <View
                          style={
                            styles.contactContent
                          }
                        >
                          <Text
                            style={
                              styles.contactLabel
                            }
                          >
                            Telefone
                          </Text>

                          <Text
                            style={
                              styles.contactValue
                            }
                          >
                            {
                              solicitacao
                                .telefone_contato
                            }
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {solicitacao.email_contato ? (
                      <View
                        style={[
                          styles.contactRow,

                          solicitacao.telefone_contato
                            ? styles.contactRowSpacing
                            : null,
                        ]}
                      >
                        <Ionicons
                          name="mail-outline"
                          size={19}
                          color="#697789"
                        />

                        <View
                          style={
                            styles.contactContent
                          }
                        >
                          <Text
                            style={
                              styles.contactLabel
                            }
                          >
                            E-mail
                          </Text>

                          <Text
                            style={
                              styles.contactValue
                            }
                          >
                            {
                              solicitacao
                                .email_contato
                            }
                          </Text>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}

              {solicitacao.status ===
              'nao_aprovada' ? (
                <View
                  style={
                    styles.naoAprovadaClienteCard
                  }
                >
                  <View
                    style={
                      styles.naoAprovadaClienteHeader
                    }
                  >
                    <View
                      style={
                        styles.naoAprovadaClienteIcon
                      }
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={24}
                        color="#9A3232"
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.naoAprovadaClienteStatus
                        }
                      >
                        RESULTADO DA VISTORIA
                      </Text>

                      <Text
                        style={
                          styles.naoAprovadaClienteTitle
                        }
                      >
                        Vistoria não aprovada
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.naoAprovadaClienteMensagem
                    }
                  >
                    Após a avaliação técnica, esta solicitação não foi aprovada para execução.
                  </Text>

                  {carregandoResultadoVistoria ? (
                    <View
                      style={
                        styles.naoAprovadaClienteLoading
                      }
                    >
                      <ActivityIndicator
                        color="#9A3232"
                      />

                      <Text
                        style={
                          styles.naoAprovadaClienteLoadingText
                        }
                      >
                        Carregando resultado da vistoria...
                      </Text>
                    </View>
                  ) : null}

                  {erroResultadoVistoria ? (
                    <View
                      style={
                        styles.naoAprovadaClienteErroBox
                      }
                    >
                      <Ionicons
                        name="alert-circle-outline"
                        size={18}
                        color="#9A3232"
                      />

                      <Text
                        style={
                          styles.naoAprovadaClienteErroText
                        }
                      >
                        {erroResultadoVistoria}
                      </Text>
                    </View>
                  ) : null}

                  {!carregandoResultadoVistoria &&
                  resultadoVistoriaCliente ? (
                    <>
                      <View
                        style={
                          styles.naoAprovadaClienteDetalhe
                        }
                      >
                        <Text
                          style={
                            styles.naoAprovadaClienteLabel
                          }
                        >
                          JUSTIFICATIVA
                        </Text>

                        <Text
                          style={
                            styles.naoAprovadaClienteValor
                          }
                        >
                          {
                            resultadoVistoriaCliente
                              .justificativa_resultado ||
                            'Não informada.'
                          }
                        </Text>
                      </View>

                      {resultadoVistoriaCliente
                        .parecer_tecnico ? (
                        <View
                          style={
                            styles.naoAprovadaClienteDetalhe
                          }
                        >
                          <Text
                            style={
                              styles.naoAprovadaClienteLabel
                            }
                          >
                            PARECER TÉCNICO
                          </Text>

                          <Text
                            style={
                              styles.naoAprovadaClienteValor
                            }
                          >
                            {
                              resultadoVistoriaCliente
                                .parecer_tecnico
                            }
                          </Text>
                        </View>
                      ) : null}

                      {resultadoVistoriaCliente
                        .finalizada_em ? (
                        <Text
                          style={
                            styles.naoAprovadaClienteData
                          }
                        >
                          Vistoria finalizada em {
                            formatarDataHora(
                              resultadoVistoriaCliente
                                .finalizada_em
                            )
                          }
                        </Text>
                      ) : null}
                    </>
                  ) : null}

                  <View
                    style={
                      styles.naoAprovadaClienteAviso
                    }
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#0B5EA8"
                    />

                    <Text
                      style={
                        styles.naoAprovadaClienteAvisoText
                      }
                    >
                      Este protocolo não seguirá para a etapa de execução.
                    </Text>
                  </View>
                </View>
              ) : null}

              {solicitacao.status ===
              'encerrada_ausencia' ? (
                <View
                  style={
                    styles.ausenciaClienteCard
                  }
                >
                  <View
                    style={
                      styles.ausenciaClienteHeader
                    }
                  >
                    <View
                      style={
                        styles.ausenciaClienteIcon
                      }
                    >
                      <Ionicons
                        name="person-remove-outline"
                        size={23}
                        color="#A76500"
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.ausenciaClienteStatus
                        }
                      >
                        CHAMADO ENCERRADO
                      </Text>

                      <Text
                        style={
                          styles.ausenciaClienteTitle
                        }
                      >
                        Encerrado por ausência
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={
                      styles.ausenciaClienteMensagem
                    }
                  >
                    Nossa equipe compareceu ao local no horário agendado, mas não havia responsável presente no imóvel. Para um novo atendimento, abra uma nova solicitação.
                  </Text>

                  <View
                    style={
                      styles.ausenciaClienteAviso
                    }
                  >
                    <Ionicons
                      name="information-circle-outline"
                      size={20}
                      color="#0B5EA8"
                    />

                    <Text
                      style={
                        styles.ausenciaClienteAvisoText
                      }
                    >
                      Este protocolo permanece disponível para consulta como registro da visita realizada.
                    </Text>
                  </View>

                  <Text
                    style={
                      styles.ausenciaClienteFotosTitulo
                    }
                  >
                    Comprovação da visita
                  </Text>

                  {carregandoFotosAusencia ? (
                    <View
                      style={
                        styles.ausenciaClienteLoading
                      }
                    >
                      <ActivityIndicator
                        color="#A76500"
                      />

                      <Text
                        style={
                          styles.ausenciaClienteLoadingText
                        }
                      >
                        Carregando foto da visita...
                      </Text>
                    </View>
                  ) : null}

                  {erroFotosAusencia ? (
                    <Text
                      style={
                        styles.ausenciaClienteErro
                      }
                    >
                      {erroFotosAusencia}
                    </Text>
                  ) : null}

                  {!carregandoFotosAusencia &&
                  fotosAusenciaCliente.length >
                    0 ? (
                    <View
                      style={
                        styles.ausenciaClienteFotosGrid
                      }
                    >
                      {fotosAusenciaCliente.map(
                        (foto) => (
                          <TouchableOpacity
                            key={
                              foto.foto_id
                            }
                            style={
                              styles.ausenciaClienteFotoCard
                            }
                            activeOpacity={
                              0.85
                            }
                            onPress={() =>
                              setFotoAusenciaSelecionada(
                                foto
                              )
                            }
                          >
                            <Image
                              source={{
                                uri: foto.url,
                              }}
                              style={
                                styles.ausenciaClienteFoto
                              }
                              resizeMode="cover"
                            />

                            <View
                              style={
                                styles.ausenciaClienteFotoOverlay
                              }
                            >
                              <Ionicons
                                name="expand-outline"
                                size={18}
                                color="#FFFFFF"
                              />
                            </View>
                          </TouchableOpacity>
                        )
                      )}
                    </View>
                  ) : null}

                  <TouchableOpacity
                    style={
                      styles.ausenciaClienteNovaSolicitacaoButton
                    }
                    onPress={() =>
                      router.push(
                        '/nova-solicitacao'
                      )
                    }
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.ausenciaClienteNovaSolicitacaoButtonText
                      }
                    >
                      Abrir nova solicitação
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {/* VISTORIA */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Vistoria
              </Text>

              {carregandoAgendamento ? (
                <View
                  style={
                    styles.vistoriaLoadingCard
                  }
                >
                  <ActivityIndicator
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.vistoriaLoadingText
                    }
                  >
                    Carregando dados da vistoria...
                  </Text>
                </View>
              ) : null}

              {erroAgendamento ? (
                <View
                  style={
                    styles.photoErrorBox
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={19}
                    color="#9A3232"
                  />

                  <Text
                    style={
                      styles.photoErrorText
                    }
                  >
                    {erroAgendamento}
                  </Text>
                </View>
              ) : null}

              {mensagemVistoria ? (
                <View
                  style={
                    styles.vistoriaMensagemSucesso
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#287A46"
                  />

                  <Text
                    style={
                      styles.vistoriaMensagemSucessoText
                    }
                  >
                    {mensagemVistoria}
                  </Text>
                </View>
              ) : null}

              {!carregandoAgendamento &&
              agendamento ? (
                <View
                  style={
                    styles.vistoriaCard
                  }
                >
                  <View
                    style={
                      styles.vistoriaHeader
                    }
                  >
                    <View
                      style={
                        styles.vistoriaIcon
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={23}
                        color="#287A46"
                      />
                    </View>

                    <View
                      style={{
                        flex: 1,
                      }}
                    >
                      <Text
                        style={
                          styles.vistoriaStatusLabel
                        }
                      >
                        VISTORIA AGENDADA
                      </Text>

                      <Text
                        style={
                          styles.vistoriaTitle
                        }
                      >
                        Visita técnica programada
                      </Text>

                      <Text
                        style={
                          styles.vistoriaSubtitle
                        }
                      >
                        Esta é a data atualmente reservada para sua vistoria.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={
                      styles.vistoriaInfoGrid
                    }
                  >
                    <View
                      style={
                        styles.vistoriaInfoItem
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={19}
                        color="#0B2447"
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.vistoriaInfoLabel
                          }
                        >
                          DATA
                        </Text>

                        <Text
                          style={
                            styles.vistoriaInfoValue
                          }
                        >
                          {formatarData(
                            agendamento.data_vistoria
                          )}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={
                        styles.vistoriaInfoItem
                      }
                    >
                      <Ionicons
                        name="time-outline"
                        size={19}
                        color="#0B2447"
                      />

                      <View
                        style={{
                          flex: 1,
                        }}
                      >
                        <Text
                          style={
                            styles.vistoriaInfoLabel
                          }
                        >
                          HORÁRIO
                        </Text>

                        <Text
                          style={
                            styles.vistoriaInfoValue
                          }
                        >
                          {formatarHora(
                            agendamento.hora_inicio
                          )}{' '}
                          às{' '}
                          {formatarHora(
                            agendamento.hora_fim
                          )}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {[
                    'aberta',
                    'em_analise',
                    'vistoria_agendada',
                  ].includes(
                    solicitacao.status
                  ) ? (
                    <View
                      style={
                        styles.vistoriaActionRow
                      }
                    >
                      <TouchableOpacity
                        style={
                          styles.vistoriaReagendarButton
                        }
                        onPress={
                          abrirReagendamento
                        }
                        disabled={
                          processandoVistoria
                        }
                      >
                        <Ionicons
                          name="refresh-outline"
                          size={19}
                          color="#0B5EA8"
                        />

                        <Text
                          style={
                            styles.vistoriaReagendarButtonText
                          }
                        >
                          Reagendar vistoria
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={
                          styles.vistoriaCancelarButton
                        }
                        onPress={() => {
                          setMostrarReagendamento(
                            false
                          );
                          setMostrarCancelamento(
                            !mostrarCancelamento
                          );
                          setErroAgendamento(
                            ''
                          );
                        }}
                        disabled={
                          processandoVistoria
                        }
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={19}
                          color="#9A3232"
                        />

                        <Text
                          style={
                            styles.vistoriaCancelarButtonText
                          }
                        >
                          Cancelar vistoria
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {!carregandoAgendamento &&
              !agendamento &&
              [
                'aberta',
                'em_analise',
                'vistoria_agendada',
              ].includes(
                solicitacao.status
              ) ? (
                <View
                  style={
                    styles.vistoriaSemAgendamento
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#0B5EA8"
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.vistoriaSemAgendamentoTitle
                      }
                    >
                      Nenhuma vistoria agendada
                    </Text>

                    <Text
                      style={
                        styles.vistoriaSemAgendamentoText
                      }
                    >
                      Escolha uma nova data e horário disponíveis.
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={
                      styles.vistoriaAgendarButton
                    }
                    onPress={
                      abrirReagendamento
                    }
                  >
                    <Text
                      style={
                        styles.vistoriaAgendarButtonText
                      }
                    >
                      Agendar
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              {mostrarCancelamento ? (
                <View
                  style={
                    styles.vistoriaFormBox
                  }
                >
                  <Text
                    style={
                      styles.vistoriaFormTitle
                    }
                  >
                    Cancelar vistoria
                  </Text>

                  <Text
                    style={
                      styles.vistoriaFormText
                    }
                  >
                    Informe o motivo. O horário será liberado para outro cliente.
                  </Text>

                  <TextInput
                    style={
                      styles.vistoriaCancelInput
                    }
                    multiline
                    placeholder="Digite o motivo do cancelamento"
                    placeholderTextColor="#8995A5"
                    value={
                      motivoCancelamento
                    }
                    onChangeText={
                      setMotivoCancelamento
                    }
                  />

                  <View
                    style={
                      styles.vistoriaFormActions
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.vistoriaFormBackButton
                      }
                      onPress={() =>
                        setMostrarCancelamento(
                          false
                        )
                      }
                    >
                      <Text
                        style={
                          styles.vistoriaFormBackText
                        }
                      >
                        Voltar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.vistoriaFormDangerButton
                      }
                      onPress={
                        cancelarVistoriaCliente
                      }
                      disabled={
                        processandoVistoria
                      }
                    >
                      <Text
                        style={
                          styles.vistoriaFormDangerText
                        }
                      >
                        Confirmar cancelamento
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {mostrarReagendamento ? (
                <View
                  style={
                    styles.vistoriaFormBox
                  }
                >
                  <Text
                    style={
                      styles.vistoriaFormTitle
                    }
                  >
                    {agendamento
                      ? 'Reagendar vistoria'
                      : 'Agendar vistoria'}
                  </Text>

                  <Text
                    style={
                      styles.vistoriaFormText
                    }
                  >
                    Escolha uma das datas abaixo. Só aparecem datas e horários ainda livres.
                  </Text>

                  {carregandoAgenda ? (
                    <ActivityIndicator
                      color="#0B2447"
                    />
                  ) : null}

                  {!carregandoAgenda &&
                  datasDisponiveis.length ===
                    0 ? (
                    <Text
                      style={
                        styles.vistoriaFormText
                      }
                    >
                      Nenhum horário disponível no momento.
                    </Text>
                  ) : null}

                  {!carregandoAgenda &&
                    datasDisponiveis.map(
                      ([
                        data,
                        horarios,
                      ]) => (
                        <View
                          key={data}
                          style={
                            styles.vistoriaDataBox
                          }
                        >
                          <TouchableOpacity
                            style={[
                              styles.vistoriaDataButton,
                              dataVistoriaSelecionada ===
                                data &&
                                styles.vistoriaDataButtonSelected,
                            ]}
                            onPress={() => {
                              setDataVistoriaSelecionada(
                                data
                              );
                              setHorarioVistoriaSelecionadoId(
                                ''
                              );
                            }}
                          >
                            <Ionicons
                              name="calendar-outline"
                              size={18}
                              color={
                                dataVistoriaSelecionada ===
                                data
                                  ? '#FFFFFF'
                                  : '#0B2447'
                              }
                            />

                            <Text
                              style={[
                                styles.vistoriaDataButtonText,
                                dataVistoriaSelecionada ===
                                  data &&
                                  styles.vistoriaDataButtonTextSelected,
                              ]}
                            >
                              {formatarData(
                                data
                              )}
                            </Text>
                          </TouchableOpacity>

                          {dataVistoriaSelecionada ===
                          data ? (
                            <View
                              style={
                                styles.vistoriaHorarioList
                              }
                            >
                              {horarios.map(
                                (
                                  horario
                                ) => {
                                  const selecionado =
                                    horarioVistoriaSelecionadoId ===
                                    horario.horario_vistoria_id;

                                  return (
                                    <TouchableOpacity
                                      key={
                                        horario.horario_vistoria_id
                                      }
                                      style={[
                                        styles.vistoriaHorarioButton,
                                        selecionado &&
                                          styles.vistoriaHorarioButtonSelected,
                                      ]}
                                      onPress={() =>
                                        setHorarioVistoriaSelecionadoId(
                                          horario.horario_vistoria_id
                                        )
                                      }
                                    >
                                      <Text
                                        style={[
                                          styles.vistoriaHorarioButtonText,
                                          selecionado &&
                                            styles.vistoriaHorarioButtonTextSelected,
                                        ]}
                                      >
                                        {formatarHora(
                                          horario.hora_inicio
                                        )}{' '}
                                        às{' '}
                                        {formatarHora(
                                          horario.hora_fim
                                        )}
                                      </Text>
                                    </TouchableOpacity>
                                  );
                                }
                              )}
                            </View>
                          ) : null}
                        </View>
                      )
                    )}

                  <View
                    style={
                      styles.vistoriaFormActions
                    }
                  >
                    <TouchableOpacity
                      style={
                        styles.vistoriaFormBackButton
                      }
                      onPress={() =>
                        setMostrarReagendamento(
                          false
                        )
                      }
                    >
                      <Text
                        style={
                          styles.vistoriaFormBackText
                        }
                      >
                        Voltar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={
                        styles.vistoriaFormPrimaryButton
                      }
                      onPress={
                        confirmarReagendamento
                      }
                      disabled={
                        processandoVistoria ||
                        !dataVistoriaSelecionada ||
                        !horarioVistoriaSelecionadoId
                      }
                    >
                      <Text
                        style={
                          styles.vistoriaFormPrimaryText
                        }
                      >
                        {agendamento
                          ? 'Confirmar reagendamento'
                          : 'Confirmar agendamento'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {historicoVistoria.length >
              0 ? (
                <View
                  style={
                    styles.vistoriaHistoricoBox
                  }
                >
                  <Text
                    style={
                      styles.vistoriaHistoricoTitle
                    }
                  >
                    Histórico da vistoria
                  </Text>

                  {historicoVistoria
                    .slice(0, 4)
                    .map(
                      (item) => (
                        <View
                          key={
                            item.agendamento_id
                          }
                          style={
                            styles.vistoriaHistoricoItem
                          }
                        >
                          <Text
                            style={
                              styles.vistoriaHistoricoStatus
                            }
                          >
                            {item.status ===
                            'agendada'
                              ? 'Agendada'
                              : item.status ===
                                  'realizada'
                                ? 'Realizada'
                                : 'Cancelada'}
                          </Text>

                          <Text
                            style={
                              styles.vistoriaHistoricoText
                            }
                          >
                            {formatarData(
                              item.data_vistoria
                            )}{' '}
                            •{' '}
                            {formatarHora(
                              item.hora_inicio
                            )}{' '}
                            às{' '}
                            {formatarHora(
                              item.hora_fim
                            )}
                          </Text>

                          {item.motivo_cancelamento ? (
                            <Text
                              style={
                                styles.vistoriaHistoricoMotivo
                              }
                            >
                              Motivo: {
                                item.motivo_cancelamento
                              }
                            </Text>
                          ) : null}
                        </View>
                      )
                    )}
                </View>
              ) : null}

              {/* AGENDAMENTO DA EXECUÇÃO */}

              {agendamentoExecucao &&
              agendamentoExecucao.status !==
                'cancelada' ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    Agendamento da execução
                  </Text>

                  <View
                    style={
                      styles.execucaoAgendaCard
                    }
                  >
                    <View
                      style={
                        styles.execucaoAgendaHeader
                      }
                    >
                      <View
                        style={
                          styles.execucaoAgendaIcon
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
                            styles.execucaoAgendaTitle
                          }
                        >
                          {agendamentoExecucao.status ===
                          'confirmada'
                            ? 'Execução agendada'
                            : 'Confirme o agendamento'}
                        </Text>

                        <Text
                          style={
                            styles.execucaoAgendaSubtitle
                          }
                        >
                          {agendamentoExecucao.status ===
                          'confirmada'
                            ? 'A data da execução já está confirmada.'
                            : 'A EMAFE propôs esta data para a execução. Confirme se o horário funciona para você ou escolha outra opção disponível.'}
                        </Text>
                      </View>
                    </View>

                    {carregandoAgendamentoExecucao ? (
                      <View
                        style={
                          styles.execucaoAgendaLoading
                        }
                      >
                        <ActivityIndicator
                          color="#0B2447"
                        />

                        <Text
                          style={
                            styles.execucaoAgendaLoadingText
                          }
                        >
                          Carregando agendamento...
                        </Text>
                      </View>
                    ) : null}

                    {agendamentoExecucao.status ===
                    'aguardando_cliente' ? (
                      <>
                        <View
                          style={
                            styles.execucaoAgendaProposta
                          }
                        >
                          <Text
                            style={
                              styles.execucaoAgendaPropostaLabel
                            }
                          >
                            AGENDAMENTO PROPOSTO
                          </Text>

                          <View
                            style={
                              styles.execucaoAgendaDataRow
                            }
                          >
                            <View
                              style={
                                styles.execucaoAgendaDataItem
                              }
                            >
                              <Ionicons
                                name="calendar-outline"
                                size={19}
                                color="#0B2447"
                              />

                              <View>
                                <Text
                                  style={
                                    styles.execucaoAgendaInfoLabel
                                  }
                                >
                                  DATA
                                </Text>

                                <Text
                                  style={
                                    styles.execucaoAgendaInfoValue
                                  }
                                >
                                  {formatarData(
                                    agendamentoExecucao.data_proposta
                                  )}
                                </Text>
                              </View>
                            </View>

                            <View
                              style={
                                styles.execucaoAgendaDataItem
                              }
                            >
                              <Ionicons
                                name="time-outline"
                                size={19}
                                color="#0B2447"
                              />

                              <View>
                                <Text
                                  style={
                                    styles.execucaoAgendaInfoLabel
                                  }
                                >
                                  HORÁRIO
                                </Text>

                                <Text
                                  style={
                                    styles.execucaoAgendaInfoValue
                                  }
                                >
                                  {formatarHora(
                                    agendamentoExecucao.hora_proposta
                                  )}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        <Text
                          style={
                            styles.execucaoAgendaPergunta
                          }
                        >
                          Esse agendamento funciona para você?
                        </Text>

                        <View
                          style={
                            styles.execucaoAgendaActions
                          }
                        >
                          <TouchableOpacity
                            style={[
                              styles.execucaoAgendaConfirmButton,

                              processandoAgendamentoExecucao &&
                                styles.execucaoAgendaButtonDisabled,
                            ]}
                            disabled={
                              processandoAgendamentoExecucao
                            }
                            onPress={
                              confirmarAgendamentoExecucaoCliente
                            }
                          >
                            {processandoAgendamentoExecucao ? (
                              <ActivityIndicator
                                size="small"
                                color="#FFFFFF"
                              />
                            ) : (
                              <Ionicons
                                name="checkmark-circle-outline"
                                size={19}
                                color="#FFFFFF"
                              />
                            )}

                            <Text
                              style={
                                styles.execucaoAgendaConfirmButtonText
                              }
                            >
                              Confirmar agendamento
                            </Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={
                              styles.execucaoAgendaReagendarButton
                            }
                            disabled={
                              processandoAgendamentoExecucao
                            }
                            onPress={
                              abrirReagendamentoExecucaoCliente
                            }
                          >
                            <Ionicons
                              name="refresh-outline"
                              size={19}
                              color="#0B5EA8"
                            />

                            <Text
                              style={
                                styles.execucaoAgendaReagendarButtonText
                              }
                            >
                              Solicitar reagendamento
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {mostrarReagendamentoExecucao ? (
                          <View
                            style={
                              styles.execucaoAgendaReagendamentoBox
                            }
                          >
                            <View
                              style={
                                styles.execucaoAgendaReagendamentoHeader
                              }
                            >
                              <Ionicons
                                name="calendar-outline"
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
                                    styles.execucaoAgendaReagendamentoTitle
                                  }
                                >
                                  Escolha uma nova data
                                </Text>

                                <Text
                                  style={
                                    styles.execucaoAgendaReagendamentoText
                                  }
                                >
                                  O calendário mostra somente os dias e horários disponíveis para execução.
                                </Text>
                              </View>
                            </View>

                            {carregandoHorariosExecucao ? (
                              <View
                                style={
                                  styles.execucaoAgendaLoading
                                }
                              >
                                <ActivityIndicator
                                  color="#0B2447"
                                />

                                <Text
                                  style={
                                    styles.execucaoAgendaLoadingText
                                  }
                                >
                                  Carregando horários disponíveis...
                                </Text>
                              </View>
                            ) : (
                              <AgendaCalendarPicker
                                horarios={
                                  horariosExecucao
                                }
                                dataSelecionada={
                                  dataExecucaoSelecionada
                                }
                                horarioSelecionadoId={
                                  horarioExecucaoSelecionadoId
                                }
                                onSelecionarData={(
                                  data
                                ) => {
                                  setDataExecucaoSelecionada(
                                    data
                                  );

                                  setHorarioExecucaoSelecionadoId(
                                    ''
                                  );

                                  setErroAgendamentoExecucao(
                                    ''
                                  );
                                }}
                                onSelecionarHorario={(
                                  horario
                                ) => {
                                  setDataExecucaoSelecionada(
                                    horario.data_vistoria
                                  );

                                  setHorarioExecucaoSelecionadoId(
                                    horario.horario_vistoria_id
                                  );

                                  setErroAgendamentoExecucao(
                                    ''
                                  );
                                }}
                              />
                            )}

                            <View
                              style={
                                styles.execucaoAgendaReagendamentoActions
                              }
                            >
                              <TouchableOpacity
                                style={
                                  styles.execucaoAgendaVoltarButton
                                }
                                onPress={() => {
                                  setMostrarReagendamentoExecucao(
                                    false
                                  );

                                  setDataExecucaoSelecionada(
                                    ''
                                  );

                                  setHorarioExecucaoSelecionadoId(
                                    ''
                                  );
                                }}
                                disabled={
                                  processandoAgendamentoExecucao
                                }
                              >
                                <Text
                                  style={
                                    styles.execucaoAgendaVoltarButtonText
                                  }
                                >
                                  Voltar
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.execucaoAgendaNovaDataButton,

                                  (!dataExecucaoSelecionada ||
                                    !horarioExecucaoSelecionadoId ||
                                    processandoAgendamentoExecucao) &&
                                    styles.execucaoAgendaButtonDisabled,
                                ]}
                                disabled={
                                  !dataExecucaoSelecionada ||
                                  !horarioExecucaoSelecionadoId ||
                                  processandoAgendamentoExecucao
                                }
                                onPress={
                                  confirmarReagendamentoExecucaoCliente
                                }
                              >
                                {processandoAgendamentoExecucao ? (
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
                                    styles.execucaoAgendaNovaDataButtonText
                                  }
                                >
                                  Confirmar nova data
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : null}
                      </>
                    ) : null}

                    {agendamentoExecucao.status ===
                    'confirmada' ? (
                      <View
                        style={
                          styles.execucaoAgendaConfirmadaBox
                        }
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={25}
                          color="#287A46"
                        />

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.execucaoAgendaConfirmadaTitle
                            }
                          >
                            Agendamento confirmado
                          </Text>

                          <Text
                            style={
                              styles.execucaoAgendaConfirmadaDate
                            }
                          >
                            {formatarData(
                              agendamentoExecucao.data_confirmada
                            )}{' '}
                            às{' '}
                            {formatarHora(
                              agendamentoExecucao.hora_confirmada
                            )}
                          </Text>

                          {agendamentoExecucao.motivo_reagendamento ? (
                            <Text
                              style={
                                styles.execucaoAgendaConfirmadaText
                              }
                            >
                              Você escolheu uma nova data entre os horários disponíveis.
                            </Text>
                          ) : (
                            <Text
                              style={
                                styles.execucaoAgendaConfirmadaText
                              }
                            >
                              Você confirmou a data proposta pela EMAFE.
                            </Text>
                          )}
                        </View>
                      </View>
                    ) : null}

                    {erroAgendamentoExecucao ? (
                      <View
                        style={
                          styles.execucaoAgendaError
                        }
                      >
                        <Ionicons
                          name="alert-circle-outline"
                          size={19}
                          color="#9A3232"
                        />

                        <Text
                          style={
                            styles.execucaoAgendaErrorText
                          }
                        >
                          {erroAgendamentoExecucao}
                        </Text>
                      </View>
                    ) : null}

                    {mensagemAgendamentoExecucao ? (
                      <View
                        style={
                          styles.execucaoAgendaSuccess
                        }
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={19}
                          color="#287A46"
                        />

                        <Text
                          style={
                            styles.execucaoAgendaSuccessText
                          }
                        >
                          {mensagemAgendamentoExecucao}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : null}

              {/* FORM 03 - ASSINATURA DO CLIENTE */}

              {form03Cliente?.modo_assinatura ===
              'manual_app' ? (
                <>
                  <Text
                    style={
                      styles.sectionTitle
                    }
                  >
                    FORM 03
                  </Text>

                  <View
                    style={
                      styles.form03ClienteBox
                    }
                  >
                    <View
                      style={
                        styles.form03ClienteHeader
                      }
                    >
                      <View
                        style={
                          styles.form03ClienteIcon
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
                            styles.form03ClienteTitle
                          }
                        >
                          Termo de Vistoria e Execução
                        </Text>

                        <Text
                          style={
                            styles.form03ClienteText
                          }
                        >
                          O serviço deste protocolo foi concluído. Assine abaixo para registrar o recebimento do serviço.
                        </Text>
                      </View>
                    </View>

                    {form03Cliente.assinatura_cliente_ok ? (
                      <View
                        style={
                          styles.form03ClienteAssinado
                        }
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#287A46"
                        />

                        <View
                          style={{
                            flex: 1,
                          }}
                        >
                          <Text
                            style={
                              styles.form03ClienteAssinadoTitle
                            }
                          >
                            Sua assinatura já foi registrada
                          </Text>

                          <Text
                            style={
                              styles.form03ClienteAssinadoText
                            }
                          >
                            {form03Cliente.assinatura_cliente_nome ??
                              form03Cliente.cliente_nome}
                          </Text>

                          {form03Cliente.assinado_cliente_em ? (
                            <Text
                              style={
                                styles.form03ClienteAssinadoText
                              }
                            >
                              {formatarDataHora(
                                form03Cliente.assinado_cliente_em
                              )}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text
                          style={
                            styles.form03ClienteLabel
                          }
                        >
                          NOME DO CLIENTE OU REPRESENTANTE
                        </Text>

                        <TextInput
                          style={
                            styles.form03ClienteInput
                          }
                          value={
                            nomeAssinanteCliente
                          }
                          placeholder="Nome de quem está assinando"
                          placeholderTextColor="#8995A5"
                          onChangeText={
                            setNomeAssinanteCliente
                          }
                          editable={
                            !salvandoAssinaturaCliente
                          }
                        />

                        <SignaturePadCliente
                          salvando={
                            salvandoAssinaturaCliente
                          }
                          onSave={
                            salvarAssinaturaCliente
                          }
                        />
                      </>
                    )}

                    <View
                      style={
                        styles.form03ResponsavelStatus
                      }
                    >
                      <Ionicons
                        name={
                          form03Cliente.assinatura_funcionario_ok
                            ? 'checkmark-circle-outline'
                            : 'time-outline'
                        }
                        size={20}
                        color={
                          form03Cliente.assinatura_funcionario_ok
                            ? '#287A46'
                            : '#9A6A00'
                        }
                      />

                      <Text
                        style={
                          form03Cliente.assinatura_funcionario_ok
                            ? styles.form03ResponsavelOk
                            : styles.form03ResponsavelPendente
                        }
                      >
                        {form03Cliente.assinatura_funcionario_ok
                          ? 'O responsável da EMAFE também já assinou.'
                          : 'Aguardando assinatura do responsável da EMAFE.'}
                      </Text>
                    </View>

                    {erroForm03Cliente ? (
                      <View
                        style={
                          styles.form03ClienteErro
                        }
                      >
                        <Text
                          style={
                            styles.form03ClienteErroText
                          }
                        >
                          {
                            erroForm03Cliente
                          }
                        </Text>
                      </View>
                    ) : null}

                    {sucessoAssinaturaCliente ? (
                      <View
                        style={
                          styles.form03ClienteSucesso
                        }
                      >
                        <Text
                          style={
                            styles.form03ClienteSucessoText
                          }
                        >
                          {
                            sucessoAssinaturaCliente
                          }
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </>
              ) : carregandoForm03Cliente ? (
                <View
                  style={
                    styles.form03ClienteLoading
                  }
                >
                  <ActivityIndicator
                    size="small"
                    color="#0B5EA8"
                  />

                  <Text
                    style={
                      styles.form03ClienteLoadingText
                    }
                  >
                    Verificando FORM 03...
                  </Text>
                </View>
              ) : null}

              {/* ANDAMENTO */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Andamento
              </Text>

              <View
                style={
                  styles.timeline
                }
              >
                <View
                  style={
                    styles.timelineItem
                  }
                >
                  <View
                    style={
                      styles.timelineMarker
                    }
                  >
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>

                  <View
                    style={
                      styles.timelineContent
                    }
                  >
                    <Text
                      style={
                        styles.timelineTitle
                      }
                    >
                      Solicitação aberta
                    </Text>

                    <Text
                      style={
                        styles.timelineDate
                      }
                    >
                      {formatarDataHora(
                        solicitacao
                          .created_at
                      )}
                    </Text>
                  </View>
                </View>

                {statusJaPassouDaAnalise(
                  solicitacao.status
                ) ? (
                  <View
                    style={
                      styles.timelineItem
                    }
                  >
                    <View
                      style={
                        styles.timelineMarker
                      }
                    >
                      <Ionicons
                        name="search-outline"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.timelineContent
                      }
                    >
                      <Text
                        style={
                          styles.timelineTitle
                        }
                      >
                        Em análise
                      </Text>

                      <Text
                        style={
                          styles.timelineDate
                        }
                      >
                        Análise técnica registrada
                      </Text>
                    </View>
                  </View>
                ) : null}

                {statusJaChegouNaVistoria(
                  solicitacao.status
                ) &&
                agendamento ? (
                  <View
                    style={
                      styles.timelineItem
                    }
                  >
                    <View
                      style={
                        styles.timelineMarker
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.timelineContent
                      }
                    >
                      <Text
                        style={
                          styles.timelineTitle
                        }
                      >
                        Vistoria agendada
                      </Text>

                      <Text
                        style={
                          styles.timelineDate
                        }
                      >
                        {formatarData(
                          agendamento.data_vistoria
                        )}{' '}
                        às{' '}
                        {formatarHora(
                          agendamento.hora_inicio
                        )}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {solicitacao.status ===
                  'em_vistoria' ||
                solicitacao.status ===
                  'em_execucao' ||
                solicitacao.status ===
                  'concluida' ? (
                  <View
                    style={
                      styles.timelineItem
                    }
                  >
                    <View
                      style={
                        styles.timelineMarker
                      }
                    >
                      <Ionicons
                        name="construct-outline"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.timelineContent
                      }
                    >
                      <Text
                        style={
                          styles.timelineTitle
                        }
                      >
                        Em vistoria
                      </Text>

                      <Text
                        style={
                          styles.timelineDate
                        }
                      >
                        Vistoria técnica iniciada
                      </Text>
                    </View>
                  </View>
                ) : null}

                {solicitacao.status ===
                  'em_execucao' ||
                solicitacao.status ===
                  'concluida' ? (
                  <View
                    style={
                      styles.timelineItem
                    }
                  >
                    <View
                      style={
                        styles.timelineMarker
                      }
                    >
                      <Ionicons
                        name="hammer-outline"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.timelineContent
                      }
                    >
                      <Text
                        style={
                          styles.timelineTitle
                        }
                      >
                        Em execução
                      </Text>

                      <Text
                        style={
                          styles.timelineDate
                        }
                      >
                        Atendimento em execução
                      </Text>
                    </View>
                  </View>
                ) : null}

                {solicitacao.status ===
                'concluida' ? (
                  <View
                    style={[
                      styles.timelineItem,
                      styles.timelineItemLast,
                    ]}
                  >
                    <View
                      style={[
                        styles.timelineMarker,
                        styles.timelineMarkerSuccess,
                      ]}
                    >
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color="#FFFFFF"
                      />
                    </View>

                    <View
                      style={
                        styles.timelineContent
                      }
                    >
                      <Text
                        style={
                          styles.timelineTitle
                        }
                      >
                        Concluída
                      </Text>

                      <Text
                        style={
                          styles.timelineDate
                        }
                      >
                        Atendimento concluído
                      </Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {/* PRÓXIMAS ETAPAS */}

              <View
                style={styles.infoBox}
              >
                <View
                  style={
                    styles.infoHeader
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={20}
                    color="#0B5EA8"
                  />

                  <Text
                    style={
                      styles.infoTitle
                    }
                  >
                    Próximas etapas
                  </Text>
                </View>

                <Text
                  style={
                    styles.infoText
                  }
                >
                  {textoProximaEtapa(
                    solicitacao.status
                  )}
                </Text>
              </View>
            </>
          ) : null}

          <Text
            style={styles.footer}
          >
            EMAFE Engenharia • Manutenção
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SignaturePadCliente({
  onSave,
  salvando,
}: {
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

            const atualizado =
              `${caminhoRef.current} L ${ponto.x.toFixed(
                2
              )} ${ponto.y.toFixed(
                2
              )}`;

            caminhoRef.current =
              atualizado;

            setCaminhoAtual(
              atualizado
            );
          },

          onPanResponderRelease:
            () => {
              const finalizado =
                caminhoRef.current;

              if (finalizado) {
                setCaminhos(
                  (atuais) => [
                    ...atuais,
                    finalizado,
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
              const finalizado =
                caminhoRef.current;

              if (finalizado) {
                setCaminhos(
                  (atuais) => [
                    ...atuais,
                    finalizado,
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
        styles.form03SignatureContainer
      }
    >
      <Text
        style={
          styles.form03ClienteLabel
        }
      >
        ASSINATURA
      </Text>

      <Text
        style={
          styles.form03SignatureHelp
        }
      >
        Assine dentro do quadro usando o dedo, mouse ou caneta.
      </Text>

      <View
        style={
          styles.form03SignatureArea
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
          styles.form03SignatureActions
        }
      >
        <TouchableOpacity
          style={
            styles.form03SignatureClear
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
              styles.form03SignatureClearText
            }
          >
            Limpar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.form03SignatureSave,

            (!possuiAssinatura ||
              salvando) &&
              styles.form03SignatureDisabled,
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
              styles.form03SignatureSaveText
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

const styles =
  StyleSheet.create({
    form03ClienteBox: {
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#CCD7E3',
      borderRadius: 16,
      padding: 18,
      marginBottom: 22,
    },

    form03ClienteHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
      marginBottom: 18,
    },

    form03ClienteIcon: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
    },

    form03ClienteTitle: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '800',
    },

    form03ClienteText: {
      color: '#697789',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 4,
    },

    form03ClienteLabel: {
      color: '#42566D',
      fontSize: 10,
      fontWeight: '800',
      marginBottom: 8,
    },

    form03ClienteInput: {
      minHeight: 52,
      borderWidth: 1,
      borderColor: '#CCD7E3',
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      paddingHorizontal: 14,
      color: '#24364B',
      fontSize: 13,
      marginBottom: 14,
    },

    form03ClienteAssinado: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
      padding: 14,
      borderWidth: 1,
      borderColor: '#AED7BA',
      borderRadius: 12,
      backgroundColor: '#EAF6EE',
    },

    form03ClienteAssinadoTitle: {
      color: '#287A46',
      fontSize: 12,
      fontWeight: '800',
    },

    form03ClienteAssinadoText: {
      color: '#567362',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 3,
    },

    form03ResponsavelStatus: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginTop: 14,
      padding: 12,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
    },

    form03ResponsavelOk: {
      flex: 1,
      color: '#287A46',
      fontSize: 11,
      fontWeight: '700',
    },

    form03ResponsavelPendente: {
      flex: 1,
      color: '#9A6A00',
      fontSize: 11,
      fontWeight: '700',
    },

    form03ClienteErro: {
      backgroundColor: '#FCEEEE',
      borderRadius: 10,
      padding: 11,
      marginTop: 12,
    },

    form03ClienteErroText: {
      color: '#9A3232',
      fontSize: 11,
    },

    form03ClienteSucesso: {
      backgroundColor: '#EAF6EE',
      borderRadius: 10,
      padding: 11,
      marginTop: 12,
    },

    form03ClienteSucessoText: {
      color: '#287A46',
      fontSize: 11,
      fontWeight: '700',
    },

    form03ClienteLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 18,
    },

    form03ClienteLoadingText: {
      color: '#697789',
      fontSize: 11,
    },

    form03SignatureContainer: {
      marginTop: 4,
    },

    form03SignatureHelp: {
      color: '#8995A5',
      fontSize: 10,
      marginTop: -4,
      marginBottom: 8,
    },

    form03SignatureArea: {
      height: 180,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#9EABB8',
      borderRadius: 10,
      overflow: 'hidden',
    },

    form03SignatureActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 10,
    },

    form03SignatureClear: {
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

    form03SignatureClearText: {
      color: '#9A3232',
      fontSize: 10,
      fontWeight: '800',
    },

    form03SignatureSave: {
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: '#0B2447',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingHorizontal: 15,
    },

    form03SignatureSaveText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    form03SignatureDisabled: {
      opacity: 0.55,
    },

    container: {
      flex: 1,
      backgroundColor: '#F5F7FA',
    },

    scrollContent: {
      flexGrow: 1,
    },

    content: {
      width: '100%',
      maxWidth: 650,
      alignSelf: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 50,
    },

    backButton: {
      alignSelf: 'flex-start',
      paddingVertical: 8,
    },

    backText: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '600',
    },

    logo: {
      width: 250,
      height: 90,
      alignSelf: 'center',
      marginTop: 5,
    },

    title: {
      color: '#0B2447',
      fontSize: 27,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 10,
      marginBottom: 28,
    },

    protocolCard: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
    },

    protocolLabel: {
      color: '#8995A5',
      fontSize: 10,
      fontWeight: '700',
    },

    protocolNumber: {
      color: '#0B2447',
      fontSize: 20,
      fontWeight: '800',
      marginTop: 6,
    },

    statusBadge: {
      backgroundColor: '#E9F1FA',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
      marginTop: 12,
    },

    statusText: {
      color: '#0B2447',
      fontSize: 11,
      fontWeight: '700',
    },

    sectionTitle: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '800',
      marginTop: 25,
      marginBottom: 10,
    },

    sectionTitleRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop: 25,
      marginBottom: 10,
    },

    sectionTitleInline: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '800',
    },

    photoCount: {
      color: '#8995A5',
      fontSize: 10,
    },

    card: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 14,
      padding: 16,
    },

    cardTitle: {
      color: '#24364B',
      fontSize: 14,
      fontWeight: '700',
    },

    cardText: {
      color: '#697789',
      fontSize: 12,
      lineHeight: 19,
      marginTop: 5,
    },

    descriptionText: {
      color: '#42566D',
      fontSize: 13,
      lineHeight: 20,
    },

    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    infoRowText: {
      flex: 1,
      color: '#24364B',
      fontSize: 13,
      fontWeight: '600',
      lineHeight: 20,
    },

    contactRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },

    contactRowSpacing: {
      marginTop: 16,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#EEF1F5',
    },

    contactContent: {
      flex: 1,
      marginLeft: 11,
    },

    contactLabel: {
      color: '#8995A5',
      fontSize: 10,
      fontWeight: '600',
    },

    contactValue: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '600',
      marginTop: 3,
    },

    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    photoContainer: {
      width: 145,
      height: 145,
      borderRadius: 14,
      overflow: 'hidden',
      backgroundColor: '#E9EEF4',
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
      paddingHorizontal: 8,
      paddingVertical: 7,
      backgroundColor:
        'rgba(11,36,71,0.60)',
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    photoNumber: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoNumberText: {
      color: '#0B2447',
      fontSize: 10,
      fontWeight: '800',
    },

    photosLoading: {
      minHeight: 100,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      alignItems: 'center',
      justifyContent: 'center',
    },

    photosLoadingText: {
      color: '#697789',
      fontSize: 11,
      marginTop: 8,
    },

    noPhotosCard: {
      borderRadius: 14,
      padding: 20,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      alignItems: 'center',
    },

    noPhotosText: {
      color: '#8995A5',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 8,
    },

    photoErrorBox: {
      backgroundColor: '#FCEEEE',
      borderWidth: 1,
      borderColor: '#D29A9A',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    photoErrorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 11,
    },

    calendarCard: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 16,
      padding: 14,
      marginTop: 10,
    },

    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 13,
    },

    calendarArrowButton: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor: '#F1F5F9',
      alignItems: 'center',
      justifyContent: 'center',
    },

    calendarArrowButtonDisabled: {
      opacity: 0.45,
    },

    calendarMonthTitle: {
      color: '#0B2447',
      fontSize: 15,
      fontWeight: '800',
    },

    calendarWeekRow: {
      flexDirection: 'row',
      marginBottom: 5,
    },

    calendarWeekText: {
      width: '14.2857%',
      textAlign: 'center',
      color: '#7B8795',
      fontSize: 9,
      fontWeight: '800',
    },

    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },

    calendarDayWrapper: {
      width: '14.2857%',
      alignItems: 'center',
      paddingVertical: 3,
    },

    calendarDay: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
    },

    calendarDayOutside: {
      opacity: 0.18,
    },

    calendarDayUnavailable: {
      backgroundColor: '#F3F5F7',
    },

    calendarDayAvailable: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#0B5EA8',
    },

    calendarDaySelected: {
      backgroundColor: '#0B2447',
      borderColor: '#0B2447',
    },

    calendarDayText: {
      color: '#42566D',
      fontSize: 12,
      fontWeight: '600',
    },

    calendarDayTextOutside: {
      color: '#AAB3BE',
    },

    calendarDayTextUnavailable: {
      color: '#B0B8C2',
    },

    calendarDayTextAvailable: {
      color: '#0B5EA8',
      fontWeight: '800',
    },

    calendarDayTextSelected: {
      color: '#FFFFFF',
      fontWeight: '800',
    },

    calendarLegend: {
      marginTop: 13,
      paddingTop: 11,
      borderTopWidth: 1,
      borderTopColor: '#EEF1F4',
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },

    calendarLegendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },

    calendarLegendAvailable: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#0B5EA8',
    },

    calendarLegendUnavailable: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#F3F5F7',
      borderWidth: 1,
      borderColor: '#D8DEE7',
    },

    calendarLegendText: {
      color: '#697789',
      fontSize: 10,
    },

    timeSelectionCard: {
      marginTop: 12,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 16,
      padding: 15,
    },

    timeSelectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 12,
    },

    timeSelectionTitle: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '800',
    },

    timeSelectionDate: {
      color: '#697789',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 2,
    },

    timeButtonsContainer: {
      gap: 8,
    },

    timeButton: {
      minHeight: 50,
      borderWidth: 1,
      borderColor: '#C8D3DF',
      borderRadius: 12,
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 15,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    timeButtonSelected: {
      backgroundColor: '#0B2447',
      borderColor: '#0B2447',
    },

    timeButtonText: {
      color: '#0B2447',
      fontSize: 12,
      fontWeight: '700',
    },

    timeButtonTextSelected: {
      color: '#FFFFFF',
    },

    agendaHintBox: {
      marginTop: 10,
      backgroundColor: '#EDF5FC',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    agendaHintText: {
      flex: 1,
      color: '#0B5EA8',
      fontSize: 11,
      lineHeight: 16,
    },


    // ======================================================
    // AGENDAMENTO DA EXECUÇÃO - CLIENTE
    // ======================================================

    execucaoAgendaCard: {
      backgroundColor: '#F8FBFF',
      borderWidth: 1,
      borderColor: '#C9D9E9',
      borderRadius: 16,
      padding: 16,
    },

    execucaoAgendaHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
      marginBottom: 14,
    },

    execucaoAgendaIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
    },

    execucaoAgendaTitle: {
      color: '#0B2447',
      fontSize: 15,
      fontWeight: '800',
    },

    execucaoAgendaSubtitle: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 4,
    },

    execucaoAgendaLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },

    execucaoAgendaLoadingText: {
      color: '#697789',
      fontSize: 11,
    },

    execucaoAgendaProposta: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8E2EC',
      borderRadius: 13,
      padding: 14,
    },

    execucaoAgendaPropostaLabel: {
      color: '#697789',
      fontSize: 9,
      fontWeight: '800',
      marginBottom: 10,
    },

    execucaoAgendaDataRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },

    execucaoAgendaDataItem: {
      flexGrow: 1,
      flexBasis: 180,
      minHeight: 62,
      backgroundColor: '#F8FAFC',
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
    },

    execucaoAgendaInfoLabel: {
      color: '#8995A5',
      fontSize: 9,
      fontWeight: '700',
    },

    execucaoAgendaInfoValue: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '800',
      marginTop: 3,
    },

    execucaoAgendaPergunta: {
      color: '#0B2447',
      fontSize: 12,
      fontWeight: '800',
      marginTop: 15,
      marginBottom: 10,
    },

    execucaoAgendaActions: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    execucaoAgendaConfirmButton: {
      flexGrow: 1,
      minHeight: 48,
      borderRadius: 11,
      backgroundColor: '#287A46',
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    execucaoAgendaConfirmButtonText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '800',
    },

    execucaoAgendaReagendarButton: {
      flexGrow: 1,
      minHeight: 48,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#B8C9DA',
      paddingHorizontal: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
    },

    execucaoAgendaReagendarButtonText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '800',
    },

    execucaoAgendaButtonDisabled: {
      opacity: 0.55,
    },

    execucaoAgendaReagendamentoBox: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8E2EC',
      borderRadius: 14,
      padding: 14,
      marginTop: 14,
    },

    execucaoAgendaReagendamentoHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      marginBottom: 4,
    },

    execucaoAgendaReagendamentoTitle: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '800',
    },

    execucaoAgendaReagendamentoText: {
      color: '#697789',
      fontSize: 10,
      lineHeight: 16,
      marginTop: 3,
    },

    execucaoAgendaReagendamentoActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 13,
    },

    execucaoAgendaVoltarButton: {
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#CCD7E3',
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
    },

    execucaoAgendaVoltarButtonText: {
      color: '#42566D',
      fontSize: 10,
      fontWeight: '800',
    },

    execucaoAgendaNovaDataButton: {
      minHeight: 44,
      borderRadius: 10,
      backgroundColor: '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
      flexDirection: 'row',
      gap: 7,
    },

    execucaoAgendaNovaDataButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    execucaoAgendaConfirmadaBox: {
      backgroundColor: '#EAF6EE',
      borderWidth: 1,
      borderColor: '#B7DCC2',
      borderRadius: 13,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },

    execucaoAgendaConfirmadaTitle: {
      color: '#287A46',
      fontSize: 12,
      fontWeight: '800',
    },

    execucaoAgendaConfirmadaDate: {
      color: '#0B2447',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 4,
    },

    execucaoAgendaConfirmadaText: {
      color: '#567362',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 4,
    },

    execucaoAgendaError: {
      marginTop: 12,
      backgroundColor: '#FCEEEE',
      borderWidth: 1,
      borderColor: '#D29A9A',
      borderRadius: 11,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    execucaoAgendaErrorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 10,
      lineHeight: 15,
    },

    execucaoAgendaSuccess: {
      marginTop: 12,
      backgroundColor: '#EAF6EE',
      borderRadius: 11,
      padding: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    execucaoAgendaSuccessText: {
      flex: 1,
      color: '#287A46',
      fontSize: 10,
      fontWeight: '700',
      lineHeight: 15,
    },

    // ======================================================
    // VISTORIA
    // ======================================================

    vistoriaLoadingCard: {
      minHeight: 95,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      alignItems: 'center',
      justifyContent: 'center',
    },

    vistoriaLoadingText: {
      color: '#697789',
      fontSize: 11,
      marginTop: 8,
    },

    vistoriaCard: {
      backgroundColor: '#F0F8F2',
      borderWidth: 1,
      borderColor: '#B7DCC2',
      borderRadius: 16,
      padding: 16,
    },

    vistoriaHeader: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 11,
    },

    vistoriaIcon: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
    },

    vistoriaStatusLabel: {
      color: '#287A46',
      fontSize: 9,
      fontWeight: '800',
    },

    vistoriaTitle: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '800',
      marginTop: 3,
    },

    vistoriaSubtitle: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 4,
    },

    vistoriaInfoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 16,
    },

    vistoriaInfoItem: {
      flexGrow: 1,
      flexBasis: 180,
      minHeight: 68,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    vistoriaInfoLabel: {
      color: '#8995A5',
      fontSize: 9,
      fontWeight: '700',
    },

    vistoriaInfoValue: {
      color: '#0B2447',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 3,
    },

    vistoriaDetailRow: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 13,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginTop: 10,
    },

    vistoriaDetailLabel: {
      color: '#8995A5',
      fontSize: 9,
      fontWeight: '700',
    },

    vistoriaDetailValue: {
      color: '#24364B',
      fontSize: 12,
      fontWeight: '700',
      marginTop: 3,
    },

    vistoriaObservacao: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 13,
      marginTop: 10,
    },

    vistoriaObservacaoText: {
      color: '#42566D',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 5,
    },

    vistoriaAviso: {
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
      marginTop: 10,
    },

    vistoriaAvisoText: {
      flex: 1,
      color: '#52667D',
      fontSize: 10,
      lineHeight: 16,
    },

    vistoriaMensagemSucesso: {
      backgroundColor: '#EAF6EE',
      borderRadius: 12,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 10,
    },

    vistoriaMensagemSucessoText: {
      flex: 1,
      color: '#287A46',
      fontSize: 11,
      fontWeight: '700',
    },

    vistoriaActionRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },

    vistoriaReagendarButton: {
      flexGrow: 1,
      minHeight: 46,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: '#B8C9DA',
      backgroundColor: '#FFFFFF',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 12,
    },

    vistoriaReagendarButtonText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '800',
    },

    vistoriaCancelarButton: {
      flexGrow: 1,
      minHeight: 46,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: '#E1B5B5',
      backgroundColor: '#FFF8F8',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 12,
    },

    vistoriaCancelarButtonText: {
      color: '#9A3232',
      fontSize: 11,
      fontWeight: '800',
    },

    vistoriaSemAgendamento: {
      backgroundColor: '#EDF5FC',
      borderWidth: 1,
      borderColor: '#C5DAEE',
      borderRadius: 15,
      padding: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    vistoriaSemAgendamentoTitle: {
      color: '#0B2447',
      fontSize: 12,
      fontWeight: '800',
    },

    vistoriaSemAgendamentoText: {
      color: '#697789',
      fontSize: 10,
      lineHeight: 15,
      marginTop: 3,
    },

    vistoriaAgendarButton: {
      backgroundColor: '#0B2447',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
    },

    vistoriaAgendarButtonText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    vistoriaFormBox: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 15,
      padding: 14,
      marginTop: 10,
    },

    vistoriaFormTitle: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '800',
    },

    vistoriaFormText: {
      color: '#697789',
      fontSize: 10,
      lineHeight: 16,
      marginTop: 4,
      marginBottom: 10,
    },

    vistoriaCancelInput: {
      minHeight: 90,
      backgroundColor: '#F8FAFC',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 11,
      padding: 12,
      color: '#24364B',
      fontSize: 11,
      textAlignVertical: 'top',
    },

    vistoriaFormActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 12,
    },

    vistoriaFormBackButton: {
      minHeight: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#CCD7E3',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
      backgroundColor: '#FFFFFF',
    },

    vistoriaFormBackText: {
      color: '#42566D',
      fontSize: 10,
      fontWeight: '800',
    },

    vistoriaFormPrimaryButton: {
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
    },

    vistoriaFormPrimaryText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    vistoriaFormDangerButton: {
      minHeight: 42,
      borderRadius: 10,
      backgroundColor: '#9A3232',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 15,
    },

    vistoriaFormDangerText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '800',
    },

    vistoriaDataBox: {
      marginBottom: 8,
    },

    vistoriaDataButton: {
      minHeight: 44,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: '#C8D3DF',
      backgroundColor: '#F8FAFC',
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    vistoriaDataButtonSelected: {
      backgroundColor: '#0B2447',
      borderColor: '#0B2447',
    },

    vistoriaDataButtonText: {
      color: '#0B2447',
      fontSize: 11,
      fontWeight: '700',
    },

    vistoriaDataButtonTextSelected: {
      color: '#FFFFFF',
    },

    vistoriaHorarioList: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 8,
    },

    vistoriaHorarioButton: {
      borderWidth: 1,
      borderColor: '#B8C9DA',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 12,
      backgroundColor: '#FFFFFF',
    },

    vistoriaHorarioButtonSelected: {
      backgroundColor: '#0B5EA8',
      borderColor: '#0B5EA8',
    },

    vistoriaHorarioButtonText: {
      color: '#0B2447',
      fontSize: 10,
      fontWeight: '700',
    },

    vistoriaHorarioButtonTextSelected: {
      color: '#FFFFFF',
    },

    vistoriaHistoricoBox: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#D8DEE7',
      borderRadius: 14,
      padding: 14,
      marginTop: 10,
    },

    vistoriaHistoricoTitle: {
      color: '#0B2447',
      fontSize: 11,
      fontWeight: '800',
      marginBottom: 8,
    },

    vistoriaHistoricoItem: {
      borderTopWidth: 1,
      borderTopColor: '#EEF1F4',
      paddingVertical: 9,
    },

    vistoriaHistoricoStatus: {
      color: '#42566D',
      fontSize: 10,
      fontWeight: '800',
    },

    vistoriaHistoricoText: {
      color: '#697789',
      fontSize: 10,
      marginTop: 3,
    },

    vistoriaHistoricoMotivo: {
      color: '#9A3232',
      fontSize: 9,
      marginTop: 3,
    },

    timeline: {
      backgroundColor: '#FFFFFF',
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: '#D8DEE7',
    },

    timelineItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 15,
    },

    timelineMarker: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
    },

    timelineMarkerSuccess: {
      backgroundColor: '#287A46',
    },

    timelineItemLast: {
      marginBottom: 0,
    },

    timelineContent: {
      flex: 1,
      marginLeft: 12,
    },

    timelineTitle: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '700',
    },

    timelineDate: {
      color: '#8995A5',
      fontSize: 10,
      marginTop: 3,
    },

    naoAprovadaClienteCard: {
      backgroundColor: '#FFF4F4',
      borderWidth: 1,
      borderColor: '#E6B8B8',
      borderRadius: 15,
      padding: 16,
      marginTop: 18,
      marginBottom: 6,
    },

    naoAprovadaClienteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },

    naoAprovadaClienteIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: '#FCE6E6',
      alignItems: 'center',
      justifyContent: 'center',
    },

    naoAprovadaClienteStatus: {
      color: '#9A3232',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    naoAprovadaClienteTitle: {
      color: '#702727',
      fontSize: 16,
      fontWeight: '800',
      marginTop: 2,
    },

    naoAprovadaClienteMensagem: {
      color: '#5F4545',
      fontSize: 12,
      lineHeight: 19,
    },

    naoAprovadaClienteLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 12,
    },

    naoAprovadaClienteLoadingText: {
      color: '#7B6060',
      fontSize: 10,
    },

    naoAprovadaClienteErroBox: {
      marginTop: 12,
      borderRadius: 10,
      backgroundColor: '#FFFFFF',
      padding: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    naoAprovadaClienteErroText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 10,
      lineHeight: 15,
    },

    naoAprovadaClienteDetalhe: {
      backgroundColor: '#FFFFFF',
      borderRadius: 11,
      padding: 12,
      marginTop: 12,
    },

    naoAprovadaClienteLabel: {
      color: '#9A3232',
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.4,
      marginBottom: 5,
    },

    naoAprovadaClienteValor: {
      color: '#3E4A59',
      fontSize: 11,
      lineHeight: 18,
    },

    naoAprovadaClienteData: {
      color: '#7C8794',
      fontSize: 9,
      marginTop: 10,
    },

    naoAprovadaClienteAviso: {
      backgroundColor: '#FFFFFF',
      borderRadius: 11,
      padding: 11,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    naoAprovadaClienteAvisoText: {
      flex: 1,
      color: '#697789',
      fontSize: 10,
      lineHeight: 16,
    },

    ausenciaClienteCard: {
      backgroundColor: '#FFF7E8',
      borderWidth: 1,
      borderColor: '#E0B567',
      borderRadius: 15,
      padding: 16,
      marginTop: 18,
      marginBottom: 6,
    },

    ausenciaClienteHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      marginBottom: 12,
    },

    ausenciaClienteIcon: {
      width: 43,
      height: 43,
      borderRadius: 22,
      backgroundColor: '#FFF0D1',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ausenciaClienteStatus: {
      color: '#A76500',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 0.5,
    },

    ausenciaClienteTitle: {
      color: '#6D4700',
      fontSize: 16,
      fontWeight: '800',
      marginTop: 2,
    },

    ausenciaClienteMensagem: {
      color: '#634F2F',
      fontSize: 12,
      lineHeight: 19,
    },

    ausenciaClienteAviso: {
      backgroundColor: '#FFFFFF',
      borderRadius: 11,
      padding: 11,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    ausenciaClienteAvisoText: {
      flex: 1,
      color: '#697789',
      fontSize: 10,
      lineHeight: 16,
    },

    ausenciaClienteFotosTitulo: {
      color: '#6D4700',
      fontSize: 11,
      fontWeight: '800',
      marginTop: 15,
      marginBottom: 9,
    },

    ausenciaClienteLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 10,
    },

    ausenciaClienteLoadingText: {
      color: '#7B6540',
      fontSize: 10,
    },

    ausenciaClienteErro: {
      color: '#9A3232',
      fontSize: 10,
      marginBottom: 8,
    },

    ausenciaClienteFotosGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    ausenciaClienteFotoCard: {
      width: 105,
      height: 105,
      borderRadius: 12,
      overflow: 'hidden',
      backgroundColor: '#E7EBF0',
      position: 'relative',
    },

    ausenciaClienteFoto: {
      width: '100%',
      height: '100%',
    },

    ausenciaClienteFotoOverlay: {
      position: 'absolute',
      right: 7,
      bottom: 7,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    ausenciaClienteNovaSolicitacaoButton: {
      minHeight: 50,
      borderRadius: 12,
      backgroundColor: '#0B5EA8',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 16,
    },

    ausenciaClienteNovaSolicitacaoButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '800',
    },

    infoBox: {
      backgroundColor: '#EAF0F6',
      borderRadius: 14,
      padding: 16,
      marginTop: 25,
    },

    infoHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },

    infoTitle: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '700',
    },

    infoText: {
      color: '#697789',
      fontSize: 12,
      lineHeight: 18,
      marginTop: 7,
    },

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: '#697789',
      fontSize: 12,
      marginTop: 10,
    },

    errorBox: {
      backgroundColor: '#FCEEEE',
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: '#D29A9A',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    errorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 12,
    },

    footer: {
      color: '#8995A5',
      fontSize: 10,
      textAlign: 'center',
      marginTop: 35,
    },

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    },

    modalClose: {
      position: 'absolute',
      top: 40,
      right: 25,
      width: 45,
      height: 45,
      borderRadius: 23,
      backgroundColor:
        'rgba(255,255,255,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 5,
    },

    modalImage: {
      width: '100%',
      height: '80%',
    },

    modalCaption: {
      color: '#FFFFFF',
      fontSize: 12,
      marginTop: 12,
    },
  });