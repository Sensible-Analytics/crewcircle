import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet,
  Alert,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import storageUtils from '../utils/storage';
import { showErrorAlert } from '../utils/errorHandler';
import { exportContactsAsCSV } from '../utils/exportUtils';

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  scannedAt: string;
};

const ContactsScreen = () => {
  const navigation = useNavigation();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const storedContacts = await storageUtils.getContacts();
      setContacts(storedContacts);
    } catch (error) {
      console.warn('Failed to load contacts:', error);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const addContact = async (contact: Omit<Contact, 'id'>) => {
    const newContact = {
      ...contact,
      id: Date.now().toString(),
      scannedAt: new Date().toISOString(),
    };
    await storageUtils.addContact(newContact);
    loadContacts();
  };

  const handleDeleteContact = (id: string) => {
    Alert.alert(
      'Delete Contact',
      'Are you sure you want to delete this contact?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await storageUtils.deleteContact(id);
            loadContacts();
          },
        },
      ]
    );
  };

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContacts().finally(() => setRefreshing(false));
  }, [loadContacts]);

  const handleExportAllContacts = useCallback(async () => {
    if (contacts.length === 0) {
      Alert.alert('Info', 'No contacts to export');
      return;
    }

    try {
      await exportContactsAsCSV(contacts);
      Alert.alert('Success', 'All contacts exported as CSV!');
    } catch (error) {
      console.warn('Export error:', error);
      showErrorAlert(error, 'Export contacts');
    }
  }, [contacts]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  const renderContact = ({ item }: { item: Contact }) => {
    return (
      <TouchableOpacity 
        style={Styles.contactCard}
        onPress={() => navigation.navigate('EditContact', { contactId: item.id })}
      >
        <View style={Styles.contactInfo}>
          <Text style={Styles.contactName}>{item.name}</Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="email" size={16} color="#666" />
            {' '}
            {item.email}
          </Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="phone" size={16} color="#666" />
            {' '}
            {item.phone}
          </Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="factory" size={16} color="#666" />
            {' '}
            {item.company}
          </Text>
          <Text style={Styles.contactDate}>
            Scanned: {new Date(item.scannedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity 
          style={Styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDeleteContact(item.id);
          }}
        >
          <MaterialCommunityIcons name="delete" size={20} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={Styles.container}>
        <View style={Styles.header}>
          <Text style={Styles.headerTitle}>My Contacts</Text>
          <TouchableOpacity style={Styles.headerButton} onPress={() => {}}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={Styles.loadingContainer}>
          <Text style={Styles.loadingText}>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={Styles.container}>
      <View style={Styles.header}>
        <Text style={Styles.headerTitle}>My Contacts</Text>
        <View style={Styles.headerActions}>
          <TouchableOpacity style={Styles.headerButton} onPress={handleExportAllContacts}>
            <MaterialCommunityIcons name="file-export" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={Styles.headerButton} onPress={() => {}}>
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <FlatList
        data={contacts}
        keyExtractor={item => item.id}
        renderItem={renderContact}
        ItemSeparatorComponent={() => <View style={Styles.separator} />}
        contentContainerStyle={Styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      />
      
      {contacts.length === 0 && (
        <View style={Styles.emptyState}>
          <MaterialCommunityIcons name="account-multiple" size={48} color="#ccc" />
          <Text style={Styles.emptyText}>No contacts yet. Scan a business card to get started!</Text>
        </View>
      )}
    </View>
  );
};

export default ContactsScreen;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066cc',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    color: '#666',
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: '#666',
    marginVertical: 2,
  },
  contactDate: {
    fontSize: 12,
    color: '#999',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ff4444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});