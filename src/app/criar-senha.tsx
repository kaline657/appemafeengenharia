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

export default function CriarSenhaScreen() {
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');

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
          />

          <Text style={styles.label}>Confirmar senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite novamente sua senha"
            placeholderTextColor="#8995A5"
            secureTextEntry
            value={confirmarSenha}
            onChangeText={setConfirmarSenha}
          />

          <View style={styles.rulesBox}>
            <Text style={styles.rulesTitle}>Sua senha deverá ter:</Text>

            <Text style={styles.rule}>• pelo menos 8 caracteres</Text>
            <Text style={styles.rule}>• uma letra maiúscula</Text>
            <Text style={styles.rule}>• uma letra minúscula</Text>
            <Text style={styles.rule}>• um número</Text>
          </View>

          <TouchableOpacity
            style={styles.activateButton}
            activeOpacity={0.85}
          >
            <Text style={styles.activateButtonText}>
              Ativar minha conta
            </Text>
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