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

type Unidade = {
  unidade_id: string;
  empreendimento: string;
  unidade: string;

  modelo_garantia_id: string | null;
  modelo_garantia: string | null;

  data_habite_se: string | null;
  data_entrega_chaves: string | null;
  data_entrega_obra: string | null;
  data_assinatura_contrato: string | null;
};

type ItemGarantia = {
  item_garantia_id: string;
  categoria: string;
  elemento_construtivo: string;
  manifestacao_patologica: string;

  prazo_quantidade: number | null;
  prazo_unidade: string | null;
  regra_data_base: string | null;
};

type ResultadoGarantia = {
  unidade_id: string;
  empreendimento: string;
  unidade: string;

  item_garantia_id: string;
  categoria: string;
  elemento_construtivo: string;
  manifestacao_patologica: string;

  regra_data_base: string | null;
  data_base: string | null;

  prazo_quantidade: number | null;
  prazo_unidade: string | null;

  data_limite_garantia: string | null;

  status_garantia: string;

  dias_restantes: number | null;

  aviso: string | null;
};

type SolicitacaoCriada = {
  solicitacao_id: string;
  protocolo: string;
  status: string;
  status_garantia: string;
  data_limite_garantia: string | null;
};

export default function NovaSolicitacaoScreen() {
  const [unidades, setUnidades] =
    useState<Unidade[]>([]);

  const [unidadeSelecionada, setUnidadeSelecionada] =
    useState<Unidade | null>(null);

  const [itens, setItens] =
    useState<ItemGarantia[]>([]);

  const [categoriaSelecionada, setCategoriaSelecionada] =
    useState('');

  const [elementoSelecionado, setElementoSelecionado] =
    useState('');

  const [itemSelecionado, setItemSelecionado] =
    useState<ItemGarantia | null>(null);

  const [resultado, setResultado] =
    useState<ResultadoGarantia | null>(null);

  const [descricaoProblema, setDescricaoProblema] =
    useState('');

  const [fotos, setFotos] =
    useState<ImagePicker.ImagePickerAsset[]>([]);

  const [solicitacaoCriada, setSolicitacaoCriada] =
    useState<SolicitacaoCriada | null>(null);

  const [
    quantidadeFotosEnviadas,
    setQuantidadeFotosEnviadas,
  ] = useState(0);

  const [avisoFotos, setAvisoFotos] =
    useState('');

  const [carregando, setCarregando] =
    useState(true);

  const [carregandoItens, setCarregandoItens] =
    useState(false);

  const [calculando, setCalculando] =
    useState(false);

  const [enviando, setEnviando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  useEffect(() => {
    carregarUnidades();
  }, []);

  async function carregarUnidades() {
    try {
      setCarregando(true);
      setErro('');

      const { data, error } =
        await supabase.rpc(
          'listar_minhas_unidades'
        );

      if (error) {
        console.error(
          'Erro ao carregar unidades:',
          error
        );

        setErro(
          'Não foi possível carregar seus imóveis.'
        );

        return;
      }

      setUnidades(
        (data ?? []) as Unidade[]
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao carregar seus imóveis.'
      );
    } finally {
      setCarregando(false);
    }
  }

  async function selecionarUnidade(
    unidade: Unidade
  ) {
    setUnidadeSelecionada(unidade);

    setCategoriaSelecionada('');
    setElementoSelecionado('');
    setItemSelecionado(null);

    setResultado(null);
    setDescricaoProblema('');
    setFotos([]);

    setSolicitacaoCriada(null);

    setItens([]);
    setErro('');

    if (!unidade.modelo_garantia_id) {
      return;
    }

    try {
      setCarregandoItens(true);

      const { data, error } =
        await supabase.rpc(
          'listar_itens_garantia_unidade',
          {
            p_unidade_id:
              unidade.unidade_id,
          }
        );

      if (error) {
        console.error(
          'Erro ao carregar garantias:',
          error
        );

        setErro(
          'Não foi possível carregar as garantias deste imóvel.'
        );

        return;
      }

      setItens(
        (data ?? []) as ItemGarantia[]
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao carregar as garantias.'
      );
    } finally {
      setCarregandoItens(false);
    }
  }

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        itens.map(
          (item) => item.categoria
        )
      )
    );
  }, [itens]);

  const elementos = useMemo(() => {
    if (!categoriaSelecionada) {
      return [];
    }

    return Array.from(
      new Set(
        itens
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
    itens,
    categoriaSelecionada,
  ]);

  const problemas = useMemo(() => {
    if (
      !categoriaSelecionada ||
      !elementoSelecionado
    ) {
      return [];
    }

    return itens.filter(
      (item) =>
        item.categoria ===
          categoriaSelecionada &&
        item.elemento_construtivo ===
          elementoSelecionado
    );
  }, [
    itens,
    categoriaSelecionada,
    elementoSelecionado,
  ]);

  function selecionarCategoria(
    categoria: string
  ) {
    setCategoriaSelecionada(
      categoria
    );

    setElementoSelecionado('');
    setItemSelecionado(null);

    setResultado(null);
    setDescricaoProblema('');
    setFotos([]);
  }

  function selecionarElemento(
    elemento: string
  ) {
    setElementoSelecionado(
      elemento
    );

    setItemSelecionado(null);

    setResultado(null);
    setDescricaoProblema('');
    setFotos([]);
  }

  function selecionarProblema(
    item: ItemGarantia
  ) {
    setItemSelecionado(item);

    setResultado(null);
    setDescricaoProblema('');
    setFotos([]);
  }

  async function verificarGarantia() {
    if (
      !unidadeSelecionada ||
      !itemSelecionado
    ) {
      return;
    }

    try {
      setCalculando(true);

      setErro('');
      setResultado(null);

      const dataAtual =
        new Date();

      const ano =
        dataAtual.getFullYear();

      const mes =
        String(
          dataAtual.getMonth() + 1
        ).padStart(2, '0');

      const dia =
        String(
          dataAtual.getDate()
        ).padStart(2, '0');

      const dataHoje =
        `${ano}-${mes}-${dia}`;

      const { data, error } =
        await supabase.rpc(
          'calcular_minha_garantia',
          {
            p_unidade_id:
              unidadeSelecionada.unidade_id,

            p_item_garantia_id:
              itemSelecionado.item_garantia_id,

            p_data_referencia:
              dataHoje,
          }
        );

      if (error) {
        console.error(
          'Erro ao calcular garantia:',
          error
        );

        setErro(
          'Não foi possível verificar a garantia.'
        );

        return;
      }

      const resultadoCalculado =
        data?.[0] as
          | ResultadoGarantia
          | undefined;

      if (!resultadoCalculado) {
        setErro(
          'Não foi possível calcular a garantia.'
        );

        return;
      }

      setResultado(
        resultadoCalculado
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Ocorreu um erro ao verificar a garantia.'
      );
    } finally {
      setCalculando(false);
    }
  }

  // ==========================================================
  // FOTOS
  // ==========================================================

  function adicionarFotos(
    novasFotos: ImagePicker.ImagePickerAsset[]
  ) {
    setFotos((fotosAtuais) => {
      const disponivel =
        MAXIMO_FOTOS -
        fotosAtuais.length;

      if (disponivel <= 0) {
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

      const fotosPermitidas =
        semDuplicadas.slice(
          0,
          disponivel
        );

      return [
        ...fotosAtuais,
        ...fotosPermitidas,
      ];
    });
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

      if (Platform.OS !== 'web') {
        const permissao =
          await ImagePicker
            .requestCameraPermissionsAsync();

        if (!permissao.granted) {
          setErro(
            'Precisamos da permissão da câmera para tirar a foto.'
          );

          return;
        }
      }

      const resultadoFoto =
        await ImagePicker
          .launchCameraAsync({
            mediaTypes:
              ImagePicker
                .MediaTypeOptions
                .Images,

            allowsEditing: false,

            quality: 0.75,
          });

      if (
        !resultadoFoto.canceled &&
        resultadoFoto.assets?.length
      ) {
        adicionarFotos(
          resultadoFoto.assets
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

      if (Platform.OS !== 'web') {
        const permissao =
          await ImagePicker
            .requestMediaLibraryPermissionsAsync();

        if (!permissao.granted) {
          setErro(
            'Precisamos da permissão para acessar suas fotos.'
          );

          return;
        }
      }

      const limite =
        MAXIMO_FOTOS -
        fotos.length;

      const resultadoGaleria =
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
        !resultadoGaleria.canceled &&
        resultadoGaleria.assets?.length
      ) {
        adicionarFotos(
          resultadoGaleria.assets
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
    setFotos((fotosAtuais) =>
      fotosAtuais.filter(
        (_, index) =>
          index !== indice
      )
    );
  }

  function extensaoDaFoto(
    foto: ImagePicker.ImagePickerAsset
  ) {
    if (foto.fileName) {
      const partes =
        foto.fileName.split('.');

      if (partes.length > 1) {
        return partes
          .pop()
          ?.toLowerCase() || 'jpg';
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
    foto: ImagePicker.ImagePickerAsset
  ) {
    if (foto.mimeType) {
      return foto.mimeType;
    }

    const extensao =
      extensaoDaFoto(foto);

    if (extensao === 'png') {
      return 'image/png';
    }

    if (extensao === 'webp') {
      return 'image/webp';
    }

    if (extensao === 'heic') {
      return 'image/heic';
    }

    if (extensao === 'heif') {
      return 'image/heif';
    }

    return 'image/jpeg';
  }

  async function enviarFoto(
    foto: ImagePicker.ImagePickerAsset,
    indice: number,
    solicitacaoId: string,
    clienteId: string
  ) {
    const extensao =
      extensaoDaFoto(foto);

    const mime =
      mimeDaFoto(foto);

    const nomeArquivo =
      `foto-${indice + 1}-${Date.now()}.${extensao}`;

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
        .from('solicitacoes-fotos')
        .upload(
          caminhoStorage,
          arquivo,
          {
            contentType: mime,
            upsert: false,
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

    if (registroError) {
      await supabase.storage
        .from('solicitacoes-fotos')
        .remove([
          caminhoStorage,
        ]);

      throw registroError;
    }
  }

  async function enviarSolicitacao() {
    if (
      !unidadeSelecionada ||
      !itemSelecionado
    ) {
      setErro(
        'Selecione o imóvel e o problema.'
      );

      return;
    }

    if (!resultado) {
      setErro(
        'Verifique a garantia antes de enviar a solicitação.'
      );

      return;
    }

    if (
      !descricaoProblema.trim()
    ) {
      setErro(
        'Descreva o problema encontrado no imóvel.'
      );

      return;
    }

    if (
      fotos.length <
      MINIMO_FOTOS
    ) {
      setErro(
        `Adicione pelo menos ${MINIMO_FOTOS} fotos do problema antes de enviar.`
      );

      return;
    }

    try {
      setEnviando(true);

      setErro('');
      setAvisoFotos('');
      setQuantidadeFotosEnviadas(0);

      // ======================================================
      // 1. CRIA SOLICITAÇÃO
      // ======================================================

      const {
        data,
        error,
      } =
        await supabase.rpc(
          'abrir_solicitacao',
          {
            p_unidade_id:
              unidadeSelecionada.unidade_id,

            p_item_garantia_id:
              itemSelecionado.item_garantia_id,

            p_descricao_problema:
              descricaoProblema.trim(),
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

      if (!novaSolicitacao) {
        setErro(
          'A solicitação não pôde ser registrada.'
        );

        return;
      }

      // ======================================================
      // 2. BUSCA USUÁRIO
      // ======================================================

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth
          .getUser();

      if (
        userError ||
        !userData.user
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
        userData.user.id;

      // ======================================================
      // 3. ENVIA FOTOS
      // ======================================================

      let enviadas = 0;

      const errosFotos: string[] =
        [];

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
            `Erro na foto ${
              indice + 1
            }:`,
            error
          );

          errosFotos.push(
            `Foto ${indice + 1}`
          );
        }
      }

      setQuantidadeFotosEnviadas(
        enviadas
      );

      if (
        enviadas <
        MINIMO_FOTOS
      ) {
        setAvisoFotos(
          `A solicitação foi registrada, mas apenas ${enviadas} foto(s) foram enviadas. Guarde o protocolo e não crie outro chamado para o mesmo problema.`
        );
      } else if (
        errosFotos.length > 0
      ) {
        setAvisoFotos(
          `A solicitação foi registrada e ${enviadas} foto(s) foram enviadas. Algumas imagens não puderam ser anexadas.`
        );
      }

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

  function novaSolicitacao() {
    setUnidadeSelecionada(null);

    setItens([]);

    setCategoriaSelecionada('');
    setElementoSelecionado('');

    setItemSelecionado(null);

    setResultado(null);

    setDescricaoProblema('');

    setFotos([]);

    setSolicitacaoCriada(null);

    setQuantidadeFotosEnviadas(0);

    setAvisoFotos('');

    setErro('');
  }

  function formatarData(
    data: string | null
  ) {
    if (!data) {
      return '-';
    }

    const partes =
      data.split('-');

    if (
      partes.length !== 3
    ) {
      return data;
    }

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  }

  function textoStatus() {
    if (!resultado) {
      return '';
    }

    switch (
      resultado.status_garantia
    ) {
      case 'dentro_da_garantia':
        return 'Dentro da garantia';

      case 'fora_da_garantia':
        return 'Fora da garantia';

      case 'dados_insuficientes':
        return 'Não foi possível calcular';

      case 'ato_da_entrega':
        return 'Garantia no ato da entrega';

      case 'nao_se_aplica':
        return 'Garantia não aplicável';

      default:
        return resultado.status_garantia;
    }
  }

  function estiloResultado() {
    if (!resultado) {
      return styles.resultNeutral;
    }

    if (
      resultado.status_garantia ===
      'dentro_da_garantia'
    ) {
      return styles.resultSuccess;
    }

    if (
      resultado.status_garantia ===
      'fora_da_garantia'
    ) {
      return styles.resultDanger;
    }

    return styles.resultWarningBox;
  }

  const quantidadeFaltando =
    Math.max(
      0,
      MINIMO_FOTOS -
        fotos.length
    );

  const podeEnviar =
    !!resultado &&
    descricaoProblema.trim()
      .length > 0 &&
    fotos.length >=
      MINIMO_FOTOS &&
    !enviando;

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
            style={styles.loadingText}
          >
            Carregando seus imóveis...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // SUCESSO
  // ==========================================================

  if (solicitacaoCriada) {
    return (
      <SafeAreaView
        style={styles.container}
      >
        <StatusBar style="dark" />

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
              style={styles.logo}
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
              Sua solicitação foi
              registrada com sucesso.
            </Text>

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

              <Text
                style={
                  styles.protocolStatus
                }
              >
                Status: Aberta
              </Text>
            </View>

            <View
              style={
                styles.photoSuccessCard
              }
            >
              <View
                style={
                  styles.photoSuccessIcon
                }
              >
                <Ionicons
                  name="images-outline"
                  size={22}
                  color="#357A4F"
                />
              </View>

              <View>
                <Text
                  style={
                    styles.photoSuccessTitle
                  }
                >
                  Fotos anexadas
                </Text>

                <Text
                  style={
                    styles.photoSuccessNumber
                  }
                >
                  {
                    quantidadeFotosEnviadas
                  }{' '}
                  foto(s)
                </Text>
              </View>
            </View>

            {avisoFotos ? (
              <View
                style={
                  styles.photoWarningBox
                }
              >
                <Text
                  style={
                    styles.photoWarningText
                  }
                >
                  {avisoFotos}
                </Text>
              </View>
            ) : null}

            <Text
              style={
                styles.protocolInfo
              }
            >
              Guarde este número para
              acompanhar sua solicitação.
            </Text>

            <TouchableOpacity
              style={
                styles.primaryButton
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
                novaSolicitacao
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
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.backText}
            >
              ‹ Voltar
            </Text>
          </TouchableOpacity>

          <Image
            source={require('../../assets/emafe/logo-horizontal-transparente.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>
            Nova solicitação
          </Text>

          <Text
            style={styles.subtitle}
          >
            Selecione o imóvel e
            informe o problema
            encontrado.
          </Text>

          {erro ? (
            <View
              style={styles.errorBox}
            >
              <Text
                style={styles.errorText}
              >
                {erro}
              </Text>
            </View>
          ) : null}

          {/* 1. IMÓVEL */}

          <Text
            style={styles.sectionTitle}
          >
            1. Selecione o imóvel
          </Text>

          {unidades.length === 0 ? (
            <View
              style={styles.emptyBox}
            >
              <Text
                style={styles.emptyText}
              >
                Nenhum imóvel está
                vinculado à sua conta.
              </Text>
            </View>
          ) : (
            unidades.map(
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
                      styles.optionCard,

                      selecionada &&
                        styles.optionCardSelected,
                    ]}
                    onPress={() =>
                      selecionarUnidade(
                        unidade
                      )
                    }
                  >
                    <Text
                      style={[
                        styles.optionTitle,

                        selecionada &&
                          styles.optionTitleSelected,
                      ]}
                    >
                      {
                        unidade.empreendimento
                      }
                    </Text>

                    <Text
                      style={[
                        styles.optionSubtitle,

                        selecionada &&
                          styles.optionSubtitleSelected,
                      ]}
                    >
                      Unidade{' '}
                      {unidade.unidade}
                    </Text>

                    {unidade.modelo_garantia ? (
                      <Text
                        style={[
                          styles.modelText,

                          selecionada &&
                            styles.optionSubtitleSelected,
                        ]}
                      >
                        {
                          unidade.modelo_garantia
                        }
                      </Text>
                    ) : (
                      <Text
                        style={
                          styles.noWarrantyText
                        }
                      >
                        Garantia ainda não
                        configurada
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              }
            )
          )}

          {unidadeSelecionada &&
          !unidadeSelecionada
            .modelo_garantia_id ? (
            <View
              style={
                styles.warningBox
              }
            >
              <Text
                style={
                  styles.warningTitle
                }
              >
                Garantia não configurada
              </Text>

              <Text
                style={
                  styles.warningText
                }
              >
                Este imóvel ainda não
                possui um modelo de
                garantia cadastrado.
              </Text>
            </View>
          ) : null}

          {carregandoItens ? (
            <View
              style={
                styles.inlineLoading
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
                Carregando garantias...
              </Text>
            </View>
          ) : null}

          {/* 2. CATEGORIA */}

          {unidadeSelecionada &&
          unidadeSelecionada
            .modelo_garantia_id &&
          !carregandoItens ? (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                2. Categoria
              </Text>

              <View
                style={
                  styles.optionsContainer
                }
              >
                {categorias.map(
                  (categoria) => {
                    const selecionada =
                      categoriaSelecionada ===
                      categoria;

                    return (
                      <TouchableOpacity
                        key={categoria}
                        style={[
                          styles.smallOption,

                          selecionada &&
                            styles.smallOptionSelected,
                        ]}
                        onPress={() =>
                          selecionarCategoria(
                            categoria
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.smallOptionText,

                            selecionada &&
                              styles.smallOptionTextSelected,
                          ]}
                        >
                          {categoria}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* 3. ELEMENTO */}

          {categoriaSelecionada ? (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                3. Onde está o problema?
              </Text>

              <View
                style={
                  styles.optionsContainer
                }
              >
                {elementos.map(
                  (elemento) => {
                    const selecionado =
                      elementoSelecionado ===
                      elemento;

                    return (
                      <TouchableOpacity
                        key={elemento}
                        style={[
                          styles.smallOption,

                          selecionado &&
                            styles.smallOptionSelected,
                        ]}
                        onPress={() =>
                          selecionarElemento(
                            elemento
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.smallOptionText,

                            selecionado &&
                              styles.smallOptionTextSelected,
                          ]}
                        >
                          {elemento}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </>
          ) : null}

          {/* 4. PROBLEMA */}

          {elementoSelecionado ? (
            <>
              <Text
                style={
                  styles.sectionTitle
                }
              >
                4. Selecione o problema
              </Text>

              {problemas.map(
                (item) => {
                  const selecionado =
                    itemSelecionado
                      ?.item_garantia_id ===
                    item.item_garantia_id;

                  return (
                    <TouchableOpacity
                      key={
                        item.item_garantia_id
                      }
                      style={[
                        styles.problemCard,

                        selecionado &&
                          styles.problemCardSelected,
                      ]}
                      onPress={() =>
                        selecionarProblema(
                          item
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.problemText,

                          selecionado &&
                            styles.problemTextSelected,
                        ]}
                      >
                        {
                          item.manifestacao_patologica
                        }
                      </Text>

                      {item.prazo_quantidade &&
                      item.prazo_unidade ? (
                        <Text
                          style={[
                            styles.deadlineText,

                            selecionado &&
                              styles.problemTextSelected,
                          ]}
                        >
                          Prazo de referência:{' '}
                          {
                            item.prazo_quantidade
                          }{' '}
                          {
                            item.prazo_unidade
                          }
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                }
              )}
            </>
          ) : null}

          {/* VERIFICAR GARANTIA */}

          {itemSelecionado &&
          !resultado ? (
            <TouchableOpacity
              style={[
                styles.checkButton,

                calculando &&
                  styles.buttonDisabled,
              ]}
              onPress={
                verificarGarantia
              }
              disabled={calculando}
            >
              {calculando ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text
                  style={
                    styles.checkButtonText
                  }
                >
                  Verificar garantia
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          {/* RESULTADO */}

          {resultado ? (
            <>
              <View
                style={[
                  styles.resultBox,

                  estiloResultado(),
                ]}
              >
                <Text
                  style={
                    styles.resultLabel
                  }
                >
                  Resultado
                </Text>

                <Text
                  style={
                    styles.resultTitle
                  }
                >
                  {textoStatus()}
                </Text>

                {resultado.data_base ? (
                  <Text
                    style={
                      styles.resultText
                    }
                  >
                    Data-base:{' '}
                    {formatarData(
                      resultado.data_base
                    )}
                  </Text>
                ) : null}

                {resultado
                  .data_limite_garantia ? (
                  <Text
                    style={
                      styles.resultText
                    }
                  >
                    Limite da garantia:{' '}
                    {formatarData(
                      resultado
                        .data_limite_garantia
                    )}
                  </Text>
                ) : null}

                {resultado.dias_restantes !==
                  null &&
                resultado.status_garantia ===
                  'dentro_da_garantia' ? (
                  <Text
                    style={
                      styles.resultText
                    }
                  >
                    Restam aproximadamente{' '}
                    {
                      resultado.dias_restantes
                    }{' '}
                    dias.
                  </Text>
                ) : null}

                {resultado.aviso ? (
                  <Text
                    style={
                      styles.resultWarningText
                    }
                  >
                    {resultado.aviso}
                  </Text>
                ) : null}
              </View>

              {/* 5. DESCRIÇÃO */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                5. Descreva o problema
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Explique o que está
                acontecendo e onde você
                percebeu o problema.
              </Text>

              <TextInput
                style={
                  styles.descriptionInput
                }
                placeholder="Ex.: Percebi uma infiltração próxima à churrasqueira. A parede fica úmida principalmente após chuva..."
                placeholderTextColor="#8995A5"
                multiline
                textAlignVertical="top"
                value={
                  descricaoProblema
                }
                onChangeText={
                  setDescricaoProblema
                }
                editable={!enviando}
                maxLength={1500}
              />

              <Text
                style={
                  styles.counterText
                }
              >
                {
                  descricaoProblema.length
                }
                /1500
              </Text>

              {/* 6. FOTOS */}

              <Text
                style={
                  styles.sectionTitle
                }
              >
                6. Fotos do problema
              </Text>

              <Text
                style={
                  styles.helperText
                }
              >
                Adicione pelo menos 3
                fotos que mostrem
                claramente o problema.
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
                  {MINIMO_FOTOS} fotos
                  obrigatórias
                </Text>

                <Text
                  style={
                    styles.photoMaxText
                  }
                >
                  máximo {MAXIMO_FOTOS}
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
                    Quantidade mínima de
                    fotos adicionada.
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
                  onPress={tirarFoto}
                  disabled={enviando}
                  activeOpacity={0.8}
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
                  disabled={enviando}
                  activeOpacity={0.8}
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

              {fotos.length > 0 ? (
                <View
                  style={
                    styles.photoGrid
                  }
                >
                  {fotos.map(
                    (foto, indice) => (
                      <View
                        key={`${foto.uri}-${indice}`}
                        style={
                          styles.photoPreviewContainer
                        }
                      >
                        <Image
                          source={{
                            uri: foto.uri,
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
                            {indice + 1}
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

              {/* ENVIO */}

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
                      Enviando...
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

              {resultado.status_garantia ===
              'fora_da_garantia' ? (
                <Text
                  style={
                    styles.outWarrantyInfo
                  }
                >
                  Mesmo fora do prazo de
                  garantia, você pode enviar
                  a solicitação para análise
                  da EMAFE.
                </Text>
              ) : null}
            </>
          ) : null}

          <Text
            style={styles.footer}
          >
            EMAFE Engenharia •
            Assistência Técnica
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
    width: 260,
    height: 95,
    alignSelf: 'center',
    marginTop: 5,
  },

  title: {
    color: '#0B2447',
    fontSize: 28,
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
    marginBottom: 30,
  },

  sectionTitle: {
    color: '#24364B',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 25,
    marginBottom: 12,
  },

  helperText: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 18,
    marginTop: -5,
    marginBottom: 10,
  },

  optionCard: {
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },

  optionCardSelected: {
    backgroundColor: '#0B2447',
    borderColor: '#0B2447',
  },

  optionTitle: {
    color: '#0B2447',
    fontSize: 16,
    fontWeight: '700',
  },

  optionTitleSelected: {
    color: '#FFFFFF',
  },

  optionSubtitle: {
    color: '#697789',
    fontSize: 13,
    marginTop: 4,
  },

  optionSubtitleSelected: {
    color: '#DCE6F1',
  },

  modelText: {
    color: '#58708A',
    fontSize: 11,
    marginTop: 8,
  },

  noWarrantyText: {
    color: '#A36B00',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },

  optionsContainer: {
    gap: 8,
  },

  smallOption: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    padding: 14,
  },

  smallOptionSelected: {
    backgroundColor: '#E6EEF7',
    borderColor: '#0B2447',
  },

  smallOptionText: {
    color: '#24364B',
    fontSize: 13,
    lineHeight: 19,
  },

  smallOptionTextSelected: {
    color: '#0B2447',
    fontWeight: '700',
  },

  problemCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },

  problemCardSelected: {
    backgroundColor: '#0B2447',
    borderColor: '#0B2447',
  },

  problemText: {
    color: '#24364B',
    fontSize: 13,
    lineHeight: 19,
  },

  problemTextSelected: {
    color: '#FFFFFF',
  },

  deadlineText: {
    color: '#7A8796',
    fontSize: 11,
    marginTop: 8,
  },

  checkButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
  },

  checkButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  resultBox: {
    borderRadius: 16,
    padding: 20,
    marginTop: 22,
    borderWidth: 1,
  },

  resultSuccess: {
    backgroundColor: '#EAF6EE',
    borderColor: '#76AA87',
  },

  resultDanger: {
    backgroundColor: '#FCEEEE',
    borderColor: '#D29A9A',
  },

  resultWarningBox: {
    backgroundColor: '#FFF7E6',
    borderColor: '#D6B66B',
  },

  resultNeutral: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D8DEE7',
  },

  resultLabel: {
    color: '#697789',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  resultTitle: {
    color: '#0B2447',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 5,
    marginBottom: 12,
  },

  resultText: {
    color: '#42566D',
    fontSize: 13,
    lineHeight: 21,
  },

  resultWarningText: {
    color: '#7B5A12',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 10,
  },

  descriptionInput: {
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#FFFFFF',
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

  photoCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#E5C77F',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  photoRequirementText: {
    color: '#7B5A12',
    fontSize: 11,
    flex: 1,
  },

  photoReadyBox: {
    backgroundColor: '#EAF6EE',
    borderWidth: 1,
    borderColor: '#76AA87',
    borderRadius: 11,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  photoReadyText: {
    color: '#357A4F',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  // ==========================================================
  // NOVO LAYOUT DOS BOTÕES DE FOTO
  // ==========================================================

  photoButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 2,
    marginBottom: 18,
  },

  photoButton: {
    flex: 1,
    minHeight: 80,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
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
    backgroundColor: '#EAF0F6',
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

  // ==========================================================

  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 5,
  },

  photoPreviewContainer: {
    width: 120,
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E9EEF4',
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
      'rgba(11,36,71,0.85)',
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
      'rgba(165,40,40,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButton: {
    height: 60,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
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

  buttonDisabled: {
    opacity: 0.65,
  },

  outWarrantyInfo: {
    color: '#697789',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 17,
    marginTop: 12,
  },

  warningBox: {
    backgroundColor: '#FFF7E6',
    borderRadius: 14,
    padding: 16,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#E5C77F',
  },

  warningTitle: {
    color: '#7B5A12',
    fontSize: 14,
    fontWeight: '700',
  },

  warningText: {
    color: '#856B35',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },

  errorBox: {
    backgroundColor: '#FCEEEE',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D29A9A',
    marginBottom: 15,
  },

  errorText: {
    color: '#9A3232',
    fontSize: 13,
  },

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8DEE7',
  },

  emptyText: {
    color: '#697789',
    textAlign: 'center',
    fontSize: 13,
  },

  inlineLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 25,
  },

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

  footer: {
    color: '#8995A5',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 45,
  },

  successPage: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  successContent: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
  },

  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#EAF6EE',
    borderWidth: 2,
    borderColor: '#76AA87',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 25,
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D8DEE7',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    marginTop: 30,
  },

  protocolLabel: {
    color: '#8995A5',
    fontSize: 11,
    fontWeight: '700',
  },

  protocolNumber: {
    color: '#0B2447',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 8,
  },

  protocolStatus: {
    color: '#557087',
    fontSize: 12,
    marginTop: 10,
  },

  photoSuccessCard: {
    width: '100%',
    backgroundColor: '#EAF6EE',
    borderRadius: 14,
    padding: 15,
    marginTop: 15,
    flexDirection: 'row',
    alignItems: 'center',
  },

  photoSuccessIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#DDF0E3',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  photoSuccessTitle: {
    color: '#557087',
    fontSize: 11,
  },

  photoSuccessNumber: {
    color: '#357A4F',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },

  photoWarningBox: {
    width: '100%',
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#E5C77F',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },

  photoWarningText: {
    color: '#7B5A12',
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
  },

  protocolInfo: {
    color: '#697789',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 15,
    lineHeight: 18,
  },

  primaryButton: {
    width: '100%',
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
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
});