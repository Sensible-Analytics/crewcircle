import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import storageUtils from "../utils/storage";
import { showErrorAlert } from "../utils/errorHandler";

type Contact = {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address?: string;
  website?: string;
  scannedAt: string;
};

const EditContactScreen = ({ route, navigation }: any) => {
  const { contactId } = route.params;
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [company, setCompany] = useState<string>("");
  const [address, setAddress] = useState<string>("");
  const [website, setWebsite] = useState<string>("");

  const loadContact = useCallback(async () => {
    setLoading(true);
    try {
      const contacts = await storageUtils.getContacts();
      const foundContact = contacts.find((c: any) => c.id === contactId);
      if (foundContact) {
        setContact(foundContact);
        setName(foundContact.name || "");
        setEmail(foundContact.email || "");
        setPhone(foundContact.phone || "");
        setCompany(foundContact.company || "");
        setAddress(foundContact.address || "");
        setWebsite(foundContact.website || "");
      } else {
        Alert.alert("Error", "Contact not found");
        navigation.goBack();
      }
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

    try {
      const updatedContact: Contact = {
        id: contactId,
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        company: company.trim(),
        address: address.trim(),
        website: website.trim(),
        scannedAt: new Date().toISOString(),
      };

      await storageUtils.updateContact(contactId, updatedContact);
      Alert.alert("Success", "Contact updated successfully!");
      navigation.goBack();
    } catch (error) {
      console.warn("Failed to save contact:", error);
      showErrorAlert(error, "Save contact");
    }
  }, [contactId, name, email, phone, company, address, website, navigation]);

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
            await storageUtils.deleteContact(contactId);
            navigation.goBack();
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
        <View style={{ width: 24 }} />
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
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 24,
    padding: 16,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#0066cc",
    borderRadius: 8,
  },
  buttonDelete: {
    backgroundColor: "#ff4444",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
