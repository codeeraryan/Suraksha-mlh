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
          <Text style={styles.emptyText}>
            No contacts yet. Tap + to add.
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
    marginHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.card_border,
    alignItems: "center",
    paddingBottom: 10,
  },

  headerText: {
    fontSize: 22,
    color: colors.primary_text,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  emptyText: {
    color: colors.secondary_text, 
    textAlign: "center", 
    marginTop: 80,
    fontSize: 16,
    fontWeight: '500',
  },

  addBtn: {
    backgroundColor: colors.accent,
    height: 70,
    width: 70,
    position: "absolute",
    borderRadius: 35,
    bottom: 100,
    right: 25,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },

  addIcon: {
    color: "#000000",
    fontSize: 36,
    fontWeight: "400",
    marginTop: -2,
  },
});
