import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import { router } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';

import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

import { supabase } from '../lib/supabase';

type LinhaCategoria = {
  categoria: string;
  quantidade: number;
};

type LinhaCriticidade = {
  criticidade: string;
  quantidade: number;
};

type LinhaStatus = {
  status: string;
  quantidade: number;
};

type LinhaCliente = {
  cliente: string;
  quantidade: number;
};

type Relatorio = {
  periodo_inicio: string;
  periodo_fim: string;
  abertas: number;
  finalizadas: number;
  tempo_medio_resolucao_horas: number | null;
  por_categoria: LinhaCategoria[];
  por_criticidade: LinhaCriticidade[];
  por_status: LinhaStatus[];
  por_cliente: LinhaCliente[];
  satisfacao_configurada: boolean;
  nota_media_satisfacao: number | null;
  quantidade_avaliacoes: number;
  prazo_limite_configurado: boolean;
  prazo_limite_dias: number | null;
  os_prazo_excedido: number | null;
};

function dataParaBR(dataIso: string) {
  if (!dataIso) return '';
  const [ano, mes, dia] = dataIso.split('-');
  return `${dia}/${mes}/${ano}`;
}

function brParaIso(valor: string) {
  const limpo = valor.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(limpo)) {
    return limpo;
  }

  const match = limpo.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

  if (!match) return null;

  const [, dia, mes, ano] = match;
  const data = new Date(
    Number(ano),
    Number(mes) - 1,
    Number(dia)
  );

  if (
    data.getFullYear() !== Number(ano) ||
    data.getMonth() !== Number(mes) - 1 ||
    data.getDate() !== Number(dia)
  ) {
    return null;
  }

  return `${ano}-${mes}-${dia}`;
}

function formatarTempo(horas: number | null) {
  if (horas === null || Number.isNaN(horas)) return '—';

  if (horas < 24) {
    return `${horas.toFixed(1)} h`;
  }

  return `${(horas / 24).toFixed(1)} dias`;
}

export default function RelatoriosFuncionarioScreen() {
  const hoje = new Date();

  const inicioMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    1
  );

  const fimMes = new Date(
    hoje.getFullYear(),
    hoje.getMonth() + 1,
    0
  );

  const isoLocal = (data: Date) =>
    `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(
      data.getDate()
    ).padStart(2, '0')}`;

  const [inicio, setInicio] = useState(dataParaBR(isoLocal(inicioMes)));
  const [fim, setFim] = useState(dataParaBR(isoLocal(fimMes)));
  const [prazoLimiteDias, setPrazoLimiteDias] = useState('');

  const [dados, setDados] = useState<Relatorio | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [erro, setErro] = useState('');

  const totalCategoria = useMemo(
    () =>
      dados?.por_categoria.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ) ?? 0,
    [dados]
  );

  const totalCriticidade = useMemo(
    () =>
      dados?.por_criticidade.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ) ?? 0,
    [dados]
  );

  const totalStatus = useMemo(
    () =>
      dados?.por_status.reduce(
        (soma, item) => soma + item.quantidade,
        0
      ) ?? 0,
    [dados]
  );

  async function carregarRelatorio() {
    const inicioIso = brParaIso(inicio);
    const fimIso = brParaIso(fim);

    if (!inicioIso || !fimIso) {
      setErro('Informe as datas no formato DD/MM/AAAA.');
      return;
    }

    if (inicioIso > fimIso) {
      setErro('A data inicial não pode ser maior que a data final.');
      return;
    }

    const prazoNumero =
      prazoLimiteDias.trim() === ''
        ? null
        : Number(prazoLimiteDias);

    if (
      prazoNumero !== null &&
      (!Number.isInteger(prazoNumero) || prazoNumero <= 0)
    ) {
      setErro(
        'O prazo limite deve ser informado em dias inteiros e maior que zero.'
      );
      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const { data, error } = await supabase.rpc(
        'relatorio_os_funcionario',
        {
          p_inicio: inicioIso,
          p_fim: fimIso,
          p_prazo_limite_dias: prazoNumero,
        }
      );

      if (error) {
        console.error('Erro ao carregar relatório:', error);
        setErro(
          error.message ||
            'Não foi possível carregar os relatórios.'
        );
        return;
      }

      setDados(data as Relatorio);
    } catch (error) {
      console.error(error);
      setErro('Ocorreu um erro ao carregar os relatórios.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarRelatorio();
  }, []);

  function Barra({
    valor,
    total,
  }: {
    valor: number;
    total: number;
  }) {
    const percentual =
      total > 0
        ? Math.max(3, Math.min(100, (valor / total) * 100))
        : 0;

    return (
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            { width: `${percentual}%` },
          ]}
        />
      </View>
    );
  }


  function escaparHtml(valor: unknown) {
    return String(valor ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function linhasTabela(
    linhas: Array<Record<string, string | number>>,
    colunas: Array<{ chave: string; titulo: string }>
  ) {
    if (!linhas.length) {
      return `<tr><td colspan="${colunas.length}" class="vazio">Nenhum registro no período.</td></tr>`;
    }

    return linhas
      .map(
        (linha) => `
          <tr>
            ${colunas
              .map(
                (coluna) =>
                  `<td>${escaparHtml(linha[coluna.chave])}</td>`
              )
              .join('')}
          </tr>
        `
      )
      .join('');
  }

  function montarHtmlRelatorio(d: Relatorio) {
    const periodo = `${dataParaBR(d.periodo_inicio)} a ${dataParaBR(
      d.periodo_fim
    )}`;

    const categorias = d.por_categoria.map((item) => ({
      categoria: item.categoria,
      quantidade: item.quantidade,
    }));

    const criticidades = d.por_criticidade.map((item) => ({
      criticidade: item.criticidade,
      quantidade: item.quantidade,
    }));

    const status = d.por_status.map((item) => ({
      status: item.status,
      quantidade: item.quantidade,
    }));

    const clientes = d.por_cliente.map((item) => ({
      cliente: item.cliente,
      quantidade: item.quantidade,
    }));

    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Relatório de OS - EMAFE</title>
<style>
  @page { size: A4; margin: 14mm; }
  * { box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    color: #24364B;
    margin: 0;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.45;
  }
  .header {
    border-bottom: 3px solid #0B2447;
    padding-bottom: 12px;
    margin-bottom: 18px;
  }
  .brand {
    color: #0B2447;
    font-weight: 800;
    font-size: 17px;
    letter-spacing: 0.5px;
  }
  h1 {
    color: #0B2447;
    font-size: 23px;
    margin: 8px 0 3px;
  }
  .sub {
    color: #697789;
    font-size: 11px;
  }
  .periodo {
    margin-top: 7px;
    font-weight: 700;
  }
  .kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 9px;
    margin-bottom: 18px;
  }
  .kpi {
    border: 1px solid #D8DEE7;
    border-radius: 8px;
    padding: 10px;
    background: #F8FAFC;
  }
  .kpi .num {
    color: #0B2447;
    font-size: 20px;
    font-weight: 800;
  }
  .kpi .rotulo {
    color: #697789;
    margin-top: 3px;
  }
  h2 {
    color: #0B2447;
    font-size: 15px;
    margin: 20px 0 8px;
    page-break-after: avoid;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 13px;
    page-break-inside: auto;
  }
  th {
    background: #EAF0F6;
    color: #0B2447;
    text-align: left;
    padding: 7px;
    border: 1px solid #D8DEE7;
    font-size: 10px;
  }
  td {
    padding: 7px;
    border: 1px solid #E4E9EF;
    vertical-align: top;
  }
  tr { page-break-inside: avoid; }
  .vazio {
    color: #8995A5;
    text-align: center;
  }
  .pendente {
    background: #FFF6DD;
    border: 1px solid #E9CC77;
    border-radius: 8px;
    padding: 10px;
    margin-top: 8px;
  }
  .footer {
    margin-top: 24px;
    padding-top: 10px;
    border-top: 1px solid #D8DEE7;
    color: #8995A5;
    font-size: 9px;
  }
</style>
</head>
<body>
  <div class="header">
    <div class="brand">EMAFE ENGENHARIA</div>
    <h1>Relatório de Ordens de Serviço</h1>
    <div class="sub">Relatório gerado pela Área do Funcionário</div>
    <div class="periodo">Período: ${escaparHtml(periodo)}</div>
  </div>

  <div class="kpis">
    <div class="kpi">
      <div class="num">${d.abertas}</div>
      <div class="rotulo">OS abertas no período</div>
    </div>
    <div class="kpi">
      <div class="num">${d.finalizadas}</div>
      <div class="rotulo">OS finalizadas no período</div>
    </div>
    <div class="kpi">
      <div class="num">${escaparHtml(
        formatarTempo(d.tempo_medio_resolucao_horas)
      )}</div>
      <div class="rotulo">Tempo médio de resolução</div>
    </div>
    <div class="kpi">
      <div class="num">${
        d.nota_media_satisfacao !== null
          ? `${Number(d.nota_media_satisfacao).toFixed(2)} / 5`
          : 'Sem avaliações'
      }</div>
      <div class="rotulo">Satisfação média (${d.quantidade_avaliacoes} avaliações)</div>
    </div>
    <div class="kpi">
      <div class="num">${
        d.prazo_limite_configurado
          ? String(d.os_prazo_excedido ?? 0)
          : '—'
      }</div>
      <div class="rotulo">${
        d.prazo_limite_configurado
          ? `OS acima de ${d.prazo_limite_dias} dias`
          : 'Prazo limite não informado'
      }</div>
    </div>
  </div>

  <h2>Quantidade de OS por categoria</h2>
  <table>
    <thead><tr><th>Categoria</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${linhasTabela(categorias, [
        { chave: 'categoria', titulo: 'Categoria' },
        { chave: 'quantidade', titulo: 'Quantidade' },
      ])}
    </tbody>
  </table>

  <h2>Quantidade de OS por criticidade</h2>
  <table>
    <thead><tr><th>Criticidade</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${linhasTabela(criticidades, [
        { chave: 'criticidade', titulo: 'Criticidade' },
        { chave: 'quantidade', titulo: 'Quantidade' },
      ])}
    </tbody>
  </table>

  <h2>Quantidade de OS por status</h2>
  <table>
    <thead><tr><th>Status</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${linhasTabela(status, [
        { chave: 'status', titulo: 'Status' },
        { chave: 'quantidade', titulo: 'Quantidade' },
      ])}
    </tbody>
  </table>

  <h2>Quantidade de OS por cliente</h2>
  <table>
    <thead><tr><th>Cliente</th><th>Quantidade</th></tr></thead>
    <tbody>
      ${linhasTabela(clientes, [
        { chave: 'cliente', titulo: 'Cliente' },
        { chave: 'quantidade', titulo: 'Quantidade' },
      ])}
    </tbody>
  </table>

  <h2>Indicadores complementares</h2>
  <div class="pendente">
    <strong>Nota média de satisfação do cliente:</strong>
    ${
      d.nota_media_satisfacao !== null
        ? `${Number(d.nota_media_satisfacao).toFixed(2)} de 5, com ${d.quantidade_avaliacoes} avaliação(ões) no período.`
        : 'Nenhuma avaliação registrada para atendimentos finalizados no período.'
    }
  </div>
  <div class="pendente">
    <strong>Quantidade de OS que excederam o prazo limite do processo:</strong>
    ${
      d.prazo_limite_configurado
        ? `${d.os_prazo_excedido ?? 0} OS ultrapassaram o limite de ${d.prazo_limite_dias} dias.`
        : 'Prazo limite não informado para este relatório.'
    }
  </div>

  <div class="footer">
    EMAFE Engenharia - Relatório interno de Ordens de Serviço.
  </div>
</body>
</html>
    `;
  }

  async function gerarPdf() {
    if (!dados) {
      setErro('Carregue um período antes de gerar o PDF.');
      return;
    }

    try {
      setGerandoPdf(true);
      setErro('');

      const html = montarHtmlRelatorio(dados);

      if (Platform.OS === 'web') {
        const janela = window.open('', '_blank');

        if (!janela) {
          setErro(
            'O navegador bloqueou a janela do relatório. Permita pop-ups para este site e tente novamente.'
          );
          return;
        }

        janela.document.open();
        janela.document.write(html);
        janela.document.close();

        setTimeout(() => {
          janela.focus();
          janela.print();
        }, 350);

        return;
      }

      const arquivo = await Print.printToFileAsync({
        html,
        base64: false,
      });

      const podeCompartilhar =
        await Sharing.isAvailableAsync();

      if (podeCompartilhar) {
        await Sharing.shareAsync(arquivo.uri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Relatório de OS - EMAFE',
          UTI: 'com.adobe.pdf',
        });
      } else {
        await Print.printAsync({ html });
      }
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setErro('Não foi possível gerar o PDF do relatório.');
    } finally {
      setGerandoPdf(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() =>
              router.replace('/dashboard-funcionario')
            }
          >
            <Text style={styles.backText}>‹ Voltar ao painel</Text>
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={styles.headerText}>
              <Text style={styles.title}>
                Relatórios e indicadores
              </Text>

              <Text style={styles.subtitle}>
                Consulte os principais indicadores das ordens de serviço da EMAFE.
              </Text>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[
                  styles.pdfButton,
                  (!dados || gerandoPdf) && styles.pdfButtonDisabled,
                ]}
                onPress={gerarPdf}
                disabled={!dados || gerandoPdf}
              >
                {gerandoPdf ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                    size="small"
                  />
                ) : (
                  <Ionicons
                    name="document-text-outline"
                    size={19}
                    color="#FFFFFF"
                  />
                )}

                <Text style={styles.pdfButtonText}>
                  Gerar PDF
                </Text>
              </TouchableOpacity>

              <View style={styles.headerIcon}>
                <Ionicons
                  name="bar-chart-outline"
                  size={28}
                  color="#0B2447"
                />
              </View>
            </View>
          </View>

          <View style={styles.filterCard}>
            <Text style={styles.filterTitle}>Período do relatório</Text>

            <View style={styles.filterRow}>
              <View style={styles.field}>
                <Text style={styles.label}>Data inicial</Text>
                <TextInput
                  style={styles.input}
                  value={inicio}
                  onChangeText={setInicio}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#8995A5"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>Data final</Text>
                <TextInput
                  style={styles.input}
                  value={fim}
                  onChangeText={setFim}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#8995A5"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.label}>
                  Prazo limite do processo (dias)
                </Text>
                <TextInput
                  style={styles.input}
                  value={prazoLimiteDias}
                  onChangeText={setPrazoLimiteDias}
                  placeholder="Ex.: 30"
                  placeholderTextColor="#8995A5"
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={carregarRelatorio}
                disabled={carregando}
              >
                {carregando ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="funnel-outline"
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.applyButtonText}>
                      Aplicar
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {erro ? (
            <View style={styles.errorBox}>
              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#A52828"
              />
              <Text style={styles.errorText}>{erro}</Text>
            </View>
          ) : null}

          {dados ? (
            <>
              <Text style={styles.sectionTitle}>
                Resumo do período
              </Text>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <View style={styles.kpiIcon}>
                    <Ionicons
                      name="add-circle-outline"
                      size={23}
                      color="#0B2447"
                    />
                  </View>
                  <Text style={styles.kpiNumber}>
                    {dados.abertas}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    OS abertas
                  </Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiIcon}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={23}
                      color="#0B2447"
                    />
                  </View>
                  <Text style={styles.kpiNumber}>
                    {dados.finalizadas}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    OS finalizadas
                  </Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiIcon}>
                    <Ionicons
                      name="time-outline"
                      size={23}
                      color="#0B2447"
                    />
                  </View>
                  <Text style={styles.kpiNumberSmall}>
                    {formatarTempo(
                      dados.tempo_medio_resolucao_horas
                    )}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    Tempo médio de resolução
                  </Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiIcon}>
                    <Ionicons
                      name="star-outline"
                      size={23}
                      color="#0B2447"
                    />
                  </View>
                  <Text style={styles.kpiNumberSmall}>
                    {dados.nota_media_satisfacao !== null
                      ? `${Number(
                          dados.nota_media_satisfacao
                        ).toFixed(2)} / 5`
                      : 'Sem avaliações'}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    Satisfação média
                    {dados.quantidade_avaliacoes > 0
                      ? ` • ${dados.quantidade_avaliacoes} ${
                          dados.quantidade_avaliacoes === 1
                            ? 'avaliação'
                            : 'avaliações'
                        }`
                      : ''}
                  </Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={styles.kpiIcon}>
                    <Ionicons
                      name="warning-outline"
                      size={23}
                      color="#0B2447"
                    />
                  </View>
                  <Text style={styles.kpiNumber}>
                    {dados.prazo_limite_configurado
                      ? dados.os_prazo_excedido ?? 0
                      : '—'}
                  </Text>
                  <Text style={styles.kpiLabel}>
                    {dados.prazo_limite_configurado
                      ? `OS acima de ${dados.prazo_limite_dias} dias`
                      : 'Informe o prazo limite acima'}
                  </Text>
                </View>
              </View>

              <View style={styles.twoColumns}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    OS por categoria
                  </Text>
                  <Text style={styles.chartSubtitle}>
                    Distribuição das OS abertas no período.
                  </Text>

                  {dados.por_categoria.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Nenhum registro no período.
                    </Text>
                  ) : (
                    dados.por_categoria.map((item) => (
                      <View
                        key={item.categoria}
                        style={styles.chartRow}
                      >
                        <View style={styles.chartLabelRow}>
                          <Text style={styles.chartLabel}>
                            {item.categoria}
                          </Text>
                          <Text style={styles.chartValue}>
                            {item.quantidade}
                          </Text>
                        </View>
                        <Barra
                          valor={item.quantidade}
                          total={totalCategoria}
                        />
                      </View>
                    ))
                  )}
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    OS por criticidade
                  </Text>
                  <Text style={styles.chartSubtitle}>
                    Atualmente usa a classificação de urgência.
                  </Text>

                  {dados.por_criticidade.map((item) => (
                    <View
                      key={item.criticidade}
                      style={styles.chartRow}
                    >
                      <View style={styles.chartLabelRow}>
                        <Text style={styles.chartLabel}>
                          {item.criticidade}
                        </Text>
                        <Text style={styles.chartValue}>
                          {item.quantidade}
                        </Text>
                      </View>
                      <Barra
                        valor={item.quantidade}
                        total={totalCriticidade}
                      />
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.twoColumns}>
                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    OS por status
                  </Text>
                  <Text style={styles.chartSubtitle}>
                    Situação das OS abertas no período.
                  </Text>

                  {dados.por_status.map((item) => (
                    <View
                      key={item.status}
                      style={styles.chartRow}
                    >
                      <View style={styles.chartLabelRow}>
                        <Text style={styles.chartLabel}>
                          {item.status}
                        </Text>
                        <Text style={styles.chartValue}>
                          {item.quantidade}
                        </Text>
                      </View>
                      <Barra
                        valor={item.quantidade}
                        total={totalStatus}
                      />
                    </View>
                  ))}
                </View>

                <View style={styles.chartCard}>
                  <Text style={styles.chartTitle}>
                    OS por cliente
                  </Text>
                  <Text style={styles.chartSubtitle}>
                    Clientes com mais OS abertas no período.
                  </Text>

                  {dados.por_cliente.length === 0 ? (
                    <Text style={styles.emptyText}>
                      Nenhum registro no período.
                    </Text>
                  ) : (
                    dados.por_cliente
                      .slice(0, 15)
                      .map((item, index) => (
                        <View
                          key={`${item.cliente}-${index}`}
                          style={styles.clientRow}
                        >
                          <View style={styles.rankCircle}>
                            <Text style={styles.rankText}>
                              {index + 1}
                            </Text>
                          </View>

                          <Text
                            style={styles.clientName}
                            numberOfLines={2}
                          >
                            {item.cliente}
                          </Text>

                          <Text style={styles.clientCount}>
                            {item.quantidade}
                          </Text>
                        </View>
                      ))
                  )}
                </View>
              </View>

              <View style={styles.pendingCard}>
                <Ionicons
                  name="information-circle-outline"
                  size={24}
                  color="#0B5EA8"
                />

                <View style={styles.pendingContent}>
                  <Text style={styles.pendingTitle}>
                    Como funciona o prazo limite
                  </Text>

                  <Text style={styles.pendingText}>
                    Informe acima o número de dias que a EMAFE deseja considerar como prazo máximo do processo. O relatório conta as OS do período que ultrapassaram esse limite, estejam elas concluídas ou ainda em andamento.
                  </Text>
                </View>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scroll: {
    paddingBottom: 50,
  },
  content: {
    width: '100%',
    maxWidth: 1180,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 26,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    marginBottom: 12,
  },
  backText: {
    color: '#0B5EA8',
    fontSize: 14,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: '#0B2447',
    fontSize: 31,
    fontWeight: '800',
  },
  subtitle: {
    color: '#697789',
    fontSize: 14,
    marginTop: 7,
    lineHeight: 21,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pdfButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#0B2447',
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  pdfButtonDisabled: {
    opacity: 0.55,
  },
  pdfButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#EAF0F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E4E9EF',
    marginBottom: 22,
  },
  filterTitle: {
    color: '#0B2447',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    alignItems: 'flex-end',
  },
  field: {
    flexGrow: 1,
    minWidth: 200,
  },
  label: {
    color: '#42566D',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    color: '#16283D',
    fontSize: 14,
  },
  applyButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#0B2447',
    paddingHorizontal: 22,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B7B7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  errorText: {
    color: '#A52828',
    fontSize: 12,
    flex: 1,
  },
  sectionTitle: {
    color: '#0B2447',
    fontSize: 19,
    fontWeight: '800',
    marginBottom: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 25,
  },
  kpiCard: {
    flexGrow: 1,
    minWidth: 190,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E9EF',
    padding: 18,
  },
  kpiIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#EAF0F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  kpiNumber: {
    color: '#0B2447',
    fontSize: 29,
    fontWeight: '800',
  },
  kpiNumberSmall: {
    color: '#0B2447',
    fontSize: 17,
    fontWeight: '800',
    minHeight: 35,
  },
  kpiLabel: {
    color: '#697789',
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  twoColumns: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  chartCard: {
    flex: 1,
    minWidth: 330,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4E9EF',
    padding: 20,
  },
  chartTitle: {
    color: '#0B2447',
    fontSize: 17,
    fontWeight: '800',
  },
  chartSubtitle: {
    color: '#8995A5',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 17,
  },
  chartRow: {
    marginBottom: 15,
  },
  chartLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 6,
  },
  chartLabel: {
    color: '#42566D',
    fontSize: 12,
    flex: 1,
  },
  chartValue: {
    color: '#0B2447',
    fontSize: 12,
    fontWeight: '800',
  },
  barTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#EAF0F6',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#0B5EA8',
  },
  emptyText: {
    color: '#8995A5',
    fontSize: 12,
    paddingVertical: 10,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1F5',
  },
  rankCircle: {
    width: 27,
    height: 27,
    borderRadius: 999,
    backgroundColor: '#EAF0F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    color: '#0B2447',
    fontSize: 11,
    fontWeight: '800',
  },
  clientName: {
    flex: 1,
    color: '#42566D',
    fontSize: 12,
  },
  clientCount: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '800',
  },
  pendingCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EAF0F6',
    borderRadius: 16,
    padding: 18,
    marginTop: 4,
  },
  pendingContent: {
    flex: 1,
  },
  pendingTitle: {
    color: '#0B2447',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  pendingText: {
    color: '#566B80',
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 4,
  },
});
