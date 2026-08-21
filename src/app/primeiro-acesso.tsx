import { router } from 'expo-router';
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

export default function PrimeiroAcessoScreen() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function verificarCadastro() {
    if (!cpfCnpj.trim() || !email.trim()) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe seu CPF/CNPJ e o e-mail cadastrado.'
      );
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.rpc(
        'verificar_primeiro_acesso',
        {
          p_cpf_cnpj: cpfCnpj,
          p_email: email,
        }
      );

      if (error) {
        console.error(error);

        Alert.alert(
          'Erro',
          'Não foi possível consultar seu cadastro. Tente novamente.'
        );

        return;
      }

      const resultado = data?.[0];

      if (!resultado?.encontrado) {
        Alert.alert(
          'Cadastro não localizado',
          'Confira o CPF/CNPJ e o e-mail informados. Caso o problema continue, entre em contato com a EMAFE.'
        );

        return;
      }

      router.push({
        pathname: '/criar-senha',
        params: {
          preCadastroId: resultado.pre_cadastro_id,
          nome: resultado.nome_completo,
          email: email.trim().toLowerCase(),
        },
      });
    } catch (erro) {
      console.error(erro);

      Alert.alert(
        'Erro',
        'Ocorreu um problema ao verificar seu cadastro.'
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
        >
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>

        <Image
          source={require('../../assets/emafe/logo-horizontal-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.title}>Primeiro acesso</Text>

        <Text style={styles.subtitle}>
          Informe seus dados para localizar seu cadastro na EMAFE e ativar seu
          acesso.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>CPF ou CNPJ</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu CPF ou CNPJ"
            placeholderTextColor="#8995A5"
            keyboardType="numeric"
            value={cpfCnpj}
            onChangeText={setCpfCnpj}
          />

          <Text style={styles.label}>E-mail cadastrado</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8995A5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.info}>
            Os dados informados precisam ser os mesmos registrados pela EMAFE.
          </Text>

          <TouchableOpacity
            style={[
              styles.continueButton,
              carregando && styles.continueButtonDisabled,
            ]}
            activeOpacity={0.85}
            onPress={verificarCadastro}
            disabled={carregando}
          >
            {carregando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continuar</Text>
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

  info: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 24,
  },

  continueButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  continueButtonDisabled: {
    opacity: 0.65,
  },

  continueButtonText: {
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