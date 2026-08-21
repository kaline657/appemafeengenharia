import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.topSection}>
        <Image
          source={require('../../assets/emafe/logo-transparente.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.welcome}>Bem-vindo</Text>

        <Text style={styles.description}>
          Acompanhe solicitações e serviços de assistência técnica de forma
          simples e segura.
        </Text>
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.contentWidth}>
          <Text style={styles.accessTitle}>Como deseja acessar?</Text>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/login-cliente')}
          >
            <Text style={styles.primaryButtonText}>Sou Cliente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.85}
            onPress={() => router.push('/login-funcionario')}
          >
            <Text style={styles.secondaryButtonText}>Sou Funcionário</Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            EMAFE Engenharia • Assistência Técnica
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

  topSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },

  logo: {
    width: 300,
    height: 150,
    marginBottom: 18,
  },

  welcome: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },

  description: {
    color: '#CAD4E0',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 12,
    maxWidth: 390,
  },

  bottomSection: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 24,
    paddingTop: 34,
    paddingBottom: 35,
  },

  contentWidth: {
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },

  accessTitle: {
    color: '#16283D',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 22,
  },

  primaryButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 13,
  },

  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  secondaryButton: {
    height: 58,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#0B2447',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  secondaryButtonText: {
    color: '#0B2447',
    fontSize: 16,
    fontWeight: '700',
  },

  footer: {
    color: '#8492A3',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 26,
  },
});