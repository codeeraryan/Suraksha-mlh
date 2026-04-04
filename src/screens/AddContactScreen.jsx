import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import React, { useState } from 'react';
import { useContext } from 'react';
import { SecurityContext } from '../context/securityContext';
import { db, firebaseAuth } from '../../firebase';

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
    padding: 20,
    backgroundColor: '#121212',
  },

  input: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    fontSize: 14,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },

  button: {
    backgroundColor: '#3D5AFE',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },

  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});