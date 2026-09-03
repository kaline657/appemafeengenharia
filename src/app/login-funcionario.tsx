import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';

import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { supabase } from '../lib/supabase';

export default function LoginFuncionarioScreen() {
  const [email, setEmail] =
    useState('');

  const [senha, setSenha] =
    useState('');

  const [carregando, setCarregando] =
    useState(false);

  const [erro, setErro] =
    useState('');

  // ==========================================================
  // LOGIN DO FUNCIONÁRIO
  // ==========================================================

  async function entrarComoFuncionario() {
    const emailFormatado =
      email.trim().toLowerCase();

    // --------------------------------------------------------
    // VALIDAÇÕES
    // --------------------------------------------------------

    if (!emailFormatado) {
      setErro(
        'Informe seu e-mail.'
      );

      return;
    }

    if (!senha) {
      setErro(
        'Informe sua senha.'
      );

      return;
    }

    try {
      setCarregando(true);
      setErro('');

      // ------------------------------------------------------
      // 1. FAZ LOGIN NO SUPABASE AUTH
      // ------------------------------------------------------

      const {
        data: loginData,
        error: loginError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              emailFormatado,

            password:
              senha,
          });

      if (loginError) {
        console.error(
          'Erro no login:',
          loginError
        );

        setErro(
          'E-mail ou senha incorretos.'
        );

        return;
      }

      if (
        !loginData.user ||
        !loginData.session
      ) {
        setErro(
          'Não foi possível iniciar sua sessão.'
        );

        return;
      }

      // ------------------------------------------------------
      // 2. VERIFICA SE É FUNCIONÁRIO ATIVO
      // ------------------------------------------------------

      const {
        data: ehFuncionario,
        error: funcionarioError,
      } =
        await supabase.rpc(
          'sou_funcionario'
        );

      if (funcionarioError) {
        console.error(
          'Erro ao verificar funcionário:',
          funcionarioError
        );

        // Por segurança, encerra a sessão
        // caso a verificação falhe.

        await supabase.auth
          .signOut();

        setErro(
          'Não foi possível verificar sua permissão de acesso.'
        );

        return;
      }

      // ------------------------------------------------------
      // 3. BLOQUEIA CLIENTE OU FUNCIONÁRIO INATIVO
      // ------------------------------------------------------

      if (
        ehFuncionario !== true
      ) {
        await supabase.auth
          .signOut();

        setSenha('');

        setErro(
          'Esta conta não possui acesso à Área do Funcionário.'
        );

        return;
      }

      // ------------------------------------------------------
      // 4. ACESSO AUTORIZADO
      // ------------------------------------------------------

      router.replace(
        '/dashboard-funcionario'
      );
    } catch (error) {
      console.error(
        'Erro inesperado no login:',
        error
      );

      // Em caso de erro inesperado,
      // também encerramos a sessão.

      await supabase.auth
        .signOut();

      setErro(
        'Ocorreu um erro ao entrar. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // RECUPERAÇÃO DE SENHA
  // ==========================================================

  async function recuperarSenha() {
    const emailFormatado =
      email.trim().toLowerCase();

    if (!emailFormatado) {
      setErro(
        'Digite seu e-mail primeiro para solicitar a recuperação da senha.'
      );

      return;
    }

    try {
      setCarregando(true);
      setErro('');

      const { error } =
        await supabase.auth
          .resetPasswordForEmail(
            emailFormatado
          );

      if (error) {
        console.error(
          'Erro ao recuperar senha:',
          error
        );

        setErro(
          'Não foi possível enviar o e-mail de recuperação.'
        );

        return;
      }

      setErro(
        'Enviamos as instruções de recuperação para o e-mail informado.'
      );
    } catch (error) {
      console.error(error);

      setErro(
        'Não foi possível solicitar a recuperação da senha.'
      );
    } finally {
      setCarregando(false);
    }
  }

  // ==========================================================
  // TELA
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar style="light" />

      {/* ====================================================
          CABEÇALHO
      ==================================================== */}

      <View style={styles.header}>
        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            router.replace('/')
          }
          disabled={carregando}
        >
          <Text
            style={
              styles.backText
            }
          >
            ‹ Voltar
          </Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/emafe/logo-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

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
          Acesso exclusivo para colaboradores EMAFE.
        </Text>
      </View>

      {/* ====================================================
          FORMULÁRIO
      ==================================================== */}

      <View
        style={
          styles.formContainer
        }
      >
        <View
          style={
            styles.contentWidth
          }
        >
          {/* ERRO / AVISO */}

          {erro ? (
            <View
              style={
                styles.messageBox
              }
            >
              <Text
                style={
                  styles.messageText
                }
              >
                {erro}
              </Text>
            </View>
          ) : null}

          {/* E-MAIL */}

          <Text
            style={styles.label}
          >
            E-mail corporativo
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8995A5"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={(texto) => {
              setEmail(texto);
              setErro('');
            }}
            editable={!carregando}
            returnKeyType="next"
          />

          {/* SENHA */}

          <Text
            style={styles.label}
          >
            Senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={(texto) => {
              setSenha(texto);
              setErro('');
            }}
            editable={!carregando}
            returnKeyType="done"
            onSubmitEditing={
              entrarComoFuncionario
            }
          />

          {/* ESQUECI SENHA */}

          <TouchableOpacity
            style={
              styles.forgotButton
            }
            onPress={
              recuperarSenha
            }
            disabled={carregando}
          >
            <Text
              style={
                styles.forgotText
              }
            >
              Esqueci minha senha
            </Text>
          </TouchableOpacity>

          {/* ENTRAR */}

          <TouchableOpacity
            style={[
              styles.loginButton,

              carregando &&
                styles.loginButtonDisabled,
            ]}
            onPress={
              entrarComoFuncionario
            }
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <View
                style={
                  styles.loadingButton
                }
              >
                <ActivityIndicator
                  color="#FFFFFF"
                  size="small"
                />

                <Text
                  style={
                    styles.loginButtonText
                  }
                >
                  Verificando acesso...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Entrar como Funcionário
              </Text>
            )}
          </TouchableOpacity>

          {/* INFORMAÇÃO */}

          <View
            style={styles.infoBox}
          >
            <Text
              style={
                styles.infoText
              }
            >
              Somente funcionários cadastrados e ativos pela EMAFE podem acessar esta área.
            </Text>
          </View>

          <Text
            style={styles.footer}
          >
            EMAFE Engenharia • Acesso interno
          </Text>
        </View>
      </View>
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
        '#0B2447',
    },

    header: {
      flex: 1,
      alignItems: 'center',
      justifyContent:
        'center',
      paddingHorizontal: 28,
    },

    backButton: {
      position: 'absolute',
      top: 24,
      left: 28,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },

    backText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },

    logo: {
      width: 240,
      height: 110,
    },

    title: {
      color: '#FFFFFF',
      fontSize: 27,
      fontWeight: '800',
      marginTop: 20,
      textAlign: 'center',
    },

    subtitle: {
      color: '#CAD4E0',
      fontSize: 14,
      textAlign: 'center',
      marginTop: 8,
    },

    formContainer: {
      backgroundColor:
        '#FFFFFF',
      borderTopLeftRadius: 36,
      borderTopRightRadius: 36,
      paddingHorizontal: 28,
      paddingTop: 35,
      paddingBottom: 40,
    },

    contentWidth: {
      width: '100%',
      maxWidth: 460,
      alignSelf: 'center',
    },

    // MENSAGEM

    messageBox: {
      backgroundColor:
        '#F4F7FA',
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      borderRadius: 12,
      padding: 13,
      marginBottom: 20,
    },

    messageText: {
      color: '#42566D',
      fontSize: 12,
      lineHeight: 18,
    },

    // FORMULÁRIO

    label: {
      color: '#24364B',
      fontSize: 14,
      fontWeight: '600',
      marginBottom: 8,
    },

    input: {
      height: 56,
      borderRadius: 14,
      borderWidth: 1,
      borderColor:
        '#D8DEE7',
      backgroundColor:
        '#F8FAFC',
      paddingHorizontal: 16,
      fontSize: 15,
      color: '#16283D',
      marginBottom: 20,
    },

    forgotButton: {
      alignSelf: 'flex-end',
      marginTop: -8,
      marginBottom: 25,
    },

    forgotText: {
      color: '#0B5EA8',
      fontSize: 13,
      fontWeight: '600',
    },

    // BOTÃO LOGIN

    loginButton: {
      height: 58,
      borderRadius: 16,
      backgroundColor:
        '#0B2447',
      alignItems: 'center',
      justifyContent:
        'center',
    },

    loginButtonDisabled: {
      opacity: 0.7,
    },

    loadingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },

    loginButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },

    // INFORMAÇÃO

    infoBox: {
      backgroundColor:
        '#F4F7FA',
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      marginTop: 18,
    },

    infoText: {
      color: '#697789',
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'center',
    },

    footer: {
      color: '#8995A5',
      fontSize: 11,
      textAlign: 'center',
      marginTop: 28,
    },
  });