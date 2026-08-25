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

export default function PrimeiroAcessoScreen() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState('');

  async function verificarCadastro() {
    setMensagemErro('');

    if (!cpfCnpj.trim() || !email.trim()) {
      setMensagemErro(
        'Informe seu CPF/CNPJ e o e-mail cadastrado.'
      );
      return;
    }

    try {
      setCarregando(true);

      console.log('Consultando primeiro acesso...', {
        cpfCnpj,
        email,
      });

      const { data, error } = await supabase.rpc(
        'verificar_primeiro_acesso',
        {
          p_cpf_cnpj: cpfCnpj.trim(),
          p_email: email.trim().toLowerCase(),
        }
      );

      console.log('Resposta do Supabase:', data);
      console.log('Erro do Supabase:', error);

      if (error) {
        setMensagemErro(
          `Erro ao consultar cadastro: ${error.message}`
        );
        return;
      }

      const resultado = data?.[0];

      console.log('Resultado encontrado:', resultado);

      if (!resultado) {
        setMensagemErro(
          'O Supabase não retornou nenhum resultado.'
        );
        return;
      }

      if (!resultado.encontrado) {
        setMensagemErro(
          'Cadastro não localizado. Confira o CPF/CNPJ e o e-mail informados.'
        );
        return;
      }

      console.log('Cadastro encontrado. Indo para criar senha...');

      router.push({
        pathname: '/criar-senha',
        params: {
          preCadastroId: resultado.pre_cadastro_id,
          nome: resultado.nome_completo,
          email: email.trim().toLowerCase(),
        },
      });
    } catch (erro: any) {
      console.error('Erro inesperado:', erro);

      setMensagemErro(
        erro?.message ??
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
            editable={!carregando}
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
            editable={!carregando}
          />

          <Text style={styles.info}>
            Os dados informados precisam ser os mesmos registrados pela EMAFE.
          </Text>

          {mensagemErro !== '' && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{mensagemErro}</Text>
            </View>
          )}

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
              <Text style={styles.continueButtonText}>
                Continuar
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

  info: {
    color: '#697789',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 18,
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