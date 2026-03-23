import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { ContactsStackParamList } from "../navigation/types";
import { Contact } from "../types/contact";
import { showErrorAlert } from "../utils/errorHandler";
import storageUtils from "../utils/storage";

type Props = NativeStackScreenProps<ContactsStackParamList, "EditContact">;

const EditContactScreen = ({ route, navigation }: Props) => {
  const { contactId } = route.params;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");

  const loadContact = useCallback(async () => {
    setLoading(true);
    try {
      const contacts = await storageUtils.getContacts();
      const foundContact = contacts.find((currentContact) => {
        return currentContact.id === contactId;
      });

      if (!foundContact) {
        Alert.alert("Error", "Contact not found");
        navigation.goBack();
        return;
      }

      setContact(foundContact);
      setName(foundContact.name);
      setEmail(foundContact.email);
      setPhone(foundContact.phone);
      setCompany(foundContact.company);
      setAddress(foundContact.address);
      setWebsite(foundContact.website);
    } catch (error) {
      console.warn("Failed to load contact:", error);
      showErrorAlert(error, "Load contact");
    } finally {
      setLoading(false);
    }
  }, [contactId, navigation]);

  useEffect(() => {
    loadContact();
  }, [loadContact]);

  const handleSaveContact = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Name is required");
      return;
    }

    if (!contact) {
      Alert.alert("Error", "Contact not found");
      return;
    }

    try {
      const updatedContact: Contact = {
        ...contact,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        address: address.trim(),
        website: website.trim(),
        updatedAt: new Date().toISOString(),
      };

      await storageUtils.updateContact(contactId, updatedContact);
      Alert.alert("Success", "Contact updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.warn("Failed to save contact:", error);
      showErrorAlert(error, "Save contact");
    }
  }, [
    address,
    company,
    contact,
    contactId,
    email,
    name,
    navigation,
    phone,
    website,
  ]);

  const handleDeleteContact = useCallback(() => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact? This action cannot be undone.",
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
              await storageUtils.deleteContact(contactId);
              navigation.goBack();
            } catch (error) {
              console.warn("Delete error:", error);
              showErrorAlert(error, "Delete contact");
            }
          },
        },
      ]
    );
  }, [contactId, navigation]);

  if (loading || !contact) {
    return (
      <KeyboardAvoidingView behavior="padding" style={Styles.container}>
        <View style={Styles.loadingContainer}>
          <Text style={Styles.loadingText}>Loading contact...</Text>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior="padding"
      style={Styles.container}
      testID="edit-contact-screen"
    >
      <View style={Styles.header} testID="header">
        <TouchableOpacity
          style={Styles.backButton}
          onPress={() => navigation.goBack()}
          testID="back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={Styles.headerTitle} testID="header-title">
          Edit Contact
        </Text>
        <View style={Styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={Styles.formContainer}
        keyboardShouldPersistTaps="handled"
        testID="form-scrollview"
      >
        <View style={Styles.inputGroup} testID="name-input-group">
          <Text style={Styles.inputLabel} testID="name-label">
            Name
          </Text>
          <TextInput
            style={Styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name"
            autoFocus
            testID="name-input"
          />
        </View>

        <View style={Styles.inputGroup} testID="email-input-group">
          <Text style={Styles.inputLabel} testID="email-label">
            Email
          </Text>
          <TextInput
            style={Styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email"
            keyboardType="email-address"
            testID="email-input"
          />
        </View>

        <View style={Styles.inputGroup} testID="phone-input-group">
          <Text style={Styles.inputLabel} testID="phone-label">
            Phone
          </Text>
          <TextInput
            style={Styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            keyboardType="phone-pad"
            testID="phone-input"
          />
        </View>

        <View style={Styles.inputGroup} testID="company-input-group">
          <Text style={Styles.inputLabel} testID="company-label">
            Company
          </Text>
          <TextInput
            style={Styles.input}
            value={company}
            onChangeText={setCompany}
            placeholder="Enter company"
            testID="company-input"
          />
        </View>

        <View style={Styles.inputGroup} testID="address-input-group">
          <Text style={Styles.inputLabel} testID="address-label">
            Address (Optional)
          </Text>
          <TextInput
            style={Styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            testID="address-input"
          />
        </View>

        <View style={Styles.inputGroup} testID="website-input-group">
          <Text style={Styles.inputLabel} testID="website-label">
            Website (Optional)
          </Text>
          <TextInput
            style={Styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="Enter website"
            testID="website-input"
          />
        </View>

        <View style={Styles.metaGroup}>
          <Text style={Styles.metaText}>
            Scanned: {new Date(contact.scannedAt).toLocaleString()}
          </Text>
          {contact.updatedAt ? (
            <Text style={Styles.metaText}>
              Last updated: {new Date(contact.updatedAt).toLocaleString()}
            </Text>
          ) : null}
        </View>

        <View style={Styles.buttonContainer} testID="button-container">
          <TouchableOpacity
            style={Styles.button}
            onPress={handleSaveContact}
            testID="save-button"
          >
            <MaterialCommunityIcons
              name="content-save"
              size={20}
              color="#fff"
            />
            <Text style={Styles.buttonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={Styles.buttonDelete}
            onPress={handleDeleteContact}
            testID="delete-button"
          >
            <MaterialCommunityIcons name="delete" size={20} color="#fff" />
            <Text style={Styles.buttonText}>Delete Contact</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditContactScreen;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#0066cc",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
  },
  headerSpacer: {
    width: 24,
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
  formContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#333",
  },
  metaGroup: {
    marginBottom: 20,
  },
  metaText: {
    fontSize: 13,
    color: "#666",
    marginBottom: 4,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#0066cc",
  },
  buttonDelete: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 24,
    backgroundColor: "#d64545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
