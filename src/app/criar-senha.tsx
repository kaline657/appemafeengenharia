import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
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
  const email = String(params.email ?? '');

  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

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

  async function ativarConta() {
    if (!preCadastroId || !email) {
      Alert.alert(
        'Dados inválidos',
        'Não foi possível identificar seu pré-cadastro. Volte e tente novamente.'
      );
      return;
    }

    if (!senha || !confirmarSenha) {
      Alert.alert(
        'Campos obrigatórios',
        'Preencha a senha e a confirmação da senha.'
      );
      return;
    }

    if (!senhaValida(senha)) {
      Alert.alert(
        'Senha inválida',
        'A senha precisa ter pelo menos 8 caracteres, uma letra maiúscula, uma letra minúscula e um número.'
      );
      return;
    }

    if (senha !== confirmarSenha) {
      Alert.alert(
        'Senhas diferentes',
        'A senha e a confirmação precisam ser iguais.'
      );
      return;
    }

    try {
      setCarregando(true);

      // Cria o usuário no Supabase Auth
      const { data: authData, error: authError } =
        await supabase.auth.signUp({
          email,
          password: senha,
        });

      if (authError) {
        console.error('Erro ao criar usuário:', authError);

        if (
          authError.message
            .toLowerCase()
            .includes('already registered')
        ) {
          Alert.alert(
            'Conta já existente',
            'Já existe uma conta cadastrada com este e-mail.'
          );
          return;
        }

        Alert.alert(
          'Não foi possível criar a conta',
          authError.message
        );
        return;
      }

      if (!authData.user) {
        Alert.alert(
          'Erro',
          'Não foi possível criar o usuário.'
        );
        return;
      }

      /*
        Se o Supabase criar uma sessão imediatamente,
        finalizamos o pré-cadastro.
      */
      if (authData.session) {
        const { error: finalizarError } = await supabase.rpc(
          'finalizar_primeiro_acesso',
          {
            p_pre_cadastro_id: preCadastroId,
          }
        );

        if (finalizarError) {
          console.error(
            'Erro ao finalizar primeiro acesso:',
            finalizarError
          );

          Alert.alert(
            'Conta criada',
            'Sua conta foi criada, mas ocorreu um problema ao concluir o cadastro. Entre em contato com a EMAFE.'
          );
          return;
        }

        Alert.alert(
          'Conta ativada!',
          `Bem-vindo${nome ? `, ${nome}` : ''}! Seu acesso foi criado com sucesso.`,
          [
            {
              text: 'Entrar',
              onPress: async () => {
                await supabase.auth.signOut();
                router.replace('/login-cliente');
              },
            },
          ]
        );

        return;
      }

      /*
        Se a confirmação de e-mail estiver ativada no Supabase,
        ele cria o usuário, mas não cria sessão ainda.
      */
      Alert.alert(
        'Confirme seu e-mail',
        `Enviamos uma confirmação para ${email}. Abra o e-mail para confirmar sua conta antes de entrar.`
      );
    } catch (erro) {
      console.error('Erro inesperado:', erro);

      Alert.alert(
        'Erro',
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
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/emafe/logo-horizontal-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Crie sua senha</Text>

        <Text style={styles.subtitle}>
          Crie uma senha para concluir a ativação do seu acesso ao aplicativo
          EMAFE.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>Nova senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua nova senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            editable={!carregando}
          />

          <Text style={styles.label}>Confirmar senha</Text>

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

            <Text style={styles.rule}>• pelo menos 8 caracteres</Text>
            <Text style={styles.rule}>• uma letra maiúscula</Text>
            <Text style={styles.rule}>• uma letra minúscula</Text>
            <Text style={styles.rule}>• um número</Text>
          </View>

          <TouchableOpacity
            style={[
              styles.activateButton,
              carregando && styles.activateButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={ativarConta}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.activateButtonText}>
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