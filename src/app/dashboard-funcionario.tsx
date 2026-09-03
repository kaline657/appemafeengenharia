import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    useCallback,
    useEffect,
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
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type ResumoDashboard = {
  total: number;
  novas: number;
  em_analise: number;
  vistorias: number;
  em_execucao: number;
  concluidas: number;
};

const RESUMO_VAZIO: ResumoDashboard = {
  total: 0,
  novas: 0,
  em_analise: 0,
  vistorias: 0,
  em_execucao: 0,
  concluidas: 0,
};

export default function DashboardFuncionarioScreen() {
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
    resumo,
    setResumo,
  ] = useState<ResumoDashboard>(
    RESUMO_VAZIO
  );

  const [
    erro,
    setErro,
  ] = useState('');

  useEffect(() => {
    iniciarDashboard();
  }, []);

  // ==========================================================
  // INICIALIZA O DASHBOARD
  // ==========================================================

  async function iniciarDashboard() {
    try {
      setCarregando(true);
      setErro('');

      const acessoPermitido =
        await verificarAcesso();

      if (!acessoPermitido) {
        return;
      }

      await carregarResumo();
    } catch (error) {
      console.error(
        'Erro ao iniciar dashboard:',
        error
      );

      setErro(
        'Não foi possível carregar o painel.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // VERIFICA SE É FUNCIONÁRIO
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
        console.error(
          'Acesso não autorizado:',
          error
        );

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
  // CARREGA OS NÚMEROS REAIS DO BANCO
  // ==========================================================

  async function carregarResumo() {
    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
          'resumo_dashboard_funcionario'
        );

      if (error) {
        console.error(
          'Erro ao carregar resumo:',
          error
        );

        setErro(
          'Não foi possível carregar o resumo das solicitações.'
        );

        return;
      }

      const resultado =
        data?.[0];

      if (!resultado) {
        setResumo(
          RESUMO_VAZIO
        );

        return;
      }

      setResumo({
        total:
          Number(
            resultado.total
          ) || 0,

        novas:
          Number(
            resultado.novas
          ) || 0,

        em_analise:
          Number(
            resultado.em_analise
          ) || 0,

        vistorias:
          Number(
            resultado.vistorias
          ) || 0,

        em_execucao:
          Number(
            resultado.em_execucao
          ) || 0,

        concluidas:
          Number(
            resultado.concluidas
          ) || 0,
      });
    } catch (error) {
      console.error(
        'Erro ao buscar resumo:',
        error
      );

      setErro(
        'Ocorreu um erro ao carregar os dados do painel.'
      );
    }
  }

  // ==========================================================
  // ATUALIZAR
  // ==========================================================

  const atualizarDashboard =
    useCallback(
      async () => {
        try {
          setAtualizando(true);
          setErro('');

          await carregarResumo();
        } finally {
          setAtualizando(false);
        }
      },
      []
    );

  // ==========================================================
  // SAIR
  // ==========================================================

  async function sair() {
    await supabase.auth
      .signOut();

    router.replace(
      '/login-funcionario'
    );
  }

  // ==========================================================
  // CARREGANDO
  // ==========================================================

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
            Carregando painel...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!autorizado) {
    return null;
  }

  // ==========================================================
  // DASHBOARD
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
              atualizarDashboard
            }
          />
        }
      >
        <View
          style={styles.content}
        >
          {/* ==================================================
              CABEÇALHO
          ================================================== */}

          <View
            style={styles.header}
          >
            <Image
              source={require('../../assets/emafe/logo-horizontal-transparente.png')}
              style={styles.logo}
              resizeMode="contain"
            />

            <TouchableOpacity
              style={
                styles.logoutButton
              }
              onPress={sair}
            >
              <Ionicons
                name="log-out-outline"
                size={20}
                color="#A52828"
              />

              <Text
                style={
                  styles.logoutText
                }
              >
                Sair
              </Text>
            </TouchableOpacity>
          </View>

          <Text
            style={styles.title}
          >
            Área do Funcionário
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Gerencie as solicitações de manutenção da EMAFE.
          </Text>

          {/* ==================================================
              ERRO
          ================================================== */}

          {erro ? (
            <View
              style={styles.errorBox}
            >
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#9A3232"
              />

              <View
                style={
                  styles.errorContent
                }
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
                    atualizarDashboard
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
            </View>
          ) : null}

          {/* ==================================================
              PAINEL
          ================================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            Painel
          </Text>

          <View
            style={styles.menuGrid}
          >
            {/* ==================================================
                SOLICITAÇÕES
            ================================================== */}

            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push(
                  '/solicitacoes-funcionario'
                )
              }
            >
              <View
                style={
                  styles.iconBox
                }
              >
                <Ionicons
                  name="document-text-outline"
                  size={27}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.menuTitle
                }
              >
                Solicitações
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Visualizar e acompanhar todos os chamados.
              </Text>

              <View
                style={
                  styles.menuFooter
                }
              >
                <Text
                  style={
                    styles.menuCounter
                  }
                >
                  {resumo.total}{' '}
                  {resumo.total === 1
                    ? 'chamado'
                    : 'chamados'}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8995A5"
                />
              </View>
            </TouchableOpacity>

            {/* ==================================================
                NOVOS CHAMADOS
            ================================================== */}

            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.85}
              onPress={() =>
                router.push(
                  '/solicitacoes-funcionario'
                )
              }
            >
              <View
                style={
                  styles.iconBox
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={27}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.menuTitle
                }
              >
                Novos chamados
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Solicitações aguardando análise.
              </Text>

              <View
                style={
                  styles.menuFooter
                }
              >
                <Text
                  style={[
                    styles.menuCounter,

                    resumo.novas > 0 &&
                      styles.menuCounterAttention,
                  ]}
                >
                  {resumo.novas}{' '}
                  {resumo.novas === 1
                    ? 'novo'
                    : 'novos'}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8995A5"
                />
              </View>
            </TouchableOpacity>

            {/* ==================================================
                CLIENTES E IMÓVEIS
            ================================================== */}

            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.85}
            >
              <View
                style={
                  styles.iconBox
                }
              >
                <Ionicons
                  name="people-outline"
                  size={27}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.menuTitle
                }
              >
                Clientes e imóveis
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Cadastrar clientes e vincular unidades.
              </Text>

              <View
                style={
                  styles.menuFooter
                }
              >
                <Text
                  style={
                    styles.menuLink
                  }
                >
                  Gerenciar
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8995A5"
                />
              </View>
            </TouchableOpacity>

            {/* ==================================================
                VISTORIAS
            ================================================== */}

            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.85}
            >
              <View
                style={
                  styles.iconBox
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={27}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.menuTitle
                }
              >
                Vistorias
              </Text>

              <Text
                style={
                  styles.menuDescription
                }
              >
                Consultar e acompanhar visitas técnicas.
              </Text>

              <View
                style={
                  styles.menuFooter
                }
              >
                <Text
                  style={
                    styles.menuCounter
                  }
                >
                  {resumo.vistorias}{' '}
                  {resumo.vistorias === 1
                    ? 'vistoria'
                    : 'vistorias'}
                </Text>

                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color="#8995A5"
                />
              </View>
            </TouchableOpacity>
          </View>

          {/* ==================================================
              RESUMO
          ================================================== */}

          <View
            style={
              styles.sectionHeader
            }
          >
            <Text
              style={
                styles.sectionTitleNoMargin
              }
            >
              Resumo das solicitações
            </Text>

            <TouchableOpacity
              style={
                styles.refreshButton
              }
              onPress={
                atualizarDashboard
              }
              disabled={
                atualizando
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

          <View
            style={
              styles.statusGrid
            }
          >
            {/* TOTAL */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="layers-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.total}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Total
              </Text>
            </View>

            {/* NOVAS */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="notifications-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.novas}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Novas
              </Text>
            </View>

            {/* EM ANÁLISE */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="search-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.em_analise}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Em análise
              </Text>
            </View>

            {/* VISTORIAS */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="calendar-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.vistorias}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Vistorias
              </Text>
            </View>

            {/* EM EXECUÇÃO */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="construct-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.em_execucao}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Em execução
              </Text>
            </View>

            {/* CONCLUÍDAS */}

            <View
              style={
                styles.statusCard
              }
            >
              <View
                style={
                  styles.statusIconBox
                }
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={21}
                  color="#0B2447"
                />
              </View>

              <Text
                style={
                  styles.statusNumber
                }
              >
                {resumo.concluidas}
              </Text>

              <Text
                style={
                  styles.statusLabel
                }
              >
                Concluídas
              </Text>
            </View>
          </View>

          {/* ==================================================
              INFORMAÇÃO
          ================================================== */}

          <View
            style={styles.infoBox}
          >
            <Ionicons
              name="information-circle-outline"
              size={21}
              color="#0B5EA8"
            />

            <Text
              style={styles.infoText}
            >
              Os números acima são atualizados diretamente a partir das solicitações registradas no sistema EMAFE.
            </Text>
          </View>

          <Text
            style={styles.footer}
          >
            EMAFE Engenharia • Área interna
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
      maxWidth: 1000,
      alignSelf: 'center',
      paddingHorizontal: 28,
      paddingTop: 25,
      paddingBottom: 50,
    },

    // CABEÇALHO

    header: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    logo: {
      width: 220,
      height: 80,
    },

    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 12,
    },

    logoutText: {
      color: '#A52828',
      fontSize: 13,
      fontWeight: '600',
    },

    title: {
      color: '#0B2447',
      fontSize: 30,
      fontWeight: '800',
      marginTop: 20,
    },

    subtitle: {
      color: '#697789',
      fontSize: 14,
      marginTop: 7,
      marginBottom: 30,
    },

    // TÍTULOS

    sectionTitle: {
      color: '#24364B',
      fontSize: 18,
      fontWeight: '800',
      marginTop: 25,
      marginBottom: 14,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop: 32,
      marginBottom: 14,
    },

    sectionTitleNoMargin: {
      color: '#24364B',
      fontSize: 18,
      fontWeight: '800',
    },

    refreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingVertical: 8,
      paddingHorizontal: 10,
    },

    refreshText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '600',
    },

    // MENU

    menuGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },

    menuCard: {
      flexGrow: 1,
      flexBasis: 280,
      minHeight: 185,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 16,
      padding: 18,
    },

    iconBox: {
      width: 50,
      height: 50,
      borderRadius: 14,
      backgroundColor:
        '#EAF0F6',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 14,
    },

    menuTitle: {
      color: '#0B2447',
      fontSize: 15,
      fontWeight: '800',
    },

    menuDescription: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 6,
      flexGrow: 1,
    },

    menuFooter: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginTop: 18,
    },

    menuCounter: {
      color: '#697789',
      fontSize: 11,
      fontWeight: '600',
    },

    menuCounterAttention: {
      color: '#A36B00',
      fontWeight: '800',
    },

    menuLink: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '700',
    },

    // RESUMO

    statusGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },

    statusCard: {
      flexGrow: 1,
      flexBasis: 135,
      minWidth: 125,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      padding: 16,
    },

    statusIconBox: {
      width: 38,
      height: 38,
      borderRadius: 11,
      backgroundColor:
        '#EAF0F6',
      alignItems: 'center',
      justifyContent:
        'center',
      marginBottom: 15,
    },

    statusNumber: {
      color: '#0B2447',
      fontSize: 27,
      fontWeight: '800',
    },

    statusLabel: {
      color: '#697789',
      fontSize: 11,
      marginTop: 4,
    },

    // INFO

    infoBox: {
      backgroundColor:
        '#EAF0F6',
      borderRadius: 14,
      padding: 16,
      marginTop: 28,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },

    infoText: {
      flex: 1,
      color: '#42566D',
      fontSize: 12,
      lineHeight: 18,
    },

    // ERRO

    errorBox: {
      backgroundColor:
        '#FCEEEE',
      borderRadius: 13,
      borderWidth: 1,
      borderColor:
        '#D29A9A',
      padding: 14,
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
      marginBottom: 10,
    },

    errorContent: {
      flex: 1,
    },

    errorText: {
      color: '#9A3232',
      fontSize: 12,
      lineHeight: 18,
    },

    retryText: {
      color: '#0B5EA8',
      fontSize: 11,
      fontWeight: '700',
      marginTop: 7,
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