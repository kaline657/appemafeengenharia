import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  Image,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

const MINIMO_FOTOS = 3;
const MAXIMO_FOTOS = 10;

const CIDADES = [
  'São Luís',
  'Bacabal',
];

const COMODOS = [
  'Sala',
  'Cozinha',
  'Quarto',
  'Banheiro',
  'Área de serviço',
  'Varanda',
  'Área externa',
  'Garagem',
  'Outro',
];

type Unidade = {
  unidade_id: string;
  cidade: string | null;
  empreendimento: string;
  unidade: string;
};

type SolicitacaoCriada = {
  solicitacao_id: string;
  protocolo: string;
  status: string;
};

export default function NovaSolicitacaoScreen() {
  const [
    unidades,
    setUnidades,
  ] = useState<Unidade[]>([]);

  const [
    cidadeSelecionada,
    setCidadeSelecionada,
  ] = useState('');

  const [
    unidadeSelecionada,
    setUnidadeSelecionada,
  ] = useState<Unidade | null>(
    null
  );

  const [
    comodoSelecionado,
    setComodoSelecionado,
  ] = useState('');

  const [
    outroComodo,
    setOutroComodo,
  ] = useState('');

  const [
    descricaoProblema,
    setDescricaoProblema,
  ] = useState('');

  const [
    fotos,
    setFotos,
  ] =
    useState<
      ImagePicker.ImagePickerAsset[]
    >([]);

  const [
    telefoneContato,
    setTelefoneContato,
  ] = useState('');

  const [
    emailContato,
    setEmailContato,
  ] = useState('');

  const [
    disponibilidadeVisita,
    setDisponibilidadeVisita,
  ] = useState('');

  const [
    solicitacaoCriada,
    setSolicitacaoCriada,
  ] =
    useState<SolicitacaoCriada | null>(
      null
    );

  const [
    quantidadeFotosEnviadas,
    setQuantidadeFotosEnviadas,
  ] = useState(0);

  const [
    notificacaoEmailEnviada,
    setNotificacaoEmailEnviada,
  ] = useState(false);

  const [
    avisoFotos,
    setAvisoFotos,
  ] = useState('');

  const [
    avisoNotificacao,
    setAvisoNotificacao,
  ] = useState('');

  const [
    carregando,
    setCarregando,
  ] = useState(true);

  const [
    enviando,
    setEnviando,
  ] = useState(false);

  const [
    erro,
    setErro,
  ] = useState('');

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  // ==========================================================
  // CARREGAMENTO INICIAL
  // ==========================================================

  async function carregarDadosIniciais() {
    try {
      setCarregando(true);
      setErro('');

      // ------------------------------------------------------
      // IMÓVEIS VINCULADOS AO CLIENTE
      // ------------------------------------------------------

      const {
        data: unidadesData,
        error: unidadesError,
      } =
        await supabase.rpc(
          'listar_minhas_unidades_cliente'
        );

      if (unidadesError) {
        console.error(
          'Erro ao carregar imóveis:',
          unidadesError
        );

        setErro(
          'Não foi possível carregar seus imóveis.'
        );

        return;
      }

      setUnidades(
        (unidadesData ?? []) as Unidade[]
      );

      // ------------------------------------------------------
      // USUÁRIO LOGADO
      // ------------------------------------------------------

      const {
        data: usuarioData,
        error: usuarioError,
      } =
        await supabase.auth.getUser();

      if (
        !usuarioError &&
        usuarioData.user
      ) {
        const usuario =
          usuarioData.user;

        if (usuario.email) {
          setEmailContato(
            usuario.email
          );
        }

        // ----------------------------------------------------
        // TENTA PREENCHER O TELEFONE AUTOMATICAMENTE
        // ----------------------------------------------------

        const {
          data: perfilData,
          error: perfilError,
        } =
          await supabase
            .from('profiles')
            .select('telefone')
            .eq(
              'id',
              usuario.id
            )
            .maybeSingle();

        if (!perfilError) {
          if (
            perfilData?.telefone
          ) {
            setTelefoneContato(
              perfilData.telefone
            );
          }
        } else {
          console.log(
            'Telefone não carregado automaticamente:',
            perfilError
          );
        }
      }
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao carregar os dados.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // IMÓVEIS POR CIDADE
  // ==========================================================

  const unidadesDaCidade =
    useMemo(() => {
      if (!cidadeSelecionada) {
        return [];
      }

      return unidades.filter(
        (unidade) =>
          unidade.cidade ===
          cidadeSelecionada
      );
    }, [
      unidades,
      cidadeSelecionada,
    ]);

  function selecionarCidade(
    cidade: string
  ) {
    setCidadeSelecionada(
      cidade
    );

    setUnidadeSelecionada(
      null
    );

    setErro('');
  }

  // ==========================================================
  // CÔMODO
  // ==========================================================

  function selecionarComodo(
    comodo: string
  ) {
    setComodoSelecionado(
      comodo
    );

    if (
      comodo !== 'Outro'
    ) {
      setOutroComodo('');
    }

    setErro('');
  }

  const comodoFinal =
    comodoSelecionado === 'Outro'
      ? outroComodo.trim()
      : comodoSelecionado;

  // ==========================================================
  // FOTOS
  // ==========================================================

  function adicionarFotos(
    novasFotos:
      ImagePicker.ImagePickerAsset[]
  ) {
    setFotos(
      (fotosAtuais) => {
        const quantidadeDisponivel =
          MAXIMO_FOTOS -
          fotosAtuais.length;

        if (
          quantidadeDisponivel <= 0
        ) {
          setErro(
            `Você pode anexar no máximo ${MAXIMO_FOTOS} fotos.`
          );

          return fotosAtuais;
        }

        const semDuplicadas =
          novasFotos.filter(
            (novaFoto) =>
              !fotosAtuais.some(
                (fotoAtual) =>
                  fotoAtual.uri ===
                  novaFoto.uri
              )
          );

        const permitidas =
          semDuplicadas.slice(
            0,
            quantidadeDisponivel
          );

        return [
          ...fotosAtuais,
          ...permitidas,
        ];
      }
    );
  }

  async function tirarFoto() {
    try {
      setErro('');

      if (
        fotos.length >=
        MAXIMO_FOTOS
      ) {
        setErro(
          `Você pode anexar no máximo ${MAXIMO_FOTOS} fotos.`
        );

        return;
      }

      if (
        Platform.OS !== 'web'
      ) {
        const permissao =
          await ImagePicker
            .requestCameraPermissionsAsync();

        if (
          !permissao.granted
        ) {
          setErro(
            'Precisamos da permissão da câmera para tirar a foto.'
          );

          return;
        }
      }

      const resultado =
        await ImagePicker
          .launchCameraAsync({
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing:
              false,

            quality: 0.75,
          });

      if (
        !resultado.canceled &&
        resultado.assets
          ?.length
      ) {
        adicionarFotos(
          resultado.assets
        );
      }
    } catch (error) {
      console.error(
        'Erro ao abrir câmera:',
        error
      );

      setErro(
        'Não foi possível abrir a câmera.'
      );
    }
  }

  async function escolherDaGaleria() {
    try {
      setErro('');

      if (
        fotos.length >=
        MAXIMO_FOTOS
      ) {
        setErro(
          `Você pode anexar no máximo ${MAXIMO_FOTOS} fotos.`
        );

        return;
      }

      if (
        Platform.OS !== 'web'
      ) {
        const permissao =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (
          !permissao.granted
        ) {
          setErro(
            'Precisamos da permissão para acessar suas fotos.'
          );

          return;
        }
      }

      const limite =
        MAXIMO_FOTOS -
        fotos.length;

      const resultado =
        await ImagePicker
          .launchImageLibraryAsync({
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsMultipleSelection:
              true,

            selectionLimit:
              limite,

            quality: 0.75,
          });

      if (
        !resultado.canceled &&
        resultado.assets
          ?.length
      ) {
        adicionarFotos(
          resultado.assets
        );
      }
    } catch (error) {
      console.error(
        'Erro ao abrir galeria:',
        error
      );

      setErro(
        'Não foi possível abrir sua galeria.'
      );
    }
  }

  function removerFoto(
    indice: number
  ) {
    setFotos(
      (fotosAtuais) =>
        fotosAtuais.filter(
          (_, index) =>
            index !== indice
        )
    );
  }

  function extensaoDaFoto(
    foto:
      ImagePicker.ImagePickerAsset
  ) {
    if (foto.fileName) {
      const partes =
        foto.fileName.split('.');

      if (
        partes.length > 1
      ) {
        return (
          partes
            .pop()
            ?.toLowerCase() ||
          'jpg'
        );
      }
    }

    switch (foto.mimeType) {
      case 'image/png':
        return 'png';

      case 'image/webp':
        return 'webp';

      case 'image/heic':
        return 'heic';

      case 'image/heif':
        return 'heif';

      default:
        return 'jpg';
    }
  }

  function mimeDaFoto(
    foto:
      ImagePicker.ImagePickerAsset
  ) {
    if (foto.mimeType) {
      return foto.mimeType;
    }

    const extensao =
      extensaoDaFoto(foto);

    if (
      extensao === 'png'
    ) {
      return 'image/png';
    }

    if (
      extensao === 'webp'
    ) {
      return 'image/webp';
    }

    if (
      extensao === 'heic'
    ) {
      return 'image/heic';
    }

    if (
      extensao === 'heif'
    ) {
      return 'image/heif';
    }

    return 'image/jpeg';
  }

  // ==========================================================
  // ENVIO DE UMA FOTO
  // ==========================================================

  async function enviarFoto(
    foto:
      ImagePicker.ImagePickerAsset,
    indice: number,
    solicitacaoId: string,
    clienteId: string
  ) {
    const extensao =
      extensaoDaFoto(foto);

    const mime =
      mimeDaFoto(foto);

    const identificador =
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    const nomeArquivo =
      `foto-${indice + 1}-${identificador}.${extensao}`;

    const caminhoStorage =
      `${clienteId}/${solicitacaoId}/${nomeArquivo}`;

    const resposta =
      await fetch(foto.uri);

    if (!resposta.ok) {
      throw new Error(
        'Não foi possível ler a imagem.'
      );
    }

    const arquivo =
      await resposta.arrayBuffer();

    const {
      error: uploadError,
    } =
      await supabase.storage
        .from(
          'solicitacoes-fotos'
        )
        .upload(
          caminhoStorage,
          arquivo,
          {
            contentType:
              mime,

            upsert:
              false,
          }
        );

    if (uploadError) {
      throw uploadError;
    }

    const {
      error: registroError,
    } =
      await supabase.rpc(
        'registrar_foto_solicitacao',
        {
          p_solicitacao_id:
            solicitacaoId,

          p_caminho_storage:
            caminhoStorage,

          p_nome_arquivo:
            foto.fileName ||
            nomeArquivo,

          p_tipo_mime:
            mime,

          p_ordem:
            indice + 1,
        }
      );

    if (
      registroError
    ) {
      await supabase.storage
        .from(
          'solicitacoes-fotos'
        )
        .remove([
          caminhoStorage,
        ]);

      throw registroError;
    }
  }

  // ==========================================================
  // E-MAIL AUTOMÁTICO PARA EMAFE
  // ==========================================================

  async function notificarEmpresa(
    solicitacaoId: string
  ) {
    try {
      setAvisoNotificacao('');

      const {
        data,
        error,
      } =
        await supabase.functions
          .invoke(
            'notificar-nova-solicitacao',
            {
              body: {
                solicitacao_id:
                  solicitacaoId,
              },
            }
          );

      if (error) {
        console.error(
          'Erro ao chamar função de notificação:',
          error
        );

        setNotificacaoEmailEnviada(
          false
        );

        setAvisoNotificacao(
          'A solicitação foi registrada, mas não foi possível enviar a notificação automática para a equipe. O protocolo continua válido.'
        );

        return false;
      }

      if (
        data?.sucesso === false
      ) {
        console.error(
          'A função retornou erro:',
          data
        );

        setNotificacaoEmailEnviada(
          false
        );

        setAvisoNotificacao(
          'A solicitação foi registrada, mas a notificação automática não pôde ser enviada. O protocolo continua válido.'
        );

        return false;
      }

      console.log(
        'Notificação enviada:',
        data
      );

      setNotificacaoEmailEnviada(
        true
      );

      return true;
    } catch (error) {
      console.error(
        'Erro ao notificar EMAFE:',
        error
      );

      setNotificacaoEmailEnviada(
        false
      );

      setAvisoNotificacao(
        'A solicitação foi registrada, mas ocorreu um erro ao notificar automaticamente a equipe.'
      );

      return false;
    }
  }

  // ==========================================================
  // VALIDAÇÕES
  // ==========================================================

  function emailValido(
    email: string
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email.trim()
    );
  }

  const quantidadeFaltando =
    Math.max(
      0,
      MINIMO_FOTOS -
        fotos.length
    );

  const podeEnviar =
    !!cidadeSelecionada &&
    !!unidadeSelecionada &&
    !!comodoFinal &&
    descricaoProblema
      .trim()
      .length > 0 &&
    fotos.length >=
      MINIMO_FOTOS &&
    telefoneContato
      .trim()
      .length > 0 &&
    emailValido(
      emailContato
    ) &&
    disponibilidadeVisita
      .trim()
      .length > 0 &&
    !enviando;

  // ==========================================================
  // ENVIO DA SOLICITAÇÃO
  // ==========================================================

  async function enviarSolicitacao() {
    if (
      !cidadeSelecionada
    ) {
      setErro(
        'Selecione a cidade do imóvel.'
      );

      return;
    }

    if (
      !unidadeSelecionada
    ) {
      setErro(
        'Selecione o imóvel.'
      );

      return;
    }

    if (!comodoFinal) {
      setErro(
        'Informe onde está o problema.'
      );

      return;
    }

    if (
      !descricaoProblema.trim()
    ) {
      setErro(
        'Descreva o problema encontrado.'
      );

      return;
    }

    if (
      fotos.length <
      MINIMO_FOTOS
    ) {
      setErro(
        `Adicione pelo menos ${MINIMO_FOTOS} fotos do problema.`
      );

      return;
    }

    if (
      !telefoneContato.trim()
    ) {
      setErro(
        'Informe um telefone para contato.'
      );

      return;
    }

    if (
      !emailValido(
        emailContato
      )
    ) {
      setErro(
        'Informe um e-mail válido.'
      );

      return;
    }

    if (
      !disponibilidadeVisita.trim()
    ) {
      setErro(
        'Informe sua disponibilidade para receber a equipe.'
      );

      return;
    }

    try {
      setEnviando(true);

      setErro('');
      setAvisoFotos('');
      setAvisoNotificacao('');

      setQuantidadeFotosEnviadas(
        0
      );

      setNotificacaoEmailEnviada(
        false
      );

      // ------------------------------------------------------
      // 1. CRIA A SOLICITAÇÃO
      // ------------------------------------------------------

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'abrir_solicitacao_cliente',
          {
            p_unidade_id:
              unidadeSelecionada
                .unidade_id,

            p_comodo:
              comodoFinal,

            p_descricao_problema:
              descricaoProblema
                .trim(),

            p_telefone_contato:
              telefoneContato
                .trim(),

            p_email_contato:
              emailContato
                .trim()
                .toLowerCase(),

            p_disponibilidade_visita:
              disponibilidadeVisita
                .trim(),
          }
        );

      if (error) {
        console.error(
          'Erro ao abrir solicitação:',
          error
        );

        setErro(
          error.message ||
            'Não foi possível enviar a solicitação.'
        );

        return;
      }

      const novaSolicitacao =
        data?.[0] as
          | SolicitacaoCriada
          | undefined;

      if (
        !novaSolicitacao
      ) {
        setErro(
          'Não foi possível registrar a solicitação.'
        );

        return;
      }

      // ------------------------------------------------------
      // 2. IDENTIFICA O CLIENTE
      // ------------------------------------------------------

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
        setSolicitacaoCriada(
          novaSolicitacao
        );

        setAvisoFotos(
          'A solicitação foi criada, mas não foi possível identificar o usuário para enviar as fotos.'
        );

        return;
      }

      const clienteId =
        usuarioData.user.id;

      // ------------------------------------------------------
      // 3. ENVIA AS FOTOS
      // ------------------------------------------------------

      let enviadas = 0;

      const errosFotos:
        number[] = [];

      for (
        let indice = 0;
        indice < fotos.length;
        indice++
      ) {
        try {
          await enviarFoto(
            fotos[indice],
            indice,
            novaSolicitacao
              .solicitacao_id,
            clienteId
          );

          enviadas++;

          setQuantidadeFotosEnviadas(
            enviadas
          );
        } catch (error) {
          console.error(
            `Erro na foto ${indice + 1}:`,
            error
          );

          errosFotos.push(
            indice + 1
          );
        }
      }

      setQuantidadeFotosEnviadas(
        enviadas
      );

      // ------------------------------------------------------
      // 4. VERIFICA SE TEM AS 3 FOTOS OBRIGATÓRIAS
      // ------------------------------------------------------

      if (
        enviadas <
        MINIMO_FOTOS
      ) {
        setAvisoFotos(
          `O protocolo foi criado, mas apenas ${enviadas} foto(s) foram enviadas. A notificação automática ainda não foi enviada porque o chamado precisa de pelo menos ${MINIMO_FOTOS} fotos.`
        );

        setSolicitacaoCriada(
          novaSolicitacao
        );

        return;
      }

      if (
        errosFotos.length > 0
      ) {
        setAvisoFotos(
          `${enviadas} foto(s) foram enviadas. Algumas imagens não puderam ser anexadas.`
        );
      }

      // ------------------------------------------------------
      // 5. NOTIFICA AUTOMATICAMENTE A EMAFE
      //
      // Só chegamos aqui se pelo menos 3 fotos
      // foram registradas.
      // ------------------------------------------------------

      await notificarEmpresa(
        novaSolicitacao
          .solicitacao_id
      );

      // ------------------------------------------------------
      // 6. MOSTRA SUCESSO PARA O CLIENTE
      // ------------------------------------------------------

      setSolicitacaoCriada(
        novaSolicitacao
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao enviar sua solicitação.'
      );
    } finally {
      setEnviando(false);
    }
  }

  // ==========================================================
  // LIMPAR FORMULÁRIO
  // ==========================================================

  function limparFormulario() {
    setCidadeSelecionada(
      ''
    );

    setUnidadeSelecionada(
      null
    );

    setComodoSelecionado(
      ''
    );

    setOutroComodo('');

    setDescricaoProblema(
      ''
    );

    setFotos([]);

    setDisponibilidadeVisita(
      ''
    );

    setSolicitacaoCriada(
      null
    );

    setQuantidadeFotosEnviadas(
      0
    );

    setNotificacaoEmailEnviada(
      false
    );

    setAvisoFotos('');

    setAvisoNotificacao('');

    setErro('');
  }

  // ==========================================================
  // CARREGAMENTO
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
            Carregando seus dados...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // SUCESSO
  // ==========================================================

  if (
    solicitacaoCriada
  ) {
    return (
      <SafeAreaView
        style={
          styles.container
        }
      >
        <StatusBar
          style="dark"
        />

        <ScrollView
          contentContainerStyle={
            styles.successPage
          }
        >
          <View
            style={
              styles.successContent
            }
          >
            <Image
              source={require('../../assets/emafe/logo-horizontal-transparente.png')}
              style={
                styles.logo
              }
              resizeMode="contain"
            />

            <View
              style={
                styles.successIcon
              }
            >
              <Ionicons
                name="checkmark"
                size={40}
                color="#357A4F"
              />
            </View>

            <Text
              style={
                styles.successTitle
              }
            >
              Solicitação enviada!
            </Text>

            <Text
              style={
                styles.successSubtitle
              }
            >
              Recebemos sua solicitação de manutenção.
            </Text>

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
                  solicitacaoCriada
                    .protocolo
                }
              </Text>

              <View
                style={
                  styles.statusBadge
                }
              >
                <Text
                  style={
                    styles.statusBadgeText
                  }
                >
                  Aguardando análise
                </Text>
              </View>
            </View>

            {/* PRÓXIMA ETAPA */}

            <View
              style={
                styles.analysisInfoBox
              }
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color="#0B5EA8"
              />

              <Text
                style={
                  styles.analysisInfoText
                }
              >
                A equipe da EMAFE analisará
                as informações enviadas.
                As atualizações aparecerão
                na área de acompanhamento
                da solicitação.
              </Text>
            </View>

            {/* FOTOS */}

            <View
              style={
                styles.photoSuccessCard
              }
            >
              <Ionicons
                name="images-outline"
                size={23}
                color="#357A4F"
              />

              <View
                style={{
                  marginLeft: 10,
                }}
              >
                <Text
                  style={
                    styles.photoSuccessLabel
                  }
                >
                  Fotos anexadas
                </Text>

                <Text
                  style={
                    styles.photoSuccessText
                  }
                >
                  {
                    quantidadeFotosEnviadas
                  }{' '}
                  foto(s)
                </Text>
              </View>
            </View>

            {/* NOTIFICAÇÃO EMAFE */}

            {notificacaoEmailEnviada ? (
              <View
                style={
                  styles.notificationSuccessBox
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={21}
                  color="#357A4F"
                />

                <View
                  style={
                    styles.notificationTextArea
                  }
                >
                  <Text
                    style={
                      styles.notificationSuccessTitle
                    }
                  >
                    Equipe notificada
                  </Text>

                  <Text
                    style={
                      styles.notificationSuccessText
                    }
                  >
                    A EMAFE recebeu uma notificação automática sobre este chamado.
                  </Text>
                </View>
              </View>
            ) : null}

            {/* AVISO DE FOTOS */}

            {avisoFotos ? (
              <View
                style={
                  styles.warningBox
                }
              >
                <Ionicons
                  name="alert-circle-outline"
                  size={20}
                  color="#7B5A12"
                />

                <Text
                  style={
                    styles.warningText
                  }
                >
                  {avisoFotos}
                </Text>
              </View>
            ) : null}

            {/* AVISO DE NOTIFICAÇÃO */}

            {avisoNotificacao ? (
              <View
                style={
                  styles.warningBox
                }
              >
                <Ionicons
                  name="mail-unread-outline"
                  size={20}
                  color="#7B5A12"
                />

                <Text
                  style={
                    styles.warningText
                  }
                >
                  {avisoNotificacao}
                </Text>
              </View>
            ) : null}

            <Text
              style={
                styles.protocolInfo
              }
            >
              Guarde este número para acompanhar sua solicitação.
            </Text>

            <TouchableOpacity
              style={
                styles.primaryButton
              }
              activeOpacity={
                0.85
              }
              onPress={() =>
                router.replace(
                  '/dashboard-cliente'
                )
              }
            >
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Voltar para minha área
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={
                styles.secondaryButton
              }
              onPress={
                limparFormulario
              }
            >
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Fazer outra solicitação
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // FORMULÁRIO
  // ==========================================================

  return (
    <SafeAreaView
      style={
        styles.container
      }
    >
      <StatusBar
        style="dark"
      />

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
          {/* VOLTAR */}

          <TouchableOpacity
            style={
              styles.backButton
            }
            onPress={() =>
              router.replace(
                '/dashboard-cliente'
              )
            }
          >
            <Text
              style={
                styles.backText
              }
            >
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          {/* LOGO */}

          <Image
            source={require('../../assets/emafe/logo-horizontal-transparente.png')}
            style={
              styles.logo
            }
            resizeMode="contain"
          />

          <Text
            style={
              styles.title
            }
          >
            Nova solicitação
          </Text>

          <Text
            style={
              styles.subtitle
            }
          >
            Informe os dados abaixo para solicitar uma manutenção.
          </Text>

          {/* ERRO */}

          {erro ? (
            <View
              style={
                styles.errorBox
              }
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

          {/* ==================================================
              1. CIDADE
          ================================================== */}

          <Text
            style={
              styles.sectionTitle
            }
          >
            1. Onde fica o seu imóvel?
          </Text>

          <Text
            style={
              styles.helperText
            }
          >
            Selecione a cidade do empreendimento.
          </Text>

          <View
            style={
              styles.cityContainer
            }
          >
            {CIDADES.map(
              (cidade) => {
                const selecionada =
                  cidadeSelecionada ===
                  cidade;

                return (
                  <TouchableOpacity
                    key={cidade}
                    style={[
                      styles.cityCard,

                      selecionada &&
                        styles.cityCardSelected,
                    ]}
                    activeOpacity={
                      0.85
                    }
                    onPress={() =>
                      selecionarCidade(
                        cidade
                      )
                    }
                  >
                    <View
                      style={[
                        styles.cityIcon,

                        selecionada &&
                          styles.cityIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="location-outline"
                        size={23}
                        color={
                          selecionada
                            ? '#FFFFFF'
                            : '#0B2447'
                        }
                      />
                    </View>

                    <Text
                      style={[
                        styles.cityText,

                        selecionada &&
                          styles.cityTextSelected,
                      ]}
                    >
                      {cidade}
                    </Text>
                  </TouchableOpacity>
                );
              }
            )}
          </View>

          {/* ==================================================
              2. IMÓVEL
          ================================================== */}

          {cidadeSelecionada ? (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                2. Selecione o imóvel
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Mostramos apenas os imóveis vinculados à sua conta em{' '}
                {cidadeSelecionada}.
              </Text>

              {unidadesDaCidade
                .length === 0 ? (
                <View
                  style={
                    styles.emptyBox
                  }
                >
                  <Ionicons
                    name="home-outline"
                    size={26}
                    color="#8995A5"
                  />

                  <Text
                    style={
                      styles.emptyTitle
                    }
                  >
                    Nenhum imóvel encontrado
                  </Text>

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    Não encontramos nenhum imóvel vinculado à sua conta nesta cidade.
                  </Text>
                </View>
              ) : (
                unidadesDaCidade.map(
                  (unidade) => {
                    const selecionada =
                      unidadeSelecionada
                        ?.unidade_id ===
                      unidade.unidade_id;

                    return (
                      <TouchableOpacity
                        key={
                          unidade.unidade_id
                        }
                        style={[
                          styles.propertyCard,

                          selecionada &&
                            styles.propertyCardSelected,
                        ]}
                        activeOpacity={
                          0.85
                        }
                        onPress={() => {
                          setUnidadeSelecionada(
                            unidade
                          );

                          setErro('');
                        }}
                      >
                        <View
                          style={
                            styles.propertyHeader
                          }
                        >
                          <View>
                            <Text
                              style={[
                                styles.propertyTitle,

                                selecionada &&
                                  styles.propertyTitleSelected,
                              ]}
                            >
                              {
                                unidade.empreendimento
                              }
                            </Text>

                            <Text
                              style={[
                                styles.propertySubtitle,

                                selecionada &&
                                  styles.propertySubtitleSelected,
                              ]}
                            >
                              Unidade{' '}
                              {
                                unidade.unidade
                              }
                            </Text>
                          </View>

                          {selecionada ? (
                            <Ionicons
                              name="checkmark-circle"
                              size={25}
                              color="#FFFFFF"
                            />
                          ) : (
                            <Ionicons
                              name="chevron-forward"
                              size={20}
                              color="#8995A5"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }
                )
              )}
            </>
          ) : null}

          {/* ==================================================
              3. CÔMODO
          ================================================== */}

          {unidadeSelecionada ? (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                3. Onde está o problema?
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Selecione o cômodo ou área do imóvel.
              </Text>

              <View
                style={
                  styles.roomGrid
                }
              >
                {COMODOS.map(
                  (comodo) => {
                    const selecionado =
                      comodoSelecionado ===
                      comodo;

                    return (
                      <TouchableOpacity
                        key={comodo}
                        style={[
                          styles.roomButton,

                          selecionado &&
                            styles.roomButtonSelected,
                        ]}
                        activeOpacity={
                          0.85
                        }
                        onPress={() =>
                          selecionarComodo(
                            comodo
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.roomButtonText,

                            selecionado &&
                              styles.roomButtonTextSelected,
                          ]}
                        >
                          {comodo}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>

              {comodoSelecionado ===
              'Outro' ? (
                <TextInput
                  style={
                    styles.input
                  }
                  placeholder="Digite onde está o problema"
                  placeholderTextColor="#8995A5"
                  value={
                    outroComodo
                  }
                  onChangeText={
                    setOutroComodo
                  }
                  maxLength={80}
                />
              ) : null}
            </>
          ) : null}

          {/* ==================================================
              A PARTIR DAQUI, SÓ APARECE APÓS ESCOLHER CÔMODO
          ================================================== */}

          {comodoSelecionado ? (
            <>
              {/* DESCRIÇÃO */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                4. Descreva o problema
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Conte de forma simples o que está acontecendo.
              </Text>

              <TextInput
                style={
                  styles.descriptionInput
                }
                placeholder="Ex.: A parede fica molhada quando chove e começou a aparecer uma mancha de umidade."
                placeholderTextColor="#8995A5"
                multiline
                textAlignVertical="top"
                value={
                  descricaoProblema
                }
                onChangeText={
                  setDescricaoProblema
                }
                maxLength={1500}
                editable={
                  !enviando
                }
              />

              <Text
                style={
                  styles.counterText
                }
              >
                {
                  descricaoProblema
                    .length
                }
                /1500
              </Text>

              {/* FOTOS */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                5. Fotos do problema
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Adicione pelo menos 3 fotos que mostrem claramente o problema.
              </Text>

              <View
                style={
                  styles.photoCounterRow
                }
              >
                <Text
                  style={
                    fotos.length >=
                    MINIMO_FOTOS
                      ? styles.photoCounterSuccess
                      : styles.photoCounterPending
                  }
                >
                  {fotos.length}/
                  {MINIMO_FOTOS}{' '}
                  fotos obrigatórias
                </Text>

                <Text
                  style={
                    styles.photoMaxText
                  }
                >
                  máximo{' '}
                  {
                    MAXIMO_FOTOS
                  }
                </Text>
              </View>

              {quantidadeFaltando >
              0 ? (
                <View
                  style={
                    styles.photoRequirementBox
                  }
                >
                  <Ionicons
                    name="information-circle-outline"
                    size={18}
                    color="#7B5A12"
                  />

                  <Text
                    style={
                      styles.photoRequirementText
                    }
                  >
                    Faltam{' '}
                    {
                      quantidadeFaltando
                    }{' '}
                    {quantidadeFaltando ===
                    1
                      ? 'foto'
                      : 'fotos'}{' '}
                    para liberar o envio.
                  </Text>
                </View>
              ) : (
                <View
                  style={
                    styles.photoReadyBox
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={18}
                    color="#357A4F"
                  />

                  <Text
                    style={
                      styles.photoReadyText
                    }
                  >
                    Quantidade mínima de fotos adicionada.
                  </Text>
                </View>
              )}

              <View
                style={
                  styles.photoButtons
                }
              >
                <TouchableOpacity
                  style={
                    styles.photoButton
                  }
                  onPress={
                    tirarFoto
                  }
                  activeOpacity={
                    0.8
                  }
                  disabled={
                    enviando
                  }
                >
                  <View
                    style={
                      styles.photoIconContainer
                    }
                  >
                    <Ionicons
                      name="camera-outline"
                      size={25}
                      color="#0B2447"
                    />
                  </View>

                  <View
                    style={
                      styles.photoButtonContent
                    }
                  >
                    <Text
                      style={
                        styles.photoButtonText
                      }
                    >
                      Tirar foto
                    </Text>

                    <Text
                      style={
                        styles.photoButtonSubtext
                      }
                    >
                      Usar a câmera
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={
                    styles.photoButton
                  }
                  onPress={
                    escolherDaGaleria
                  }
                  activeOpacity={
                    0.8
                  }
                  disabled={
                    enviando
                  }
                >
                  <View
                    style={
                      styles.photoIconContainer
                    }
                  >
                    <Ionicons
                      name="images-outline"
                      size={25}
                      color="#0B2447"
                    />
                  </View>

                  <View
                    style={
                      styles.photoButtonContent
                    }
                  >
                    <Text
                      style={
                        styles.photoButtonText
                      }
                    >
                      Galeria
                    </Text>

                    <Text
                      style={
                        styles.photoButtonSubtext
                      }
                    >
                      Escolher fotos
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

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
                      <View
                        key={`${foto.uri}-${indice}`}
                        style={
                          styles.photoPreviewContainer
                        }
                      >
                        <Image
                          source={{
                            uri:
                              foto.uri,
                          }}
                          style={
                            styles.photoPreview
                          }
                        />

                        <View
                          style={
                            styles.photoNumberBadge
                          }
                        >
                          <Text
                            style={
                              styles.photoNumberText
                            }
                          >
                            {indice +
                              1}
                          </Text>
                        </View>

                        <TouchableOpacity
                          style={
                            styles.removePhotoButton
                          }
                          onPress={() =>
                            removerFoto(
                              indice
                            )
                          }
                          disabled={
                            enviando
                          }
                        >
                          <Ionicons
                            name="close"
                            size={18}
                            color="#FFFFFF"
                          />
                        </TouchableOpacity>
                      </View>
                    )
                  )}
                </View>
              ) : null}

              {/* TELEFONE */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                6. Telefone para contato
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Informe o número que a EMAFE poderá utilizar para falar com você.
              </Text>

              <View
                style={
                  styles.inputWithIcon
                }
              >
                <Ionicons
                  name="call-outline"
                  size={20}
                  color="#697789"
                />

                <TextInput
                  style={
                    styles.inputInside
                  }
                  placeholder="(98) 99999-9999"
                  placeholderTextColor="#8995A5"
                  keyboardType="phone-pad"
                  value={
                    telefoneContato
                  }
                  onChangeText={
                    setTelefoneContato
                  }
                  maxLength={20}
                />
              </View>

              {/* E-MAIL */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                7. E-mail
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Confira o e-mail para receber informações sobre sua solicitação.
              </Text>

              <View
                style={
                  styles.inputWithIcon
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="#697789"
                />

                <TextInput
                  style={
                    styles.inputInside
                  }
                  placeholder="seuemail@exemplo.com"
                  placeholderTextColor="#8995A5"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={
                    emailContato
                  }
                  onChangeText={
                    setEmailContato
                  }
                />
              </View>

              {/* DISPONIBILIDADE */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                8. Disponibilidade para visita
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Informe os melhores dias e horários para receber a equipe da EMAFE.
              </Text>

              <TextInput
                style={
                  styles.availabilityInput
                }
                placeholder="Ex.: Segunda e quarta-feira, das 14h às 17h."
                placeholderTextColor="#8995A5"
                multiline
                textAlignVertical="top"
                value={
                  disponibilidadeVisita
                }
                onChangeText={
                  setDisponibilidadeVisita
                }
                maxLength={500}
              />

              {/* ENVIAR */}

              <TouchableOpacity
                style={[
                  styles.sendButton,

                  !podeEnviar &&
                    styles.sendButtonDisabled,
                ]}
                onPress={
                  enviarSolicitacao
                }
                disabled={
                  !podeEnviar
                }
                activeOpacity={
                  0.85
                }
              >
                {enviando ? (
                  <View
                    style={
                      styles.sendingContent
                    }
                  >
                    <ActivityIndicator
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.sendButtonText
                      }
                    >
                      Enviando solicitação...
                    </Text>
                  </View>
                ) : (
                  <Text
                    style={
                      styles.sendButtonText
                    }
                  >
                    Enviar solicitação
                  </Text>
                )}
              </TouchableOpacity>

              {!podeEnviar &&
              !enviando ? (
                <Text
                  style={
                    styles.requiredInfo
                  }
                >
                  Preencha todos os campos e adicione pelo menos 3 fotos para liberar o envio.
                </Text>
              ) : null}
            </>
          ) : null}

          <Text
            style={
              styles.footer
            }
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
      paddingTop: 20,
      paddingBottom: 55,
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
      width: 260,
      height: 95,
      alignSelf: 'center',
      marginTop: 5,
    },

    title: {
      color: '#0B2447',
      fontSize: 29,
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

    sectionTitle: {
      color: '#24364B',
      fontSize: 16,
      fontWeight: '700',
      marginTop: 27,
      marginBottom: 7,
    },

    helperText: {
      color: '#697789',
      fontSize: 12,
      lineHeight: 18,
      marginBottom: 12,
    },

    // CIDADE

    cityContainer: {
      flexDirection: 'row',
      gap: 12,
    },

    cityCard: {
      flex: 1,
      minHeight: 95,
      backgroundColor:
        '#FFFFFF',
      borderRadius: 16,
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
    },

    cityCardSelected: {
      backgroundColor:
        '#0B2447',
      borderColor:
        '#0B2447',
    },

    cityIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor:
        '#EAF0F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },

    cityIconSelected: {
      backgroundColor:
        'rgba(255,255,255,0.15)',
    },

    cityText: {
      color: '#0B2447',
      fontSize: 14,
      fontWeight: '700',
    },

    cityTextSelected: {
      color: '#FFFFFF',
    },

    // IMÓVEL

    propertyCard: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 15,
      padding: 17,
      marginBottom: 10,
    },

    propertyCardSelected: {
      backgroundColor:
        '#0B2447',
      borderColor:
        '#0B2447',
    },

    propertyHeader: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
    },

    propertyTitle: {
      color: '#0B2447',
      fontSize: 16,
      fontWeight: '700',
    },

    propertyTitleSelected: {
      color: '#FFFFFF',
    },

    propertySubtitle: {
      color: '#697789',
      fontSize: 12,
      marginTop: 5,
    },

    propertySubtitleSelected: {
      color: '#DCE6F1',
    },

    // CÔMODO

    roomGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 9,
    },

    roomButton: {
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },

    roomButtonSelected: {
      backgroundColor:
        '#E6EEF7',
      borderColor:
        '#0B2447',
    },

    roomButtonText: {
      color: '#42566D',
      fontSize: 12,
    },

    roomButtonTextSelected: {
      color: '#0B2447',
      fontWeight: '700',
    },

    // INPUTS

    input: {
      height: 54,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 13,
      paddingHorizontal: 15,
      color: '#24364B',
      fontSize: 14,
      marginTop: 10,
    },

    descriptionInput: {
      minHeight: 135,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      padding: 16,
      color: '#24364B',
      fontSize: 14,
      lineHeight: 21,
    },

    availabilityInput: {
      minHeight: 105,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      padding: 16,
      color: '#24364B',
      fontSize: 14,
      lineHeight: 21,
    },

    counterText: {
      color: '#8995A5',
      fontSize: 10,
      textAlign: 'right',
      marginTop: 5,
    },

    inputWithIcon: {
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

    inputInside: {
      flex: 1,
      height: 54,
      paddingHorizontal: 11,
      color: '#24364B',
      fontSize: 14,
      outlineStyle:
        'none' as any,
    },

    // FOTOS

    photoCounterRow: {
      flexDirection: 'row',
      justifyContent:
        'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },

    photoCounterPending: {
      color: '#A36B00',
      fontSize: 12,
      fontWeight: '700',
    },

    photoCounterSuccess: {
      color: '#357A4F',
      fontSize: 12,
      fontWeight: '700',
    },

    photoMaxText: {
      color: '#8995A5',
      fontSize: 10,
    },

    photoRequirementBox: {
      backgroundColor:
        '#FFF7E6',
      borderWidth: 1,
      borderColor:
        '#E5C77F',
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    photoRequirementText: {
      flex: 1,
      color: '#7B5A12',
      fontSize: 11,
    },

    photoReadyBox: {
      backgroundColor:
        '#EAF6EE',
      borderWidth: 1,
      borderColor:
        '#76AA87',
      borderRadius: 11,
      paddingHorizontal: 12,
      paddingVertical: 11,
      marginBottom: 14,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    photoReadyText: {
      flex: 1,
      color: '#357A4F',
      fontSize: 11,
      fontWeight: '700',
    },

    photoButtons: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 18,
    },

    photoButton: {
      flex: 1,
      minHeight: 80,
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 14,
      paddingHorizontal: 14,
      paddingVertical: 13,
      flexDirection: 'row',
      alignItems: 'center',
    },

    photoIconContainer: {
      width: 46,
      height: 46,
      borderRadius: 13,
      backgroundColor:
        '#EAF0F6',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },

    photoButtonContent: {
      flex: 1,
    },

    photoButtonText: {
      color: '#0B2447',
      fontSize: 13,
      fontWeight: '700',
    },

    photoButtonSubtext: {
      color: '#8995A5',
      fontSize: 10,
      marginTop: 3,
    },

    photoGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
      marginTop: 4,
    },

    photoPreviewContainer: {
      width: 120,
      height: 120,
      borderRadius: 12,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor:
        '#E9EEF4',
    },

    photoPreview: {
      width: '100%',
      height: '100%',
    },

    photoNumberBadge: {
      position: 'absolute',
      left: 6,
      bottom: 6,
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor:
        'rgba(11,36,71,0.88)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    photoNumberText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '700',
    },

    removePhotoButton: {
      position: 'absolute',
      top: 6,
      right: 6,
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor:
        'rgba(165,40,40,0.92)',
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ENVIO

    sendButton: {
      height: 60,
      borderRadius: 16,
      backgroundColor:
        '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 30,
    },

    sendButtonDisabled: {
      opacity: 0.45,
    },

    sendButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    sendingContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    requiredInfo: {
      color: '#8995A5',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      marginTop: 10,
    },

    // ERROS

    errorBox: {
      backgroundColor:
        '#FCEEEE',
      borderRadius: 12,
      padding: 13,
      borderWidth: 1,
      borderColor:
        '#D29A9A',
      marginBottom: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },

    errorText: {
      flex: 1,
      color: '#9A3232',
      fontSize: 12,
    },

    // VAZIO

    emptyBox: {
      backgroundColor:
        '#FFFFFF',
      borderRadius: 14,
      padding: 22,
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      alignItems: 'center',
    },

    emptyTitle: {
      color: '#24364B',
      fontSize: 13,
      fontWeight: '700',
      marginTop: 8,
    },

    emptyText: {
      color: '#8995A5',
      textAlign: 'center',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 5,
    },

    // LOADING

    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },

    loadingText: {
      color: '#697789',
      fontSize: 13,
      marginTop: 10,
    },

    // SUCESSO

    successPage: {
      flexGrow: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },

    successContent: {
      width: '100%',
      maxWidth: 500,
      alignItems: 'center',
    },

    successIcon: {
      width: 70,
      height: 70,
      borderRadius: 35,
      backgroundColor:
        '#EAF6EE',
      borderWidth: 2,
      borderColor:
        '#76AA87',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },

    successTitle: {
      color: '#0B2447',
      fontSize: 27,
      fontWeight: '800',
      textAlign: 'center',
      marginTop: 20,
    },

    successSubtitle: {
      color: '#697789',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },

    protocolCard: {
      width: '100%',
      backgroundColor:
        '#FFFFFF',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 16,
      padding: 22,
      alignItems: 'center',
      marginTop: 28,
    },

    protocolLabel: {
      color: '#8995A5',
      fontSize: 10,
      fontWeight: '700',
    },

    protocolNumber: {
      color: '#0B2447',
      fontSize: 22,
      fontWeight: '800',
      marginTop: 8,
    },

    statusBadge: {
      backgroundColor:
        '#EAF0F6',
      borderRadius: 20,
      paddingHorizontal: 14,
      paddingVertical: 7,
      marginTop: 12,
    },

    statusBadgeText: {
      color: '#0B2447',
      fontSize: 11,
      fontWeight: '700',
    },

    analysisInfoBox: {
      width: '100%',
      backgroundColor:
        '#EAF0F6',
      borderRadius: 14,
      padding: 15,
      marginTop: 15,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 10,
    },

    analysisInfoText: {
      flex: 1,
      color: '#42566D',
      fontSize: 12,
      lineHeight: 18,
    },

    photoSuccessCard: {
      width: '100%',
      backgroundColor:
        '#EAF6EE',
      borderRadius: 14,
      padding: 15,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    photoSuccessLabel: {
      color: '#557087',
      fontSize: 10,
    },

    photoSuccessText: {
      color: '#357A4F',
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },

    notificationSuccessBox: {
      width: '100%',
      backgroundColor:
        '#EAF6EE',
      borderWidth: 1,
      borderColor:
        '#76AA87',
      borderRadius: 14,
      padding: 15,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },

    notificationTextArea: {
      flex: 1,
      marginLeft: 10,
    },

    notificationSuccessTitle: {
      color: '#357A4F',
      fontSize: 12,
      fontWeight: '800',
    },

    notificationSuccessText: {
      color: '#557087',
      fontSize: 11,
      lineHeight: 17,
      marginTop: 3,
    },

    warningBox: {
      width: '100%',
      backgroundColor:
        '#FFF7E6',
      borderWidth: 1,
      borderColor:
        '#E5C77F',
      borderRadius: 12,
      padding: 12,
      marginTop: 12,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 8,
    },

    warningText: {
      flex: 1,
      color: '#7B5A12',
      fontSize: 11,
      lineHeight: 17,
    },

    protocolInfo: {
      color: '#697789',
      fontSize: 12,
      textAlign: 'center',
      marginTop: 16,
    },

    primaryButton: {
      width: '100%',
      height: 58,
      borderRadius: 16,
      backgroundColor:
        '#0B2447',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 28,
    },

    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700',
    },

    secondaryButton: {
      paddingVertical: 15,
      paddingHorizontal: 20,
      marginTop: 8,
    },

    secondaryButtonText: {
      color: '#0B5EA8',
      fontSize: 13,
      fontWeight: '600',
    },

    footer: {
      color: '#8995A5',
      fontSize: 10,
      textAlign: 'center',
      marginTop: 45,
    },
  });