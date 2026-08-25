import { router, useLocalSearchParams } from 'expo-router';
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

export default function CriarSenhaScreen() {
  const params = useLocalSearchParams();

  const preCadastroId = String(params.preCadastroId ?? '');
  const nome = String(params.nome ?? '');
  const email = String(params.email ?? '')
    .trim()
    .toLowerCase();

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  const [mensagemErro, setMensagemErro] = useState('');
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  function senhaValida(valor: string) {
    const temOitoCaracteres = valor.length >= 8;
    const temMaiuscula = /[A-Z]/.test(valor);
    const temMinuscula = /[a-z]/.test(valor);
    const temNumero = /[0-9]/.test(valor);

    return (
      temOitoCaracteres &&
      temMaiuscula &&
      temMinuscula &&
      temNumero
    );
  }

  async function finalizarCadastro() {
    const { error } = await supabase.rpc(
      'finalizar_primeiro_acesso',
      {
        p_pre_cadastro_id: preCadastroId,
      }
    );

    if (error) {
      console.error(
        'Erro ao finalizar primeiro acesso:',
        error
      );

      throw new Error(
        `Não foi possível concluir o cadastro: ${error.message}`
      );
    }
  }

  async function contaAtivadaComSucesso() {
    setMensagemErro('');

    setMensagemSucesso(
      `Conta ativada com sucesso${
        nome ? `, ${nome}` : ''
      }! Você já pode entrar no aplicativo.`
    );

    /*
      Saímos da sessão criada durante o cadastro
      porque o próximo passo será o login normal.
    */
    await supabase.auth.signOut();

    /*
      Depois de mostrar a mensagem,
      volta para a tela de login.
    */
    setTimeout(() => {
      router.replace('/login-cliente');
    }, 1800);
  }

  async function ativarConta() {
    setMensagemErro('');
    setMensagemSucesso('');

    if (!preCadastroId || !email) {
      setMensagemErro(
        'Não foi possível identificar seu pré-cadastro. Volte para a tela anterior e tente novamente.'
      );
      return;
    }

    if (!senha || !confirmarSenha) {
      setMensagemErro(
        'Preencha a senha e a confirmação da senha.'
      );
      return;
    }

    if (!senhaValida(senha)) {
      setMensagemErro(
        'A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      setMensagemErro(
        'A senha e a confirmação precisam ser iguais.'
      );
      return;
    }

    try {
      setCarregando(true);

      /*
        PRIMEIRA TENTATIVA:
        criar a conta no Supabase Auth.
      */
      const {
        data: authData,
        error: authError,
      } = await supabase.auth.signUp({
        email,
        password: senha,
      });

      /*
        Se o usuário já existir, não precisamos
        tentar cadastrá-lo novamente.

        Tentamos autenticar com a senha digitada.
      */
      if (authError) {
        const mensagem =
          authError.message.toLowerCase();

        const usuarioJaExiste =
          mensagem.includes('already registered') ||
          mensagem.includes('already exists') ||
          authError.code === 'user_already_exists';

        if (usuarioJaExiste) {
          console.log(
            'Usuário já existe. Tentando autenticar...'
          );

          const {
            data: loginData,
            error: loginError,
          } = await supabase.auth.signInWithPassword({
            email,
            password: senha,
          });

          if (loginError) {
            console.error(
              'Erro ao autenticar usuário existente:',
              loginError
            );

            setMensagemErro(
              'Já existe uma conta com este e-mail, mas a senha informada não corresponde à conta existente. Use a senha cadastrada ou recupere seu acesso.'
            );

            return;
          }

          if (!loginData.session) {
            setMensagemErro(
              'Não foi possível iniciar a sessão da conta existente.'
            );
            return;
          }

          /*
            O usuário existe e conseguimos provar
            que ele conhece a senha.
            Agora finalizamos o cadastro EMAFE.
          */
          await finalizarCadastro();

          await contaAtivadaComSucesso();

          return;
        }

        console.error(
          'Erro ao criar usuário:',
          authError
        );

        setMensagemErro(
          `Erro do Supabase: ${authError.message}`
        );

        return;
      }

      /*
        Cadastro novo criado.
      */
      if (!authData.user) {
        setMensagemErro(
          'O Supabase não retornou o usuário criado.'
        );
        return;
      }

      /*
        Com "Confirm email" desligado,
        o Supabase cria a sessão imediatamente.
      */
      if (authData.session) {
        await finalizarCadastro();

        await contaAtivadaComSucesso();

        return;
      }

      /*
        Isso poderá acontecer futuramente
        se reativarmos a confirmação de e-mail.
      */
      setMensagemSucesso(
        `Sua conta foi criada. Enviamos uma confirmação para ${email}. Confirme seu e-mail antes de entrar.`
      );
    } catch (erro: any) {
      console.error(
        'Erro inesperado ao ativar conta:',
        erro
      );

      setMensagemErro(
        erro?.message ??
          'Ocorreu um problema ao ativar sua conta. Tente novamente.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
          Crie sua senha
        </Text>

        <Text style={styles.subtitle}>
          Crie uma senha para concluir a ativação do seu
          acesso ao aplicativo EMAFE.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>
            Nova senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <Text style={styles.label}>
            Confirmar senha
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Digite novamente sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
            editable={!carregando}
          />

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>
              Sua senha deverá ter:
            </Text>

            <Text style={styles.rule}>
              • pelo menos 8 caracteres
            </Text>

            <Text style={styles.rule}>
              • uma letra maiúscula
            </Text>

            <Text style={styles.rule}>
              • uma letra minúscula
            </Text>

            <Text style={styles.rule}>
              • um número
            </Text>
          </View>

          {mensagemErro !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>
                {mensagemErro}
              </Text>
            </View>
          )}

          {mensagemSucesso !== '' && (
            <View style={styles.successBox}>
              <Text style={styles.successText}>
                {mensagemSucesso}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.activateButton,
              carregando &&
                styles.activateButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={ativarConta}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text
                style={styles.activateButtonText}
              >
                Ativar minha conta
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

  rulesBox: {
    backgroundColor: '#EAF0F6',
    borderRadius: 14,
    padding: 16,
    marginBottom: 24,
  },

  rulesTitle: {
    color: '#24364B',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },

  rule: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 20,
  },

  errorBox: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B7B7',
    borderRadius: 12,
    padding: 14,
    marginBottom: 18,
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
    padding: 14,
    marginBottom: 18,
  },

  successText: {
    color: '#22633A',
    fontSize: 12,
    lineHeight: 18,
  },

  activateButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  activateButtonDisabled: {
    opacity: 0.65,
  },

  activateButtonText: {
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