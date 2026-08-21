import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function PrimeiroAcessoScreen() {
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [email, setEmail] = useState('');

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
            style={styles.continueButton}
            activeOpacity={0.85}
            onPress={() => router.push('/criar-senha')}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
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