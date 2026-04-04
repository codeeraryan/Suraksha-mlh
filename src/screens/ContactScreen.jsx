import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect } from "react";
import { colors } from "../colors";
import ContactCard from "../components/ContactCard";
import { useNavigation } from "@react-navigation/native";
import { useContext } from 'react';
import { SecurityContext } from '../context/securityContext';
import { db, firebaseAuth } from "../../firebase";


const ContactScreen = () => {
  const navigation = useNavigation();
  const { contacts, setContacts } = useContext(SecurityContext);

  const handleEdit = (item) => {
    console.log("Edit pressed:", item);
  };

  const handleDelete = async (item) => {
    try {
      await db.collection('users')
        .doc(firebaseAuth.currentUser.uid)
        .collection('emergency_contacts')
        .doc(item.id)
        .delete();
      console.log("Contact deleted from Firestore");
    } catch (error) {
      console.error("Error deleting contact:", error);
    }
  };

  return (
    <View style={styles.mainContainer}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Emergency Contacts</Text>
      </View>

      {/* LIST */}
      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={() => (
          <Text style={{ color: "#888", textAlign: "center", marginTop: 50 }}>
            No contacts yet
          </Text>
        )}
        renderItem={({ item }) => (
          <ContactCard
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      />

      {/* ADD BUTTON */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => navigation.navigate("AddContact")}
      >
        <Text style={styles.addIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
};

export default ContactScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: colors.background_color,
    paddingTop: 10,
  },

  headerContainer: {
    marginTop: 20,
    marginHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#00FFAA",
    alignItems: "center",
  },

  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },

  addBtn: {
    backgroundColor: "#00FFAA",
    height: 65,
    width: 65,
    position: "absolute",
    borderRadius: 50, // ✅ FIXED
    bottom: 100,
    right: 20,
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },

  addIcon: {
    color: "#000",
    fontSize: 35,
    fontWeight: "bold",
  },
});
