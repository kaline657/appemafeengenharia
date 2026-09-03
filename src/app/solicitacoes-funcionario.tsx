import { Ionicons } from '@expo/vector-icons';
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
    useWindowDimensions,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

// ============================================================
// TIPOS
// ============================================================

type SolicitacaoFuncionario = {
  solicitacao_id: string;
  protocolo: string;

  cliente_nome: string;
  telefone_contato: string | null;
  email_contato: string | null;

  cidade: string | null;
  empreendimento: string;
  unidade: string;
  comodo: string | null;

  descricao_problema: string;

  status: string;

  quantidade_fotos: number;

  created_at: string;
  updated_at: string;
};

type FiltroStatus =
  | 'todos'
  | 'novos'
  | 'em_analise'
  | 'vistorias'
  | 'em_execucao'
  | 'concluidas';

export default function SolicitacoesFuncionarioScreen() {
  const { width } =
    useWindowDimensions();

  const modoDesktop =
    width >= 850;

  const [
    solicitacoes,
    setSolicitacoes,
  ] = useState<
    SolicitacaoFuncionario[]
  >([]);

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    atualizando,
    setAtualizando,
  ] = useState(false);

  const [
    autorizado,
    setAutorizado,
  ] = useState(false);

  const [
    busca,
    setBusca,
  ] = useState('');

  const [
    filtroStatus,
    setFiltroStatus,
  ] =
    useState<FiltroStatus>(
      'todos'
    );

  const [
    erro,
    setErro,
  ] = useState('');

  useEffect(() => {
    iniciarTela();
  }, []);

  // ==========================================================
  // INICIALIZA
  // ==========================================================

  async function iniciarTela() {
    try {
      setCarregando(true);
      setErro('');

      const permitido =
        await verificarAcesso();

      if (!permitido) {
        return;
      }

      await carregarSolicitacoes();
    } catch (error) {
      console.error(
        'Erro ao iniciar tela:',
        error
      );

      setErro(
        'Não foi possível carregar as solicitações.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // VERIFICA ACESSO
  // ==========================================================

  async function verificarAcesso() {
    try {
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
        router.replace(
          '/login-funcionario'
        );

        return false;
      }

      const {
        data: ehFuncionario,
        error,
      } =
        await supabase.rpc(
          'sou_funcionario'
        );

      if (
        error ||
        ehFuncionario !== true
      ) {
        await supabase.auth
          .signOut();

        router.replace(
          '/login-funcionario'
        );

        return false;
      }

      setAutorizado(true);

      return true;
    } catch (error) {
      console.error(
        'Erro ao verificar acesso:',
        error
      );

      await supabase.auth
        .signOut();

      router.replace(
        '/login-funcionario'
      );

      return false;
    }
  }

  // ==========================================================
  // CARREGA SOLICITAÇÕES
  // ==========================================================

  async function carregarSolicitacoes() {
    try {
      setErro('');

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'listar_solicitacoes_funcionario'
        );

      if (error) {
        console.error(
          'Erro ao listar solicitações:',
          error
        );

        setErro(
          'Não foi possível carregar os chamados.'
        );

        return;
      }

      setSolicitacoes(
        (
          data ?? []
        ).map(
          (item: any) => ({
            ...item,

            quantidade_fotos:
              Number(
                item.quantidade_fotos
              ) || 0,
          })
        )
      );
    } catch (error) {
      console.error(
        'Erro ao carregar chamados:',
        error
      );

      setErro(
        'Ocorreu um erro ao carregar as solicitações.'
      );
    }
  }

  // ==========================================================
  // ABRIR SOLICITAÇÃO
  // ==========================================================

  function abrirSolicitacao(
    solicitacaoId: string
  ) {
    router.push({
      pathname:
        '/detalhes-solicitacao-funcionario',

      params: {
        solicitacaoId,
      },
    });
  }

  // ==========================================================
  // ATUALIZAR
  // ==========================================================

  const atualizar =
    useCallback(async () => {
      try {
        setAtualizando(true);

        await carregarSolicitacoes();
      } finally {
        setAtualizando(false);
      }
    }, []);

  // ==========================================================
  // STATUS
  // ==========================================================

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

  function estiloStatus(
    status: string
  ) {
    switch (status) {
      case 'aberta':
        return styles.statusNova;

      case 'em_analise':
        return styles.statusAnalise;

      case 'vistoria_agendada':
      case 'em_vistoria':
        return styles.statusVistoria;

      case 'em_execucao':
        return styles.statusExecucao;

      case 'aprovada':
      case 'concluida':
        return styles.statusConcluida;

      case 'nao_aprovada':
      case 'cancelada':
        return styles.statusCancelada;

      default:
        return styles.statusPadrao;
    }
  }

  // ==========================================================
  // DATA
  // ==========================================================

  function formatarData(
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

  // ==========================================================
  // FILTROS
  // ==========================================================

  function correspondeFiltro(
    solicitacao:
      SolicitacaoFuncionario
  ) {
    switch (filtroStatus) {
      case 'novos':
        return (
          solicitacao.status ===
          'aberta'
        );

      case 'em_analise':
        return (
          solicitacao.status ===
          'em_analise'
        );

      case 'vistorias':
        return [
          'vistoria_agendada',
          'em_vistoria',
        ].includes(
          solicitacao.status
        );

      case 'em_execucao':
        return (
          solicitacao.status ===
          'em_execucao'
        );

      case 'concluidas':
        return (
          solicitacao.status ===
          'concluida'
        );

      default:
        return true;
    }
  }

  const solicitacoesFiltradas =
    useMemo(() => {
      const textoBusca =
        busca
          .trim()
          .toLowerCase();

      return solicitacoes.filter(
        (solicitacao) => {
          if (
            !correspondeFiltro(
              solicitacao
            )
          ) {
            return false;
          }

          if (!textoBusca) {
            return true;
          }

          const campos = [
            solicitacao.protocolo,
            solicitacao.cliente_nome,
            solicitacao.cidade,
            solicitacao.empreendimento,
            solicitacao.unidade,
            solicitacao.comodo,
            solicitacao.telefone_contato,
            solicitacao.email_contato,
          ];

          return campos.some(
            (campo) =>
              String(
                campo ?? ''
              )
                .toLowerCase()
                .includes(
                  textoBusca
                )
          );
        }
      );
    }, [
      solicitacoes,
      busca,
      filtroStatus,
    ]);

  // ==========================================================
  // CARREGANDO
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
            Carregando solicitações...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!autorizado) {
    return null;
  }

  // ==========================================================
  // TELA
  // ==========================================================

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
            refreshing={
              atualizando
            }
            onRefresh={
              atualizar
            }
          />
        }
      >
        <View
          style={
            styles.content
          }
        >
          {/* ==================================================
              CABEÇALHO
          ================================================== */}

          <View
            style={
              styles.topBar
            }
          >
            <TouchableOpacity
              style={
                styles.backButton
              }
              onPress={() =>
                router.replace(
                  '/dashboard-funcionario'
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
                Painel
              </Text>
            </TouchableOpacity>

            <Image
              source={require('../../assets/emafe/logo-horizontal-transparente.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          <Text
            style={
              styles.title
            }
          >
            Solicitações
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Consulte e acompanhe os chamados de manutenção registrados pelos clientes.
          </Text>

          {/* ==================================================
              BUSCA
          ================================================== */}

          <View
            style={
              styles.searchBox
            }
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#697789"
            />

            <TextInput
              style={
                styles.searchInput
              }
              placeholder="Buscar protocolo, cliente, empreendimento, unidade..."
              placeholderTextColor="#8995A5"
              value={busca}
              onChangeText={
                setBusca
              }
            />

            {busca ? (
              <TouchableOpacity
                onPress={() =>
                  setBusca('')
                }
              >
                <Ionicons
                  name="close-circle"
                  size={20}
                  color="#8995A5"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* ==================================================
              FILTROS
          ================================================== */}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.filtersContainer
            }
          >
            <FiltroButton
              texto="Todos"
              ativo={
                filtroStatus ===
                'todos'
              }
              onPress={() =>
                setFiltroStatus(
                  'todos'
                )
              }
            />

            <FiltroButton
              texto="Novos"
              ativo={
                filtroStatus ===
                'novos'
              }
              onPress={() =>
                setFiltroStatus(
                  'novos'
                )
              }
            />

            <FiltroButton
              texto="Em análise"
              ativo={
                filtroStatus ===
                'em_analise'
              }
              onPress={() =>
                setFiltroStatus(
                  'em_analise'
                )
              }
            />

            <FiltroButton
              texto="Vistorias"
              ativo={
                filtroStatus ===
                'vistorias'
              }
              onPress={() =>
                setFiltroStatus(
                  'vistorias'
                )
              }
            />

            <FiltroButton
              texto="Em execução"
              ativo={
                filtroStatus ===
                'em_execucao'
              }
              onPress={() =>
                setFiltroStatus(
                  'em_execucao'
                )
              }
            />

            <FiltroButton
              texto="Concluídas"
              ativo={
                filtroStatus ===
                'concluidas'
              }
              onPress={() =>
                setFiltroStatus(
                  'concluidas'
                )
              }
            />
          </ScrollView>

          {/* ==================================================
              CABEÇALHO DA LISTA
          ================================================== */}

          <View
            style={
              styles.listHeader
            }
          >
            <Text
              style={
                styles.resultCount
              }
            >
              {
                solicitacoesFiltradas.length
              }{' '}
              {solicitacoesFiltradas
                .length === 1
                ? 'solicitação'
                : 'solicitações'}
            </Text>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              onPress={
                atualizar
              }
            >
              {atualizando ? (
                <ActivityIndicator
                  size="small"
                  color="#0B5EA8"
                />
              ) : (
                <Ionicons
                  name="refresh-outline"
                  size={18}
                  color="#0B5EA8"
                />
              )}

              <Text
                style={
                  styles.refreshText
                }
              >
                Atualizar
              </Text>
            </TouchableOpacity>
          </View>

          {/* ==================================================
              ERRO
          ================================================== */}

          {erro ? (
            <View
              style={
                styles.errorBox
              }
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
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

          {/* ==================================================
              SEM RESULTADO
          ================================================== */}

          {!erro &&
          solicitacoesFiltradas
            .length === 0 ? (
            <View
              style={
                styles.emptyCard
              }
            >
              <Ionicons
                name="document-text-outline"
                size={34}
                color="#8995A5"
              />

              <Text
                style={
                  styles.emptyTitle
                }
              >
                Nenhuma solicitação encontrada
              </Text>

              <Text
                style={
                  styles.emptyText
                }
              >
                Não encontramos chamados para os filtros selecionados.
              </Text>
            </View>
          ) : null}

          {/* ==================================================
              DESKTOP
          ================================================== */}

          {modoDesktop &&
          solicitacoesFiltradas
            .length > 0 ? (
            <View
              style={
                styles.desktopTable
              }
            >
              {/* CABEÇALHO DA TABELA */}

              <View
                style={
                  styles.tableHeader
                }
              >
                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colProtocol,
                  ]}
                >
                  Protocolo
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colClient,
                  ]}
                >
                  Cliente
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colProperty,
                  ]}
                >
                  Imóvel
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colStatus,
                  ]}
                >
                  Status
                </Text>

                <Text
                  style={[
                    styles.tableHeaderText,
                    styles.colDate,
                  ]}
                >
                  Abertura
                </Text>
              </View>

              {/* LINHAS */}

              {solicitacoesFiltradas.map(
                (solicitacao) => (
                  <TouchableOpacity
                    key={
                      solicitacao
                        .solicitacao_id
                    }
                    style={
                      styles.tableRow
                    }
                    activeOpacity={
                      0.65
                    }
                    onPress={() =>
                      abrirSolicitacao(
                        solicitacao
                          .solicitacao_id
                      )
                    }
                  >
                    {/* PROTOCOLO */}

                    <View
                      style={
                        styles.colProtocol
                      }
                    >
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

                      <Text
                        style={
                          styles.photoText
                        }
                      >
                        {
                          solicitacao
                            .quantidade_fotos
                        }{' '}
                        fotos
                      </Text>
                    </View>

                    {/* CLIENTE */}

                    <View
                      style={
                        styles.colClient
                      }
                    >
                      <Text
                        style={
                          styles.mainCellText
                        }
                      >
                        {
                          solicitacao
                            .cliente_nome
                        }
                      </Text>

                      <Text
                        style={
                          styles.secondaryCellText
                        }
                        numberOfLines={
                          1
                        }
                      >
                        {
                          solicitacao
                            .telefone_contato ||
                          '-'
                        }
                      </Text>
                    </View>

                    {/* IMÓVEL */}

                    <View
                      style={
                        styles.colProperty
                      }
                    >
                      <Text
                        style={
                          styles.mainCellText
                        }
                      >
                        {
                          solicitacao
                            .empreendimento
                        }
                      </Text>

                      <Text
                        style={
                          styles.secondaryCellText
                        }
                      >
                        Unidade{' '}
                        {
                          solicitacao
                            .unidade
                        }
                      </Text>

                      {solicitacao.comodo ? (
                        <Text
                          style={
                            styles.secondaryCellText
                          }
                        >
                          {
                            solicitacao
                              .comodo
                          }
                        </Text>
                      ) : null}
                    </View>

                    {/* STATUS */}

                    <View
                      style={
                        styles.colStatus
                      }
                    >
                      <View
                        style={[
                          styles.statusBadge,

                          estiloStatus(
                            solicitacao
                              .status
                          ),
                        ]}
                      >
                        <Text
                          style={
                            styles.statusText
                          }
                        >
                          {textoStatus(
                            solicitacao
                              .status
                          )}
                        </Text>
                      </View>
                    </View>

                    {/* DATA */}

                    <View
                      style={
                        styles.colDate
                      }
                    >
                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {formatarData(
                          solicitacao
                            .created_at
                        )}
                      </Text>

                      <View
                        style={
                          styles.openRow
                        }
                      >
                        <Text
                          style={
                            styles.openText
                          }
                        >
                          Abrir
                        </Text>

                        <Ionicons
                          name="chevron-forward"
                          size={14}
                          color="#0B5EA8"
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              )}
            </View>
          ) : null}

          {/* ==================================================
              CELULAR / TABLET
          ================================================== */}

          {!modoDesktop &&
            solicitacoesFiltradas.map(
              (solicitacao) => (
                <TouchableOpacity
                  key={
                    solicitacao
                      .solicitacao_id
                  }
                  style={
                    styles.mobileCard
                  }
                  activeOpacity={
                    0.75
                  }
                  onPress={() =>
                    abrirSolicitacao(
                      solicitacao
                        .solicitacao_id
                    )
                  }
                >
                  {/* PROTOCOLO / STATUS */}

                  <View
                    style={
                      styles.mobileHeader
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
                          solicitacao
                            .status
                        ),
                      ]}
                    >
                      <Text
                        style={
                          styles.statusText
                        }
                      >
                        {textoStatus(
                          solicitacao
                            .status
                        )}
                      </Text>
                    </View>
                  </View>

                  {/* CLIENTE */}

                  <View
                    style={
                      styles.mobileSection
                    }
                  >
                    <Text
                      style={
                        styles.mobileLabel
                      }
                    >
                      CLIENTE
                    </Text>

                    <Text
                      style={
                        styles.mobileMainText
                      }
                    >
                      {
                        solicitacao
                          .cliente_nome
                      }
                    </Text>

                    <Text
                      style={
                        styles.mobileSecondaryText
                      }
                    >
                      {
                        solicitacao
                          .telefone_contato ||
                        '-'
                      }
                    </Text>
                  </View>

                  {/* IMÓVEL */}

                  <View
                    style={
                      styles.mobileSection
                    }
                  >
                    <Text
                      style={
                        styles.mobileLabel
                      }
                    >
                      IMÓVEL
                    </Text>

                    <Text
                      style={
                        styles.mobileMainText
                      }
                    >
                      {
                        solicitacao
                          .empreendimento
                      }
                    </Text>

                    <Text
                      style={
                        styles.mobileSecondaryText
                      }
                    >
                      Unidade{' '}
                      {
                        solicitacao
                          .unidade
                      }
                    </Text>

                    {solicitacao.comodo ? (
                      <Text
                        style={
                          styles.mobileSecondaryText
                        }
                      >
                        {
                          solicitacao
                            .comodo
                        }
                      </Text>
                    ) : null}
                  </View>

                  {/* DESCRIÇÃO */}

                  <Text
                    style={
                      styles.description
                    }
                    numberOfLines={
                      3
                    }
                  >
                    {
                      solicitacao
                        .descricao_problema
                    }
                  </Text>

                  {/* RODAPÉ */}

                  <View
                    style={
                      styles.mobileFooter
                    }
                  >
                    <View>
                      <View
                        style={
                          styles.photoInfo
                        }
                      >
                        <Ionicons
                          name="images-outline"
                          size={16}
                          color="#697789"
                        />

                        <Text
                          style={
                            styles.photoText
                          }
                        >
                          {
                            solicitacao
                              .quantidade_fotos
                          }{' '}
                          fotos
                        </Text>
                      </View>

                      <Text
                        style={
                          styles.dateText
                        }
                      >
                        {formatarData(
                          solicitacao
                            .created_at
                        )}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.mobileOpen
                      }
                    >
                      <Text
                        style={
                          styles.mobileOpenText
                        }
                      >
                        Abrir chamado
                      </Text>

                      <Ionicons
                        name="chevron-forward"
                        size={19}
                        color="#0B5EA8"
                      />
                    </View>
                  </View>
                </TouchableOpacity>
              )
            )}

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
// BOTÃO DE FILTRO
// ============================================================

function FiltroButton({
  texto,
  ativo,
  onPress,
}: {
  texto: string;
  ativo: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.filterButton,

        ativo &&
          styles.filterButtonActive,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={[
          styles.filterButtonText,

          ativo &&
            styles.filterButtonTextActive,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
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
      maxWidth: 1150,
      alignSelf: 'center',
      paddingHorizontal: 24,
      paddingTop: 20,
      paddingBottom: 50,
    },

    // TOPO

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

    title: {
      color: '#0B2447',
      fontSize: 30,
      fontWeight: '800',
      marginTop: 25,
    },

    subtitle: {
      color: '#697789',
      fontSize: 13,
      lineHeight: 20,
      marginTop: 7,
      marginBottom: 24,
    },

    // BUSCA

    searchBox: {
      minHeight: 56,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,

      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 15,
    },

    searchInput: {
      flex: 1,
      height: 54,
      paddingHorizontal: 10,
      color: '#24364B',
      fontSize: 13,

      outlineStyle:
        'none' as any,
    },

    // FILTROS

    filtersContainer: {
      gap: 8,
      paddingVertical: 15,
    },

    filterButton: {
      borderRadius: 20,

      paddingHorizontal: 15,
      paddingVertical: 9,

      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,
      borderColor:
        '#D8DEE7',
    },

    filterButtonActive: {
      backgroundColor:
        '#0B2447',

      borderColor:
        '#0B2447',
    },

    filterButtonText: {
      color: '#697789',
      fontSize: 11,
      fontWeight: '600',
    },

    filterButtonTextActive: {
      color: '#FFFFFF',
    },

    // LISTAGEM

    listHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },

    resultCount: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '700',
    },

    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    refreshText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '600',
    },

    // DESKTOP

    desktopTable: {
      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,
      borderColor:
        '#D8DEE7',

      borderRadius: 16,

      overflow: 'hidden',
    },

    tableHeader: {
      flexDirection: 'row',

      backgroundColor:
        '#EEF3F8',

      paddingHorizontal: 16,
      paddingVertical: 13,
    },

    tableHeaderText: {
      color: '#697789',
      fontSize: 10,
      fontWeight: '800',
      textTransform:
        'uppercase',
    },

    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',

      paddingHorizontal: 16,
      paddingVertical: 17,

      borderTopWidth: 1,
      borderTopColor:
        '#EEF1F4',

      backgroundColor:
        '#FFFFFF',
    },

    colProtocol: {
      flex: 1.35,
      paddingRight: 10,
    },

    colClient: {
      flex: 1.5,
      paddingRight: 10,
    },

    colProperty: {
      flex: 1.7,
      paddingRight: 10,
    },

    colStatus: {
      flex: 1.1,
      paddingRight: 10,
    },

    colDate: {
      flex: 1,
    },

    protocolText: {
      color: '#0B2447',
      fontSize: 12,
      fontWeight: '800',
    },

    mainCellText: {
      color: '#24364B',
      fontSize: 12,
      fontWeight: '700',
    },

    secondaryCellText: {
      color: '#8995A5',
      fontSize: 10,
      marginTop: 4,
    },

    dateText: {
      color: '#697789',
      fontSize: 10,
      lineHeight: 15,
    },

    photoText: {
      color: '#697789',
      fontSize: 10,
      marginTop: 4,
    },

    openRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      marginTop: 7,
    },

    openText: {
      color: '#0B5EA8',
      fontSize: 10,
      fontWeight: '700',
    },

    // STATUS

    statusBadge: {
      alignSelf:
        'flex-start',

      borderRadius: 20,

      paddingHorizontal: 10,
      paddingVertical: 6,
    },

    statusNova: {
      backgroundColor:
        '#FFF4D9',
    },

    statusAnalise: {
      backgroundColor:
        '#E9F1FA',
    },

    statusVistoria: {
      backgroundColor:
        '#EDE9FA',
    },

    statusExecucao: {
      backgroundColor:
        '#E6F2F4',
    },

    statusConcluida: {
      backgroundColor:
        '#EAF6EE',
    },

    statusCancelada: {
      backgroundColor:
        '#FCEEEE',
    },

    statusPadrao: {
      backgroundColor:
        '#EEF1F4',
    },

    statusText: {
      color: '#24364B',
      fontSize: 9,
      fontWeight: '800',
    },

    // MOBILE

    mobileCard: {
      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,
      borderColor:
        '#D8DEE7',

      borderRadius: 15,

      padding: 16,
      marginBottom: 12,
    },

    mobileHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems:
        'flex-start',
      gap: 10,
    },

    protocolLabel: {
      color: '#8995A5',
      fontSize: 9,
      fontWeight: '700',
      marginBottom: 4,
    },

    mobileSection: {
      marginTop: 15,
    },

    mobileLabel: {
      color: '#8995A5',
      fontSize: 9,
      fontWeight: '700',
      marginBottom: 4,
    },

    mobileMainText: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '700',
    },

    mobileSecondaryText: {
      color: '#697789',
      fontSize: 11,
      marginTop: 3,
    },

    description: {
      color: '#42566D',
      fontSize: 11,
      lineHeight: 17,

      backgroundColor:
        '#F8FAFC',

      borderRadius: 10,

      padding: 11,
      marginTop: 15,
    },

    mobileFooter: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',

      marginTop: 15,
      paddingTop: 12,

      borderTopWidth: 1,
      borderTopColor:
        '#EEF1F4',
    },

    photoInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },

    mobileOpen: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },

    mobileOpenText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '700',
    },

    // ERRO / VAZIO

    errorBox: {
      backgroundColor:
        '#FCEEEE',

      borderWidth: 1,
      borderColor:
        '#D29A9A',

      borderRadius: 12,

      padding: 14,

      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,

      marginBottom: 12,
    },

    errorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 11,
    },

    emptyCard: {
      backgroundColor:
        '#FFFFFF',

      borderWidth: 1,
      borderColor:
        '#D8DEE7',

      borderRadius: 15,

      padding: 35,

      alignItems: 'center',
    },

    emptyTitle: {
      color: '#24364B',
      fontSize: 14,
      fontWeight: '700',
      marginTop: 10,
    },

    emptyText: {
      color: '#8995A5',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 5,
    },

    // LOADING

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loadingText: {
      color: '#697789',
      fontSize: 12,
      marginTop: 10,
    },

    footer: {
      color: '#8995A5',
      fontSize: 10,
      textAlign: 'center',
      marginTop: 35,
    },
  });