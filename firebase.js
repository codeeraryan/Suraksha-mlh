import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import database from '@react-native-firebase/database';

export const firebaseAuth = auth();
export const db = firestore();
export const rtdb = database();

