

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

  form03_pendente_assinatura?: boolean;
  form03_assinado?: boolean;

};



type FiltroStatus =

  | 'todos'

  | 'aberta'

  | 'em_analise'

  | 'vistoria'

  | 'execucao'

  | 'finalizadas';



type ImovelCliente = {

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



type GarantiaCliente = {

  unidade_id: string;

  empreendimento: string;

  unidade: string;

  modelo_garantia: string;

  item_garantia_id: string;

  categoria: string;

  elemento_construtivo: string;

  manifestacao_patologica: string | null;

  tipo_prazo: string;

  prazo_quantidade: number | null;

  prazo_unidade: string | null;

  regra_data_base: string;

  data_base: string | null;

  data_limite_garantia: string | null;

  status_garantia: string;

  dias_restantes: number | null;

  aviso: string | null;

  observacao: string | null;

};



function formatarData(data: string | null | undefined) {

  if (!data) return 'Não informada';



  const somenteData = data.substring(0, 10);

  const partes = somenteData.split('-');



  if (partes.length === 3) {

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

  }



  return data;

}



function formatarDataHora(dataIso: string) {

  if (!dataIso) return '';



  const data = new Date(dataIso);



  if (Number.isNaN(data.getTime())) return dataIso;



  return data.toLocaleString('pt-BR', {

    day: '2-digit',

    month: '2-digit',

    year: 'numeric',

    hour: '2-digit',

    minute: '2-digit',

  });

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

    case 'encerrada_ausencia':

      return 'Encerrada por ausência';

    default:

      return status;

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

    case 'encerrada_ausencia':

      return styles.statusDanger;

    default:

      return styles.statusNeutral;

  }

}



function textoStatusGarantia(status: string) {

  switch (status) {

    case 'dentro_da_garantia':

      return 'Prazo vigente';

    case 'fora_da_garantia':

      return 'Prazo encerrado';

    case 'ato_da_entrega':

      return 'No ato da entrega';

    case 'dados_insuficientes':

      return 'Data pendente';

    case 'nao_se_aplica':

      return 'Não se aplica';

    default:

      return 'A verificar';

  }

}



function corStatusGarantia(status: string) {

  switch (status) {

    case 'dentro_da_garantia':

      return '#287A46';

    case 'fora_da_garantia':

      return '#A52828';

    case 'ato_da_entrega':

      return '#0B5EA8';

    default:

      return '#9A6A15';

  }

}



function descricaoPrazo(item: GarantiaCliente) {

  if (item.tipo_prazo === 'ato_entrega') {

    return 'No ato da entrega';

  }



  if (

    item.prazo_quantidade == null ||

    !item.prazo_unidade

  ) {

    return 'Prazo não informado';

  }



  return `${item.prazo_quantidade} ${item.prazo_unidade}`;

}



function nomeDataBase(regra: string) {

  switch (regra) {

    case 'habite_se':

      return 'Habite-se';

    case 'entrega_chaves':

      return 'Entrega das chaves';

    case 'entrega_obra':

      return 'Entrega da obra';

    case 'primeiro_habite_se_ou_entrega_obra':

      return 'Primeira data entre Habite-se e entrega da obra';

    case 'entrega_chaves_e_contrato':

      return 'Entrega das chaves e assinatura do contrato';

    case 'conclusao_servico':

      return 'Conclusão do serviço';

    case 'ato_entrega':

      return 'Ato da entrega';

    default:

      return regra;

  }

}



export default function DashboardClienteScreen() {

  const [solicitacoes, setSolicitacoes] =

    useState<Solicitacao[]>([]);

  const [imoveis, setImoveis] =

    useState<ImovelCliente[]>([]);

  const [garantias, setGarantias] =

    useState<GarantiaCliente[]>([]);



  const [carregando, setCarregando] = useState(true);

  const [atualizando, setAtualizando] = useState(false);

  const [erro, setErro] = useState('');

  const [erroGarantias, setErroGarantias] = useState('');



  const [busca, setBusca] = useState('');

  const [filtroStatus, setFiltroStatus] =

    useState<FiltroStatus>('todos');



  const [mostrarImoveis, setMostrarImoveis] =

    useState(false);

  const [unidadeAbertaId, setUnidadeAbertaId] =

    useState<string | null>(null);

  const [buscaGarantia, setBuscaGarantia] = useState('');

  const [mostrarTodosItens, setMostrarTodosItens] =

    useState(false);



  const carregarTudo = useCallback(

    async (recarregando = false) => {

      try {

        if (recarregando) {

          setAtualizando(true);

        } else {

          setCarregando(true);

        }



        setErro('');

        setErroGarantias('');



        const [

          resultadoSolicitacoes,

          resultadoImoveis,

          resultadoGarantias,

        ] = await Promise.all([

          supabase.rpc('listar_minhas_solicitacoes'),

          supabase.rpc('listar_minhas_unidades'),

          supabase.rpc('listar_minhas_garantias_cliente'),

        ]);



        if (resultadoSolicitacoes.error) {

          console.error(

            'Erro ao carregar solicitações:',

            resultadoSolicitacoes.error

          );



          setErro(

            'Não foi possível carregar suas solicitações.'

          );

        } else {

          const listaBase =
            (resultadoSolicitacoes.data ?? []) as Solicitacao[];

          const listaComForm03 = await Promise.all(
            listaBase.map(async (solicitacao) => {
              try {
                const { data: form03Data, error: form03Error } =
                  await supabase.rpc('buscar_form03_cliente', {
                    p_solicitacao_id: solicitacao.solicitacao_id,
                  });

                if (form03Error || !form03Data?.length) {
                  return {
                    ...solicitacao,
                    form03_pendente_assinatura: false,
                    form03_assinado: false,
                  };
                }

                const form03 = form03Data[0] as {
                  modo_assinatura: 'manual_app' | 'externa_pdf' | null;
                  status: string;
                  assinatura_cliente_ok: boolean;
                  assinatura_funcionario_ok: boolean;
                };

                return {
                  ...solicitacao,
                  form03_pendente_assinatura:
                    form03.modo_assinatura === 'manual_app' &&
                    form03.assinatura_funcionario_ok === true &&
                    form03.assinatura_cliente_ok !== true,
                  form03_assinado:
                    form03.status === 'assinado' ||
                    (form03.assinatura_cliente_ok === true &&
                      form03.assinatura_funcionario_ok === true),
                };
              } catch (error) {
                console.error('Erro ao verificar FORM 03:', error);
                return {
                  ...solicitacao,
                  form03_pendente_assinatura: false,
                  form03_assinado: false,
                };
              }
            })
          );

          setSolicitacoes(listaComForm03);

        }



        if (resultadoImoveis.error) {

          console.error(

            'Erro ao carregar imóveis:',

            resultadoImoveis.error

          );



          setErroGarantias(

            'Não foi possível carregar seus imóveis.'

          );

        } else {

          setImoveis(

            (resultadoImoveis.data ?? []) as ImovelCliente[]

          );

        }



        if (resultadoGarantias.error) {

          console.error(

            'Erro ao carregar garantias:',

            resultadoGarantias.error

          );



          setErroGarantias(

            'Não foi possível carregar os itens de garantia.'

          );

        } else {

          setGarantias(

            (resultadoGarantias.data ?? []) as GarantiaCliente[]

          );

        }

      } catch (error) {

        console.error(error);



        setErro(

          'Ocorreu um erro ao carregar suas solicitações.'

        );



        setErroGarantias(

          'Ocorreu um erro ao carregar seus imóveis e garantias.'

        );

      } finally {

        setCarregando(false);

        setAtualizando(false);

      }

    },

    []

  );



  useEffect(() => {

    void carregarTudo(false);

  }, [carregarTudo]);



  async function sair() {

    await supabase.auth.signOut();

    router.replace('/login-cliente');

  }



  const solicitacoesFiltradas = useMemo(() => {

    const termo = busca.trim().toLowerCase();



    return solicitacoes.filter((solicitacao) => {

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

        correspondeStatus = solicitacao.status === 'aberta';

      }



      if (filtroStatus === 'em_analise') {

        correspondeStatus =

          solicitacao.status === 'em_analise';

      }



      if (filtroStatus === 'vistoria') {

        correspondeStatus = [

          'vistoria_agendada',

          'em_vistoria',

        ].includes(solicitacao.status);

      }



      if (filtroStatus === 'execucao') {

        correspondeStatus = [

          'aprovada',

          'em_execucao',

        ].includes(solicitacao.status);

      }



      if (filtroStatus === 'finalizadas') {

        correspondeStatus =
          [
            'nao_aprovada',
            'cancelada',
            'encerrada_ausencia',
          ].includes(solicitacao.status) ||
          (
            solicitacao.status === 'concluida' &&
            solicitacao.form03_pendente_assinatura !== true
          );

      }



      return correspondeBusca && correspondeStatus;

    });

  }, [solicitacoes, busca, filtroStatus]);



  const pendenciasForm03 = useMemo(
    () =>
      solicitacoes.filter(
        (solicitacao) => solicitacao.form03_pendente_assinatura === true
      ),
    [solicitacoes]
  );

  function renderGarantias() {

    return (

      <View style={styles.garantiasArea}>

        <TouchableOpacity

          style={styles.garantiasCabecalho}

          activeOpacity={0.85}

          onPress={() => setMostrarImoveis(!mostrarImoveis)}

        >

          <View style={styles.garantiasIcone}>

            <Ionicons

              name="shield-checkmark-outline"

              size={24}

              color="#0B2447"

            />

          </View>



          <View style={{ flex: 1 }}>

            <Text style={styles.garantiasTitulo}>

              Meus imóveis e garantias

            </Text>

            <Text style={styles.garantiasSubtitulo}>

              {imoveis.length}{' '}

              {imoveis.length === 1

                ? 'imóvel vinculado'

                : 'imóveis vinculados'}

            </Text>

          </View>



          <Ionicons

            name={

              mostrarImoveis

                ? 'chevron-up'

                : 'chevron-down'

            }

            size={22}

            color="#0B2447"

          />

        </TouchableOpacity>



        {mostrarImoveis ? (

          <View style={styles.garantiasConteudo}>

            <Text style={styles.avisoGarantias}>

              Consulte os prazos registrados para seus imóveis.

              A cobertura de cada solicitação depende da análise

              técnica da equipe EMAFE.

            </Text>



            {erroGarantias ? (

              <View style={styles.errorBox}>

                <Text style={styles.errorText}>

                  {erroGarantias}

                </Text>



                <TouchableOpacity

                  onPress={() => carregarTudo(false)}

                >

                  <Text style={styles.retryText}>

                    Tentar novamente

                  </Text>

                </TouchableOpacity>

              </View>

            ) : null}



            {!carregando && imoveis.length === 0 ? (

              <View style={styles.emptyCard}>

                <Text style={styles.emptyTitle}>

                  Nenhum imóvel vinculado

                </Text>

                <Text style={styles.emptyText}>

                  Quando a EMAFE vincular uma unidade

                  ao seu cadastro, ela aparecerá aqui.

                </Text>

              </View>

            ) : null}



            {imoveis.map((imovel) => {

              const itensUnidade = garantias.filter(

                (item) =>

                  item.unidade_id === imovel.unidade_id

              );



              const aberta =

                unidadeAbertaId === imovel.unidade_id;



              const vigentes = itensUnidade.filter(

                (item) =>

                  item.status_garantia ===

                  'dentro_da_garantia'

              ).length;



              const encerrados = itensUnidade.filter(

                (item) =>

                  item.status_garantia ===

                  'fora_da_garantia'

              ).length;



              const termo = buscaGarantia

                .trim()

                .toLowerCase();



              const itensFiltrados = itensUnidade.filter(

                (item) => {

                  if (!termo) return true;



                  return [

                    item.categoria,

                    item.elemento_construtivo,

                    item.manifestacao_patologica,

                    item.observacao,

                  ]

                    .filter(Boolean)

                    .join(' ')

                    .toLowerCase()

                    .includes(termo);

                }

              );



              const itensExibidos = mostrarTodosItens

                ? itensFiltrados

                : itensFiltrados.slice(0, 20);



              return (

                <View

                  key={imovel.unidade_id}

                  style={styles.imovelCard}

                >

                  <TouchableOpacity

                    style={styles.imovelCabecalho}

                    onPress={() => {

                      setUnidadeAbertaId(

                        aberta ? null : imovel.unidade_id

                      );

                      setBuscaGarantia('');

                      setMostrarTodosItens(false);

                    }}

                  >

                    <Ionicons

                      name="home-outline"

                      size={23}

                      color="#0B2447"

                    />



                    <View style={{ flex: 1 }}>

                      <Text style={styles.propertyName}>

                        {imovel.empreendimento}

                      </Text>



                      <Text style={styles.propertyUnit}>

                        Unidade {imovel.unidade}

                      </Text>



                      <Text style={styles.modeloNome}>

                        {imovel.modelo_garantia ||

                          'Sem modelo de garantia vinculado'}

                      </Text>

                    </View>



                    <Ionicons

                      name={

                        aberta

                          ? 'chevron-up'

                          : 'chevron-down'

                      }

                      size={20}

                      color="#697789"

                    />

                  </TouchableOpacity>



                  {aberta ? (

                    <View style={styles.imovelDetalhes}>

                      <Text style={styles.subsectionTitle}>

                        Datas do imóvel

                      </Text>



                      <Text style={styles.dadoImovel}>

                        Habite-se:{' '}

                        {formatarData(imovel.data_habite_se)}

                      </Text>



                      <Text style={styles.dadoImovel}>

                        Entrega das chaves:{' '}

                        {formatarData(

                          imovel.data_entrega_chaves

                        )}

                      </Text>



                      <Text style={styles.dadoImovel}>

                        Entrega da obra:{' '}

                        {formatarData(

                          imovel.data_entrega_obra

                        )}

                      </Text>



                      <Text style={styles.dadoImovel}>

                        Assinatura do contrato:{' '}

                        {formatarData(

                          imovel.data_assinatura_contrato

                        )}

                      </Text>



                      <View style={styles.divider} />



                      <Text style={styles.subsectionTitle}>

                        Itens de garantia

                      </Text>



                      {!imovel.modelo_garantia_id ? (

                        <Text style={styles.emptyText}>

                          Esta unidade ainda não possui

                          modelo de garantia vinculado.

                        </Text>

                      ) : (

                        <>

                          <Text style={styles.garantiasResumo}>

                            {itensUnidade.length} itens •{' '}

                            {vigentes} com prazo vigente •{' '}

                            {encerrados} com prazo encerrado

                          </Text>



                          <TextInput

                            value={buscaGarantia}

                            onChangeText={(valor) => {

                              setBuscaGarantia(valor);

                              setMostrarTodosItens(false);

                            }}

                            placeholder="Buscar pintura, estrutura, instalações..."

                            placeholderTextColor="#8995A5"

                            style={styles.searchInput}

                          />



                          {itensFiltrados.length === 0 ? (

                            <Text style={styles.emptyText}>

                              {termo

                                ? 'Nenhum item corresponde à busca.'

                                : 'Nenhum item de garantia encontrado.'}

                            </Text>

                          ) : (

                            itensExibidos.map((item) => (

                              <View

                                key={item.item_garantia_id}

                                style={styles.itemGarantia}

                              >

                                <Text style={styles.itemCategoria}>

                                  {item.categoria}

                                </Text>



                                <Text style={styles.itemElemento}>

                                  {item.elemento_construtivo}

                                </Text>



                                {item.manifestacao_patologica ? (

                                  <Text style={styles.itemDescricao}>

                                    {item.manifestacao_patologica}

                                  </Text>

                                ) : null}



                                <Text style={styles.itemPrazo}>

                                  Prazo: {descricaoPrazo(item)}

                                </Text>



                                <Text style={styles.itemDado}>

                                  Referência:{' '}

                                  {nomeDataBase(

                                    item.regra_data_base

                                  )}

                                </Text>



                                {item.data_base ? (

                                  <Text style={styles.itemDado}>

                                    Início:{' '}

                                    {formatarData(item.data_base)}

                                  </Text>

                                ) : null}



                                {item.data_limite_garantia &&

                                item.tipo_prazo !== 'ato_entrega' ? (

                                  <Text style={styles.itemDado}>

                                    Data-limite:{' '}

                                    {formatarData(

                                      item.data_limite_garantia

                                    )}

                                  </Text>

                                ) : null}



                                <Text

                                  style={[

                                    styles.itemSituacao,

                                    {

                                      color: corStatusGarantia(

                                        item.status_garantia

                                      ),

                                    },

                                  ]}

                                >

                                  {textoStatusGarantia(

                                    item.status_garantia

                                  )}

                                </Text>



                                {item.aviso ? (

                                  <Text style={styles.itemObservacao}>

                                    {item.aviso}

                                  </Text>

                                ) : null}



                                {item.observacao ? (

                                  <Text style={styles.itemObservacao}>

                                    {item.observacao}

                                  </Text>

                                ) : null}

                              </View>

                            ))

                          )}



                          {!mostrarTodosItens &&

                          itensFiltrados.length > 20 ? (

                            <TouchableOpacity

                              style={styles.detailsButton}

                              onPress={() =>

                                setMostrarTodosItens(true)

                              }

                            >

                              <Text

                                style={styles.detailsButtonText}

                              >

                                Mostrar todos os{' '}

                                {itensFiltrados.length} itens

                              </Text>

                            </TouchableOpacity>

                          ) : null}



                          {mostrarTodosItens &&

                          itensFiltrados.length > 20 ? (

                            <TouchableOpacity

                              style={styles.detailsButton}

                              onPress={() =>

                                setMostrarTodosItens(false)

                              }

                            >

                              <Text

                                style={styles.detailsButtonText}

                              >

                                Mostrar menos

                              </Text>

                            </TouchableOpacity>

                          ) : null}

                        </>

                      )}

                    </View>

                  ) : null}

                </View>

              );

            })}

          </View>

        ) : null}

      </View>

    );

  }



  return (

    <SafeAreaView style={styles.container}>

      <StatusBar style="dark" />



      <ScrollView

        contentContainerStyle={styles.scrollContent}

        showsVerticalScrollIndicator={false}

        keyboardShouldPersistTaps="handled"

        refreshControl={

          <RefreshControl

            refreshing={atualizando}

            onRefresh={() => carregarTudo(true)}

          />

        }

      >

        <View style={styles.content}>

          <Image

            source={require(

              '../../assets/emafe/logo-horizontal-transparente.png'

            )}

            style={styles.logo}

            resizeMode="contain"

          />



          <Text style={styles.title}>

            Área do Cliente

          </Text>



          <Text style={styles.subtitle}>

            Acompanhe suas solicitações de manutenção

            e consulte as garantias dos seus imóveis.

          </Text>



          <TouchableOpacity

            style={styles.newButton}

            activeOpacity={0.85}

            onPress={() => router.push('/nova-solicitacao')}

          >

            <Text style={styles.newButtonText}>

              + Nova solicitação

            </Text>

          </TouchableOpacity>



          {renderGarantias()}



          <View style={styles.searchArea}>

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

              showsHorizontalScrollIndicator={false}

              contentContainerStyle={styles.filtersContainer}

            >

              {[

                { id: 'todos', texto: 'Todos' },

                { id: 'aberta', texto: 'Abertas' },

                { id: 'em_analise', texto: 'Em análise' },

                { id: 'vistoria', texto: 'Vistoria' },

                { id: 'execucao', texto: 'Execução' },

                { id: 'finalizadas', texto: 'Finalizadas' },

              ].map((filtro) => {

                const selecionado =

                  filtroStatus === filtro.id;



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



          {pendenciasForm03.length > 0 ? (
            <View style={styles.form03PendingBanner}>
              <Ionicons name="create-outline" size={23} color="#9A6A00" />
              <View style={{ flex: 1 }}>
                <Text style={styles.form03PendingBannerTitle}>
                  Assinatura do FORM 03 pendente
                </Text>
                <Text style={styles.form03PendingBannerText}>
                  {pendenciasForm03.length === 1
                    ? 'Existe 1 FORM 03 aguardando sua assinatura.'
                    : `Existem ${pendenciasForm03.length} FORM 03 aguardando sua assinatura.`}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.form03PendingBannerButton}
                onPress={() => {
                  const primeira = pendenciasForm03[0];
                  if (!primeira) return;
                  router.push({
                    pathname: '/detalhes-solicitacao',
                    params: { solicitacaoId: primeira.solicitacao_id },
                  });
                }}
              >
                <Text style={styles.form03PendingBannerButtonText}>Ver</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>

              Minhas solicitações

            </Text>



            {!carregando ? (

              <Text style={styles.totalText}>

                {solicitacoesFiltradas.length}{' '}

                {solicitacoesFiltradas.length === 1

                  ? 'solicitação'

                  : 'solicitações'}

              </Text>

            ) : null}

          </View>



          {erro ? (

            <View style={styles.errorBox}>

              <Text style={styles.errorText}>

                {erro}

              </Text>



              <TouchableOpacity

                onPress={() => carregarTudo(false)}

              >

                <Text style={styles.retryText}>

                  Tentar novamente

                </Text>

              </TouchableOpacity>

            </View>

          ) : null}



          {carregando ? (

            <View style={styles.loadingContainer}>

              <ActivityIndicator

                size="large"

                color="#0B2447"

              />

              <Text style={styles.loadingText}>

                Carregando informações...

              </Text>

            </View>

          ) : null}



          {!carregando &&

          !erro &&

          solicitacoes.length === 0 ? (

            <View style={styles.emptyCard}>

              <Text style={styles.emptyTitle}>

                Nenhuma solicitação

              </Text>

              <Text style={styles.emptyText}>

                Quando você abrir uma solicitação de

                manutenção, ela aparecerá aqui.

              </Text>

            </View>

          ) : null}



          {!carregando &&

          !erro &&

          solicitacoes.length > 0 &&

          solicitacoesFiltradas.length === 0 ? (

            <View style={styles.emptyCard}>

              <Text style={styles.emptyTitle}>

                Nenhum resultado encontrado

              </Text>

              <Text style={styles.emptyText}>

                Tente pesquisar outro termo ou selecionar

                outro filtro.

              </Text>

            </View>

          ) : null}



          {!carregando &&

            solicitacoesFiltradas.map((solicitacao) => (

              <View

                key={solicitacao.solicitacao_id}

                style={styles.requestCard}

              >

                <View style={styles.requestHeader}>

                  <View style={styles.protocolArea}>

                    <Text style={styles.protocolLabel}>

                      PROTOCOLO

                    </Text>



                    <Text style={styles.protocolText}>

                      {solicitacao.protocolo}

                    </Text>

                  </View>



                  <View

                    style={[

                      styles.statusBadge,

                      solicitacao.form03_pendente_assinatura
                        ? styles.statusSignaturePending
                        : estiloStatus(solicitacao.status),

                    ]}

                  >

                    <Text
                      style={[
                        styles.statusText,
                        solicitacao.form03_pendente_assinatura &&
                          styles.statusSignaturePendingText,
                      ]}
                    >

                      {solicitacao.form03_pendente_assinatura
                        ? 'Aguardando assinatura'
                        : textoStatus(solicitacao.status)}

                    </Text>

                  </View>

                </View>



                <View style={styles.propertyBox}>

                  <Text style={styles.propertyName}>

                    {solicitacao.empreendimento}

                  </Text>



                  <Text style={styles.propertyUnit}>

                    Unidade {solicitacao.unidade}

                  </Text>

                </View>



                <View style={styles.descriptionBox}>

                  <Text style={styles.descriptionLabel}>

                    PROBLEMA RELATADO

                  </Text>



                  <Text

                    style={styles.descriptionText}

                    numberOfLines={3}

                  >

                    {solicitacao.descricao_problema}

                  </Text>

                </View>



                {solicitacao.status === 'aberta' ? (

                  <View style={styles.analysisBox}>

                    <Text style={styles.analysisText}>

                      Aguardando análise da equipe EMAFE

                    </Text>

                  </View>

                ) : null}



                {solicitacao.form03_pendente_assinatura ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.form03PendingCard}
                    onPress={() =>
                      router.push({
                        pathname: '/detalhes-solicitacao',
                        params: { solicitacaoId: solicitacao.solicitacao_id },
                      })
                    }
                  >
                    <Ionicons name="alert-circle-outline" size={20} color="#9A6A00" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.form03PendingCardTitle}>Assinatura pendente</Text>
                      <Text style={styles.form03PendingCardText}>
                        O FORM 03 já foi assinado pela EMAFE e aguarda sua assinatura.
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#9A6A00" />
                  </TouchableOpacity>
                ) : null}

                <View style={styles.divider} />



                <Text style={styles.dateText}>

                  Aberta em{' '}

                  {formatarDataHora(solicitacao.created_at)}

                </Text>



                <TouchableOpacity

                  style={styles.detailsButton}

                  activeOpacity={0.85}

                  onPress={() =>

                    router.push({

                      pathname: '/detalhes-solicitacao',

                      params: {

                        solicitacaoId:

                          solicitacao.solicitacao_id,

                      },

                    })

                  }

                >

                  <Text style={styles.detailsButtonText}>

                    Acompanhar solicitação

                  </Text>

                </TouchableOpacity>

              </View>

            ))}



          <TouchableOpacity

            style={styles.logoutButton}

            onPress={sair}

          >

            <Text style={styles.logoutText}>

              Sair

            </Text>

          </TouchableOpacity>



          <Text style={styles.footer}>

            EMAFE Engenharia • Manutenção

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

    marginBottom: 24,

  },

  newButtonText: {

    color: '#FFFFFF',

    fontSize: 16,

    fontWeight: '700',

  },

  garantiasArea: {

    marginBottom: 28,

    backgroundColor: '#FFFFFF',

    borderRadius: 16,

    borderWidth: 1,

    borderColor: '#B8C9DA',

    overflow: 'hidden',

  },

  garantiasCabecalho: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 12,

    padding: 17,

  },

  garantiasIcone: {

    width: 44,

    height: 44,

    borderRadius: 12,

    backgroundColor: '#EAF0F6',

    alignItems: 'center',

    justifyContent: 'center',

  },

  garantiasTitulo: {

    color: '#0B2447',

    fontSize: 16,

    fontWeight: '800',

  },

  garantiasSubtitulo: {

    color: '#697789',

    fontSize: 11,

    marginTop: 5,

  },

  garantiasConteudo: {

    borderTopWidth: 1,

    borderTopColor: '#E5EAF0',

    padding: 14,

  },

  avisoGarantias: {

    color: '#42566D',

    fontSize: 11,

    lineHeight: 18,

    backgroundColor: '#EAF0F6',

    borderRadius: 10,

    padding: 12,

    marginBottom: 14,

  },

  imovelCard: {

    borderWidth: 1,

    borderColor: '#D8DEE7',

    borderRadius: 12,

    marginBottom: 12,

    overflow: 'hidden',

  },

  imovelCabecalho: {

    padding: 13,

    flexDirection: 'row',

    alignItems: 'center',

    gap: 10,

  },

  imovelDetalhes: {

    padding: 14,

    borderTopWidth: 1,

    borderTopColor: '#E5EAF0',

    backgroundColor: '#FAFBFC',

  },

  modeloNome: {

    color: '#0B5EA8',

    fontSize: 11,

    fontWeight: '700',

    marginTop: 6,

  },

  subsectionTitle: {

    color: '#0B2447',

    fontSize: 14,

    fontWeight: '800',

    marginBottom: 10,

  },

  dadoImovel: {

    color: '#42566D',

    fontSize: 11,

    lineHeight: 21,

  },

  garantiasResumo: {

    color: '#697789',

    fontSize: 11,

    lineHeight: 18,

    marginBottom: 13,

  },

  itemGarantia: {

    backgroundColor: '#FFFFFF',

    borderWidth: 1,

    borderColor: '#E0E6EE',

    borderRadius: 11,

    padding: 13,

    marginTop: 10,

  },

  itemCategoria: {

    color: '#8995A5',

    fontSize: 10,

    fontWeight: '800',

    marginBottom: 5,

  },

  itemElemento: {

    color: '#0B2447',

    fontSize: 13,

    fontWeight: '800',

  },

  itemDescricao: {

    color: '#42566D',

    fontSize: 11,

    lineHeight: 18,

    marginTop: 6,

  },

  itemPrazo: {

    color: '#0B5EA8',

    fontSize: 12,

    fontWeight: '800',

    marginTop: 10,

  },

  itemDado: {

    color: '#697789',

    fontSize: 11,

    lineHeight: 19,

    marginTop: 3,

  },

  itemSituacao: {

    fontSize: 12,

    fontWeight: '800',

    marginTop: 9,

  },

  itemObservacao: {

    color: '#697789',

    fontSize: 11,

    lineHeight: 17,

    marginTop: 7,

  },

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

  statusSignaturePending: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#E1B94A',
  },

  statusSignaturePendingText: {
    color: '#8A6200',
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

  analysisBox: {

    alignSelf: 'flex-start',

    marginTop: 13,

    backgroundColor: '#EAF0F6',

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

    backgroundColor: '#E5EAF0',

    marginTop: 16,

    marginBottom: 12,

  },

  dateText: {

    color: '#8995A5',

    fontSize: 10,

  },

  detailsButton: {

    minHeight: 45,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: '#0B2447',

    alignItems: 'center',

    justifyContent: 'center',

    marginTop: 15,

    paddingHorizontal: 10,

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

  form03PendingBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#E6C46A',
    borderRadius: 14, padding: 14, marginBottom: 18,
  },
  form03PendingBannerTitle: { color: '#765000', fontSize: 13, fontWeight: '800' },
  form03PendingBannerText: { color: '#8A691A', fontSize: 11, lineHeight: 17, marginTop: 3 },
  form03PendingBannerButton: { minHeight: 36, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#9A6A00', alignItems: 'center', justifyContent: 'center' },
  form03PendingBannerButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  form03PendingCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E7', borderWidth: 1, borderColor: '#E6C46A', borderRadius: 12, padding: 12, marginTop: 14 },
  form03PendingCardTitle: { color: '#765000', fontSize: 11, fontWeight: '800' },
  form03PendingCardText: { color: '#8A691A', fontSize: 10, lineHeight: 15, marginTop: 2 },

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
