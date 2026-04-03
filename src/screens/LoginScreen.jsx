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
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#888',
    marginTop: 8,
    fontSize: 14,
  },

  form: {
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  loginBtn: {
    backgroundColor: '#00FFAA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  loginText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },

  signupText: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 20,
  },

  footer: {
    position: 'absolute',
    bottom: 30,
    alignSelf: 'center',
  },

  footerText: {
    color: '#555',
    fontSize: 12,
  },
});