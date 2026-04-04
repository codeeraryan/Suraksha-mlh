import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../colors';
import { useAuth } from '../context/AuthContext';


const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn, isLoggingIn } = useAuth();

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>
          Login to continue your safety journey
        </Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>

        <TextInput
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Password"
          placeholderTextColor="#777"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {/* LOGIN BUTTON */}
        <TouchableOpacity onPress={() => { signIn(email, password) }} disabled={isLoggingIn} style={styles.loginBtn}>
          {isLoggingIn ? <ActivityIndicator size={'small'} color={'black'} /> : <Text style={styles.loginText}>Login</Text>}
        </TouchableOpacity>

        {/* SIGNUP LINK */}
        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.signupText}>
            Don’t have an account? <Text style={{ color: '#00FFAA' }}>Signup</Text>
          </Text>
        </TouchableOpacity>

      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Your safety, our priority 💙
        </Text>
      </View>

    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_color,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 40,
  },

  title: {
    fontSize: 32,
    color: colors.primary_text,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  subtitle: {
    color: colors.secondary_text,
    marginTop: 8,
    fontSize: 15,
    fontWeight: '400',
  },

  form: {
    marginBottom: 30,
  },

  input: {
    backgroundColor: colors.input_bg,
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    color: colors.primary_text,
    borderWidth: 1,
    borderColor: colors.card_border,
    fontSize: 16,
  },

  loginBtn: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },

  loginText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  signupText: {
    color: colors.secondary_text,
    textAlign: 'center',
    marginTop: 25,
    fontSize: 15,
  },

  footer: {
    position: 'absolute',
    bottom: 35,
    alignSelf: 'center',
  },

  footerText: {
    color: colors.secondary_text,
    fontSize: 13,
    opacity: 0.7,
  },
});