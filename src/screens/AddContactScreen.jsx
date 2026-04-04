import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState, useContext } from 'react';
import { SecurityContext } from '../context/securityContext';
import { db, firebaseAuth } from '../../firebase';
import { colors } from '../colors';

const AddContactScreen = ({ navigation, route }) => {
  const { setContacts } = useContext(SecurityContext);
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');

  const handleSave = async () => {
    if (!name.trim() || !mobile.trim()) {
      Alert.alert('Error', 'Please enter name and mobile number');
      return;
    }

    if (mobile.length < 10) {
      Alert.alert('Error', 'Enter valid mobile number');
      return;
    }



    try {
      const userQuery = await db.collection('users')
        .where('mobile', '==', mobile.trim("+91"))
        .get();

      let linkedUid = null;
      let isAppUser = false;

      if (!userQuery.empty) {
        // User found in the app!
        linkedUid = userQuery.docs[0].id;
        isAppUser = true;
      }

      await db.collection('users').doc(firebaseAuth.currentUser.uid)
        .collection('emergency_contacts').add({
          name,
          mobile,
          linkedUid,
          isAppUser,
          addedAt: new Date()
        });

      Alert.alert("Success", isAppUser ? "Linked as App User" : "Added as SMS Contact");

    } catch (error) {
      console.log(error);
      Alert.alert("Error", error.message);

    }


    navigation.goBack();
  };

  return (
    <View style={styles.container}>

      {/* Name Input */}
      <TextInput
        placeholder="Enter Name"
        value={name}
        onChangeText={setName}
        style={styles.input}
        placeholderTextColor="#777"
      />

      {/* Mobile Input */}
      <TextInput
        placeholder="Enter Mobile Number"
        value={mobile}
        maxLength={10}
        onChangeText={setMobile}
        style={styles.input}
        keyboardType="number-pad"
        placeholderTextColor="#777"
      />

      {/* Save Button */}
      <TouchableOpacity style={styles.button} onPress={handleSave}>
        <Text style={styles.buttonText}>Save Contact</Text>
      </TouchableOpacity>
    </View>
  );
};

export default AddContactScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    backgroundColor: colors.background_color,
  },

  input: {
    backgroundColor: colors.input_bg,
    padding: 18,
    borderRadius: 14,
    marginBottom: 16,
    fontSize: 16,
    color: colors.primary_text,
    borderWidth: 1,
    borderColor: colors.card_border,
  },

  button: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },

  buttonText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 17,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});