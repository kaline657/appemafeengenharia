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

export default function LoginFuncionarioScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
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
          <Text style={styles.label}>E-mail corporativo</Text>

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

          <TouchableOpacity style={styles.forgotButton}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.loginButtonText}>Entrar como Funcionário</Text>
          </TouchableOpacity>

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
    marginTop: 28,
  },
});