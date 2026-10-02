import { router } from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import {
  useCallback,

  useEffect,

  useMemo,

  useState,
} from 'react';

import {
  ActivityIndicator,

  Image,

  RefreshControl,

  SafeAreaView,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type Solicitacao = {

  solicitacao_id: string;

  protocolo: string;

  empreendimento: string;

  unidade: string;

  descricao_problema: string;

  status: string;

  created_at: string;

};

type FiltroStatus =

  | 'todos'

  | 'aberta'

  | 'em_analise'

  | 'vistoria'

  | 'execucao'

  | 'finalizadas';

export default function DashboardClienteScreen() {

  const [

    solicitacoes,

    setSolicitacoes,

  ] = useState<Solicitacao[]>([]);

  const [

    carregando,

    setCarregando,

  ] = useState(true);

  const [

    atualizando,

    setAtualizando,

  ] = useState(false);

  const [erro, setErro] =

    useState('');

  const [busca, setBusca] =

    useState('');

  const [

    filtroStatus,

    setFiltroStatus,

  ] = useState<FiltroStatus>('todos');

  useEffect(() => {

    carregarSolicitacoes();

  }, []);

  // ============================================================

  // CARREGAR SOLICITAÇÕES

  // ============================================================

  async function carregarSolicitacoes() {

    try {

      setCarregando(true);

      setErro('');

      const {

        data,

        error,

      } = await supabase.rpc(

        'listar_minhas_solicitacoes'

      );

      if (error) {

        console.error(

          'Erro ao carregar solicitações:',

          error

        );

        setErro(

          'Não foi possível carregar suas solicitações.'

        );

        return;

      }

      setSolicitacoes(

        (data ?? []) as Solicitacao[]

      );

    } catch (error) {

      console.error(error);

      setErro(

        'Ocorreu um erro ao carregar suas solicitações.'

      );

    } finally {

      setCarregando(false);

    }

  }

  // ============================================================

  // ATUALIZAR PUXANDO PARA BAIXO

  // ============================================================

  const atualizarSolicitacoes =

    useCallback(async () => {

      try {

        setAtualizando(true);

        setErro('');

        const {

          data,

          error,

        } = await supabase.rpc(

          'listar_minhas_solicitacoes'

        );

        if (error) {

          console.error(

            'Erro ao atualizar solicitações:',

            error

          );

          setErro(

            'Não foi possível atualizar suas solicitações.'

          );

          return;

        }

        setSolicitacoes(

          (data ?? []) as Solicitacao[]

        );

      } catch (error) {

        console.error(error);

        setErro(

          'Ocorreu um erro ao atualizar suas solicitações.'

        );

      } finally {

        setAtualizando(false);

      }

    }, []);

  // ============================================================

  // SAIR

  // ============================================================

  async function sair() {

    await supabase.auth.signOut();

    router.replace(

      '/login-cliente'

    );

  }

  // ============================================================

  // DATA

  // ============================================================

  function formatarDataHora(

    dataIso: string

  ) {

    if (!dataIso) {

      return '';

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

  // ============================================================

  // STATUS

  // ============================================================

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

  function estiloStatus(

    status: string

  ) {

    switch (status) {

      case 'aberta':

        return styles.statusOpen;

      case 'em_analise':

      case 'vistoria_agendada':

      case 'em_vistoria':

      case 'em_execucao':

        return styles.statusProgress;

      case 'aprovada':

      case 'concluida':

        return styles.statusSuccess;

      case 'nao_aprovada':

      case 'cancelada':

      case 'encerrada_ausencia':

        return styles.statusDanger;

      default:

        return styles.statusNeutral;

    }

  }

  // ============================================================

  // PESQUISA E FILTROS

  // ============================================================

  const solicitacoesFiltradas =

    useMemo(() => {

      const termo =

        busca.trim().toLowerCase();

      return solicitacoes.filter(

        (solicitacao) => {

          const protocolo =

            solicitacao.protocolo?.toLowerCase() ?? '';

          const empreendimento =

            solicitacao.empreendimento?.toLowerCase() ?? '';

          const unidade =

            solicitacao.unidade?.toLowerCase() ?? '';

          const descricao =

            solicitacao.descricao_problema?.toLowerCase() ?? '';

          const correspondeBusca =

            !termo ||

            protocolo.includes(termo) ||

            empreendimento.includes(termo) ||

            unidade.includes(termo) ||

            descricao.includes(termo);

          let correspondeStatus = true;

          if (filtroStatus === 'aberta') {

            correspondeStatus =

              solicitacao.status ===

              'aberta';

          }

          if (

            filtroStatus === 'em_analise'

          ) {

            correspondeStatus =

              solicitacao.status ===

              'em_analise';

          }

          if (

            filtroStatus === 'vistoria'

          ) {

            correspondeStatus = [

              'vistoria_agendada',

              'em_vistoria',

            ].includes(

              solicitacao.status

            );

          }

          if (

            filtroStatus === 'execucao'

          ) {

            correspondeStatus = [

              'aprovada',

              'em_execucao',

            ].includes(

              solicitacao.status

            );

          }

          if (

            filtroStatus ===

            'finalizadas'

          ) {

            correspondeStatus = [

              'concluida',

              'nao_aprovada',

              'cancelada',

              'encerrada_ausencia',

            ].includes(

              solicitacao.status

            );

          }

          return (

            correspondeBusca &&

            correspondeStatus

          );

        }

      );

    }, [

      solicitacoes,

      busca,

      filtroStatus,

    ]);

  // ============================================================

  // TELA

  // ============================================================

  return (

    <SafeAreaView

      style={styles.container}

    >

      <StatusBar style="dark" />

      <ScrollView

        contentContainerStyle={

          styles.scrollContent

        }

        showsVerticalScrollIndicator={

          false

        }

        refreshControl={

          <RefreshControl

            refreshing={atualizando}

            onRefresh={

              atualizarSolicitacoes

            }

          />

        }

      >

        <View style={styles.content}>

          {/* LOGO */}

          <Image

            source={require('../../assets/emafe/logo-horizontal-transparente.png')}

            style={styles.logo}

            resizeMode="contain"

          />

          {/* TÍTULO */}

          <Text style={styles.title}>

            Área do Cliente

          </Text>

          <Text

            style={styles.subtitle}

          >

            Acompanhe suas solicitações de

            manutenção de forma simples e

            segura.

          </Text>

          {/* ==================================================

              NOVA SOLICITAÇÃO

          ================================================== */}

          <TouchableOpacity

            style={styles.newButton}

            activeOpacity={0.85}

            onPress={() =>

              router.push(

                '/nova-solicitacao'

              )

            }

          >

            <Text

              style={

                styles.newButtonText

              }

            >

              + Nova solicitação

            </Text>

          </TouchableOpacity>

          {/* ==================================================

              MINHAS SOLICITAÇÕES

          ================================================== */}

          <View

            style={styles.searchArea}

          >

            <TextInput

              value={busca}

              onChangeText={setBusca}

              placeholder="Buscar protocolo, empreendimento ou unidade"

              placeholderTextColor="#8995A5"

              style={styles.searchInput}

              autoCapitalize="none"

              autoCorrect={false}

            />

            <ScrollView

              horizontal

              showsHorizontalScrollIndicator={

                false

              }

              contentContainerStyle={

                styles.filtersContainer

              }

            >

              {[

                {

                  id: 'todos',

                  texto: 'Todos',

                },

                {

                  id: 'aberta',

                  texto: 'Abertas',

                },

                {

                  id: 'em_analise',

                  texto: 'Em análise',

                },

                {

                  id: 'vistoria',

                  texto: 'Vistoria',

                },

                {

                  id: 'execucao',

                  texto: 'Execução',

                },

                {

                  id: 'finalizadas',

                  texto: 'Finalizadas',

                },

              ].map((filtro) => {

                const selecionado =

                  filtroStatus ===

                  filtro.id;

                return (

                  <TouchableOpacity

                    key={filtro.id}

                    style={[

                      styles.filterButton,

                      selecionado &&

                        styles.filterButtonSelected,

                    ]}

                    onPress={() =>

                      setFiltroStatus(

                        filtro.id as FiltroStatus

                      )

                    }

                  >

                    <Text

                      style={[

                        styles.filterButtonText,

                        selecionado &&

                          styles.filterButtonTextSelected,

                      ]}

                    >

                      {filtro.texto}

                    </Text>

                  </TouchableOpacity>

                );

              })}

            </ScrollView>

          </View>

          <View

            style={

              styles.sectionHeader

            }

          >

            <Text

              style={

                styles.sectionTitle

              }

            >

              Minhas solicitações

            </Text>

            {!carregando ? (

              <Text

                style={

                  styles.totalText

                }

              >

                {solicitacoesFiltradas.length}{' '}

                {solicitacoesFiltradas.length ===

                1

                  ? 'solicitação'

                  : 'solicitações'}

              </Text>

            ) : null}

          </View>

          {/* ==================================================

              ERRO

          ================================================== */}

          {erro ? (

            <View

              style={styles.errorBox}

            >

              <Text

                style={

                  styles.errorText

                }

              >

                {erro}

              </Text>

              <TouchableOpacity

                onPress={

                  carregarSolicitacoes

                }

              >

                <Text

                  style={

                    styles.retryText

                  }

                >

                  Tentar novamente

                </Text>

              </TouchableOpacity>

            </View>

          ) : null}

          {/* ==================================================

              CARREGAMENTO

          ================================================== */}

          {carregando ? (

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

                Carregando solicitações...

              </Text>

            </View>

          ) : null}

          {/* ==================================================

              NENHUMA SOLICITAÇÃO

          ================================================== */}

          {!carregando &&

          solicitacoes.length === 0 ? (

            <View

              style={styles.emptyCard}

            >

              <Text

                style={

                  styles.emptyTitle

                }

              >

                Nenhuma solicitação

              </Text>

              <Text

                style={

                  styles.emptyText

                }

              >

                Quando você abrir uma

                solicitação de manutenção,

                ela aparecerá aqui.

              </Text>

            </View>

          ) : null}

          {!carregando &&

          solicitacoes.length > 0 &&

          solicitacoesFiltradas.length ===

            0 ? (

            <View

              style={styles.emptyCard}

            >

              <Text

                style={styles.emptyTitle}

              >

                Nenhum resultado encontrado

              </Text>

              <Text

                style={styles.emptyText}

              >

                Tente pesquisar outro termo ou selecionar outro filtro.

              </Text>

            </View>

          ) : null}

          {/* ==================================================

              LISTA DE SOLICITAÇÕES

          ================================================== */}

          {!carregando &&

            solicitacoesFiltradas.map(

              (solicitacao) => (

                <View

                  key={

                    solicitacao

                      .solicitacao_id

                  }

                  style={

                    styles.requestCard

                  }

                >

                  {/* PROTOCOLO E STATUS */}

                  <View

                    style={

                      styles.requestHeader

                    }

                  >

                    <View

                      style={

                        styles.protocolArea

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

                          styles.protocolText

                        }

                      >

                        {

                          solicitacao

                            .protocolo

                        }

                      </Text>

                    </View>

                    <View

                      style={[

                        styles.statusBadge,

                        estiloStatus(

                          solicitacao.status

                        ),

                      ]}

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

                  <View

                    style={

                      styles.propertyBox

                    }

                  >

                    <Text

                      style={

                        styles.propertyName

                      }

                    >

                      {

                        solicitacao

                          .empreendimento

                      }

                    </Text>

                    <Text

                      style={

                        styles.propertyUnit

                      }

                    >

                      Unidade{' '}

                      {

                        solicitacao

                          .unidade

                      }

                    </Text>

                  </View>

                  {/* ==================================================

                      PROBLEMA RELATADO

                      Não mostramos:

                      - categoria técnica

                      - elemento construtivo

                      - manifestação patológica

                      - garantia

                      Tudo isso será definido posteriormente

                      pela equipe EMAFE.

                  ================================================== */}

                  <View

                    style={

                      styles.descriptionBox

                    }

                  >

                    <Text

                      style={

                        styles.descriptionLabel

                      }

                    >

                      PROBLEMA RELATADO

                    </Text>

                    <Text

                      style={

                        styles.descriptionText

                      }

                      numberOfLines={3}

                    >

                      {

                        solicitacao

                          .descricao_problema

                      }

                    </Text>

                  </View>

                  {/* STATUS DE ANÁLISE */}

                  {solicitacao.status ===

                  'aberta' ? (

                    <View

                      style={

                        styles.analysisBox

                      }

                    >

                      <Text

                        style={

                          styles.analysisText

                        }

                      >

                        Aguardando análise da

                        equipe EMAFE

                      </Text>

                    </View>

                  ) : null}

                  {/* DATA */}

                  <View

                    style={

                      styles.divider

                    }

                  />

                  <Text

                    style={

                      styles.dateText

                    }

                  >

                    Aberta em{' '}

                    {formatarDataHora(

                      solicitacao.created_at

                    )}

                  </Text>

                  {/* ACOMPANHAR */}

                  <TouchableOpacity

                    style={

                      styles.detailsButton

                    }

                    activeOpacity={0.85}

                    onPress={() =>

                      router.push({

                        pathname:

                          '/detalhes-solicitacao',

                        params: {

                          solicitacaoId:

                            solicitacao

                              .solicitacao_id,

                        },

                      })

                    }

                  >

                    <Text

                      style={

                        styles.detailsButtonText

                      }

                    >

                      Acompanhar solicitação

                    </Text>

                  </TouchableOpacity>

                </View>

              )

            )}

          {/* ==================================================

              SAIR

          ================================================== */}

          <TouchableOpacity

            style={

              styles.logoutButton

            }

            onPress={sair}

          >

            <Text

              style={

                styles.logoutText

              }

            >

              Sair

            </Text>

          </TouchableOpacity>

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

// ============================================================

// ESTILOS

// ============================================================

const styles =

  StyleSheet.create({

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

      maxWidth: 680,

      alignSelf: 'center',

      paddingHorizontal: 24,

      paddingTop: 30,

      paddingBottom: 45,

    },

    logo: {

      width: 260,

      height: 95,

      alignSelf: 'center',

    },

    title: {

      color: '#0B2447',

      fontSize: 30,

      fontWeight: '800',

      textAlign: 'center',

      marginTop: 10,

    },

    subtitle: {

      color: '#697789',

      fontSize: 14,

      lineHeight: 21,

      textAlign: 'center',

      marginTop: 8,

      marginBottom: 28,

    },

    // NOVA SOLICITAÇÃO

    newButton: {

      height: 58,

      borderRadius: 16,

      backgroundColor:

        '#0B2447',

      alignItems: 'center',

      justifyContent: 'center',

      marginBottom: 32,

    },

    newButtonText: {

      color: '#FFFFFF',

      fontSize: 16,

      fontWeight: '700',

    },

    // PESQUISA E FILTROS

    searchArea: {

      marginBottom: 24,

    },

    searchInput: {

      height: 50,

      backgroundColor: '#FFFFFF',

      borderWidth: 1,

      borderColor: '#D8DEE7',

      borderRadius: 14,

      paddingHorizontal: 15,

      color: '#0B2447',

      fontSize: 13,

    },

    filtersContainer: {

      gap: 8,

      paddingTop: 12,

      paddingRight: 8,

    },

    filterButton: {

      paddingHorizontal: 14,

      paddingVertical: 9,

      borderRadius: 20,

      backgroundColor: '#FFFFFF',

      borderWidth: 1,

      borderColor: '#D8DEE7',

    },

    filterButtonSelected: {

      backgroundColor: '#0B2447',

      borderColor: '#0B2447',

    },

    filterButtonText: {

      color: '#697789',

      fontSize: 11,

      fontWeight: '600',

    },

    filterButtonTextSelected: {

      color: '#FFFFFF',

    },

    // CABEÇALHO

    sectionHeader: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      alignItems: 'center',

      marginBottom: 14,

    },

    sectionTitle: {

      color: '#0B2447',

      fontSize: 20,

      fontWeight: '800',

    },

    totalText: {

      color: '#8995A5',

      fontSize: 11,

    },

    // CARD DO CHAMADO

    requestCard: {

      backgroundColor:

        '#FFFFFF',

      borderRadius: 16,

      padding: 18,

      borderWidth: 1,

      borderColor:

        '#D8DEE7',

      marginBottom: 16,

    },

    requestHeader: {

      flexDirection: 'row',

      justifyContent:

        'space-between',

      alignItems: 'flex-start',

      gap: 10,

    },

    protocolArea: {

      flex: 1,

    },

    protocolLabel: {

      color: '#8995A5',

      fontSize: 9,

      fontWeight: '700',

    },

    protocolText: {

      color: '#0B2447',

      fontSize: 15,

      fontWeight: '800',

      marginTop: 4,

    },

    // STATUS

    statusBadge: {

      borderRadius: 20,

      paddingHorizontal: 10,

      paddingVertical: 6,

    },

    statusOpen: {

      backgroundColor:

        '#E9F1FA',

    },

    statusProgress: {

      backgroundColor:

        '#FFF4D9',

    },

    statusSuccess: {

      backgroundColor:

        '#EAF6EE',

    },

    statusDanger: {

      backgroundColor:

        '#FCEEEE',

    },

    statusNeutral: {

      backgroundColor:

        '#EEF1F4',

    },

    statusText: {

      color: '#0B2447',

      fontSize: 10,

      fontWeight: '700',

    },

    // IMÓVEL

    propertyBox: {

      backgroundColor:

        '#F5F7FA',

      borderRadius: 12,

      padding: 12,

      marginTop: 15,

    },

    propertyName: {

      color: '#0B2447',

      fontSize: 14,

      fontWeight: '700',

    },

    propertyUnit: {

      color: '#697789',

      fontSize: 11,

      marginTop: 3,

    },

    // PROBLEMA RELATADO

    descriptionBox: {

      marginTop: 15,

      backgroundColor:

        '#F8FAFC',

      borderRadius: 10,

      padding: 12,

    },

    descriptionLabel: {

      color: '#8995A5',

      fontSize: 9,

      fontWeight: '700',

      textTransform:

        'uppercase',

      marginBottom: 5,

    },

    descriptionText: {

      color: '#42566D',

      fontSize: 12,

      lineHeight: 18,

    },

    // AGUARDANDO ANÁLISE

    analysisBox: {

      alignSelf: 'flex-start',

      marginTop: 13,

      backgroundColor:

        '#EAF0F6',

      borderRadius: 20,

      paddingHorizontal: 12,

      paddingVertical: 7,

    },

    analysisText: {

      color: '#42566D',

      fontSize: 10,

      fontWeight: '700',

    },

    divider: {

      height: 1,

      backgroundColor:

        '#E5EAF0',

      marginTop: 16,

      marginBottom: 12,

    },

    dateText: {

      color: '#8995A5',

      fontSize: 10,

    },

    // ACOMPANHAR

    detailsButton: {

      height: 45,

      borderRadius: 12,

      borderWidth: 1,

      borderColor:

        '#0B2447',

      alignItems: 'center',

      justifyContent: 'center',

      marginTop: 15,

    },

    detailsButtonText: {

      color: '#0B2447',

      fontSize: 12,

      fontWeight: '700',

    },

    // CARREGAMENTO

    loadingContainer: {

      alignItems: 'center',

      justifyContent: 'center',

      paddingVertical: 60,

    },

    loadingText: {

      color: '#697789',

      fontSize: 12,

      marginTop: 10,

    },

    // VAZIO

    emptyCard: {

      backgroundColor:

        '#FFFFFF',

      borderRadius: 16,

      padding: 30,

      alignItems: 'center',

      borderWidth: 1,

      borderColor:

        '#D8DEE7',

    },

    emptyTitle: {

      color: '#0B2447',

      fontSize: 16,

      fontWeight: '700',

    },

    emptyText: {

      color: '#697789',

      fontSize: 12,

      textAlign: 'center',

      lineHeight: 18,

      marginTop: 6,

    },

    // ERRO

    errorBox: {

      backgroundColor:

        '#FCEEEE',

      borderRadius: 12,

      padding: 14,

      marginBottom: 15,

      borderWidth: 1,

      borderColor:

        '#D29A9A',

    },

    errorText: {

      color: '#9A3232',

      fontSize: 12,

    },

    retryText: {

      color: '#0B5EA8',

      fontSize: 12,

      fontWeight: '700',

      marginTop: 8,

    },

    // SAIR

    logoutButton: {

      alignSelf: 'center',

      paddingHorizontal: 20,

      paddingVertical: 12,

      marginTop: 15,

    },

    logoutText: {

      color: '#A52828',

      fontSize: 14,

      fontWeight: '600',

    },

    footer: {

      color: '#8995A5',

      fontSize: 10,

      textAlign: 'center',

      marginTop: 25,

    },

  });