import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';

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


type Solicitacao = {
  solicitacao_id: string;
  protocolo: string;

  empreendimento: string;
  unidade: string;

  categoria: string | null;
  elemento_construtivo: string | null;
  manifestacao_patologica: string | null;

  descricao_problema: string;

  status_garantia: string | null;
  data_limite_garantia: string | null;

  status: string;

  created_at: string;
};


export default function DashboardClienteScreen() {
  const [solicitacoes, setSolicitacoes] =
    useState<Solicitacao[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [atualizando, setAtualizando] =
    useState(false);

  const [erro, setErro] = useState('');


  useEffect(() => {
    carregarSolicitacoes();
  }, []);


  async function carregarSolicitacoes() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } = await supabase.rpc(
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


  const atualizarSolicitacoes =
    useCallback(async () => {
      try {
        setAtualizando(true);
        setErro('');

        const { data, error } =
          await supabase.rpc(
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


  async function sair() {
    await supabase.auth.signOut();

    router.replace('/login-cliente');
  }


  function formatarDataHora(
    dataIso: string
  ) {
    if (!dataIso) {
      return '';
    }

    const data = new Date(dataIso);

    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }


  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return '';
    }

    const partes = data.split('-');

    if (partes.length !== 3) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }


  function textoStatus(status: string) {
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


  function textoGarantia(
    status: string | null
  ) {
    switch (status) {
      case 'dentro_da_garantia':
        return 'Dentro da garantia';

      case 'fora_da_garantia':
        return 'Fora da garantia';

      case 'dados_insuficientes':
        return 'Dados insuficientes';

      case 'ato_da_entrega':
        return 'Garantia no ato da entrega';

      case 'nao_se_aplica':
        return 'Não se aplica';

      default:
        return 'Não informado';
    }
  }


  function estiloStatus(status: string) {
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
        return styles.statusDanger;

      default:
        return styles.statusNeutral;
    }
  }


  function estiloGarantia(
    status: string | null
  ) {
    if (status === 'dentro_da_garantia') {
      return styles.warrantySuccess;
    }

    if (status === 'fora_da_garantia') {
      return styles.warrantyDanger;
    }

    return styles.warrantyNeutral;
  }


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={atualizando}
            onRefresh={atualizarSolicitacoes}
          />
        }
      >
        <View style={styles.content}>
          <Image
            source={require('../../assets/emafe/logo-horizontal-transparente.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Área do Cliente
          </Text>

          <Text style={styles.subtitle}>
            Acompanhe suas solicitações de
            Assistência Técnica.
          </Text>


          {/* NOVA SOLICITAÇÃO */}

          <TouchableOpacity
            style={styles.newButton}
            onPress={() =>
              router.push('/nova-solicitacao')
            }
          >
            <Text
              style={styles.newButtonText}
            >
              + Nova solicitação
            </Text>
          </TouchableOpacity>


          {/* TÍTULO */}

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Minhas solicitações
            </Text>

            {!carregando ? (
              <Text style={styles.totalText}>
                {solicitacoes.length}{' '}
                {solicitacoes.length === 1
                  ? 'solicitação'
                  : 'solicitações'}
              </Text>
            ) : null}
          </View>


          {/* ERRO */}

          {erro ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {erro}
              </Text>

              <TouchableOpacity
                onPress={carregarSolicitacoes}
              >
                <Text style={styles.retryText}>
                  Tentar novamente
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}


          {/* CARREGANDO */}

          {carregando ? (
            <View
              style={styles.loadingContainer}
            >
              <ActivityIndicator
                size="large"
                color="#0B2447"
              />

              <Text style={styles.loadingText}>
                Carregando solicitações...
              </Text>
            </View>
          ) : null}


          {/* SEM SOLICITAÇÕES */}

          {!carregando &&
          solicitacoes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>
                Nenhuma solicitação
              </Text>

              <Text style={styles.emptyText}>
                Quando você abrir uma
                solicitação de manutenção, ela
                aparecerá aqui.
              </Text>
            </View>
          ) : null}


          {/* LISTA */}

          {!carregando &&
            solicitacoes.map(
              (solicitacao) => (
                <View
                  key={
                    solicitacao.solicitacao_id
                  }
                  style={styles.requestCard}
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
                        {solicitacao.protocolo}
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
                    style={styles.propertyBox}
                  >
                    <Text
                      style={
                        styles.propertyName
                      }
                    >
                      {
                        solicitacao.empreendimento
                      }
                    </Text>

                    <Text
                      style={
                        styles.propertyUnit
                      }
                    >
                      Unidade{' '}
                      {solicitacao.unidade}
                    </Text>
                  </View>


                  {/* PROBLEMA */}

                  {solicitacao.categoria ? (
                    <Text
                      style={styles.category}
                    >
                      {solicitacao.categoria}
                    </Text>
                  ) : null}

                  {solicitacao
                    .elemento_construtivo ? (
                    <Text
                      style={
                        styles.elementText
                      }
                    >
                      {
                        solicitacao
                          .elemento_construtivo
                      }
                    </Text>
                  ) : null}

                  {solicitacao
                    .manifestacao_patologica ? (
                    <Text
                      style={
                        styles.problemText
                      }
                    >
                      {
                        solicitacao
                          .manifestacao_patologica
                      }
                    </Text>
                  ) : null}


                  {/* DESCRIÇÃO DO CLIENTE */}

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
                      Sua descrição
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


                  {/* GARANTIA */}

                  <View
                    style={
                      styles.warrantyRow
                    }
                  >
                    <View
                      style={[
                        styles.warrantyBadge,
                        estiloGarantia(
                          solicitacao
                            .status_garantia
                        ),
                      ]}
                    >
                      <Text
                        style={
                          styles.warrantyText
                        }
                      >
                        {textoGarantia(
                          solicitacao
                            .status_garantia
                        )}
                      </Text>
                    </View>

                    {solicitacao
                      .data_limite_garantia ? (
                      <Text
                        style={
                          styles.warrantyDate
                        }
                      >
                        Limite:{' '}
                        {formatarData(
                          solicitacao
                            .data_limite_garantia
                        )}
                      </Text>
                    ) : null}
                  </View>


                  {/* DATA */}

                  <View style={styles.divider} />

                  <Text
                    style={styles.dateText}
                  >
                    Aberta em{' '}
                    {formatarDataHora(
                      solicitacao.created_at
                    )}
                  </Text>


                  {/* ACOMPANHAR SOLICITAÇÃO */}

                  <TouchableOpacity
                    style={
                      styles.detailsButton
                    }
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


          {/* SAIR */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={sair}
          >
            <Text style={styles.logoutText}>
              Sair
            </Text>
          </TouchableOpacity>


          <Text style={styles.footer}>
            EMAFE Engenharia • Assistência
            Técnica
          </Text>
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

  newButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    marginBottom: 16,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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

  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  statusOpen: {
    backgroundColor: '#E9F1FA',
  },

  statusProgress: {
    backgroundColor: '#FFF4D9',
  },

  statusSuccess: {
    backgroundColor: '#EAF6EE',
  },

  statusDanger: {
    backgroundColor: '#FCEEEE',
  },

  statusNeutral: {
    backgroundColor: '#EEF1F4',
  },

  statusText: {
    color: '#0B2447',
    fontSize: 10,
    fontWeight: '700',
  },

  propertyBox: {
    backgroundColor: '#F5F7FA',
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    marginBottom: 15,
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

  category: {
    color: '#0B5EA8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },

  elementText: {
    color: '#24364B',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 19,
  },

  problemText: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },

  descriptionBox: {
    marginTop: 15,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },

  descriptionLabel: {
    color: '#8995A5',
    fontSize: 9,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  descriptionText: {
    color: '#42566D',
    fontSize: 12,
    lineHeight: 18,
  },

  warrantyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 15,
  },

  warrantyBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },

  warrantySuccess: {
    backgroundColor: '#EAF6EE',
  },

  warrantyDanger: {
    backgroundColor: '#FCEEEE',
  },

  warrantyNeutral: {
    backgroundColor: '#FFF4D9',
  },

  warrantyText: {
    color: '#42566D',
    fontSize: 10,
    fontWeight: '700',
  },

  warrantyDate: {
    color: '#8995A5',
    fontSize: 10,
  },

  divider: {
    height: 1,
    backgroundColor: '#E5EAF0',
    marginTop: 16,
    marginBottom: 12,
  },

  dateText: {
    color: '#8995A5',
    fontSize: 10,
  },

  detailsButton: {
    height: 45,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
  },

  detailsButtonText: {
    color: '#0B2447',
    fontSize: 12,
    fontWeight: '700',
  },

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

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D8DEE7',
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

  errorBox: {
    backgroundColor: '#FCEEEE',
    borderRadius: 12,
    padding: 14,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#D29A9A',
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