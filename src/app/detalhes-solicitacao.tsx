import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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

const styles =
  StyleSheet.create({
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