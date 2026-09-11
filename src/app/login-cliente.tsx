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

export default function LoginClienteScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  async function entrar() {
    setMensagemErro('');

    if (!email.trim() || !senha) {
      setMensagemErro(
        'Informe seu e-mail e sua senha.'
      );

      return;
    }

    try {
      setCarregando(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password: senha,
        });

      if (error) {
        console.error(
          'Erro no login:',
          error
        );

        if (
          error.message
            .toLowerCase()
            .includes(
              'invalid login credentials'
            )
        ) {
          setMensagemErro(
            'E-mail ou senha incorretos.'
          );
        } else {
          setMensagemErro(
            `Não foi possível entrar: ${error.message}`
          );
        }

        return;
      }

      if (!data.user || !data.session) {
        setMensagemErro(
          'Não foi possível iniciar sua sessão.'
        );

        return;
      }

      console.log(
        'Cliente autenticado:',
        data.user.email
      );

      router.replace(
        '/dashboard-cliente'
      );
    } catch (erro: any) {
      console.error(
        'Erro inesperado no login:',
        erro
      );

      setMensagemErro(
        erro?.message ??
          'Ocorreu um problema ao entrar.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar style="dark" />

      <View style={styles.content}>
        {/* VOLTAR PARA A TELA INICIAL */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() =>
            router.replace('/')
          }
          disabled={carregando}
        >
          <Text style={styles.backText}>
            ‹ Voltar
          </Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/emafe/logo-horizontal-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>
          Área do Cliente
        </Text>

        <Text style={styles.subtitle}>
          Entre para acompanhar suas solicitações de manutenção.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            E-mail
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8995A5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
            editable={!carregando}
          />

          <Text style={styles.label}>
            Senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <View style={styles.accessLinks}>
            <TouchableOpacity>
              <Text
                style={styles.forgotText}
              >
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                router.push(
                  '/primeiro-acesso'
                )
              }
              disabled={carregando}
            >
              <Text
                style={
                  styles.firstAccessText
                }
              >
                Primeiro acesso
              </Text>
            </TouchableOpacity>
          </View>

          {mensagemErro !== '' && (
            <View style={styles.errorBox}>
              <Text
                style={styles.errorText}
              >
                {mensagemErro}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.loginButton,
              carregando &&
                styles.loginButtonDisabled,
            ]}
            onPress={entrar}
            disabled={carregando}
            activeOpacity={0.85}
          >
            {carregando ? (
              <ActivityIndicator
                color="#FFFFFF"
              />
            ) : (
              <Text
                style={
                  styles.loginButtonText
                }
              >
                Entrar
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          EMAFE Engenharia • Assistência Técnica
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  content: {
    flex: 1,
    width: '100%',
    maxWidth: 460,
    alignSelf: 'center',
    paddingHorizontal: 28,
    paddingTop: 24,
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
    width: 290,
    height: 120,
    alignSelf: 'center',
    marginTop: 20,
  },

  title: {
    color: '#0B2447',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 16,
  },

  subtitle: {
    color: '#697789',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 35,
  },

  form: {
    width: '100%',
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    fontSize: 15,
    color: '#16283D',
    marginBottom: 20,
  },

  accessLinks: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 25,
  },

  forgotText: {
    color: '#0B5EA8',
    fontSize: 13,
    fontWeight: '600',
  },

  firstAccessText: {
    color: '#0B2447',
    fontSize: 13,
    fontWeight: '700',
  },

  errorBox: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B7B7',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
  },

  errorText: {
    color: '#A52828',
    fontSize: 12,
    lineHeight: 18,
  },

  loginButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loginButtonDisabled: {
    opacity: 0.65,
  },

  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    color: '#8995A5',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 40,
  },
});