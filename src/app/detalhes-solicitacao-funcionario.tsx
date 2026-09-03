import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
    useEffect,
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

export default function DetalhesSolicitacaoFuncionarioScreen() {
  const params =
    useLocalSearchParams();

  const solicitacaoId =
    String(
      params.solicitacaoId ?? ''
    );

  const [
    solicitacao,
    setSolicitacao,
  ] =
    useState<Solicitacao | null>(
      null
    );

  const [
    fotos,
    setFotos,
  ] =
    useState<FotoSolicitacao[]>(
      []
    );

  const [
    fotoSelecionada,
    setFotoSelecionada,
  ] =
    useState<FotoSolicitacao | null>(
      null
    );

  const [
    carregando,
    setCarregando,
  ] =
    useState(true);

  const [
    carregandoFotos,
    setCarregandoFotos,
  ] =
    useState(false);

  const [
    autorizado,
    setAutorizado,
  ] =
    useState(false);

  const [
    erro,
    setErro,
  ] =
    useState('');

  const [
    erroFotos,
    setErroFotos,
  ] =
    useState('');

  // ==========================================================
  // INICIALIZA
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

      await carregarSolicitacao();

      await carregarFotos();
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
        'Erro ao verificar funcionário:',
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
  // CARREGA SOLICITAÇÃO
  // ==========================================================

  async function carregarSolicitacao() {
    try {
      const {
        data,
        error,
      } =
        await supabase.rpc(
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

      setSolicitacao({
        ...resultado,

        quantidade_fotos:
          Number(
            resultado.quantidade_fotos
          ) || 0,
      });
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao carregar a solicitação.'
      );
    }
  }

  // ==========================================================
  // CARREGA FOTOS
  // ==========================================================

  async function carregarFotos() {
    try {
      setCarregandoFotos(true);
      setErroFotos('');

      const {
        data,
        error,
      } =
        await supabase
          .from(
            'solicitacao_fotos'
          )
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
          'Erro ao carregar fotos:',
          error
        );

        setErroFotos(
          'Não foi possível carregar as fotos do chamado.'
        );

        return;
      }

      const registros =
        data ?? [];

      const fotosComUrl:
        FotoSolicitacao[] = [];

      for (
        const foto of registros
      ) {
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
            'Erro na URL da foto:',
            signedError
          );

          continue;
        }

        fotosComUrl.push({
          ...foto,

          url:
            signedData.signedUrl,
        });
      }

      setFotos(
        fotosComUrl
      );
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

  function textoGarantia(
    status:
      | string
      | null
  ) {
    switch (status) {
      case 'dentro_garantia':
        return 'Dentro da garantia';

      case 'fora_garantia':
        return 'Fora da garantia';

      case 'nao_se_aplica':
        return 'Não se aplica';

      default:
        return 'Aguardando análise';
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

  // ==========================================================
  // TELA
  // ==========================================================

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

          {fotoSelecionada ? (
            <Text
              style={
                styles.modalCaption
              }
            >
              Foto{' '}
              {
                fotoSelecionada
                  .ordem
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
        <View
          style={
            styles.content
          }
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
                <View>
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
                {/* CLIENTE */}

                <View
                  style={
                    styles.columnCard
                  }
                >
                  <View
                    style={
                      styles.cardHeader
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

                {/* IMÓVEL */}

                <View
                  style={
                    styles.columnCard
                  }
                >
                  <View
                    style={
                      styles.cardHeader
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
                  PROBLEMA RELATADO
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Problema relatado
              </Text>

              <View
                style={
                  styles.card
                }
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
                style={
                  styles.card
                }
              >
                <View
                  style={
                    styles.inlineInfo
                  }
                >
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.inlineInfoText
                    }
                  >
                    {
                      solicitacao
                        .disponibilidade_visita ||
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
                    styles.sectionTitleNoMargin
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
                    styles.photosLoading
                  }
                >
                  <ActivityIndicator
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.loadingText
                    }
                  >
                    Carregando fotos...
                  </Text>
                </View>
              ) : null}

              {erroFotos ? (
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
                    {erroFotos}
                  </Text>
                </View>
              ) : null}

              {!carregandoFotos &&
              !erroFotos &&
              fotos.length === 0 ? (
                <View
                  style={
                    styles.emptyPhotos
                  }
                >
                  <Ionicons
                    name="images-outline"
                    size={30}
                    color="#8995A5"
                  />

                  <Text
                    style={
                      styles.emptyPhotosText
                    }
                  >
                    Nenhuma foto encontrada.
                  </Text>
                </View>
              ) : null}

              {fotos.length >
              0 ? (
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
                          <Text
                            style={
                              styles.photoNumber
                            }
                          >
                            Foto{' '}
                            {indice +
                              1}
                          </Text>

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

              {solicitacao.categoria ||
              solicitacao
                .elemento_construtivo ||
              solicitacao
                .manifestacao_patologica ? (
                <View
                  style={
                    styles.card
                  }
                >
                  <InfoItem
                    label="Categoria"
                    value={
                      solicitacao.categoria ||
                      '-'
                    }
                  />

                  <InfoItem
                    label="Elemento construtivo"
                    value={
                      solicitacao.elemento_construtivo ||
                      '-'
                    }
                  />

                  <InfoItem
                    label="Problema técnico"
                    value={
                      solicitacao.manifestacao_patologica ||
                      '-'
                    }
                  />
                </View>
              ) : (
                <View
                  style={
                    styles.analysisPending
                  }
                >
                  <Ionicons
                    name="search-outline"
                    size={25}
                    color="#0B5EA8"
                  />

                  <View
                    style={{
                      flex: 1,
                    }}
                  >
                    <Text
                      style={
                        styles.analysisPendingTitle
                      }
                    >
                      Aguardando análise técnica
                    </Text>

                    <Text
                      style={
                        styles.analysisPendingText
                      }
                    >
                      O funcionário ainda precisa classificar a categoria, o elemento construtivo e o problema técnico.
                    </Text>
                  </View>
                </View>
              )}

              {/* ==============================================
                  GARANTIA
              ============================================== */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                Garantia
              </Text>

              <View
                style={
                  styles.warrantyCard
                }
              >
                <View
                  style={
                    styles.warrantyHeader
                  }
                >
                  <Ionicons
                    name={
                      solicitacao.status_garantia
                        ? 'shield-checkmark-outline'
                        : 'time-outline'
                    }
                    size={24}
                    color="#0B2447"
                  />

                  <Text
                    style={
                      styles.warrantyTitle
                    }
                  >
                    {textoGarantia(
                      solicitacao.status_garantia
                    )}
                  </Text>
                </View>

                {solicitacao.status_garantia ? (
                  <>
                    <InfoItem
                      label="Data-base"
                      value={
                        formatarData(
                          solicitacao.data_base_garantia
                        )
                      }
                    />

                    <InfoItem
                      label="Limite"
                      value={
                        formatarData(
                          solicitacao.data_limite_garantia
                        )
                      }
                    />

                    {solicitacao
                      .prazo_quantidade ? (
                      <InfoItem
                        label="Prazo"
                        value={`${solicitacao.prazo_quantidade} ${
                          solicitacao.prazo_unidade ??
                          ''
                        }`}
                      />
                    ) : null}

                    {solicitacao
                      .aviso_garantia ? (
                      <Text
                        style={
                          styles.warrantyNotice
                        }
                      >
                        {
                          solicitacao.aviso_garantia
                        }
                      </Text>
                    ) : null}
                  </>
                ) : (
                  <Text
                    style={
                      styles.warrantyPendingText
                    }
                  >
                    O cálculo da garantia será realizado após a classificação técnica do chamado.
                  </Text>
                )}
              </View>

              {/* ==============================================
                  PRÓXIMO PASSO
              ============================================== */}

              <View
                style={
                  styles.nextStepBox
                }
              >
                <Ionicons
                  name="information-circle-outline"
                  size={22}
                  color="#0B5EA8"
                />

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.nextStepTitle
                    }
                  >
                    Próximo passo
                  </Text>

                  <Text
                    style={
                      styles.nextStepText
                    }
                  >
                    Na próxima etapa vamos adicionar aqui o formulário de análise técnica:
                    {'\n'}
                    categoria → elemento construtivo → problema técnico → cálculo da garantia.
                  </Text>
                </View>
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
// ITEM DE INFORMAÇÃO
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
      maxWidth: 1100,
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

    // PROTOCOLO

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

    // DUAS COLUNAS

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

    cardHeader: {
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

    // INFO

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
      textTransform:
        'uppercase',
    },

    infoValue: {
      color: '#24364B',
      fontSize: 12,
      fontWeight: '600',
      marginTop: 4,
    },

    // SEÇÕES

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

    sectionTitleNoMargin: {
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

    descriptionText: {
      color: '#42566D',
      fontSize: 13,
      lineHeight: 21,
    },

    inlineInfo: {
      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },

    inlineInfoText: {
      flex: 1,
      color: '#42566D',
      fontSize: 12,
      lineHeight: 19,
    },

    // FOTOS

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

    photosLoading: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      minHeight: 100,
      alignItems: 'center',
      justifyContent: 'center',
    },

    emptyPhotos: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      padding: 25,
      alignItems: 'center',
    },

    emptyPhotosText: {
      color: '#8995A5',
      fontSize: 11,
      marginTop: 7,
    },

    // ANÁLISE

    analysisPending: {
      backgroundColor:
        '#EAF0F6',
      borderRadius: 14,
      padding: 17,
      flexDirection: 'row',
      gap: 12,
      alignItems:
        'flex-start',
    },

    analysisPendingTitle: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '800',
    },

    analysisPendingText: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 18,
      marginTop: 4,
    },

    // GARANTIA

    warrantyCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 15,
      padding: 17,
    },

    warrantyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      marginBottom: 7,
    },

    warrantyTitle: {
      color: '#0B2447',
      fontSize: 14,
      fontWeight: '800',
    },

    warrantyPendingText: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 18,
      marginTop: 8,
    },

    warrantyNotice: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 18,
      marginTop: 12,
      padding: 11,
      backgroundColor:
        '#F5F7FA',
      borderRadius: 10,
    },

    // PRÓXIMO PASSO

    nextStepBox: {
      backgroundColor:
        '#EAF0F6',
      borderRadius: 14,
      padding: 17,
      marginTop: 28,

      flexDirection: 'row',
      alignItems:
        'flex-start',
      gap: 10,
    },

    nextStepTitle: {
      color: '#0B2447',
      fontSize: 12,
      fontWeight: '800',
    },

    nextStepText: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 18,
      marginTop: 4,
    },

    updateText: {
      color: '#8995A5',
      fontSize: 10,
      textAlign: 'right',
      marginTop: 15,
    },

    // ERRO

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
      marginTop: 15,
    },

    errorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 11,
    },

    // LOADING

    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },

    loadingText: {
      color: '#697789',
      fontSize: 11,
      marginTop: 8,
    },

    // MODAL

    modalOverlay: {
      flex: 1,
      backgroundColor:
        'rgba(0,0,0,0.94)',
      alignItems: 'center',
      justifyContent: 'center',
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
      justifyContent: 'center',

      zIndex: 5,
    },

    modalImage: {
      width: '100%',
      height: '82%',
    },

    modalCaption: {
      color: '#FFFFFF',
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