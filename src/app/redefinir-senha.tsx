import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

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

export default function RedefinirSenhaScreen() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [sessaoPronta, setSessaoPronta] = useState(false);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  useEffect(() => {
    let ativo = true;

    async function conferirSessao() {
      const { data } = await supabase.auth.getSession();

      if (ativo) {
        setSessaoPronta(!!data.session);
      }
    }

    conferirSessao();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!ativo) return;

        if (event === 'PASSWORD_RECOVERY' || session) {
          setSessaoPronta(true);
        }
      }
    );

    return () => {
      ativo = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function salvarNovaSenha() {
    setErro('');
    setSucesso('');

    if (!senha || !confirmarSenha) {
      setErro('Preencha a nova senha e a confirmação.');
      return;
    }

    if (senha.length < 8) {
      setErro('A senha deve ter pelo menos 8 caracteres.');
      return;
    }

    if (senha !== confirmarSenha) {
      setErro('A senha e a confirmação precisam ser iguais.');
      return;
    }

    try {
      setCarregando(true);

      const { error } = await supabase.auth.updateUser({
        password: senha,
      });

      if (error) {
        console.error('Erro ao atualizar senha:', error);
        setErro(
          'Não foi possível redefinir a senha. Abra novamente o link enviado por e-mail.'
        );
        return;
      }

      setSucesso('Senha atualizada com sucesso.');

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace('/login-funcionario');
      }, 1600);
    } catch (error) {
      console.error(error);
      setErro('Ocorreu um erro ao redefinir sua senha.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.content}>
        <Image
          source={require('../../assets/emafe/logo-horizontal-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Redefinir senha</Text>

        <Text style={styles.subtitle}>
          Crie uma nova senha para acessar a Área do Funcionário.
        </Text>

        {!sessaoPronta ? (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              Se você abriu esta página sem usar o link recebido por e-mail,
              volte ao e-mail de recuperação e abra o link novamente.
            </Text>
          </View>
        ) : null}

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

        <Text style={styles.label}>Confirmar nova senha</Text>

        <TextInput
          style={styles.input}
          placeholder="Digite novamente a senha"
          placeholderTextColor="#8995A5"
          secureTextEntry
          value={confirmarSenha}
          onChangeText={setConfirmarSenha}
          editable={!carregando}
        />

        {erro ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{erro}</Text>
          </View>
        ) : null}

        {sucesso ? (
          <View style={styles.successBox}>
            <Text style={styles.successText}>{sucesso}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[
            styles.button,
            (!sessaoPronta || carregando) && styles.buttonDisabled,
          ]}
          onPress={salvarNovaSenha}
          disabled={!sessaoPronta || carregando}
        >
          {carregando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Salvar nova senha</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/login-funcionario')}
          disabled={carregando}
        >
          <Text style={styles.backText}>Voltar para o login</Text>
        </TouchableOpacity>
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
    paddingTop: 40,
  },
  logo: {
    width: 280,
    height: 110,
    alignSelf: 'center',
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
    marginBottom: 28,
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
  infoBox: {
    backgroundColor: '#EAF0F6',
    borderRadius: 12,
    padding: 13,
    marginBottom: 20,
  },
  infoText: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: '#FDECEC',
    borderWidth: 1,
    borderColor: '#F3B7B7',
    borderRadius: 12,
    padding: 13,
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
    padding: 13,
    marginBottom: 18,
  },
  successText: {
    color: '#22633A',
    fontSize: 12,
    lineHeight: 18,
  },
  button: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.55,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 22,
    padding: 8,
  },
  backText: {
    color: '#0B5EA8',
    fontSize: 13,
    fontWeight: '600',
  },
});
