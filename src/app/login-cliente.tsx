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

export default function LoginClienteScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

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

        <Text style={styles.title}>Área do Cliente</Text>

        <Text style={styles.subtitle}>
          Entre para acompanhar suas solicitações de manutenção.
        </Text>

        <View style={styles.form}>
          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite seu e-mail"
            placeholderTextColor="#8995A5"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.label}>Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
          />

          <View style={styles.accessLinks}>
            <TouchableOpacity>
              <Text style={styles.forgotText}>
                Esqueci minha senha
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push('/primeiro-acesso')}
            >
              <Text style={styles.firstAccessText}>
                Primeiro acesso
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Entrar</Text>
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
    justifyContent: 'space-between',
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

  loginButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
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