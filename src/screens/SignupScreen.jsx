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
    fontSize: 28,
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

  signupBtn: {
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

  signupText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  loginLink: {
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