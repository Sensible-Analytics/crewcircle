// Mock all modules first
jest.mock("@react-navigation/native");
jest.mock("../utils/storage");
jest.mock("../utils/errorHandler");

// Import the component after mocks are set up
import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react-native";
import EditContactScreen from "./EditContactScreen";

describe("EditContactScreen", () => {
  // Set up default mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the navigation and route objects
    const navigateMock = jest.fn();
    const goBackMock = jest.fn();

    // Mock useNavigation and useRoute from @react-navigation/native
    require("@react-navigation/native").useNavigation = jest
      .fn()
      .mockReturnValue({ navigate: navigateMock, goBack: goBackMock });
    require("@react-navigation/native").useRoute = jest
      .fn()
      .mockReturnValue({ params: { contactId: "1" } });

    // Default mock for storage - since the component imports the default export,
    // we need to mock the default export's methods
    const storageUtilsMock = {
      getContacts: jest.fn().mockResolvedValue([]),
      deleteContact: jest.fn().mockResolvedValue(undefined),
      saveContacts: jest.fn().mockResolvedValue(undefined),
      addContact: jest.fn().mockResolvedValue(undefined),
      updateContact: jest.fn().mockResolvedValue(undefined),
      getSetting: jest.fn().mockResolvedValue(null),
      saveSetting: jest.fn().mockResolvedValue(undefined),
      getOcrLanguages: jest.fn().mockResolvedValue(["eng"]),
      saveOcrLanguages: jest.fn().mockResolvedValue(undefined),
    };
    // Mock the default export
    require("../utils/storage").__esModule = true;
    require("../utils/storage").default = storageUtilsMock;

    // Default mock for errorHandler
    const errorHandlerMock = {
      showErrorAlert: jest.fn(),
      handleError: jest.fn(),
    };
    // Mock the default export
    require("../utils/errorHandler").__esModule = true;
    require("../utils/errorHandler").default = errorHandlerMock;
  });

  it("renders without crashing", () => {
    render(<EditContactScreen />);
    expect(screen.getByText(/Edit Contact/i)).toBeTruthy();
  });

  it("shows loading state when contact is being fetched", async () => {
    // Mock getContacts to return a promise that resolves after a delay
    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([]), 100);
        })
    );

    render(<EditContactScreen />);
    expect(screen.getByText(/Loading contact.../i)).toBeTruthy();

    // Wait for loading to complete
    await waitFor(
      () => {
        return screen.queryByText(/Loading contact.../i) === null;
      },
      { timeout: 1000 }
    );
  });

  it("shows error when contact is not found", async () => {
    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([]); // Empty contacts array

    render(<EditContactScreen />);

    // Wait for loading to complete and error to appear
    await waitFor(
      () => {
        return screen.getByText(/Error/i) !== null;
      },
      { timeout: 2000 }
    );

    // Verify Alert.alert was called with error message
    expect(require("react-native").Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Contact not found"
    );

    // Verify navigation.goBack was called
    const { goBack } = require("@react-navigation/native").useNavigation();
    expect(goBack).toHaveBeenCalled();
  });

  it("displays contact details when loaded successfully", async () => {
    const mockContact = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
      scannedAt: "2023-01-01T10:00:00Z",
    };

    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([mockContact]);

    render(<EditContactScreen />);

    // Wait for loading to complete and contact details to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i) !== null;
      },
      { timeout: 2000 }
    );

    expect(screen.getByText(/John Doe/i)).toBeTruthy();
    expect(screen.getByText(/john@example.com/i)).toBeTruthy();
    expect(screen.getByText(/123-456-7890/i)).toBeTruthy();
    expect(screen.getByText(/Acme Inc/i)).toBeTruthy();
    expect(screen.getByText(/123 Main St/i)).toBeTruthy();
    expect(screen.getByText(/https:\/\/example.com/i)).toBeTruthy();

    // Verify loading indicator is gone
    expect(screen.queryByText(/Loading contact.../i)).toBeNull();
  });

  it("saves contact when save button is pressed", async () => {
    const mockContact = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
      scannedAt: "2023-01-01T10:00:00Z",
    };

    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([mockContact]);
    storageUtils.updateContact = jest.fn().mockResolvedValue(undefined);

    render(<EditContactScreen />);

    // Wait for loading to complete and contact details to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i) !== null;
      },
      { timeout: 2000 }
    );

    // Find and press save button
    const saveButton = screen.getByText(/Save Changes/i);
    await act(async () => {
      saveButton.props.onPress();
    });

    // Verify updateContact was called with correct parameters
    expect(storageUtils.updateContact).toHaveBeenCalledWith(
      "1",
      expect.objectContaining({
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        company: "Acme Inc",
        address: "123 Main St",
        website: "https://example.com",
        // scannedAt will be a recent date, so we won't check the exact value
      })
    );

    // Verify success alert was shown
    expect(require("react-native").Alert.alert).toHaveBeenCalledWith(
      "Success",
      "Contact updated successfully!"
    );

    // Verify navigation.goBack was called
    const { goBack } = require("@react-navigation/native").useNavigation();
    expect(goBack).toHaveBeenCalled();
  });

  it("shows error when saving contact fails", async () => {
    const mockContact = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
      scannedAt: "2023-01-01T10:00:00Z",
    };

    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([mockContact]);
    // Mock updateContact to reject
    storageUtils.updateContact = jest
      .fn()
      .mockRejectedValue(new Error("Save failed"));

    render(<EditContactScreen />);

    // Wait for loading to complete and contact details to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i) !== null;
      },
      { timeout: 2000 }
    );

    // Find and press save button
    const saveButton = screen.getByText(/Save Changes/i);
    await act(async () => {
      saveButton.props.onPress();
    });

    // Verify error handler was called
    const errorHandler = require("../utils/errorHandler").default;
    expect(errorHandler.showErrorAlert).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Save failed" }),
      "Save contact"
    );
  });

  it("deletes contact when delete button is pressed", async () => {
    const mockContact = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
      scannedAt: "2023-01-01T10:00:00Z",
    };

    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([mockContact]);
    storageUtils.deleteContact = jest.fn().mockResolvedValue(undefined);

    render(<EditContactScreen />);

    // Wait for loading to complete and contact details to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i) !== null;
      },
      { timeout: 2000 }
    );

    // Find and press delete button
    const deleteButton = screen.getByText(/Delete Contact/i);
    await act(async () => {
      deleteButton.props.onPress();
    });

    // Verify deleteContact was called with the right ID
    expect(storageUtils.deleteContact).toHaveBeenCalledWith("1");

    // Verify navigation.goBack was called
    const { goBack } = require("@react-navigation/native").useNavigation();
    expect(goBack).toHaveBeenCalled();
  });

  it("shows error when name is empty and save is pressed", async () => {
    const mockContact = {
      id: "1",
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
      scannedAt: "2023-01-01T10:00:00Z",
    };

    const storageUtils = require("../utils/storage").default;
    storageUtils.getContacts = jest.fn().mockResolvedValue([mockContact]);

    render(<EditContactScreen />);

    // Wait for loading to complete and contact details to appear
    await waitFor(
      () => {
        return screen.getByText(/John Doe/i) !== null;
      },
      { timeout: 2000 }
    );

    // Clear the name field
    const nameInput = screen.getByPlaceholderText(/Enter name/i);
    await act(async () => {
      nameInput.props.onChangeText("");
    });

    // Find and press save button
    const saveButton = screen.getByText(/Save Changes/i);
    await act(async () => {
      saveButton.props.onPress();
    });

    // Verify error alert is shown
    expect(require("react-native").Alert.alert).toHaveBeenCalledWith(
      "Error",
      "Name is required"
    );

    // Verify updateContact was NOT called
    const storageUtilsCheck = require("../utils/storage").default;
    expect(storageUtilsCheck.updateContact).not.toHaveBeenCalled();
  });
});
