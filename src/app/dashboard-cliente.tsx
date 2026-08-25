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

import { supabase } from '../lib/supabase';

export default function DashboardClienteScreen() {
  async function sair() {
    await supabase.auth.signOut();
    router.replace('/login-cliente');
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

        <Text style={styles.title}>Área do Cliente</Text>

        <Text style={styles.subtitle}>
          Bem-vindo ao sistema de Assistência Técnica da EMAFE.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Minhas solicitações</Text>

          <Text style={styles.cardText}>
            Aqui você poderá acompanhar suas solicitações de manutenção.
          </Text>
        </View>

        <TouchableOpacity style={styles.newButton}>
          <Text style={styles.newButtonText}>
            + Nova solicitação
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={sair}
        >
          <Text style={styles.logoutText}>Sair</Text>
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
    maxWidth: 520,
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
    fontSize: 30,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 20,
  },

  subtitle: {
    color: '#697789',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 35,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#D8DEE7',
    marginBottom: 20,
  },

  cardTitle: {
    color: '#0B2447',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },

  cardText: {
    color: '#697789',
    fontSize: 13,
    lineHeight: 20,
  },

  newButton: {
    height: 58,
    borderRadius: 16,
    backgroundColor: '#0B2447',
    alignItems: 'center',
    justifyContent: 'center',
  },

  newButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },

  logoutButton: {
    alignSelf: 'center',
    marginTop: 25,
    padding: 10,
  },

  logoutText: {
    color: '#A52828',
    fontSize: 14,
    fontWeight: '600',
  },
});