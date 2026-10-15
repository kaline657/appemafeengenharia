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
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');

  async function entrarComoFuncionario() {
    const emailFormatado = email.trim().toLowerCase();

    if (!emailFormatado) {
      setErro('Informe seu e-mail.');
      return;
    }

    if (!senha) {
      setErro('Informe sua senha.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');
      setAviso('');

      const { data: loginData, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: emailFormatado,
          password: senha,
        });

      if (loginError) {
        setErro('E-mail ou senha incorretos.');
        return;
      }

      if (!loginData.user || !loginData.session) {
        setErro('Não foi possível iniciar sua sessão.');
        return;
      }

      const { data: ehFuncionario, error: funcionarioError } =
        await supabase.rpc('sou_funcionario');

      if (funcionarioError) {
        await supabase.auth.signOut();
        setErro('Não foi possível verificar sua permissão de acesso.');
        return;
      }

      if (ehFuncionario !== true) {
        await supabase.auth.signOut();
        setSenha('');
        setErro('Esta conta não possui acesso à Área do Funcionário.');
        return;
      }

      router.replace('/dashboard-funcionario');
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      await supabase.auth.signOut();
      setErro('Ocorreu um erro ao entrar. Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  async function recuperarSenha() {
    const emailFormatado = email.trim().toLowerCase();

    if (!emailFormatado) {
      setErro('Digite seu e-mail primeiro para solicitar a recuperação da senha.');
      return;
    }

    try {
      setCarregando(true);
      setErro('');
      setAviso('');

      const { error } = await supabase.auth.resetPasswordForEmail(
        emailFormatado,
        {
          redirectTo: 'https://emafe-engenharia.expo.app/redefinir-senha',
        }
      );

      if (error) {
        console.error('Erro ao recuperar senha:', error);
        setErro('Não foi possível enviar o e-mail de recuperação.');
        return;
      }

      setAviso(
        'Enviamos as instruções de recuperação para o e-mail informado.'
      );
    } catch (error) {
      console.error(error);
      setErro('Não foi possível solicitar a recuperação da senha.');
    } finally {
      setCarregando(false);
    }
  }

  function irParaPrimeiroAcesso() {
    setErro('');
    setAviso('');

    router.push({
      pathname: '/primeiro-acesso-funcionario' as any,
      params: {
        email: email.trim().toLowerCase(),
      },
    } as any);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
          disabled={carregando}
        >
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/emafe/logo-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Área do Funcionário</Text>

        <Text style={styles.subtitle}>
          Acesso exclusivo para colaboradores EMAFE.
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.contentWidth}>
          {erro ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{erro}</Text>
            </View>
          ) : null}

          {aviso ? (
            <View style={styles.successBox}>
              <Text style={styles.successText}>{aviso}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>E-mail corporativo</Text>

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
              setAviso('');
            }}
            editable={!carregando}
            returnKeyType="next"
          />

          <Text style={styles.label}>Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={(texto) => {
              setSenha(texto);
              setErro('');
              setAviso('');
            }}
            editable={!carregando}
            returnKeyType="done"
            onSubmitEditing={entrarComoFuncionario}
          />

          <TouchableOpacity
            style={styles.firstAccessButton}
            onPress={irParaPrimeiroAcesso}
            disabled={carregando}
          >
            <Text style={styles.firstAccessText}>
              Primeiro acesso? Criar minha senha
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.forgotButton}
            onPress={recuperarSenha}
            disabled={carregando}
          >
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.loginButton,
              carregando && styles.loginButtonDisabled,
            ]}
            onPress={entrarComoFuncionario}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color="#FFFFFF" size="small" />
                <Text style={styles.loginButtonText}>
                  Verificando acesso...
                </Text>
              </View>
            ) : (
              <Text style={styles.loginButtonText}>
                Entrar como Funcionário
              </Text>
            )}
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Se você foi pré-cadastrado pela EMAFE e nunca acessou o sistema,
              use a opção “Primeiro acesso” para criar sua senha.
            </Text>
          </View>

          <Text style={styles.footer}>
            EMAFE Engenharia • Acesso interno
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B2447',
  },
  header: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#FFFFFF',
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
  errorBox: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B7B7',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
  },
  errorText: {
    color: '#A52828',
    fontSize: 12,
    lineHeight: 18,
  },
  successBox: {
    backgroundColor: '#EAF7EF',
    borderWidth: 1,
    borderColor: '#A8D8B9',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
  },
  successText: {
    color: '#22633A',
    fontSize: 12,
    lineHeight: 18,
  },
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
    borderColor: '#D8DEE7',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#16283D',
    marginBottom: 20,
  },
  firstAccessButton: {
    alignSelf: 'flex-start',
    marginTop: -8,
    marginBottom: 10,
  },
  firstAccessText: {
    color: '#0B5EA8',
    fontSize: 13,
    fontWeight: '700',
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginTop: -28,
    marginBottom: 25,
  },
  forgotText: {
    color: '#0B5EA8',
    fontSize: 13,
    fontWeight: '600',
  },
  loginButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
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
  infoBox: {
    backgroundColor: '#F4F7FA',
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
