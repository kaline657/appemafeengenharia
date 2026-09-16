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
  solicitacao_id: string;
  protocolo: string;
  status: string;
  data_vistoria: string | null;
  hora_vistoria: string | null;
  observacao_vistoria: string | null;
  responsavel_vistoria_nome: string | null;
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
    await carregarForm03Cliente();
  }

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
          'buscar_agendamento_minha_solicitacao',
          {
            p_solicitacao_id:
              solicitacaoId,
          }
        );

      if (error) {
        console.error(
          'Erro ao buscar agendamento da vistoria:',
          error
        );

        setErroAgendamento(
          'Não foi possível carregar os dados da vistoria.'
        );

        return;
      }

      const resultado =
        data?.[0] as
          | AgendamentoVistoria
          | undefined;

      if (
        !resultado ||
        !resultado.data_vistoria
      ) {
        setAgendamento(null);
        return;
      }

      setAgendamento(resultado);
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
        return 'Sua solicitação está em análise. Quando a vistoria for agendada, a data e o horário aparecerão nesta tela.';

      case 'vistoria_agendada':
        return 'Sua vistoria já está agendada. Confira a data, o horário e as orientações acima.';

      case 'em_vistoria':
        return 'A vistoria técnica está em andamento. As próximas atualizações serão registradas neste protocolo.';

      case 'em_execucao':
        return 'O atendimento está em execução. Você poderá acompanhar a conclusão por esta tela.';

      case 'concluida':
        return 'O atendimento foi concluído. Este protocolo permanece disponível para consulta.';

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

              {/* DISPONIBILIDADE */}

              {solicitacao.disponibilidade_visita ? (
                <>
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
                        styles.infoRow
                      }
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#0B2447"
                      />

                      <Text
                        style={
                          styles.infoRowText
                        }
                      >
                        {
                          solicitacao
                            .disponibilidade_visita
                        }
                      </Text>
                    </View>
                  </View>
                </>
              ) : null}

              {/* VISTORIA AGENDADA */}

              {(carregandoAgendamento ||
                erroAgendamento ||
                agendamento) ? (
                <>
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

                  {!carregandoAgendamento &&
                  !erroAgendamento &&
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
                            Confira abaixo os dados definidos pela equipe da EMAFE.
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
                                agendamento.hora_vistoria
                              )}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {agendamento.responsavel_vistoria_nome ? (
                        <View
                          style={
                            styles.vistoriaDetailRow
                          }
                        >
                          <Ionicons
                            name="person-outline"
                            size={19}
                            color="#697789"
                          />

                          <View
                            style={{
                              flex: 1,
                            }}
                          >
                            <Text
                              style={
                                styles.vistoriaDetailLabel
                              }
                            >
                              Responsável pela vistoria
                            </Text>

                            <Text
                              style={
                                styles.vistoriaDetailValue
                              }
                            >
                              {
                                agendamento.responsavel_vistoria_nome
                              }
                            </Text>
                          </View>
                        </View>
                      ) : null}

                      {agendamento.observacao_vistoria ? (
                        <View
                          style={
                            styles.vistoriaObservacao
                          }
                        >
                          <Text
                            style={
                              styles.vistoriaDetailLabel
                            }
                          >
                            Observação
                          </Text>

                          <Text
                            style={
                              styles.vistoriaObservacaoText
                            }
                          >
                            {
                              agendamento.observacao_vistoria
                            }
                          </Text>
                        </View>
                      ) : null}

                      <View
                        style={
                          styles.vistoriaAviso
                        }
                      >
                        <Ionicons
                          name="information-circle-outline"
                          size={19}
                          color="#0B5EA8"
                        />

                        <Text
                          style={
                            styles.vistoriaAvisoText
                          }
                        >
                          Caso seja necessário alterar o agendamento, a equipe da EMAFE entrará em contato pelos dados informados na solicitação.
                        </Text>
                      </View>
                    </View>
                  ) : null}
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
                          agendamento.hora_vistoria
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