import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../colors';
import { useAuth } from '../context/AuthContext';

const SignupScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const { signUp, isSigningUp } = useAuth();

  const handleSignUp = () => {
    if (!email || !password || !name || !mobile) {
      Alert.alert("unfilled", "please fill all details")
      return;
    }
    signUp(email, password, name, mobile)
  }


  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>Create Account 🚀</Text>
        <Text style={styles.subtitle}>
          Join us & stay safe always
        </Text>
      </View>

      {/* FORM */}
      <View style={styles.form}>

        <TextInput
          placeholder="Full Name"
          placeholderTextColor="#777"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <TextInput
          placeholder="Email"
          placeholderTextColor="#777"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
        />

        <TextInput
          placeholder="Mobile Number"
          placeholderTextColor="#777"
          value={mobile}
          maxLength={10}
          onChangeText={setMobile}
          keyboardType="number-pad"
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

        {/* SIGNUP BUTTON */}
        <TouchableOpacity disabled={isSigningUp} onPress={() => { handleSignUp() }} style={styles.signupBtn}>
          {isSigningUp ? <ActivityIndicator size={'small'} color={'black'} /> : <Text style={styles.signupText}>Create Account</Text>}
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>
            Already have an account? <Text style={{ color: '#00FFAA' }}>Login</Text>
          </Text>
        </TouchableOpacity>

      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Empowering safety with technology 💙
        </Text>
      </View>

    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_color,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },

  header: {
    marginBottom: 35,
  },

  title: {
    fontSize: 26,
    color: '#fff',
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#888',
    marginTop: 6,
    fontSize: 14,
  },

  form: {
    marginBottom: 30,
  },

  input: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  signupBtn: {
    backgroundColor: '#00FFAA',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  signupText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },

  loginLink: {
    color: '#aaa',
    textAlign: 'center',
    marginTop: 18,
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