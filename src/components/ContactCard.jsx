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
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 16,
    elevation: 3,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: colors.card_border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  leftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '75%',
  },

  avatar: {
    height: 52,
    width: 52,
    backgroundColor: '#fff',
    borderRadius: 26,
    borderWidth: 2,
    borderColor: colors.card_border,
  },

  detailsBox: {
    marginLeft: 15,
  },

  nameText: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary_text,
    letterSpacing: 0.5,
  },

  numText: {
    fontWeight: '500',
    fontSize: 14,
    color: colors.secondary_text,
    marginTop: 4,
  },

  rightContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: '20%',
  },

  optIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.secondary_text,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },

  menuBox: {
    position: 'absolute',
    backgroundColor: colors.input_bg,
    borderRadius: 14,
    paddingVertical: 8,
    width: 140,
    elevation: 10,
    borderWidth: 1,
    borderColor: colors.card_border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },

  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary_text,
  },
});