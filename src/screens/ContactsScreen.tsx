import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  useFocusEffect,
  useNavigation,
  type NavigationProp,
} from "@react-navigation/native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ContactsStackParamList } from "../navigation/types";
import { Contact } from "../types/contact";
import { showErrorAlert } from "../utils/errorHandler";
import { exportContactsAsCSV } from "../utils/exportUtils";
import storageUtils from "../utils/storage";

const Separator = () => <View style={Styles.separator} />;

const ContactsScreen = () => {
  const navigation = useNavigation<NavigationProp<ContactsStackParamList>>();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadContacts = useCallback(async () => {
    setLoading(true);
    try {
      const storedContacts = await storageUtils.getContacts();
      setContacts(storedContacts);
    } catch (error) {
      console.warn("Failed to load contacts:", error);
      setContacts([]);
      showErrorAlert(error, "Load contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const handleDeleteContact = useCallback(
    (id: string) => {
      Alert.alert(
        "Delete Contact",
        "Are you sure you want to delete this contact?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await storageUtils.deleteContact(id);
                await loadContacts();
              } catch (error) {
                console.warn("Delete error:", error);
                showErrorAlert(error, "Delete contact");
              }
            },
          },
        ]
      );
    },
    [loadContacts]
  );

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadContacts().finally(() => setRefreshing(false));
  }, [loadContacts]);

  const handleExportAllContacts = useCallback(async () => {
    if (contacts.length === 0) {
      Alert.alert("Info", "No contacts to export");
      return;
    }

    try {
      await exportContactsAsCSV(contacts);
      Alert.alert("Success", "All contacts exported as CSV!");
    } catch (error) {
      console.warn("Export error:", error);
      showErrorAlert(error, "Export contacts");
    }
  }, [contacts]);

  const handleManualAdd = useCallback(() => {
    Alert.alert(
      "Manual Add",
      "Manual contact creation is not implemented yet. Use the scanner to add contacts."
    );
  }, []);

  const renderContact = ({ item }: { item: Contact }) => {
    return (
      <TouchableOpacity
        style={Styles.contactCard}
        onPress={() =>
          navigation.navigate("EditContact", { contactId: item.id })
        }
        testID={`contact-item-${item.id}`}
      >
        <View style={Styles.contactInfo}>
          <Text style={Styles.contactName}>
            {item.name || "Unnamed Contact"}
          </Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="email" size={16} color="#666" />{" "}
            {item.email || "No email"}
          </Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="phone" size={16} color="#666" />{" "}
            {item.phone || "No phone"}
          </Text>
          <Text style={Styles.contactDetail}>
            <MaterialCommunityIcons name="factory" size={16} color="#666" />{" "}
            {item.company || "No company"}
          </Text>
          <Text style={Styles.contactDate}>
            Scanned: {new Date(item.scannedAt).toLocaleDateString()}
          </Text>
        </View>
        <TouchableOpacity
          style={Styles.deleteButton}
          onPress={(event) => {
            event.stopPropagation();
            handleDeleteContact(item.id);
          }}
          testID={`delete-button-${item.id}`}
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
          <TouchableOpacity
            style={Styles.headerButton}
            onPress={handleManualAdd}
          >
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
    <View style={Styles.container} testID="contacts-screen">
      <View style={Styles.header}>
        <Text style={Styles.headerTitle} testID="header-title">
          My Contacts
        </Text>
        <View style={Styles.headerActions}>
          <TouchableOpacity
            style={Styles.headerButton}
            onPress={handleExportAllContacts}
            testID="export-all-contacts-button"
          >
            <MaterialCommunityIcons name="file-export" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={Styles.headerButton}
            onPress={handleManualAdd}
            testID="add-contact-button"
          >
            <MaterialCommunityIcons name="plus" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={contacts}
        keyExtractor={(item) => item.id}
        renderItem={renderContact}
        ItemSeparatorComponent={Separator}
        contentContainerStyle={Styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            testID="refresh-control"
          />
        }
        testID="contacts-list"
      />

      {contacts.length === 0 ? (
        <View style={Styles.emptyState} testID="empty-state-view">
          <MaterialCommunityIcons
            name="account-multiple"
            size={48}
            color="#ccc"
          />
          <Text style={Styles.emptyText} testID="empty-state-text">
            No contacts yet. Scan a business card to get started!
          </Text>
        </View>
      ) : null}
    </View>
  );
};

export default ContactsScreen;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#0066cc",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  headerButton: {
    padding: 8,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 18,
    color: "#666",
  },
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: "#666",
    marginVertical: 2,
  },
  contactDate: {
    fontSize: 12,
    color: "#999",
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ff4444",
    alignItems: "center",
    justifyContent: "center",
  },
  separator: {
    height: 1,
    backgroundColor: "#f0f0f0",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
