import {
  StyleSheet,
  Text,
  View,
  Image,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import React, { useState } from 'react';
import { colors } from '../colors';

const ContactCard = ({ item, onDelete, onEdit }) => {
  const [visible, setVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });

  const handleMenuPress = (event) => {
    const { pageY } = event.nativeEvent;

    const screenHeight = Dimensions.get('window').height;

    const adjustedTop =
      pageY > screenHeight - 120 ? pageY - 100 : pageY;

    setMenuPosition({
      top: adjustedTop,
      right: 20,
    });

    setVisible(true);
  };

  return (
    <View style={styles.contactCard}>
      {/* LEFT */}
      <View style={styles.leftContainer}>
        <Image
          source={require('../assets/tabIcons/profile.png')}
          style={styles.avatar}
        />
        <View style={styles.detailsBox}>
          <Text style={styles.nameText}>{item.name}</Text>
          <Text style={styles.numText}>{item.mobile}</Text>
        </View>
      </View>

      {/* RIGHT */}
      <View style={styles.rightContainer}>
        <TouchableOpacity style={{width:20,alignItems:'center'}} onPress={handleMenuPress} activeOpacity={0.6}>
          <Text style={styles.optIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* MODAL */}
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.modalOverlay}>
          {/* Click outside */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setVisible(false)}
          />

          {/* MENU */}
          <View
            style={[
              styles.menuBox,
              { top: menuPosition.top, right: menuPosition.right },
            ]}
          >
            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                onEdit(item);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.menuItem}>Edit</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setVisible(false);
                onDelete(item);
              }}
              activeOpacity={0.6}
            >
              <Text style={styles.menuItem}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default ContactCard;

const styles = StyleSheet.create({
  contactCard: {
    marginHorizontal: 15,
    marginTop: 15,
    backgroundColor: colors.card,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    elevation: 6,
    marginBottom: 4,
  },

  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '60%',
  },

  avatar: {
    height: 50,
    width: 50,
    backgroundColor: 'white',
    borderRadius: 50,
  },

  detailsBox: {
    marginLeft: 10,
  },

  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.primary_text,
  },

  numText: {
    fontWeight: '500',
    color: colors.secondary_text,
  },

  rightContainer: {
    paddingRight: 15,
    justifyContent: 'center',
  },

  optIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary_text,
  },

  modalOverlay: {
    flex: 1,
  },

  menuBox: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 5,
    width: 140,
    elevation: 8,
  },

  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    fontSize: 14,
  },
});